// Admin Insight Agent - Analytics & Business Intelligence
// Generates daily reports and insights for admins
// Runs daily at 2 AM

import { Decimal } from "decimal.js";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class AdminInsightAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "AdminInsightAgent",
      enabled: true,
      schedule: "0 2 * * *", // Daily at 2 AM
      retryAttempts: 3,
      timeout: 300000,
      priority: "low",
      description: "Daily admin analytics",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;

    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // User metrics
      const newUsers = await this.context.prisma.users.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      const totalUsers = await this.context.prisma.users.count();

      const activeUsers = await this.context.prisma.users.count({
        where: {
          lastLogin: {
            gte: yesterday,
          },
        },
      });

      itemsProcessed += 3;

      // Transaction metrics
      const transactions = await this.context.prisma.transactions.findMany({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      const totalVolume = transactions.reduce(
        (sum: Decimal, tx: any) => sum.add(tx.amount),
        new Decimal(0)
      );

      const successfulTxs = transactions.filter(
        (tx: any) => tx.status === "COMPLETED"
      ).length;
      const failedTxs = transactions.filter(
        (tx: any) => tx.status === "FAILED"
      ).length;
      const successRate =
        transactions.length > 0
          ? (successfulTxs / transactions.length) * 100
          : 0;

      itemsProcessed += transactions.length;

      // Notification metrics
      const notifications = await this.context.prisma.notifications.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      // Audit log metrics (error tracking)
      const auditLogs = await this.context.prisma.audit_logs.findMany({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      });

      const errorLogs = auditLogs.filter((log: any) =>
        log.action.includes("ERROR")
      ).length;

      itemsProcessed += auditLogs.length;

      // Compile daily report
      const dailyReport = {
        date: new Date().toISOString().split("T")[0],
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
          activeRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        },
        transactions: {
          count: transactions.length,
          volume: totalVolume.toString(),
          successful: successfulTxs,
          failed: failedTxs,
          successRate: successRate.toFixed(2),
        },
        notifications: {
          sent: notifications,
        },
        system: {
          errors: errorLogs,
          auditLogs: auditLogs.length,
        },
      };

      this.context.logger.info("Daily report generated", dailyReport);

      // Emit to admin dashboard
      if (this.context.io) {
        this.context.io.emit("admin:daily-report", {
          agent: this.config.name,
          report: dailyReport,
          timestamp: new Date(),
        });
      }

      // Alert on concerning metrics
      if (successRate < 90) {
        this.context.logger.warn("Low transaction success rate", {
          successRate,
        });
      }

      if (errorLogs > 50) {
        this.context.logger.warn("High error count", {
          errorLogs,
        });
      }

      return {
        success: true,
        message: "Daily insights generated",
        data: dailyReport,
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
