// Bug Fix Agent - Automated Error Analysis & Fix Suggestions
// Analyzes recent errors, searches for solutions, creates patches
// Runs every 20 minutes

import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class BugFixAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "BugFixAgent",
      enabled: true,
      schedule: "*/20 * * * *",
      retryAttempts: 3,
      timeout: 90000,
      priority: "high",
      description: "Analyzes errors and suggests fixes automatically",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const startTime = Date.now();

    try {
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

      // Step 1: Query recent errors from AuditLog
      const recentErrors = await this.context.prisma.audit_logs.findMany({
        where: {
          action: {
            contains: "ERROR",
          },
          createdAt: {
            gte: twentyMinutesAgo,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      itemsProcessed++;

      if (recentErrors.length === 0) {
        return {
          success: true,
          message: "No recent errors detected",
          data: { errorsAnalyzed: 0 },
          metrics: { itemsProcessed, errors, duration: Date.now() - startTime },
        };
      }

      // Step 2: Detect recurring error patterns
      const errorPatterns = this.detectErrorPatterns(recentErrors);
      itemsProcessed++;

      // Step 3: Analyze critical errors and generate fixes
      let fixesCreated = 0;

      for (const pattern of errorPatterns) {
        if (pattern.occurrences >= 3) {
          // Search for solutions
          const solutions = await this.searchSolutions(pattern.errorMessage);

          // Create SecurityPatch entry
          const patch = await this.context.prisma.security_patches.create({
            data: {
              id: `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: "BUG_FIX",
              status: "PENDING",
              vulnerability: pattern.errorMessage,
              fix: solutions.join("\n\n"),
              applied_by: null,
              applied_at: null,
            },
          });

          fixesCreated++;
          itemsProcessed++;

          // Alert admins about critical bugs
          if (pattern.occurrences >= 10 && this.context.io) {
            const admins = await this.context.prisma.users.findMany({
              where: { role: "ADMIN" },
              select: { id: true },
            });

            admins.forEach((admin) => {
              this.context.io?.to(`user-${admin.id}`).emit("bug:critical", {
                type: "error",
                title: "Critical Bug Detected",
                message: `Error occurred ${pattern.occurrences} times in 20 minutes`,
                patch_id: patch.id,
                occurrences: pattern.occurrences,
                timestamp: new Date(),
              });
            });
          }
        }
      }

      // Step 4: Create audit log
      await SafePrisma.create("audit_logs", {
        userId: null,
        action: "BUG_FIX_ANALYSIS",
        resourceType: "agent",
        resourceId: this.config.name,
        ipAddress: "127.0.0.1",
        userAgent: "BugFixAgent",
        metadata: {
          agent: this.config.name,
          errorsAnalyzed: recentErrors.length,
          patternsDetected: errorPatterns.length,
          fixesCreated,
        },
      });
      itemsProcessed++;

      return {
        success: true,
        message: `Analyzed ${recentErrors.length} errors, created ${fixesCreated} fixes`,
        data: {
          errorsAnalyzed: recentErrors.length,
          patternsDetected: errorPatterns.length,
          fixesCreated,
        },
        metrics: { itemsProcessed, errors, duration: Date.now() - startTime },
      };
    } catch (error: any) {
      this.context.logger.error("BugFixAgent failed", error);
      return {
        success: false,
        message: error.message || "Bug analysis failed",
        data: { error: error.message },
        metrics: {
          itemsProcessed,
          errors: errors + 1,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  private detectErrorPatterns(errors: any[]): any[] {
    const patterns: Map<string, any> = new Map();

    errors.forEach((error) => {
      const errorMsg = error.details?.error || error.action || "Unknown error";
      const key = errorMsg.substring(0, 100);

      if (patterns.has(key)) {
        const existing = patterns.get(key);
        existing.occurrences++;
        existing.lastSeen = error.createdAt;
        existing.actions.push(error.action);
      } else {
        patterns.set(key, {
          errorMessage: errorMsg,
          occurrences: 1,
          firstSeen: error.createdAt,
          lastSeen: error.createdAt,
          actions: [error.action],
        });
      }
    });

    return Array.from(patterns.values()).sort((a, b) => b.occurrences - a.occurrences);
  }

  private async searchSolutions(errorMessage: string): Promise<string[]> {
    const solutions: string[] = [];

    // Basic AI-powered suggestions
    if (errorMessage.includes("ECONNREFUSED")) {
      solutions.push("Check if the database/service is running and accessible");
      solutions.push("Verify connection string in environment variables");
      solutions.push("Check firewall rules and network connectivity");
    } else if (errorMessage.includes("timeout")) {
      solutions.push("Increase timeout duration in configuration");
      solutions.push("Optimize query performance to reduce execution time");
      solutions.push("Check for slow network or database performance");
    } else if (errorMessage.includes("validation")) {
      solutions.push("Review input validation rules");
      solutions.push("Check for missing required fields in request");
      solutions.push("Verify data types match schema definitions");
    } else if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
      solutions.push("Verify user has required permissions/role");
      solutions.push("Check JWT token validity and expiration");
      solutions.push("Review authorization middleware configuration");
    } else if (errorMessage.includes("duplicate") || errorMessage.includes("unique constraint")) {
      solutions.push("Check for existing records before insert");
      solutions.push("Add unique constraint validation in code");
      solutions.push("Consider using upsert instead of insert");
    } else {
      solutions.push("Review error logs for more context");
      solutions.push("Check recent code changes related to this functionality");
      solutions.push("Consult official documentation for troubleshooting");
    }

    return solutions;
  }
}
