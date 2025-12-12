import { PrismaClient } from "@prisma/client";
import { aiBrain } from "../brain";
import { emailHandler } from "./email-handler";

const prisma = new PrismaClient();

export interface ReportTaskData {
  type: "daily" | "weekly" | "monthly" | "custom";
  reportType: "usage" | "performance" | "security" | "business" | "ai-activity";
  recipients: string[];
  format?: "html" | "pdf" | "json";
  dateRange?: { start: Date; end: Date };
}

export class ReportHandler {
  async handle(taskData: ReportTaskData): Promise<any> {
    try {
      const report = await this.generateReport(taskData);

      // Send report via email
      if (taskData.recipients && taskData.recipients.length > 0) {
        await emailHandler.handle({
          to: taskData.recipients,
          subject: `${taskData.reportType} Report - ${new Date().toLocaleDateString()}`,
          template: report.html,
          context: report.data,
        });
      }

      // Store report (logging skipped - no AITaskLog model)
      console.log(`Generated ${taskData.reportType} report with ${report.dataPoints} data points`);

      return {
        success: true,
        report: report.data,
        sent: taskData.recipients?.length || 0,
      };
    } catch (error: any) {
      console.error("Report handler error:", error);
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  private async generateReport(taskData: ReportTaskData): Promise<any> {
    const { reportType, dateRange } = taskData;

    const endDate = dateRange?.end || new Date();
    const startDate = dateRange?.start || new Date(endDate.getTime() - 24 * 3600000);

    let data: any = {};
    let dataPoints = 0;

    switch (reportType) {
      case "usage":
        data = await this.generateUsageReport(startDate, endDate);
        break;
      case "performance":
        data = await this.generatePerformanceReport(startDate, endDate);
        break;
      case "security":
        data = await this.generateSecurityReport(startDate, endDate);
        break;
      case "business":
        data = await this.generateBusinessReport(startDate, endDate);
        break;
      case "ai-activity":
        data = await this.generateAIActivityReport(startDate, endDate);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    // Generate AI summary
    const aiResponse = await aiBrain.analyze({
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a data analyst providing executive summaries of reports.",
      userPrompt: `Analyze this ${reportType} report data and provide executive summary with key insights:\n${JSON.stringify(
        data,
        null,
        2
      )}`,
      temperature: 0.7,
      maxTokens: 500,
    });
    const summary = aiResponse.content;

    data.aiSummary = summary;
    dataPoints = this.countDataPoints(data);

    // Generate HTML
    const html = this.generateHTML(reportType, data, startDate, endDate);

    return {
      data,
      html,
      dataPoints,
    };
  }

  private async generateUsageReport(startDate: Date, endDate: Date): Promise<any> {
    const [users, workflows, auditLogs] = await Promise.all([
      prisma.users.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.rPAWorkflow.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          enabled: true,
        },
      }),
      prisma.audit_logs.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    return {
      period: { start: startDate, end: endDate },
      users: {
        new: users,
        total: await prisma.users.count(),
      },
      workflows: {
        created: workflows.length,
        enabled: workflows.filter((w: any) => w.enabled).length,
        disabled: workflows.filter((w: any) => !w.enabled).length,
      },
      auditLogs: {
        total: auditLogs,
      },
    };
  }

  private async generatePerformanceReport(startDate: Date, endDate: Date): Promise<any> {
    const tasks = await prisma.rPAWorkflow.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        enabled: true,
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const executionTimes = tasks.map((t: any) => ({
      duration: t.updatedAt.getTime() - t.createdAt.getTime(),
    }));

    const durations = executionTimes.map((e: any) => e.duration);
    const avgExecutionTime =
      durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0;

    return {
      period: { start: startDate, end: endDate },
      tasks: {
        total: tasks.length,
        avgExecutionTime,
        totalDuration: durations.reduce((a: number, b: number) => a + b, 0),
        minDuration: durations.length > 0 ? Math.min(...durations) : 0,
        maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
  }

  private async generateSecurityReport(startDate: Date, endDate: Date): Promise<any> {
    const [securityLogs, failedWorkflows, errorLogs] = await Promise.all([
      prisma.audit_logs.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          action: { contains: "security" },
        },
      }),
      prisma.rPAWorkflow.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          enabled: false,
        },
      }),
      prisma.audit_logs.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          action: { contains: "error" },
        },
      }),
    ]);

    return {
      period: { start: startDate, end: endDate },
      security: {
        totalLogs: securityLogs.length,
        byAction: this.groupBy(securityLogs, "action"),
      },
      incidents: {
        failedWorkflows,
        errorLogs,
      },
    };
  }

  private async generateBusinessReport(startDate: Date, endDate: Date): Promise<any> {
    const [users, subscriptions] = await Promise.all([
      prisma.users.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.push_subscriptions.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          userId: true,
        },
      }),
    ]);

    return {
      period: { start: startDate, end: endDate },
      growth: {
        newUsers: users,
        newPushSubscriptions: subscriptions.length,
      },
      subscriptions: {
        byUser: this.groupBy(subscriptions, "userId"),
      },
    };
  }

  private async generateAIActivityReport(startDate: Date, endDate: Date): Promise<any> {
    const [suggestions, workflows, auditLogs] = await Promise.all([
      prisma.ai_suggestions.findMany({
        where: {
          created_at: { gte: startDate, lte: endDate },
        },
        select: {
          type: true,
          accepted: true,
        },
      }),
      prisma.rPAWorkflow.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.audit_logs.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          action: { contains: "AI" },
        },
      }),
    ]);

    const acceptedCount = suggestions.filter((s: any) => s.accepted).length;
    const acceptanceRate = suggestions.length > 0 ? (acceptedCount / suggestions.length) * 100 : 0;

    return {
      period: { start: startDate, end: endDate },
      suggestions: {
        total: suggestions.length,
        accepted: acceptedCount,
        acceptanceRate,
        byType: this.groupBy(suggestions, "type"),
      },
      workflows: {
        total: workflows,
      },
      activity: {
        aiRelatedLogs: auditLogs,
      },
    };
  }

  private groupBy(items: any[], key: string): any {
    return items.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private countDataPoints(obj: any): number {
    let count = 0;
    for (const value of Object.values(obj)) {
      if (typeof value === "object" && value !== null) {
        count += this.countDataPoints(value);
      } else {
        count++;
      }
    }
    return count;
  }

  private generateHTML(reportType: string, data: any, startDate: Date, endDate: Date): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .summary { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .metric { display: inline-block; margin: 10px 20px; }
    .metric-value { font-size: 2em; font-weight: bold; color: #4CAF50; }
    .metric-label { color: #666; }
  </style>
</head>
<body>
  <h1>${reportType.toUpperCase()} Report</h1>
  <p><strong>Period:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
  
  <div class="summary">
    <h2>AI Summary</h2>
    <p>${data.aiSummary || "No summary available"}</p>
  </div>
  
  <h2>Key Metrics</h2>
  ${this.generateMetricsHTML(data)}
  
  <h2>Detailed Data</h2>
  <pre>${JSON.stringify(data, null, 2)}</pre>
</body>
</html>
    `;
  }

  private generateMetricsHTML(data: any, prefix = ""): string {
    let html = "";
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "number") {
        html += `
          <div class="metric">
            <div class="metric-value">${value}</div>
            <div class="metric-label">${prefix}${key}</div>
          </div>
        `;
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        html += this.generateMetricsHTML(value, `${prefix}${key} - `);
      }
    }
    return html;
  }
}

export const reportHandler = new ReportHandler();
