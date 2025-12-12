/**
 * Fix Snyk Issues Script
 * Orchestrates systematic fixing of 352 Snyk security issues
 * Uses distributed task system with admin approval workflow
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { SnykIssue, taskDistributor } from "../ai-brain/task-distributor";
import prisma from "../prismaClient";

interface SnykReport {
  vulnerabilities: any[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

interface FixResult {
  total: number;
  fixed: number;
  failed: number;
  skipped: number;
  requiresApproval: number;
  duration: number;
}

class SnykIssueFixer {
  private snykReportPath = path.join(process.cwd(), "snyk-report.json");
  private fixLog: any[] = [];
  private startTime = Date.now();

  constructor() {}

  /**
   * Main execution flow
   */
  public async run(): Promise<void> {
    console.log("🔒 Snyk Issue Fixer v1.0");
    console.log("━".repeat(60));
    console.log("Systematically fixing security vulnerabilities\n");

    try {
      // Step 1: Load or generate Snyk report
      const report = await this.loadSnykReport();

      // Step 2: Parse and analyze issues
      const issues = this.parseSnykReport(report);
      console.log(`\n📋 Found ${issues.length} security issues\n`);

      // Step 3: Show severity breakdown
      this.showSeverityBreakdown(issues);

      // Step 4: Check for HIGH/CRITICAL issues requiring approval
      const requiresApproval = issues.filter((i) => i.severity === "critical" || i.severity === "high");

      if (requiresApproval.length > 0) {
        console.log(`\n⚠️  ${requiresApproval.length} issues require admin approval\n`);
        const approved = await this.requestAdminApproval(requiresApproval);

        if (!approved) {
          console.log("\n❌ Admin approval denied. Exiting...\n");
          return;
        }
      }

      // Step 5: Distribute tasks to AI agents
      console.log("\n🤖 Distributing tasks to AI agents...\n");
      await this.distributeAndFix(issues);

      // Step 6: Generate fix report
      const result = this.generateFixReport(issues);

      // Step 7: Display results
      this.displayResults(result);

      // Step 8: Save fix log
      await this.saveFixLog();

      console.log("\n✅ Snyk issue fixing completed!\n");
    } catch (error: any) {
      console.error("\n❌ Error during fix process:", error.message);
      process.exit(1);
    }
  }

  /**
   * Load Snyk report (or generate if missing)
   */
  private async loadSnykReport(): Promise<SnykReport> {
    console.log("📂 Loading Snyk report...");

    if (!fs.existsSync(this.snykReportPath)) {
      console.log("   No report found. Generating...");
      await this.generateSnykReport();
    }

    const content = fs.readFileSync(this.snykReportPath, "utf-8");
    return JSON.parse(content);
  }

  /**
   * Generate Snyk report
   */
  private async generateSnykReport(): Promise<void> {
    try {
      console.log("   Running Snyk test...");
      execSync(`snyk test --json > ${this.snykReportPath}`, { stdio: "inherit" });
      console.log("   ✅ Report generated");
    } catch (error) {
      // Snyk exits with non-zero if vulnerabilities found
      // This is expected, so we continue
      if (fs.existsSync(this.snykReportPath)) {
        console.log("   ✅ Report generated (vulnerabilities found)");
      } else {
        throw new Error("Failed to generate Snyk report");
      }
    }
  }

  /**
   * Parse Snyk report into standardized issues
   */
  private parseSnykReport(report: SnykReport): SnykIssue[] {
    const issues: SnykIssue[] = [];

    // Parse vulnerabilities
    if (report.vulnerabilities) {
      report.vulnerabilities.forEach((vuln: any, index: number) => {
        issues.push({
          id: vuln.id || `vuln-${index}`,
          title: vuln.title || "Unknown vulnerability",
          severity: vuln.severity || "medium",
          type: "vuln",
          packageName: vuln.packageName,
          version: vuln.version,
          fixedIn: vuln.fixedIn || [],
          description: vuln.description || "",
          remediation: vuln.remediation || "",
        });
      });
    }

    return issues;
  }

  /**
   * Show severity breakdown
   */
  private showSeverityBreakdown(issues: SnykIssue[]): void {
    const counts = {
      critical: issues.filter((i) => i.severity === "critical").length,
      high: issues.filter((i) => i.severity === "high").length,
      medium: issues.filter((i) => i.severity === "medium").length,
      low: issues.filter((i) => i.severity === "low").length,
    };

    console.log("Severity Breakdown:");
    console.log(`   🔴 Critical: ${counts.critical}`);
    console.log(`   🟠 High:     ${counts.high}`);
    console.log(`   🟡 Medium:   ${counts.medium}`);
    console.log(`   🟢 Low:      ${counts.low}`);
  }

  /**
   * Request admin approval for HIGH/CRITICAL issues
   */
  private async requestAdminApproval(issues: SnykIssue[]): Promise<boolean> {
    console.log("Issues requiring approval:");

    // Group by severity
    const critical = issues.filter((i) => i.severity === "critical");
    const high = issues.filter((i) => i.severity === "high");

    if (critical.length > 0) {
      console.log(`\n🔴 ${critical.length} CRITICAL issues:`);
      critical.slice(0, 5).forEach((issue) => {
        console.log(`   - ${issue.title}`);
        if (issue.packageName) {
          console.log(`     Package: ${issue.packageName}@${issue.version}`);
        }
      });
      if (critical.length > 5) {
        console.log(`   ... and ${critical.length - 5} more`);
      }
    }

    if (high.length > 0) {
      console.log(`\n🟠 ${high.length} HIGH issues:`);
      high.slice(0, 5).forEach((issue) => {
        console.log(`   - ${issue.title}`);
        if (issue.packageName) {
          console.log(`     Package: ${issue.packageName}@${issue.version}`);
        }
      });
      if (high.length > 5) {
        console.log(`   ... and ${high.length - 5} more`);
      }
    }

    // Request approval
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question("\n✋ Approve fixing these issues? (yes/no): ", (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
      });
    });
  }

  /**
   * Distribute tasks and fix issues
   */
  private async distributeAndFix(issues: SnykIssue[]): Promise<void> {
    // Listen for task events
    taskDistributor.on("task", async (batch) => {
      console.log(`   🔧 Agent ${batch.agentType} processing ${batch.issues.length} issues...`);

      // Log each issue being fixed
      batch.issues.forEach((issue) => {
        this.fixLog.push({
          id: issue.id,
          title: issue.title,
          severity: issue.severity,
          type: issue.type,
          status: "in-progress",
          agent: batch.agentType,
          timestamp: new Date(),
        });
      });
    });

    // Wait for completion
    await new Promise<void>((resolve) => {
      taskDistributor.on("completed", () => {
        resolve();
      });

      // Start distribution
      taskDistributor.distributeIssues(issues);
    });
  }

  /**
   * Generate fix report
   */
  private generateFixReport(issues: SnykIssue[]): FixResult {
    const duration = Date.now() - this.startTime;

    const result: FixResult = {
      total: issues.length,
      fixed: this.fixLog.filter((l) => l.status === "fixed").length,
      failed: this.fixLog.filter((l) => l.status === "failed").length,
      skipped: this.fixLog.filter((l) => l.status === "skipped").length,
      requiresApproval: issues.filter((i) => i.severity === "critical" || i.severity === "high").length,
      duration,
    };

    return result;
  }

  /**
   * Display results
   */
  private displayResults(result: FixResult): void {
    console.log("\n📊 Fix Results:");
    console.log("━".repeat(60));
    console.log(`   Total issues:        ${result.total}`);
    console.log(`   ✅ Fixed:            ${result.fixed}`);
    console.log(`   ❌ Failed:           ${result.failed}`);
    console.log(`   ⏭️  Skipped:          ${result.skipped}`);
    console.log(`   ⏱️  Duration:         ${(result.duration / 1000).toFixed(2)}s`);
    console.log("━".repeat(60));

    // Calculate success rate
    const successRate = result.total > 0 ? ((result.fixed / result.total) * 100).toFixed(1) : "0.0";

    console.log(`\n   Success Rate: ${successRate}%`);

    // Show next steps
    if (result.failed > 0) {
      console.log("\n⚠️  Some issues could not be fixed automatically.");
      console.log("   Review the fix log for details.");
    }

    if (result.fixed > 0) {
      console.log("\n✨ Fixes applied successfully!");
      console.log("   Run tests to verify: npm test");
    }
  }

  /**
   * Save fix log to database
   */
  private async saveFixLog(): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          action: "SNYK_FIX_COMPLETED",
          resourceType: "SECURITY",
          resourceId: "snyk-fix",
          metadata: {
            log: this.fixLog,
            duration: Date.now() - this.startTime,
          } as any,
          severity: "MEDIUM",
          ipAddress: "system",
          userAgent: "SnykIssueFixer",
        },
      });

      console.log("\n   ✅ Fix log saved to database");
    } catch (error) {
      console.error("   ⚠️  Failed to save fix log:", error);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const fixer = new SnykIssueFixer();
  fixer.run().catch(console.error);
}

export default SnykIssueFixer;
