import { PrismaClient } from "@prisma/client";
import { aiBrain } from "../brain";

const prisma = new PrismaClient();

export interface MonitoringTaskData {
  type: "error-detection" | "performance" | "security" | "usage";
  target?: string;
  threshold?: number;
  timeRange?: string;
}

export class MonitoringHandler {
  async handle(taskData: MonitoringTaskData): Promise<any> {
    try {
      switch (taskData.type) {
        case "error-detection":
          return await this.detectErrors(taskData);
        case "performance":
          return await this.checkPerformance(taskData);
        case "security":
          return await this.checkSecurity(taskData);
        case "usage":
          return await this.analyzeUsage(taskData);
        default:
          throw new Error(`Unknown monitoring type: ${taskData.type}`);
      }
    } catch (error: any) {
      console.error("Monitoring handler error:", error);
      throw new Error(`Monitoring failed: ${error.message}`);
    }
  }

  private async detectErrors(taskData: MonitoringTaskData): Promise<any> {
    // Get recent error logs
    const timeRange = this.parseTimeRange(taskData.timeRange || "1h");

    const errors = await prisma.audit_logs.findMany({
      where: {
        action: { contains: "error" },
        createdAt: {
          gte: timeRange,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (errors.length === 0) {
      return {
        status: "healthy",
        errors: 0,
        message: "No errors detected",
      };
    }

    // Analyze error patterns with AI
    const errorSummary = errors.map((e: any) => ({
      action: e.action,
      metadata: e.details,
      time: e.createdAt,
    }));

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are an error analysis assistant. Identify patterns and root causes.",
      userPrompt: JSON.stringify(errorSummary, null, 2),
      temperature: 0.3,
      maxTokens: 800,
    });
    const analysis = aiResponse.content;

    // Log alert if threshold exceeded
    const threshold = taskData.threshold || 10;
    if (errors.length >= threshold) {
      console.log("Alert: Error spike detected", {
        type: "error-spike",
        severity: errors.length > threshold * 2 ? "CRITICAL" : "HIGH",
        message: `Error spike detected: ${errors.length} errors in ${taskData.timeRange || "1h"}`,
        errorCount: errors.length,
        analysis,
        topErrors: errors.slice(0, 5),
      });
    }

    return {
      status: errors.length >= threshold ? "alert" : "warning",
      errorCount: errors.length,
      threshold,
      analysis,
      errors: errors.slice(0, 10),
    };
  }

  private async checkPerformance(taskData: MonitoringTaskData): Promise<any> {
    const timeRange = this.parseTimeRange(taskData.timeRange || "1h");

    // Get task execution metrics
    const tasks = await prisma.rPAWorkflow.findMany({
      where: {
        updatedAt: {
          gte: timeRange,
        },
      },
      select: {
        id: true,
        name: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate performance metrics
    const completed = tasks.filter((t: any) => t.enabled === true);
    const failed = tasks.filter((t: any) => t.enabled === false);

    const executionTimes = completed.map((t) => t.updatedAt.getTime() - t.createdAt.getTime());

    const avgExecutionTime =
      executionTimes.length > 0 ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length : 0;

    const maxExecutionTime = Math.max(...executionTimes, 0);
    const successRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 100;

    // Check thresholds
    const slowThreshold = taskData.threshold || 30000; // 30 seconds
    const slowTasks = completed.filter((t) => t.updatedAt.getTime() - t.createdAt.getTime() > slowThreshold);

    if (slowTasks.length > 0 || successRate < 90) {
      console.log("Alert: Performance degradation", {
        type: "performance-degradation",
        severity: successRate < 80 ? "HIGH" : "MEDIUM",
        message: `Performance issues detected: ${slowTasks.length} slow tasks, ${successRate.toFixed(1)}% success rate`,
        avgExecutionTime,
        maxExecutionTime,
        successRate,
        slowTasks: slowTasks.length,
        failedTasks: failed.length,
      });
    }

    return {
      status: successRate >= 90 ? "healthy" : "degraded",
      metrics: {
        totalTasks: tasks.length,
        completed: completed.length,
        failed: failed.length,
        successRate: successRate.toFixed(2) + "%",
        avgExecutionTime: Math.round(avgExecutionTime) + "ms",
        maxExecutionTime: Math.round(maxExecutionTime) + "ms",
        slowTasks: slowTasks.length,
      },
    };
  }

  private async checkSecurity(taskData: MonitoringTaskData): Promise<any> {
    const timeRange = this.parseTimeRange(taskData.timeRange || "24h");

    // Check for suspicious activities
    const suspiciousLogs = await prisma.audit_logs.findMany({
      where: {
        OR: [
          {
            action: {
              contains: "unauthorized",
            },
          },
          {
            action: {
              contains: "failed",
            },
          },
        ],
        createdAt: {
          gte: timeRange,
        },
      },
      take: 50,
    });

    // Analyze with AI for security patterns
    if (suspiciousLogs.length > 0) {
      const aiResponse = await aiBrain.analyze({
        model: "gpt-3.5-turbo",
        systemPrompt: "You are a security analysis assistant. Identify potential threats.",
        userPrompt: `Analyze these logs for security concerns:\n${JSON.stringify(
          suspiciousLogs.map((l: any) => l.action),
          null,
          2
        )}`,
        temperature: 0.2,
        maxTokens: 600,
      });
      const analysis = aiResponse.content;

      if (suspiciousLogs.length > 20) {
        console.log("Alert: Security concern", {
          type: "security-concern",
          severity: "HIGH",
          message: `Suspicious activity detected: ${suspiciousLogs.length} concerning events`,
          eventCount: suspiciousLogs.length,
          analysis,
          samples: suspiciousLogs.slice(0, 5),
        });
      }
    }

    return {
      status: suspiciousLogs.length < 10 ? "secure" : "attention-required",
      suspiciousEvents: suspiciousLogs.length,
      logs: suspiciousLogs.slice(0, 10),
    };
  }

  private async analyzeUsage(taskData: MonitoringTaskData): Promise<any> {
    const timeRange = this.parseTimeRange(taskData.timeRange || "24h");

    // Get usage statistics
    const [workflowStats, userActivity] = await Promise.all([
      prisma.rPAWorkflow.groupBy({
        by: ["enabled"],
        where: {
          createdAt: {
            gte: timeRange,
          },
        },
        _count: true,
      }),
      prisma.users.count({
        where: {
          updatedAt: {
            gte: timeRange,
          },
        },
      }),
    ]);

    // Generate AI insights
    const usageData = {
      workflows: workflowStats,
      activeUsers: userActivity,
    };

    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a usage analytics assistant. Provide actionable insights.",
      userPrompt: `Analyze this usage data and provide insights:\n${JSON.stringify(usageData, null, 2)}`,
      temperature: 0.5,
      maxTokens: 500,
    });
    const insights = aiResponse.content;

    return {
      status: "analyzed",
      timeRange: taskData.timeRange || "24h",
      statistics: usageData,
      insights,
    };
  }

  private parseTimeRange(range: string): Date {
    const now = new Date();
    const match = range.match(/^(\d+)([hmds])$/);

    if (!match) {
      return new Date(now.getTime() - 3600000); // Default 1 hour
    }

    const [, value, unit] = match;
    const num = parseInt(value);

    switch (unit) {
      case "s":
        return new Date(now.getTime() - num * 1000);
      case "m":
        return new Date(now.getTime() - num * 60000);
      case "h":
        return new Date(now.getTime() - num * 3600000);
      case "d":
        return new Date(now.getTime() - num * 86400000);
      default:
        return new Date(now.getTime() - 3600000);
    }
  }
}

export const monitoringHandler = new MonitoringHandler();
