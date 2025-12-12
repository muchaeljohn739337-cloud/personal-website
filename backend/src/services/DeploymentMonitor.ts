/**
 * Deployment Monitor Service
 * Tracks deployments, monitors health, and triggers automatic rollbacks
 * Part of the autonomous AI deployment system
 */

import prisma from "../prismaClient";

export interface DeploymentMetrics {
  deploymentId: string;
  startTime: Date;
  endTime?: Date;
  status: "in_progress" | "success" | "failed" | "rolled_back";
  errorRate: number;
  responseTime: number;
  baselineResponseTime: number;
  healthChecksPassed: number;
  healthChecksFailed: number;
  errors: Array<{
    timestamp: Date;
    message: string;
    stack?: string;
  }>;
}

export interface RollbackTrigger {
  reason: string;
  metric: string;
  threshold: number;
  actual: number;
  timestamp: Date;
}

export class DeploymentMonitor {
  private static instance: DeploymentMonitor;
  private activeDeployments: Map<string, DeploymentMetrics> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private baselineMetrics: Map<string, number> = new Map();

  private constructor() {
    this.initializeBaseline();
  }

  public static getInstance(): DeploymentMonitor {
    if (!DeploymentMonitor.instance) {
      DeploymentMonitor.instance = new DeploymentMonitor();
    }
    return DeploymentMonitor.instance;
  }

  /**
   * Initialize baseline metrics for comparison
   */
  private async initializeBaseline(): Promise<void> {
    try {
      // In production, these would be calculated from historical data
      this.baselineMetrics.set("responseTime", 200); // 200ms baseline
      this.baselineMetrics.set("errorRate", 1); // 1% baseline error rate
      console.log("[DeploymentMonitor] Baseline metrics initialized");
    } catch (error) {
      console.error("[DeploymentMonitor] Failed to initialize baseline:", error);
    }
  }

  /**
   * Start monitoring a new deployment
   */
  public async startDeployment(deploymentId: string, action: AgentAction, performedBy: string): Promise<void> {
    const metrics: DeploymentMetrics = {
      deploymentId,
      startTime: new Date(),
      status: "in_progress",
      errorRate: 0,
      responseTime: 0,
      baselineResponseTime: this.baselineMetrics.get("responseTime") || 200,
      healthChecksPassed: 0,
      healthChecksFailed: 0,
      errors: [],
    };

    this.activeDeployments.set(deploymentId, metrics);

    // Log deployment start to database
    try {
      await prisma.audit_logs.create({
        data: {
          action: "DEPLOYMENT_STARTED",
          user_id: performedBy,
          resource_type: "DEPLOYMENT",
          resource_id: deploymentId,
          changes: JSON.stringify({
            actionId: action.id,
            actionName: action.name,
            riskLevel: action.riskLevel,
            estimatedDuration: action.estimatedDuration,
          }),
          ip_address: "127.0.0.1",
          user_agent: "DeploymentMonitor",
        },
      });
    } catch (error) {
      console.error("[DeploymentMonitor] Failed to log deployment start:", error);
    }

    // Start health check monitoring
    this.startHealthCheckMonitoring(deploymentId);

    console.log(`[DeploymentMonitor] 🚀 Started monitoring deployment: ${deploymentId}`);
  }

