/**
 * Snyk Security Scanner
 * Runs comprehensive Snyk security scan and generates detailed report
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface ScanResult {
  vulnerabilities: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  dependencies: number;
  recommendations: string[];
}

class SnykScanner {
  private reportPath = path.join(process.cwd(), "snyk-report.json");
  private htmlReportPath = path.join(process.cwd(), "snyk-report.html");

  constructor() {}

  /**
   * Main scan execution
   */
  public async run(): Promise<void> {
    console.log("🔍 Snyk Security Scanner v1.0");
    console.log("━".repeat(60));
    console.log("Running comprehensive security scan...\n");

    try {
      // Step 1: Check Snyk authentication
      await this.checkSnykAuth();

      // Step 2: Run vulnerability scan
      console.log("📦 Scanning dependencies for vulnerabilities...\n");
      const result = await this.runSnykTest();

      // Step 3: Run code analysis
      console.log("\n💻 Scanning code for security issues...\n");
      await this.runSnykCode();

      // Step 4: Display results
      this.displayResults(result);

      // Step 5: Generate recommendations
      const recommendations = this.generateRecommendations(result);
      this.displayRecommendations(recommendations);

      // Step 6: Save reports
      await this.saveReports();

      console.log("\n✅ Scan completed!\n");
      console.log("📄 Reports saved:");
      console.log(`   - JSON: ${this.reportPath}`);
      console.log(`   - HTML: ${this.htmlReportPath}`);
      console.log("\n💡 Next steps:");
      console.log("   - Review the report");
      console.log("   - Run: npm run fix-snyk-issues");
    } catch (error: any) {
      console.error("\n❌ Scan failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Check Snyk authentication
   */
  private async checkSnykAuth(): Promise<void> {
    try {
      console.log("🔐 Checking Snyk authentication...");
      execSync("snyk auth", { stdio: "pipe" });
      console.log("   ✅ Authenticated\n");
    } catch (error) {
      console.log("   ⚠️  Not authenticated");
      console.log("\n📝 Please authenticate with Snyk:");
      console.log("   1. Run: snyk auth");
      console.log("   2. Follow the browser authentication flow");
      console.log("   3. Re-run this script\n");
      throw new Error("Snyk authentication required");
    }
  }

  /**
   * Run Snyk vulnerability test
   */
  private async runSnykTest(): Promise<ScanResult> {
    try {
      // Run test with JSON output
      const output = execSync("snyk test --json", {
        encoding: "utf-8",
        stdio: "pipe",
      });

      const report = JSON.parse(output);

      // Parse results
      const result: ScanResult = {
        vulnerabilities: report.vulnerabilities?.length || 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        dependencies: report.dependencyCount || 0,
        recommendations: [],
      };

      // Count by severity
      if (report.vulnerabilities) {
        report.vulnerabilities.forEach((vuln: any) => {
          switch (vuln.severity) {
            case "critical":
              result.critical++;
              break;
            case "high":
              result.high++;
              break;
            case "medium":
              result.medium++;
              break;
            case "low":
              result.low++;
              break;
          }
        });
      }

      // Save JSON report
      fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));

      return result;
    } catch (error: any) {
      // Snyk exits with non-zero when vulnerabilities found
      if (error.stdout) {
        const report = JSON.parse(error.stdout);

        const result: ScanResult = {
          vulnerabilities: report.vulnerabilities?.length || 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          dependencies: report.dependencyCount || 0,
          recommendations: [],
        };

        if (report.vulnerabilities) {
          report.vulnerabilities.forEach((vuln: any) => {
            switch (vuln.severity) {
              case "critical":
                result.critical++;
                break;
              case "high":
                result.high++;
                break;
              case "medium":
                result.medium++;
                break;
              case "low":
                result.low++;
                break;
            }
          });
        }

        fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
        return result;
      }

      throw error;
    }
  }

  /**
   * Run Snyk code analysis
   */
  private async runSnykCode(): Promise<void> {
    try {
      console.log("   Analyzing source code...");
      execSync("snyk code test --json > snyk-code-report.json", {
        stdio: "inherit",
      });
      console.log("   ✅ Code analysis complete");
    } catch (error) {
      // Non-zero exit when issues found (expected)
      if (fs.existsSync("snyk-code-report.json")) {
        console.log("   ✅ Code analysis complete (issues found)");
      } else {
        console.log("   ⚠️  Code analysis unavailable");
      }
    }
  }

  /**
   * Display scan results
   */
  private displayResults(result: ScanResult): void {
    console.log("\n📊 Scan Results:");
    console.log("━".repeat(60));
    console.log(`   Total dependencies:  ${result.dependencies}`);
    console.log(`   Vulnerabilities:     ${result.vulnerabilities}`);
    console.log("");
    console.log("   Severity Breakdown:");
    console.log(`   🔴 Critical:         ${result.critical}`);
    console.log(`   🟠 High:             ${result.high}`);
    console.log(`   🟡 Medium:           ${result.medium}`);
    console.log(`   🟢 Low:              ${result.low}`);
    console.log("━".repeat(60));

    // Risk assessment
    const riskScore = result.critical * 10 + result.high * 5 + result.medium * 2 + result.low * 1;

    let riskLevel = "LOW";
    if (riskScore > 100) riskLevel = "CRITICAL";
    else if (riskScore > 50) riskLevel = "HIGH";
    else if (riskScore > 20) riskLevel = "MEDIUM";

    console.log(`\n   🎯 Risk Level: ${riskLevel} (score: ${riskScore})`);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(result: ScanResult): string[] {
    const recommendations: string[] = [];

    if (result.critical > 0) {
      recommendations.push(`🔴 URGENT: ${result.critical} critical vulnerabilities require immediate attention`);
      recommendations.push("   Action: Run npm run fix-snyk-issues to apply automated fixes");
    }

    if (result.high > 0) {
      recommendations.push(`🟠 ${result.high} high-severity issues should be addressed soon`);
    }

    if (result.medium > 0) {
      recommendations.push(`🟡 ${result.medium} medium-severity issues detected`);
    }

    if (result.vulnerabilities === 0) {
      recommendations.push("✅ No vulnerabilities detected! Your project is secure.");
    }

    // General recommendations
    recommendations.push("");
    recommendations.push("📋 General Recommendations:");
    recommendations.push("   1. Keep dependencies up to date");
    recommendations.push("   2. Run security scans regularly");
    recommendations.push("   3. Monitor Snyk dashboard for new vulnerabilities");
    recommendations.push("   4. Enable automated dependency updates");
    recommendations.push("   5. Review and fix code security issues");

    return recommendations;
  }

  /**
   * Display recommendations
   */
  private displayRecommendations(recommendations: string[]): void {
    console.log("\n💡 Recommendations:\n");
    recommendations.forEach((rec) => {
      console.log(`   ${rec}`);
    });
  }

  /**
   * Save HTML report
   */
  private async saveReports(): Promise<void> {
    try {
      // Generate HTML report
      execSync(`snyk test --json | snyk-to-html > ${this.htmlReportPath}`, {
        stdio: "inherit",
      });
      console.log("   ✅ HTML report generated");
    } catch (error) {
      // HTML report is optional
      console.log("   ⚠️  HTML report unavailable (install snyk-to-html)");
      console.log("      npm install -g snyk-to-html");
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const scanner = new SnykScanner();
  scanner.run().catch(console.error);
}

export default SnykScanner;
