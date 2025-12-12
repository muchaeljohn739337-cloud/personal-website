// Monitor Agent - System Health Monitoring
// Checks system health, resource utilization, database performance
// Runs every 5 minutes

import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class MonitorAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "MonitorAgent",
      enabled: true,
      schedule: "*/5 * * * *", // Every 5 minutes
      retryAttempts: 3,
      timeout: 60000,
      priority: "critical",
      description: "System health monitoring",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;

    try {
      // Check database connection
      await this.context.prisma.$queryRaw`SELECT 1`;
      itemsProcessed++;

      // Check active users
      const activeUsers = await this.context.prisma.users.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      });

      // Check pending transactions
      const pendingTxs = await this.context.prisma.transactions.count({
        where: {
          status: "PENDING",
        },
      });

      // Check system errors in last 5 minutes
      const recentErrors = await this.context.prisma.audit_logs.count({
        where: {
          action: {
            contains: "ERROR",
          },
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
      });

      itemsProcessed += 3;

      // Alert thresholds
      if (pendingTxs > 100) {
        this.context.logger.warn("High pending transaction count", {
          count: pendingTxs,
        });

        if (this.context.io) {
          this.context.io.emit("system:alert", {
            type: "warning",
            agent: this.config.name,
            message: `${pendingTxs} pending transactions detected`,
            timestamp: new Date(),
          });
        }
      }

      if (recentErrors > 10) {
        this.context.logger.error("High error rate detected", {
          count: recentErrors,
        });

        if (this.context.io) {
          this.context.io.emit("system:alert", {
            type: "error",
            agent: this.config.name,
            message: `${recentErrors} errors in last 5 minutes`,
            timestamp: new Date(),
          });
        }
      }

      return {
        success: true,
        message: "System health check completed",
        data: {
          activeUsers,
          pendingTransactions: pendingTxs,
          recentErrors,
          status: recentErrors > 10 ? "critical" : "healthy",
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
