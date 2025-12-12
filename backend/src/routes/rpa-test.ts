import { Request, Response, Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import {
  createWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getExecutions,
  getWorkflowById,
  getWorkflows,
  updateWorkflow,
} from "../services/rpaService";

const router = Router();
router.use(authenticateToken, requireAdmin);

let io: SocketIOServer | null = null;

export function setRPASocketIO(socketIO: SocketIOServer) {
  io = socketIO;
}

export function broadcastRPAUpdate(event: string, data: any) {
  if (io) {
    io.emit(`rpa:${event}`, data);
  }
}

// Get all workflows
router.get("/workflows", async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const { items, count } = await getWorkflows({
      status: status as string | undefined,
      limit: limitNum,
      offset,
    });

    return res.json({
      success: true,
      workflows: items,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (error) {
    console.error("[RPA] Error fetching workflows:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workflows",
    });
  }
});

// Get single workflow
router.get("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workflow = await getWorkflowById(id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: "Workflow not found",
      });
    }

    return res.json({ success: true, workflow });
  } catch (error) {
    console.error("[RPA] Error fetching workflow:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workflow",
    });
  }
});

// Create workflow
router.post("/workflows", async (req: Request, res: Response) => {
  try {
    const { name, description, trigger, actions, enabled, createdById } =
      req.body;

    // Validate required fields
    if (!name || !trigger || !actions || !createdById) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, trigger, actions, createdById",
      });
    }

    // Validate trigger structure (should be JSON)
    if (typeof trigger !== "object") {
      return res.status(400).json({
        success: false,
        message: "Trigger must be a valid JSON object",
      });
    }

    // Validate actions structure (should be array)
    if (!Array.isArray(actions)) {
      return res.status(400).json({
        success: false,
        message: "Actions must be an array",
      });
    }

    const workflow = await createWorkflow({
      name,
      description,
      trigger,
      actions,
      enabled: enabled !== undefined ? enabled : true,
      createdById,
    });

    broadcastRPAUpdate("workflow:created", workflow);

    return res.status(201).json({ success: true, workflow });
  } catch (error) {
    console.error("[RPA] Error creating workflow:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create workflow",
    });
  }
});

// Update workflow
router.patch("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, trigger, actions, enabled } = req.body;

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trigger !== undefined) updateData.trigger = trigger;
    if (actions !== undefined) updateData.actions = actions;
    if (enabled !== undefined) updateData.enabled = enabled;

    const workflow = await updateWorkflow(id, updateData);

    broadcastRPAUpdate("workflow:updated", workflow);

    return res.json({ success: true, workflow });
  } catch (error) {
    console.error("[RPA] Error updating workflow:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update workflow",
    });
  }
});

// Delete workflow
router.delete("/workflows/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteWorkflow(id);

    broadcastRPAUpdate("workflow:deleted", { id });

    return res.json({ success: true, message: "Workflow deleted" });
  } catch (error) {
    console.error("[RPA] Error deleting workflow:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete workflow",
    });
  }
});

// Execute workflow
router.post("/workflows/:id/execute", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const execution = await executeWorkflow({ workflowId: id });

    broadcastRPAUpdate("execution:started", execution);

    return res.status(202).json({
      success: true,
      message: "Workflow execution started",
      execution,
    });
  } catch (error) {
    console.error("[RPA] Error executing workflow:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to execute workflow",
    });
  }
});

// Get executions
router.get("/executions", async (req: Request, res: Response) => {
  try {
    const { workflowId, page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const { items, count } = await getExecutions({
      workflowId: workflowId as string | undefined,
      limit: limitNum,
      offset,
    });

    return res.json({
      success: true,
      executions: items,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum),
    });
  } catch (error) {
    console.error("[RPA] Error fetching executions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch executions",
    });
  }
});

export default router;


