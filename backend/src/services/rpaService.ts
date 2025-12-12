// OALStatus is not exported in current Prisma client; use string fallback
type OALStatus = "PENDING" | "APPROVED" | "REJECTED" | string;
import { randomUUID } from "crypto";
import prisma from "../prismaClient";
import { createOALLog } from "./oalService";

interface RPAWorkflowData {
  name: string;
  description?: string;
  trigger: any;
  actions: any;
  enabled?: boolean;
  createdById: string;
}

interface RPAExecutionData {
  workflowId: string;
  result?: Record<string, any>;
}

interface WorkflowAction {
  type: string;
  params: Record<string, any>;
}

interface ExecutionStep {
  action: string;
  status: string;
  result?: any;
  error?: string;
  timestamp: Date;
}

export async function createWorkflow(data: RPAWorkflowData) {
  const now = new Date();
  return await prisma.rPAWorkflow.create({
    data: {
      id: randomUUID(),
      name: data.name,
      description: data.description ?? null,
      // Avoid tight Prisma JSON typing to fix compile issues
      trigger: (data.trigger as any) ?? {},
      actions: (data.actions as any) ?? [],
      enabled: data.enabled !== false,
      createdById: data.createdById,
      updatedAt: now,
    },
  });
}

export async function getWorkflows(filters: { status?: string; limit?: number; offset?: number }) {
  const where: Record<string, any> = {};
  if (filters.status) where.status = filters.status;

  const [rawItems, count] = await Promise.all([
    prisma.rPAWorkflow.findMany({
      where,
      include: {
        _count: {
          select: { RPAExecution: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.rPAWorkflow.count({ where }),
  ]);

  const items = rawItems.map((workflow: any) => {
    const { _count, RPAExecution, ...rest } = workflow as typeof workflow & {
      RPAExecution?: any[];
    };

    return {
      ...rest,
      executions: RPAExecution ?? [],
      _count: {
        executions: _count?.RPAExecution ?? 0,
      },
    };
  });

  return { items, count };
}

export async function getWorkflowById(id: string) {
  const workflow = await prisma.rPAWorkflow.findUnique({
    where: { id },
    include: {
      RPAExecution: {
        orderBy: { startedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!workflow) return null;

  const { RPAExecution, ...rest } = workflow as typeof workflow & {
    RPAExecution: any[];
  };

  return {
    ...rest,
    executions: RPAExecution,
  };
}

export async function updateWorkflow(id: string, data: Partial<RPAWorkflowData>) {
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.trigger !== undefined) updateData.trigger = (data.trigger as unknown) ?? {};
  if (data.actions !== undefined) updateData.actions = (data.actions as unknown) ?? [];
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  updateData.updatedAt = new Date();

  return await prisma.rPAWorkflow.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteWorkflow(id: string) {
  return await prisma.rPAWorkflow.delete({
    where: { id },
  });
}

export async function executeWorkflow(data: RPAExecutionData) {
  const workflow = await prisma.rPAWorkflow.findUnique({
    where: { id: data.workflowId },
  });

  if (!workflow) {
    throw new Error("Workflow not found");
  }

  if (!workflow.enabled) {
    throw new Error("Workflow is disabled");
  }

  const executionId = randomUUID();
  const execution = await prisma.rPAExecution.create({
    data: {
      id: executionId,
      workflowId: data.workflowId,
      status: "RUNNING",
      trigger: (data.result as any) ?? {},
      steps: [] as any,
    },
  });

  // Update workflow last run time
  await prisma.rPAWorkflow.update({
    where: { id: data.workflowId },
    data: { updatedAt: new Date() },
  });

  // Execute workflow asynchronously
  executeWorkflowSteps(
    executionId,
    data.workflowId,
    Array.isArray(workflow.actions) ? (workflow.actions as unknown as WorkflowAction[]) : []
  ).catch(async (error: Error) => {
    await prisma.rPAExecution.update({
      where: { id: executionId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: error.message,
      },
    });

    await prisma.rPAWorkflow.update({
      where: { id: data.workflowId },
      data: { updatedAt: new Date() },
    });
  });

  return execution;
}

async function executeWorkflowSteps(executionId: string, workflowId: string, actions: WorkflowAction[]) {
  const steps: ExecutionStep[] = [];

  try {
    for (const action of actions) {
      const stepResult = await executeAction(action);
      steps.push({
        action: action.type,
        status: "SUCCESS",
        result: stepResult,
        timestamp: new Date(),
      });
    }

    // Mark as completed
    await prisma.rPAExecution.update({
      where: { id: executionId },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        steps: steps as unknown as any[],
      },
    });

    await prisma.rPAWorkflow.update({
      where: { id: workflowId },
      data: { updatedAt: new Date() },
    });
  } catch (error: any) {
    steps.push({
      action: "error",
      status: "FAILED",
      error: error.message || "Unknown error",
      timestamp: new Date(),
    });

    await prisma.rPAExecution.update({
      where: { id: executionId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: error.message,
        steps: steps as unknown as any[],
      },
    });

    await prisma.rPAWorkflow.update({
      where: { id: workflowId },
      data: { updatedAt: new Date() },
    });

    throw error;
  }
}

async function executeAction(action: WorkflowAction): Promise<any> {
  switch (action.type) {
    case "create_oal_log":
      return await createOALLog({
        object: action.params.object,
        action: action.params.action,
        location: action.params.location || "rpa.automation",
        subjectId: action.params.subjectId,
        metadata: action.params.metadata || {},
        createdById: action.params.createdById || "system",
        status: action.params.status || "PENDING",
      });

    case "approve_oal":
      return await prisma.oal_audit_log.update({
        where: { id: action.params.logId },
        data: { status: "APPROVED" },
      });

    case "reject_oal":
      return await prisma.oal_audit_log.update({
        where: { id: action.params.logId },
        data: { status: "REJECTED" },
      });

    case "send_notification":
      // Integrate with notification service
      return { sent: true, type: action.params.type };

    case "delay":
      await new Promise((resolve) => setTimeout(resolve, action.params.milliseconds || 1000));
      return { delayed: action.params.milliseconds || 1000 };

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

export async function checkOALTriggers(oalLog: Record<string, any>) {
  // Get all workflows that could be triggered
  const workflows = await prisma.rPAWorkflow.findMany({
    where: {
      enabled: true,
    },
  });

  for (const workflow of workflows) {
    // Check if workflow should be triggered (simplified logic)
    // In production, you'd store trigger conditions in the workflow
    if (shouldTriggerWorkflow(workflow, oalLog)) {
      executeWorkflow({
        workflowId: workflow.id,
        result: {
          triggerSource: "oal",
          logId: oalLog?.id,
        },
      }).catch((error: Error) => {
        console.error(`[RPA] Failed to execute workflow ${workflow.id} for OAL trigger:`, error);
      });
    }
  }
}

function shouldTriggerWorkflow(workflow: any, oalLog: Record<string, any>): boolean {
  // Simplified trigger logic - customize based on your needs
  // You might want to add a 'triggerConfig' JSON field to RPAWorkflow
  return workflow.name.toLowerCase().includes("oal");
}

export async function getExecutions(filters: {
  workflowId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, any> = {};
  if (filters.workflowId) where.workflowId = filters.workflowId;
  if (filters.status) where.status = filters.status;

  const [rawItems, count] = await Promise.all([
    prisma.rPAExecution.findMany({
      where,
      include: {
        RPAWorkflow: {
          select: { id: true, name: true, enabled: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
    }),
    prisma.rPAExecution.count({ where }),
  ]);

  const items = rawItems.map((execution: any) => {
    const { RPAWorkflow, ...rest } = execution as typeof execution & {
      RPAWorkflow?: any;
    };

    return {
      ...rest,
      workflow: RPAWorkflow,
    };
  });

  return { items, count };
}
