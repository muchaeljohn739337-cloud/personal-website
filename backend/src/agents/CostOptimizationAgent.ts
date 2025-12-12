// Cost Optimization Agent - Resource & Cost Management
// Monitors costs, optimizes resource usage, identifies savings
// Runs daily at 3 AM

import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class CostOptimizationAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "CostOptimizationAgent",
      enabled: true,
      schedule: "0 3 * * *", // Daily at 3 AM
      retryAttempts: 3,
      timeout: 180000,
      priority: "low",
      description: "Resource and cost optimization",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const recommendations: any[] = [];

    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Analyze database query patterns
      const transactionCount = await this.context.prisma.transactions.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      const notificationCount = await this.context.prisma.notifications.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      const auditLogCount = await this.context.prisma.audit_logs.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      itemsProcessed += 3;

      // Check for old audit logs that can be archived
      const oldAuditLogs = await this.context.prisma.audit_logs.count({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // > 90 days old
          },
        },
      });

      if (oldAuditLogs > 10000) {
        recommendations.push({
          type: "archive_old_audit_logs",
          priority: "medium",
          savings: "Database storage costs",
          count: oldAuditLogs,
          action: "Archive audit logs older than 90 days to cold storage",
        });
      }

      // Check for inactive users consuming resources
      const inactiveUsers = await this.context.prisma.users.count({
        where: {
          lastLogin: {
            lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // > 6 months
          },
        },
      });

      if (inactiveUsers > 100) {
        recommendations.push({
          type: "remove_inactive_users",
          priority: "low",
          savings: "Database storage & compute",
          count: inactiveUsers,
          action: "Send re-engagement email or archive inactive accounts",
        });
      }

      // Analyze notification patterns
      const oldNotifications = await this.context.prisma.notifications.count({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // > 30 days old
          },
        },
      });

      if (oldNotifications > 5000) {
        recommendations.push({
          type: "cleanup_old_notifications",
          priority: "medium",
          savings: "Database storage",
          count: oldNotifications,
          action: "Delete notifications older than 30 days",
        });
      }

      // Check for failed transactions that can be cleaned up
      const oldFailedTxs = await this.context.prisma.transactions.count({
        where: {
          status: "FAILED",
          createdAt: {
            lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // > 60 days old
          },
        },
      });

      if (oldFailedTxs > 1000) {
        recommendations.push({
          type: "archive_old_failed_transactions",
          priority: "low",
          savings: "Database storage",
          count: oldFailedTxs,
          action: "Archive failed transactions older than 60 days",
        });
      }

      // Estimate daily operational metrics
      const dailyMetrics = {
        transactions: transactionCount,
        notifications: notificationCount,
        auditLogs: auditLogCount,
        databaseRecords: transactionCount + notificationCount + auditLogCount,
      };

      // Calculate potential savings
      const storagePerRecord = 0.5; // KB estimate
      const archivablRecords = oldAuditLogs + oldNotifications + oldFailedTxs;
      const potentialStorageSavings = (
        (archivablRecords * storagePerRecord) /
        1024 /
        1024
      ).toFixed(2); // GB

      const costReport = {
        date: new Date().toISOString().split("T")[0],
        dailyMetrics,
        recommendations: recommendations.length,
        potentialSavings: {
          storage: `${potentialStorageSavings} GB`,
          archivableRecords: archivablRecords,
        },
      };

      if (recommendations.length > 0) {
        this.context.logger.info("Cost optimization opportunities found", {
          recommendations,
        });

        if (this.context.io) {
          this.context.io.emit("optimization:report", {
            agent: this.config.name,
            report: costReport,
            recommendations,
            timestamp: new Date(),
          });
        }
      }

      return {
        success: true,
        message: "Cost optimization analysis completed",
        data: costReport,
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