  /**
   * Start periodic health checks for deployment
   */
  private startHealthCheckMonitoring(deploymentId: string): void {
    const interval = agentConfig.safetyConstraints.healthCheckInterval * 1000;

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck(deploymentId);
    }, interval);
  }

  /**
   * Perform health check on active deployment
   */
  private async performHealthCheck(deploymentId: string): Promise<void> {
    const metrics = this.activeDeployments.get(deploymentId);
    if (!metrics || metrics.status !== "in_progress") {
      return;
    }

    try {
      // Test database connectivity
      await prisma.$queryRaw`SELECT 1`;

      // Simulate response time check (in production, use actual API calls)
      const responseTime = Math.random() * 300 + 100; // 100-400ms
      metrics.responseTime = responseTime;
      metrics.healthChecksPassed++;

      // Check for rollback triggers
      await this.checkRollbackTriggers(deploymentId, metrics);

      console.log(`[DeploymentMonitor] ✅ Health check passed for ${deploymentId}`);
    } catch (error: any) {
      metrics.healthChecksFailed++;
      metrics.errors.push({
        timestamp: new Date(),
        message: error.message,
        stack: error.stack,
      });

      console.error(`[DeploymentMonitor] ❌ Health check failed for ${deploymentId}:`, error.message);

      // Check if we need to trigger rollback
      await this.checkRollbackTriggers(deploymentId, metrics);
    }
  }

  /**
   * Check if rollback should be triggered
   */
  private async checkRollbackTriggers(deploymentId: string, metrics: DeploymentMetrics): Promise<void> {
    const triggers: RollbackTrigger[] = [];

    // Check error rate
    const totalChecks = metrics.healthChecksPassed + metrics.healthChecksFailed;
    if (totalChecks >= 5) {
      const errorRate = (metrics.healthChecksFailed / totalChecks) * 100;
      metrics.errorRate = errorRate;

      if (errorRate > agentConfig.safetyConstraints.errorRateThreshold) {
        triggers.push({
          reason: "Error rate exceeded threshold",
          metric: "errorRate",
          threshold: agentConfig.safetyConstraints.errorRateThreshold,
          actual: errorRate,
          timestamp: new Date(),
        });
      }
    }

    // Check response time
    const responseTimeThreshold = metrics.baselineResponseTime * agentConfig.safetyConstraints.responseTimeThreshold;

    if (metrics.responseTime > responseTimeThreshold) {
      triggers.push({
        reason: "Response time exceeded threshold",
        metric: "responseTime",
        threshold: responseTimeThreshold,
        actual: metrics.responseTime,
        timestamp: new Date(),
      });
    }

    // Check for any 500 errors (critical)
    const has500Error = metrics.errors.some(
      (e) => e.message.includes("500") || e.message.includes("Internal Server Error")
    );

    if (has500Error) {
      triggers.push({
        reason: "Critical 500 error detected",
        metric: "errorSeverity",
        threshold: 0,
        actual: 1,
        timestamp: new Date(),
      });
    }

    // Trigger rollback if any conditions met
    if (triggers.length > 0) {
      await this.triggerRollback(deploymentId, triggers);
    }
  }

  /**
   * Trigger automatic rollback
   */
  private async triggerRollback(deploymentId: string, triggers: RollbackTrigger[]): Promise<void> {
    const metrics = this.activeDeployments.get(deploymentId);
    if (!metrics) return;

    console.error(`[DeploymentMonitor] 🔄 Triggering rollback for ${deploymentId}`);
    console.error("Rollback triggers:", triggers);

    metrics.status = "rolled_back";
    metrics.endTime = new Date();

    // Stop health check monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    try {
      // Log rollback to database
      await prisma.audit_logs.create({
        data: {
          action: "DEPLOYMENT_ROLLED_BACK",
          user_id: "system",
          resource_type: "DEPLOYMENT",
          resource_id: deploymentId,
          changes: JSON.stringify({
            triggers,
            metrics: {
              errorRate: metrics.errorRate,
              responseTime: metrics.responseTime,
              healthChecksFailed: metrics.healthChecksFailed,
              errors: metrics.errors.slice(-5), // Last 5 errors
            },
          }),
          ip_address: "127.0.0.1",
          user_agent: "DeploymentMonitor",
        },
      });

      // TODO: Execute actual rollback commands here
      // This would restore previous deployment state

      // Send alert to admin
      await this.sendRollbackAlert(deploymentId, triggers, metrics);
    } catch (error) {
      console.error("[DeploymentMonitor] Failed to log rollback:", error);
    }

    this.activeDeployments.delete(deploymentId);
  }

  /**
   * Send rollback alert to admin
   */
  private async sendRollbackAlert(
    deploymentId: string,
    triggers: RollbackTrigger[],
    metrics: DeploymentMetrics
  ): Promise<void> {
    const message = `
🚨 AUTOMATIC ROLLBACK TRIGGERED

Deployment ID: ${deploymentId}
Time: ${new Date().toISOString()}

Triggers:
${triggers.map((t) => `- ${t.reason}: ${t.actual.toFixed(2)} (threshold: ${t.threshold})`).join("\n")}

Metrics:
- Error Rate: ${metrics.errorRate.toFixed(2)}%
- Response Time: ${metrics.responseTime.toFixed(0)}ms (baseline: ${metrics.baselineResponseTime}ms)
- Failed Health Checks: ${metrics.healthChecksFailed}/${metrics.healthChecksPassed + metrics.healthChecksFailed}

Recent Errors:
${metrics.errors
  .slice(-3)
  .map((e) => `[${e.timestamp.toISOString()}] ${e.message}`)
  .join("\n")}

Action Required: Review logs and investigate root cause.
    `.trim();

    console.error(message);

    // TODO: Send to Slack/Discord webhook
    // TODO: Send email notification
    // For now, just log to audit
  }

  /**
   * Complete a successful deployment
   */
  public async completeDeployment(deploymentId: string): Promise<void> {
    const metrics = this.activeDeployments.get(deploymentId);
    if (!metrics) {
      console.warn(`[DeploymentMonitor] No active deployment found: ${deploymentId}`);
      return;
    }

    metrics.status = "success";
    metrics.endTime = new Date();

    // Stop health check monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    const duration = metrics.endTime.getTime() - metrics.startTime.getTime();
    const durationMinutes = (duration / 1000 / 60).toFixed(2);

    console.log(`[DeploymentMonitor] ✅ Deployment completed successfully: ${deploymentId}`);
    console.log(`   Duration: ${durationMinutes} minutes`);
    console.log(`   Health checks passed: ${metrics.healthChecksPassed}`);
    console.log(`   Error rate: ${metrics.errorRate.toFixed(2)}%`);

    try {
      // Log successful deployment
      await prisma.audit_logs.create({
        data: {
          action: "DEPLOYMENT_COMPLETED",
          user_id: "system",
          resource_type: "DEPLOYMENT",
          resource_id: deploymentId,
          changes: JSON.stringify({
            duration: durationMinutes,
            healthChecksPassed: metrics.healthChecksPassed,
            healthChecksFailed: metrics.healthChecksFailed,
            errorRate: metrics.errorRate,
            avgResponseTime: metrics.responseTime,
          }),
          ip_address: "127.0.0.1",
          user_agent: "DeploymentMonitor",
        },
      });
    } catch (error) {
      console.error("[DeploymentMonitor] Failed to log completion:", error);
    }

    this.activeDeployments.delete(deploymentId);
  }

  /**
   * Fail a deployment manually
   */
  public async failDeployment(deploymentId: string, reason: string): Promise<void> {
    const metrics = this.activeDeployments.get(deploymentId);
    if (!metrics) return;

    metrics.status = "failed";
    metrics.endTime = new Date();

    // Stop health check monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    console.error(`[DeploymentMonitor] ❌ Deployment failed: ${deploymentId}`);
    console.error(`   Reason: ${reason}`);

    try {
      await prisma.audit_logs.create({
        data: {
          action: "DEPLOYMENT_FAILED",
          user_id: "system",
          resource_type: "DEPLOYMENT",
          resource_id: deploymentId,
          changes: JSON.stringify({
            reason,
            errorRate: metrics.errorRate,
            errors: metrics.errors,
          }),
          ip_address: "127.0.0.1",
          user_agent: "DeploymentMonitor",
        },
      });
    } catch (error) {
      console.error("[DeploymentMonitor] Failed to log failure:", error);
    }

    this.activeDeployments.delete(deploymentId);
  }

  /**
   * Get active deployments
   */
  public getActiveDeployments(): Map<string, DeploymentMetrics> {
    return this.activeDeployments;
  }

  /**
   * Get deployment metrics
   */
  public getDeploymentMetrics(deploymentId: string): DeploymentMetrics | undefined {
    return this.activeDeployments.get(deploymentId);
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log("[DeploymentMonitor] Shutdown complete");
  }
}

// Export singleton instance
export const deploymentMonitor = DeploymentMonitor.getInstance();
