// Security & Fraud Detection Agent - Threat Monitoring
// Monitors for suspicious activity, security threats, fraud patterns
// Runs every 5 minutes

import { Decimal } from "decimal.js";
import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class SecurityFraudAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "SecurityFraudAgent",
      enabled: true,
      schedule: "*/5 * * * *", // Every 5 minutes
      retryAttempts: 3,
      timeout: 120000,
      priority: "critical",
      description: "Security threat detection",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const threats: any[] = [];

    try {
      const lookback = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes

      // Check for multiple failed login attempts
      const failedLogins = await this.context.prisma.audit_logs.groupBy({
        by: ["userId"],
        where: {
          action: "LOGIN_FAILED",
          createdAt: {
            gte: lookback,
          },
        },
        _count: {
          userId: true,
        },
        having: {
          userId: {
            _count: {
              gt: 3, // More than 3 failed attempts
            },
          },
        },
      });

      for (const log of failedLogins) {
        if (log.userId) {
          threats.push({
            type: "brute_force_attempt",
            userId: log.userId,
            severity: "high",
            attempts: log._count.userId,
          });
        }
      }

      itemsProcessed += failedLogins.length;

      // Check for unusual transaction patterns
      const recentTransactions =
        await this.context.prisma.transactions.findMany({
          where: {
            createdAt: {
              gte: lookback,
            },
          },
        });

      // Group by user to detect rapid transactions
      const userTxMap = new Map<string, number>();
      for (const tx of recentTransactions) {
        const count = userTxMap.get(tx.userId) || 0;
        userTxMap.set(tx.userId, count + 1);
      }

      for (const [userId, count] of userTxMap.entries()) {
        if (count > 5) {
          threats.push({
            type: "rapid_transactions",
            userId,
            severity: "medium",
            count,
            timeframe: "5 minutes",
          });
        }
      }

      itemsProcessed += recentTransactions.length;

      // Check for large transactions
      const largeThreshold = new Decimal(10000);
      const largeTxs = recentTransactions.filter((tx) =>
        tx.amount.gt(largeThreshold)
      );

      for (const tx of largeTxs) {
        // Check if user is new (< 7 days old)
        const user = await this.context.prisma.users.findUnique({
          where: { id: tx.userId },
        });

        if (
          user &&
          user.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ) {
          threats.push({
            type: "large_transaction_new_user",
            userId: tx.userId,
            transaction_id: tx.id,
            amount: tx.amount.toString(),
            severity: "high",
            userAge: Math.floor(
              (Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            ),
          });
        }
      }

      // Check for suspicious API usage patterns
      const recentApiCalls = await this.context.prisma.audit_logs.groupBy({
        by: ["userId"],
        where: {
          action: {
            startsWith: "API_",
          },
          createdAt: {
            gte: lookback,
          },
        },
        _count: {
          userId: true,
        },
        having: {
          userId: {
            _count: {
              gt: 100, // More than 100 API calls in 5 minutes
            },
          },
        },
      });

      for (const log of recentApiCalls) {
        if (log.userId) {
          threats.push({
            type: "api_abuse",
            userId: log.userId,
            severity: "medium",
            calls: log._count.userId,
          });
        }
      }

      itemsProcessed += recentApiCalls.length;

      // Handle detected threats
      if (threats.length > 0) {
        this.context.logger.warn("Security threats detected", {
          count: threats.length,
          threats,
        });

        // Log each threat to audit log
        for (const threat of threats) {
          await SafePrisma.create("audit_logs", {
            userId: threat.userId || null,
            action: `SECURITY_THREAT_${threat.type.toUpperCase()}`,
            resourceType: "Security",
            resourceId: threat.userId || "system",
            ipAddress: null,
          });
        }

        // Real-time alert to admins
        if (this.context.io) {
          this.context.io.emit("security:alert", {
            agent: this.config.name,
            threats,
            timestamp: new Date(),
          });
        }

        // Auto-lock accounts with high severity threats
        const highSeverityThreats = threats.filter(
          (t) => t.severity === "high"
        );
        for (const threat of highSeverityThreats) {
          try {
            // In production, implement account locking logic
            this.context.logger.info("High severity threat - action required", {
              threat,
            });
          } catch (lockError) {
            errors++;
            this.context.logger.error("Failed to handle threat", lockError);
          }
        }
      }

      return {
        success: true,
        message: "Security scan completed",
        data: {
          threatsDetected: threats.length,
          threats,
          highSeverity: threats.filter((t) => t.severity === "high").length,
        },
        metrics: {
          duration: 0,
          itemsProcessed,
          errors,
        },
      };
    } catch (error) {
      errors++;
      throw error;
    }
  }
}
