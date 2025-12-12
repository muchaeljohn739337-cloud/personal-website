// Compliance & Policy Agent - Regulatory Compliance Monitoring
// Ensures platform compliance with regulations, enforces policies
// Runs every 6 hours

import { Decimal } from 'decimal.js';
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class CompliancePolicyAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "CompliancePolicyAgent",
      enabled: true,
      schedule: "0 */6 * * *", // Every 6 hours
      retryAttempts: 3,
      timeout: 300000,
      priority: "high",
      description: "Regulatory compliance monitoring",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const violations: any[] = [];

    try {
      const lookback = new Date(Date.now() - 6 * 60 * 60 * 1000); // Last 6 hours

      // Check for users without KYC verification (if required)
      const unverifiedUsers = await this.context.prisma.users.findMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Older than 7 days
          },
        },
        take: 100,
      });

      itemsProcessed += unverifiedUsers.length;

      // Check transaction limits and reporting thresholds
      const largeTxThreshold = new Decimal(10000);
      const largeTransactions = await this.context.prisma.transactions.findMany({
        where: {
          createdAt: {
            gte: lookback,
          },
          amount: {
            gte: largeTxThreshold,
          },
        },
      });

      // Flag transactions that require reporting
      for (const tx of largeTransactions) {
        violations.push({
          type: "large_transaction_reporting",
          transaction_id: tx.id,
          userId: tx.userId,
          amount: tx.amount.toString(),
          requiresReporting: true,
        });
      }

      itemsProcessed += largeTransactions.length;

      // Check for users with cumulative daily volume over threshold
      const dailyThreshold = new Decimal(50000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayTransactions = await this.context.prisma.transactions.findMany({
        where: {
          createdAt: {
            gte: today,
          },
          status: "COMPLETED",
        },
      });

      // Group by user
      const userVolumes = new Map<string, Decimal>();
      for (const tx of todayTransactions) {
        const current = userVolumes.get(tx.userId) || new Decimal(0);
        userVolumes.set(tx.userId, current.add(tx.amount));
      }

      for (const [userId, volume] of userVolumes.entries()) {
        if (volume.gt(dailyThreshold)) {
          violations.push({
            type: "daily_volume_limit_exceeded",
            userId,
            volume: volume.toString(),
            threshold: dailyThreshold.toString(),
          });
        }
      }

      itemsProcessed += todayTransactions.length;

      // Check for missing audit logs (data retention compliance)
      const oldestAuditLog = await this.context.prisma.audit_logs.findFirst({
        orderBy: {
          createdAt: "asc",
        },
      });

      if (oldestAuditLog) {
        const retentionDays = 365; // 1 year retention
        const retentionDate = new Date(
          Date.now() - retentionDays * 24 * 60 * 60 * 1000
        );

        if (oldestAuditLog.createdAt < retentionDate) {
          violations.push({
            type: "audit_log_retention_exceeded",
            oldestLog: oldestAuditLog.createdAt,
            retentionPolicy: `${retentionDays} days`,
          });
        }
      }

      // Check for data privacy compliance (inactive users)
      const inactiveThreshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      const inactiveUsers = await this.context.prisma.users.count({
        where: {
          lastLogin: {
            lt: inactiveThreshold,
          },
        },
      });

      if (inactiveUsers > 100) {
        violations.push({
          type: "inactive_user_data_retention",
          count: inactiveUsers,
          recommendation: "Review and archive inactive user data",
        });
      }

      // Generate compliance report
      const complianceReport = {
        timestamp: new Date(),
        period: "6 hours",
        checks: {
          unverifiedUsers: unverifiedUsers.length,
          largeTransactions: largeTransactions.length,
          volumeViolations: violations.filter(
            (v) => v.type === "daily_volume_limit_exceeded"
          ).length,
          inactiveUsers,
        },
        violations: violations.length,
        status: violations.length === 0 ? "compliant" : "review_required",
      };

      if (violations.length > 0) {
        this.context.logger.warn("Compliance violations detected", {
          count: violations.length,
          violations,
        });

        if (this.context.io) {
          this.context.io.emit("compliance:alert", {
            agent: this.config.name,
            report: complianceReport,
            violations,
            timestamp: new Date(),
          });
        }
      }

      return {
        success: true,
        message: "Compliance check completed",
        data: complianceReport,
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
