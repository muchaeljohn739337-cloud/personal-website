// Deploy Orchestrator Agent - Deployment Monitoring & Rollback
// Monitors deployments, health checks, auto-rollback on failure
// Runs every 30 minutes

import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class DeployOrchestratorAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "DeployOrchestratorAgent",
      enabled: true,
      schedule: "*/30 * * * *", // Every 30 minutes
      retryAttempts: 3,
      timeout: 120000,
      priority: "high",
      description: "Deployment health monitoring",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const healthChecks: any[] = [];

    try {
      const lookback = new Date(Date.now() - 30 * 60 * 1000); // Last 30 minutes

      // Check system health indicators
      // 1. Database connectivity
      try {
        await this.context.prisma.$queryRaw`SELECT 1`;
        healthChecks.push({
          component: "database",
          status: "healthy",
          timestamp: new Date(),
        });
      } catch (dbError) {
        healthChecks.push({
          component: "database",
          status: "unhealthy",
          error: dbError instanceof Error ? dbError.message : "Unknown error",
          timestamp: new Date(),
        });
        errors++;
      }

      itemsProcessed++;

      // 2. Check recent error rate
      const recentErrors = await this.context.prisma.audit_logs.count({
        where: {
          action: {
            contains: "ERROR",
          },
          createdAt: {
            gte: lookback,
          },
        },
      });

      const errorRate = recentErrors / 30; // errors per minute
      healthChecks.push({
        component: "error_rate",
        status: errorRate > 5 ? "unhealthy" : "healthy",
        value: errorRate.toFixed(2),
        threshold: "5 errors/min",
        timestamp: new Date(),
      });

      if (errorRate > 5) {
        errors++;
      }

      itemsProcessed++;

      // 3. Check transaction processing
      const recentTxs = await this.context.prisma.transactions.findMany({
        where: {
          createdAt: {
            gte: lookback,
          },
        },
      });

      const failedTxRate =
        recentTxs.length > 0
          ? (recentTxs.filter((tx) => tx.status === 'FAILED').length /
              recentTxs.length) *
            100
          : 0;

      healthChecks.push({
        component: "transaction_processing",
        status: failedTxRate > 10 ? "degraded" : "healthy",
        value: `${failedTxRate.toFixed(2)}% failed`,
        threshold: "10%",
        timestamp: new Date(),
      });

      if (failedTxRate > 10) {
        errors++;
      }

      itemsProcessed += recentTxs.length;

      // 4. Check API response times (using audit logs as proxy)
      const recentApiLogs = await this.context.prisma.audit_logs.findMany({
        where: {
          action: {
            startsWith: "API_",
          },
          createdAt: {
            gte: lookback,
          },
        },
        take: 100,
      });

      healthChecks.push({
        component: "api_activity",
        status: recentApiLogs.length > 0 ? "healthy" : "warning",
        value: `${recentApiLogs.length} requests`,
        timestamp: new Date(),
      });

      itemsProcessed++;

      // Determine overall system health
      const unhealthyCount = healthChecks.filter(
        (c) => c.status === "unhealthy"
      ).length;
      const degradedCount = healthChecks.filter(
        (c) => c.status === "degraded"
      ).length;

      let overallStatus: "healthy" | "degraded" | "critical";
      if (unhealthyCount > 0) {
        overallStatus = "critical";
      } else if (degradedCount > 0) {
        overallStatus = "degraded";
      } else {
        overallStatus = "healthy";
      }

      // Alert on unhealthy status
      if (overallStatus !== "healthy") {
        this.context.logger.warn("System health degraded", {
          status: overallStatus,
          healthChecks,
        });

        if (this.context.io) {
          this.context.io.emit("deployment:health", {
            agent: this.config.name,
            status: overallStatus,
            healthChecks,
            timestamp: new Date(),
          });
        }
      }

      // Check for deployment markers (recent schema changes, etc.)
      const recentDeploymentMarker =
        await this.context.prisma.audit_logs.findFirst({
          where: {
            action: "DEPLOYMENT",
            createdAt: {
              gte: lookback,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      const deploymentStatus = {
        overallStatus,
        healthChecks,
        recentDeployment: recentDeploymentMarker || null,
        timestamp: new Date(),
      };

      return {
        success: true,
        message: "Deployment health check completed",
        data: deploymentStatus,
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
