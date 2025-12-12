import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import { logger } from "../utils/logger";
import { AIQueueManager } from "./queue";

// Local enum mirrors Prisma enum values for runtime usage
const WorkflowStatusEnum = {
  RUNNING: "RUNNING",
  FAILED: "FAILED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  AWAITING_APPROVAL: "AWAITING_APPROVAL",
} as const;

const prisma = new PrismaClient();

export interface WorkflowConfig {
  name: string;
  description: string;
  category: "automation" | "monitoring" | "code_suggestion" | "data_collection" | "orchestration";
  triggerType: "event" | "scheduled" | "manual";
  cronSchedule?: string;
  enabled?: boolean;
  requiresApproval?: boolean;
  riskLevel?: "low" | "medium" | "high" | "critical";
  aiModel?: string;
  config: any;
}

export interface TaskDefinition {
  taskType: string;
  priority?: number;
  input: any;
  scheduledFor?: Date;
}

export class AIWorkflowEngine {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Create a new workflow
   */
  async createWorkflow(config: WorkflowConfig) {
    const workflow = await prisma.aIWorkflow.create({
      data: {
        name: config.name,
        description: config.description,
        category: config.category,
        triggerType: config.triggerType,
        cronSchedule: config.cronSchedule,
        enabled: config.enabled !== false,
        requiresApproval: config.requiresApproval !== false,
        riskLevel: config.riskLevel || "medium",
        aiModel: config.aiModel || "gpt-4",
        config: JSON.stringify(config.config),
      },
    });

    // If scheduled, set up cron job
    if (config.triggerType === "scheduled" && config.cronSchedule) {
      this.scheduleWorkflow(workflow.id, config.cronSchedule);
    }

    logger.info(`Workflow created: ${workflow.name} (${workflow.id})`);
    return workflow;
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(workflowId: string, updates: Partial<WorkflowConfig>) {
    const workflow = await prisma.aIWorkflow.update({
      where: { id: workflowId },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description && { description: updates.description }),
        ...(updates.category && { category: updates.category }),
        ...(updates.triggerType && { triggerType: updates.triggerType }),
        ...(updates.cronSchedule !== undefined && {
          cronSchedule: updates.cronSchedule,
        }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        ...(updates.requiresApproval !== undefined && {
          requiresApproval: updates.requiresApproval,
        }),
        ...(updates.riskLevel && { riskLevel: updates.riskLevel }),
        ...(updates.aiModel && { aiModel: updates.aiModel }),
        ...(updates.config && { config: JSON.stringify(updates.config) }),
      },
    });

    // Update scheduled job if needed
    if (updates.cronSchedule !== undefined) {
      this.unscheduleWorkflow(workflowId);
      if (updates.cronSchedule && workflow.enabled) {
        this.scheduleWorkflow(workflowId, updates.cronSchedule);
      }
    }

    logger.info(`Workflow updated: ${workflow.name} (${workflowId})`);
    return workflow;
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string) {
    this.unscheduleWorkflow(workflowId);

    await prisma.aIWorkflow.delete({
      where: { id: workflowId },
    });

    logger.info(`Workflow deleted: ${workflowId}`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, triggeredBy: string, triggerData?: any) {
    const workflow = await prisma.aIWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflow.name}`);
    }

    // Create execution record
    const execution = await prisma.aIWorkflowExecution.create({
      data: {
        workflowId,
        status: WorkflowStatusEnum.RUNNING,
        triggeredBy,
        triggerData: triggerData ? JSON.stringify(triggerData) : null,
      },
    });

    logger.info(`Workflow execution started: ${workflow.name} (${execution.id})`);

    try {
      // Queue the workflow for processing
      await AIQueueManager.scheduleWorkflow({
        workflowId,
        triggeredBy,
        triggerData,
      });

      return execution;
    } catch (error) {
      // Update execution with error
      await prisma.aIWorkflowExecution.update({
        where: { id: execution.id },
        data: {
          status: WorkflowStatusEnum.FAILED,
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Schedule a workflow with cron
   */
  private scheduleWorkflow(workflowId: string, cronSchedule: string) {
    if (this.scheduledJobs.has(workflowId)) {
      this.unscheduleWorkflow(workflowId);
    }

    try {
      const task = cron.schedule(cronSchedule, async () => {
        try {
          await this.executeWorkflow(workflowId, "system:scheduled", {
            scheduledAt: new Date(),
          });
        } catch (error) {
          logger.error(`Scheduled workflow execution failed: ${workflowId}`, error);
        }
      });

      this.scheduledJobs.set(workflowId, task);
      logger.info(`Workflow scheduled: ${workflowId} with cron: ${cronSchedule}`);
    } catch (error) {
      logger.error(`Failed to schedule workflow ${workflowId}:`, error);
      throw error;
    }
  }

  /**
   * Unschedule a workflow
   */
  private unscheduleWorkflow(workflowId: string) {
    const task = this.scheduledJobs.get(workflowId);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(workflowId);
      logger.info(`Workflow unscheduled: ${workflowId}`);
    }
  }

  /**
   * Create a task within a workflow execution
   */
  async createTask(workflowId: string, executionId: string, taskDef: TaskDefinition) {
    const workflow = await prisma.aIWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const task = await prisma.aITask.create({
      data: {
        workflowId,
        executionId,
        taskType: taskDef.taskType,
        priority: taskDef.priority || 5,
        status: workflow.requiresApproval ? "awaiting_approval" : "pending",
        input: JSON.stringify(taskDef.input),
        scheduledFor: taskDef.scheduledFor,
      },
    });

    // Update execution task count
    await prisma.aIWorkflowExecution.update({
      where: { id: executionId },
      data: {
        tasksTotal: { increment: 1 },
      },
    });

    // If doesn't require approval, queue it immediately
    if (!workflow.requiresApproval) {
      await AIQueueManager.scheduleTask({
        taskId: task.id,
        workflowId,
        executionId,
        taskType: task.taskType,
        input: JSON.parse(task.input),
        priority: task.priority,
        requiresApproval: false,
      });
    }

    logger.info(`Task created: ${task.taskType} (${task.id})`);
    return task;
  }

  /**
   * Approve a task (human-in-the-loop)
   */
  async approveTask(taskId: string, reviewedBy: string, feedback?: string, modification?: any) {
    const task = await prisma.aITask.findUnique({
      where: { id: taskId },
      include: { workflow: true },
    });

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== "awaiting_approval") {
      throw new Error(`Task is not awaiting approval: ${task.status}`);
    }

    // Update task
    const updatedTask = await prisma.aITask.update({
      where: { id: taskId },
      data: {
        status: WorkflowStatusEnum.APPROVED,
        reviewedBy,
        reviewedAt: new Date(),
        approvalStatus: modification ? "modified" : "approved",
        humanFeedback: feedback,
        humanModification: modification ? JSON.stringify(modification) : null,
      },
    });

    // Use modified input if provided
    const input = modification || JSON.parse(task.input);

    // Queue the approved task
    await AIQueueManager.scheduleTask({
      taskId: task.id,
      workflowId: task.workflowId,
      executionId: task.executionId || undefined,
      taskType: task.taskType,
      input,
      priority: task.priority,
      requiresApproval: false,
    });

    // Record learning if feedback provided
    if (feedback || modification) {
      await prisma.aILearning.create({
        data: {
          taskId,
          taskType: task.taskType,
          aiSuggestion: task.aiSuggestion || "",
          humanDecision: "approved",
          humanModification: modification ? JSON.stringify(modification) : null,
          feedback,
          context: task.input,
        },
      });
    }

    logger.info(`Task approved: ${taskId} by ${reviewedBy}`);
    return updatedTask;
  }

  /**
   * Reject a task
   */
  async rejectTask(taskId: string, reviewedBy: string, reason: string) {
    const task = await prisma.aITask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updatedTask = await prisma.aITask.update({
      where: { id: taskId },
      data: {
        status: WorkflowStatusEnum.REJECTED,
        reviewedBy,
        reviewedAt: new Date(),
        approvalStatus: WorkflowStatusEnum.REJECTED,
        humanFeedback: reason,
        error: `Rejected: ${reason}`,
      },
    });

    // Update execution failed count
    if (task.executionId) {
      await prisma.aIWorkflowExecution.update({
        where: { id: task.executionId },
        data: {
          tasksFailed: { increment: 1 },
        },
      });
    }

    // Record learning
    await prisma.aILearning.create({
      data: {
        taskId,
        taskType: task.taskType,
        aiSuggestion: task.aiSuggestion || "",
        humanDecision: "rejected",
        feedback: reason,
        context: task.input,
        wasCorrect: false,
      },
    });

    logger.info(`Task rejected: ${taskId} by ${reviewedBy}`);
    return updatedTask;
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, output: any, error?: string) {
    const task = await prisma.aITask.update({
      where: { id: taskId },
      data: {
        status: error ? "failed" : "completed",
        output: output ? JSON.stringify(output) : null,
        error,
        completedAt: new Date(),
      },
    });

    // Update execution counts
    if (task.executionId) {
      await prisma.aIWorkflowExecution.update({
        where: { id: task.executionId },
        data: {
          ...(error ? { tasksFailed: { increment: 1 } } : { tasksCompleted: { increment: 1 } }),
        },
      });

      // Check if execution is complete
      await this.checkExecutionComplete(task.executionId);
    }

    logger.info(`Task completed: ${taskId} - ${error ? "FAILED" : "SUCCESS"}`);
    return task;
  }

  /**
   * Check if workflow execution is complete
   */
  private async checkExecutionComplete(executionId: string) {
    const execution = await prisma.aIWorkflowExecution.findUnique({
      where: { id: executionId },
      include: { tasks: true },
    });

    if (!execution) return;

    const { tasksTotal, tasksCompleted, tasksFailed } = execution;
    const totalProcessed = tasksCompleted + tasksFailed;

    if (totalProcessed >= tasksTotal) {
      const duration = new Date().getTime() - execution.startedAt.getTime();

      await prisma.aIWorkflowExecution.update({
        where: { id: executionId },
        data: {
          status: tasksFailed > 0 ? "failed" : "completed",
          completedAt: new Date(),
          duration,
        },
      });

      logger.info(
        `Workflow execution completed: ${executionId} ` + `(${tasksCompleted} succeeded, ${tasksFailed} failed)`
      );
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string) {
    const workflow = await prisma.aIWorkflow.findUnique({
      where: { id: workflowId },
      include: {
        executions: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            tasks: true,
            executions: true,
          },
        },
      },
    });

    return workflow;
  }

  /**
   * Get execution details
   */
  async getExecutionDetails(executionId: string) {
    const execution = await prisma.aIWorkflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: true,
        tasks: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return execution;
  }

  /**
   * Get tasks awaiting approval
   */
  async getTasksAwaitingApproval(limit = 50) {
    const tasks = await prisma.aITask.findMany({
      where: {
        status: WorkflowStatusEnum.AWAITING_APPROVAL,
      },
      include: {
        workflow: true,
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      take: limit,
    });

    return tasks;
  }

  /**
   * Initialize all scheduled workflows
   */
  async initializeScheduledWorkflows() {
    const workflows = await prisma.aIWorkflow.findMany({
      where: {
        triggerType: "scheduled",
        enabled: true,
        cronSchedule: { not: null },
      },
    });

    for (const workflow of workflows) {
      if (workflow.cronSchedule) {
        try {
          this.scheduleWorkflow(workflow.id, workflow.cronSchedule);
        } catch (error) {
          logger.error(`Failed to schedule workflow ${workflow.id}:`, error);
        }
      }
    }

    logger.info(`Initialized ${workflows.length} scheduled workflows`);
  }

  /**
   * Stop all scheduled workflows
   */
  stopAllScheduledWorkflows() {
    for (const [workflowId, task] of this.scheduledJobs) {
      task.stop();
      logger.info(`Stopped scheduled workflow: ${workflowId}`);
    }
    this.scheduledJobs.clear();
  }
}

// Export singleton instance
export const workflowEngine = new AIWorkflowEngine();

// Alias for compatibility
export const WorkflowEngine = AIWorkflowEngine;
