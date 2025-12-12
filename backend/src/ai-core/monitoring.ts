import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { AIBrainCell } from "./brain";

const TaskStatusEnum = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
const AlertStatusEnum = {
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
} as const;

const prisma = new PrismaClient();

export interface MonitoringRule {
  name: string;
  type: "error" | "performance" | "security" | "usage" | "custom";
  condition: any;
  threshold?: number;
  action: "alert" | "auto_fix" | "suggest" | "log";
  severity: "low" | "medium" | "high" | "critical";
  enabled?: boolean;
}

export interface Alert {
  ruleId: string;
  message: string;
  metadata: any;
  severity: string;
  suggestedAction?: string;
}

/**
 * AI-powered monitoring and alerting system
 */
export class AIMonitoringService {
  private brain: AIBrainCell;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    this.brain = new AIBrainCell();
  }

  /**
   * Start monitoring
   */
  start(intervalMs: number = 60000) {
    if (this.checkInterval) {
      logger.warn("Monitoring already running");
      return;
    }

    logger.info(`Starting AI monitoring (interval: ${intervalMs}ms)`);

    this.checkInterval = setInterval(async () => {
      await this.runMonitoringChecks();
    }, intervalMs);

    // Run initial check
    this.runMonitoringChecks();
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      logger.info("AI monitoring stopped");
    }
  }

  /**
   * Create a monitoring rule
   */
  async createRule(rule: MonitoringRule) {
    const created = await prisma.aIMonitoringRule.create({
      data: {
        name: rule.name,
        type: rule.type,
        condition: JSON.stringify({ ...rule.condition, action: rule.action }),
        threshold: rule.threshold,
        severity: rule.severity,
        enabled: rule.enabled !== false,
      },
    });

    logger.info(`Monitoring rule created: ${rule.name} (${created.id})`);
    return created;
  }

  /**
   * Run all monitoring checks
   */
  private async runMonitoringChecks() {
    const rules = await prisma.aIMonitoringRule.findMany({
      where: { enabled: true },
    });

    for (const rule of rules) {
      try {
        await this.checkRule(rule);
      } catch (error) {
        logger.error(`Error checking rule ${rule.name}:`, error);
      }
    }
  }

  /**
   * Check a specific monitoring rule
   */
  private async checkRule(rule: any) {
    const condition = JSON.parse(rule.condition);

    let triggered = false;
    let metadata: any = {};
    let details: any = {};

    switch (rule.type) {
      case "error":
        triggered = await this.checkErrors(condition, rule.threshold);
        details = await this.getErrorDetails(condition);
        break;

      case "performance":
        triggered = await this.checkPerformance(condition, rule.threshold);
        details = await this.getPerformanceDetails(condition);
        break;

      case "security":
        triggered = await this.checkSecurity(condition);
        details = await this.getSecurityDetails(condition);
        break;

      case "usage":
        triggered = await this.checkUsage(condition, rule.threshold);
        details = await this.getUsageDetails(condition);
        break;

      case "custom":
        triggered = await this.checkCustom(condition);
        details = { condition };
        break;
    }

    if (triggered) {
      await this.handleAlert({
        ruleId: rule.id,
        message: `Alert: ${rule.name}`,
        metadata: details,
        severity: rule.severity,
      });
    }

    // Update last check time
    await prisma.aIMonitoringRule.update({
      where: { id: rule.id },
      data: { lastCheck: new Date() },
    });
  }

  /**
   * Check for errors
   */
  private async checkErrors(condition: any, threshold?: number): Promise<boolean> {
    const since = new Date(Date.now() - (condition.timeWindowMs || 3600000));

    const errorCount = await prisma.aITask.count({
      where: {
        status: TaskStatusEnum.FAILED,
        createdAt: { gte: since },
        ...(condition.taskType && { taskType: condition.taskType }),
      },
    });

    return threshold ? errorCount >= threshold : errorCount > 0;
  }

  /**
   * Get error details
   */
  private async getErrorDetails(condition: any) {
    const since = new Date(Date.now() - (condition.timeWindowMs || 3600000));

    const errors = await prisma.aITask.findMany({
      where: {
        status: TaskStatusEnum.FAILED,
        createdAt: { gte: since },
        ...(condition.taskType && { taskType: condition.taskType }),
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        taskType: true,
        error: true,
        createdAt: true,
      },
    });

    return { errorCount: errors.length, recentErrors: errors };
  }

  /**
   * Check performance metrics
   */
  private async checkPerformance(condition: any, threshold?: number): Promise<boolean> {
    const since = new Date(Date.now() - (condition.timeWindowMs || 3600000));

    const tasks = await prisma.aITask.findMany({
      where: {
        status: TaskStatusEnum.COMPLETED,
        createdAt: { gte: since },
        ...(condition.taskType && { taskType: condition.taskType }),
      },
      select: {
        executionTimeMs: true,
      },
    });

    if (tasks.length === 0) return false;

    const avgExecutionTime =
      tasks.reduce((sum: number, t: { executionTimeMs: number | null }) => sum + (t.executionTimeMs || 0), 0) /
      tasks.length;

    return threshold ? avgExecutionTime >= threshold : false;
  }

  /**
   * Get performance details
   */
  private async getPerformanceDetails(condition: any) {
    const since = new Date(Date.now() - (condition.timeWindowMs || 3600000));

    const tasks = await prisma.aITask.findMany({
      where: {
        status: TaskStatusEnum.COMPLETED,
        createdAt: { gte: since },
        ...(condition.taskType && { taskType: condition.taskType }),
      },
      select: {
        executionTimeMs: true,
        taskType: true,
      },
    });

    const avgExecutionTime =
      tasks.length > 0
        ? tasks.reduce((sum: number, t: { executionTimeMs: number | null }) => sum + (t.executionTimeMs || 0), 0) /
          tasks.length
        : 0;

    return {
      taskCount: tasks.length,
      avgExecutionTime,
      maxExecutionTime: Math.max(...tasks.map((t: { executionTimeMs: number | null }) => t.executionTimeMs || 0)),
    };
  }

  /**
   * Check security conditions
   */
  private async checkSecurity(condition: any): Promise<boolean> {
    // Check for suspicious patterns
    if (condition.checkFailedLogins) {
      const since = new Date(Date.now() - 3600000); // Last hour
      // This would integrate with your auth system
      // For now, return false
      return false;
    }

    if (condition.checkUnauthorizedAccess) {
      // Check logs for unauthorized access attempts
      return false;
    }

    return false;
  }

  /**
   * Get security details
   */
  private async getSecurityDetails(condition: any) {
    return {
      checkType: condition.checkFailedLogins ? "failed_logins" : "unauthorized_access",
      timestamp: new Date(),
    };
  }

  /**
   * Check usage metrics
   */
  private async checkUsage(condition: any, threshold?: number): Promise<boolean> {
    const since = new Date(Date.now() - (condition.timeWindowMs || 86400000));

    const taskCount = await prisma.aITask.count({
      where: {
        createdAt: { gte: since },
      },
    });

    return threshold ? taskCount >= threshold : false;
  }

  /**
   * Get usage details
   */
  private async getUsageDetails(condition: any) {
    const since = new Date(Date.now() - (condition.timeWindowMs || 86400000));

    const totalTasks = await prisma.aITask.count({
      where: { createdAt: { gte: since } },
    });

    const completedTasks = await prisma.aITask.count({
      where: { status: TaskStatusEnum.COMPLETED, createdAt: { gte: since } },
    });

    const failedTasks = await prisma.aITask.count({
      where: { status: TaskStatusEnum.FAILED, createdAt: { gte: since } },
    });

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  /**
   * Check custom condition
   */
  private async checkCustom(condition: any): Promise<boolean> {
    // Custom logic based on condition
    // This can be extended for specific use cases
    return false;
  }

  /**
   * Handle an alert
   */
  private async handleAlert(alert: Alert) {
    logger.warn(`AI Alert: ${alert.message}`, alert.metadata);

    // Get AI suggestion for the alert
    const suggestion = await this.getAISuggestion(alert);

    // Create alert record
    await prisma.aIAlert.create({
      data: {
        ruleId: alert.ruleId,
        message: alert.message,
        metadata: JSON.stringify(alert.metadata),
        severity: alert.severity,
        status: AlertStatusEnum.PENDING,
      },
    });

    // If critical, could trigger immediate notifications
    if (alert.severity === "critical") {
      // Send urgent notification to admins
      logger.error("CRITICAL ALERT:", alert.message);
    }
  }

  /**
   * Get AI suggestion for an alert
   */
  private async getAISuggestion(alert: Alert): Promise<string> {
    try {
      const response = await this.brain.analyze({
        model: "gpt-4",
        systemPrompt:
          "You are a system monitoring expert. Analyze the alert and provide a clear, actionable suggestion to resolve the issue.",
        userPrompt: `Alert: ${alert.message}\nDetails: ${JSON.stringify(
          alert.metadata,
          null,
          2
        )}\n\nProvide a suggested action to resolve this issue.`,
        temperature: 0.3,
        maxTokens: 500,
      });

      return response.content;
    } catch (error) {
      logger.error("Failed to get AI suggestion:", error);
      return "Manual investigation required.";
    }
  }

  /**
   * Get all active alerts
   */
  async getAlerts(status?: string) {
    return await prisma.aIAlert.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /**
   * Acknowledge/resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, notes?: string) {
    return await prisma.aIAlert.update({
      where: { id: alertId },
      data: {
        status: AlertStatusEnum.RESOLVED,
      },
    });
  }

  /**
   * Get monitoring stats
   */
  async getStats() {
    const activeRules = await prisma.aIMonitoringRule.count({
      where: { enabled: true },
    });

    const pendingAlerts = await prisma.aIAlert.count({
      where: { status: AlertStatusEnum.PENDING },
    });

    const criticalAlerts = await prisma.aIAlert.count({
      where: { status: AlertStatusEnum.PENDING, severity: "critical" },
    });

    const last24h = new Date(Date.now() - 86400000);
    const recentAlerts = await prisma.aIAlert.count({
      where: { createdAt: { gte: last24h } },
    });

    return {
      activeRules,
      pendingAlerts,
      criticalAlerts,
      recentAlerts,
    };
  }
}

// Export singleton instance for compatibility
export const AIMonitoring = new AIMonitoringService();
