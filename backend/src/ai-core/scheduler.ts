import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { WorkflowEngine } from "./workflow-engine";

const prisma = new PrismaClient();

// Lazy-load workflow engine to avoid circular dependency
function getWorkflowEngine(): any {
  return (WorkflowEngine as any).getInstance();
}

export class AIScheduler {
  private static instance: AIScheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): AIScheduler {
    if (!AIScheduler.instance) {
      AIScheduler.instance = new AIScheduler();
    }
    return AIScheduler.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("AI Scheduler already initialized");
      return;
    }

    console.log("Initializing AI Scheduler...");

    // Schedule default monitoring tasks
    this.scheduleMonitoring();

    // Schedule workflow checks
    this.scheduleWorkflowChecks();

    // Load custom schedules from database
    await this.loadScheduledWorkflows();

    this.initialized = true;
    console.log("AI Scheduler initialized successfully");
  }

  private scheduleMonitoring(): void {
    // Error detection every 15 minutes
    this.schedule("monitoring-errors", "*/15 * * * *", async () => {
      await taskQueue.addTask({
        type: "monitoring",
        data: {
          type: "error-detection",
          timeRange: "15m",
        },
        priority: 7,
        requiresApproval: false,
      });
    });

    // Performance check every 30 minutes
    this.schedule("monitoring-performance", "*/30 * * * *", async () => {
      await taskQueue.addTask({
        type: "monitoring",
        data: {
          type: "performance",
          timeRange: "30m",
        },
        priority: 5,
        requiresApproval: false,
      });
    });

    // Security check every hour
    this.schedule("monitoring-security", "0 * * * *", async () => {
      await taskQueue.addTask({
        type: "monitoring",
        data: {
          type: "security",
          timeRange: "1h",
        },
        priority: 8,
        requiresApproval: false,
      });
    });

    // Usage analysis every 6 hours
    this.schedule("monitoring-usage", "0 */6 * * *", async () => {
      await taskQueue.addTask({
        type: "monitoring",
        data: {
          type: "usage",
          timeRange: "6h",
        },
        priority: 3,
        requiresApproval: false,
      });
    });

    console.log("Scheduled monitoring tasks");
  }

  private scheduleWorkflowChecks(): void {
    // Check for pending approvals every 5 minutes
    this.schedule("check-pending-workflows", "*/5 * * * *", async () => {
      const pendingTasks = await prisma.aITask.findMany({
        where: {
          status: "awaiting_approval",
          createdAt: {
            lt: new Date(Date.now() - 30 * 60000), // Older than 30 minutes
          },
        },
        include: {
          workflow: true,
        },
      });

      if (pendingTasks.length > 0) {
        await monitoring.createAlert({
          type: "workflow-approval-pending",
          severity: "MEDIUM",
          message: `${pendingTasks.length} tasks pending approval for >30 minutes`,
          metadata: {
            tasks: pendingTasks.map((t) => ({
              id: t.id,
              workflowName: t.workflow.name,
              age: Date.now() - t.createdAt.getTime(),
            })),
          },
        });
      }
    });

    // Retry failed tasks every hour
    this.schedule("retry-failed-tasks", "0 * * * *", async () => {
      const failedTasks = await prisma.aITask.findMany({
        where: {
          status: "failed",
          attempts: {
            lt: 3,
          },
          updatedAt: {
            lt: new Date(Date.now() - 3600000), // Older than 1 hour
          },
        },
        take: 10,
      });

      for (const task of failedTasks) {
        try {
          await taskQueue.retryTask(task.id);
        } catch (error) {
          console.error(`Failed to retry task ${task.id}:`, error);
        }
      }
    });

    console.log("Scheduled workflow check tasks");
  }

  private async loadScheduledWorkflows(): Promise<void> {
    const scheduledWorkflows = await prisma.aIWorkflow.findMany({
      where: {
        triggerType: "scheduled",
        cronSchedule: {
          not: null,
        },
        enabled: true,
      },
    });

    for (const workflow of scheduledWorkflows) {
      if (workflow.cronSchedule) {
        this.scheduleWorkflow(workflow.id, workflow.cronSchedule);
      }
    }

    console.log(`Loaded ${scheduledWorkflows.length} scheduled workflows`);
  }

  scheduleWorkflow(workflowId: string, schedule: string): void {
    const jobName = `workflow-${workflowId}`;

    // Remove existing job if any
    if (this.jobs.has(jobName)) {
      this.jobs.get(jobName)?.stop();
    }

    // Schedule new job
    const job = cron.schedule(schedule, async () => {
      try {
        console.log(`Executing scheduled workflow: ${workflowId}`);
        await getWorkflowEngine().executeWorkflow(workflowId, {});
      } catch (error) {
        console.error(`Failed to execute scheduled workflow ${workflowId}:`, error);
      }
    });

    this.jobs.set(jobName, job);
    console.log(`Scheduled workflow ${workflowId} with pattern: ${schedule}`);
  }

  schedule(name: string, pattern: string, callback: () => Promise<void>): void {
    // Remove existing job if any
    if (this.jobs.has(name)) {
      this.jobs.get(name)?.stop();
    }

    // Validate cron pattern
    if (!cron.validate(pattern)) {
      throw new Error(`Invalid cron pattern: ${pattern}`);
    }

    // Schedule job
    const job = cron.schedule(pattern, async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Scheduled job ${name} failed:`, error);
      }
    });

    this.jobs.set(name, job);
    console.log(`Scheduled job: ${name} with pattern: ${pattern}`);
  }

  unschedule(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`Unscheduled job: ${name}`);
    }
  }

  unscheduleWorkflow(workflowId: string): void {
    this.unschedule(`workflow-${workflowId}`);
  }

  getScheduledJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  async scheduleDailyReport(reportType: string, recipients: string[], time: string = "08:00"): Promise<void> {
    const [hour, minute] = time.split(":");
    const pattern = `${minute} ${hour} * * *`;

    this.schedule(`daily-report-${reportType}`, pattern, async () => {
      await taskQueue.addTask({
        type: "report",
        data: {
          type: "daily",
          reportType,
          recipients,
        },
        priority: 4,
        requiresApproval: false,
      });
    });
  }

  async scheduleWeeklyReport(
    reportType: string,
    recipients: string[],
    dayOfWeek: number = 1, // Monday
    time: string = "08:00"
  ): Promise<void> {
    const [hour, minute] = time.split(":");
    const pattern = `${minute} ${hour} * * ${dayOfWeek}`;

    this.schedule(`weekly-report-${reportType}`, pattern, async () => {
      await taskQueue.addTask({
        type: "report",
        data: {
          type: "weekly",
          reportType,
          recipients,
        },
        priority: 4,
        requiresApproval: false,
      });
    });
  }

  async scheduleMonthlyReport(
    reportType: string,
    recipients: string[],
    dayOfMonth: number = 1,
    time: string = "08:00"
  ): Promise<void> {
    const [hour, minute] = time.split(":");
    const pattern = `${minute} ${hour} ${dayOfMonth} * *`;

    this.schedule(`monthly-report-${reportType}`, pattern, async () => {
      await taskQueue.addTask({
        type: "report",
        data: {
          type: "monthly",
          reportType,
          recipients,
        },
        priority: 4,
        requiresApproval: false,
      });
    });
  }

  async shutdown(): Promise<void> {
    console.log("Shutting down AI Scheduler...");

    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }

    this.jobs.clear();
    this.initialized = false;

    console.log("AI Scheduler shut down successfully");
  }
}

export const scheduler = AIScheduler.getInstance();
