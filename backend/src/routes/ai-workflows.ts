import { PrismaClient } from "@prisma/client";
// TaskStatus, WorkflowStatus removed - not exported from @prisma/client
import { Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { AIMonitoring } from "../ai-core/monitoring";
import { TaskQueue } from "../ai-core/queue";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Lazy initialization to avoid circular dependencies
import { workflowEngine } from "../ai-core/workflow-engine";

function getWorkflowEngine() {
  return workflowEngine;
}

function getMonitoring() {
  return AIMonitoring;
}

function getTaskQueue() {
  return new TaskQueue();
}

// Middleware to check admin role
const requireAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization check failed" });
  }
};

// Get all workflows
router.get("/workflows", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, type, limit = "50", offset = "0" } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const workflows = await prisma.aIWorkflow.findMany({
      where,
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.aIWorkflow.count({ where });

    res.json({
      workflows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

// Get workflow by ID
router.get("/workflows/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await prisma.aIWorkflow.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    res.status(500).json({ error: "Failed to fetch workflow" });
  }
});

// Create workflow
router.post(
  "/workflows",
  authenticateToken,
  requireAdmin,
  [
    body("name").notEmpty().trim(),
    body("type").notEmpty().trim(),
    body("config").isObject(),
    body("trigger").optional().isObject(),
    body("requiresApproval").optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, config, trigger, requiresApproval = true } = req.body;
      const userId = (req as any).user?.userId;

      const workflow = await getWorkflowEngine().createWorkflow({
        name,
        type,
        config,
        trigger,
        requiresApproval,
        createdBy: userId,
      });

      res.status(201).json(workflow);
    } catch (error) {
      console.error("Error creating workflow:", error);
      res.status(500).json({ error: "Failed to create workflow" });
    }
  }
);

// Execute workflow
router.post(
  "/workflows/:id/execute",
  authenticateToken,
  requireAdmin,
  [body("input").optional().isObject()],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { input = {} } = req.body;

      const result = await getWorkflowEngine().executeWorkflow(id, input);

      res.json(result);
    } catch (error) {
      console.error("Error executing workflow:", error);
      res.status(500).json({ error: "Failed to execute workflow" });
    }
  }
);

// Approve/Reject workflow
router.post(
  "/workflows/:id/approve",
  authenticateToken,
  requireAdmin,
  [body("approved").isBoolean(), body("feedback").optional().isString()],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { approved, feedback } = req.body;
      const userId = (req as any).user?.userId;

      const workflow = await getWorkflowEngine().approveWorkflow(id, userId, approved, feedback);

      res.json(workflow);
    } catch (error) {
      console.error("Error approving workflow:", error);
      res.status(500).json({ error: "Failed to approve workflow" });
    }
  }
);

// Get all tasks
router.get("/tasks", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, type, workflowId, limit = "50", offset = "0" } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (workflowId) where.workflowId = workflowId;

    const tasks = await prisma.aITask.findMany({
      where,
      include: {
        workflow: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.aITask.count({ where });

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Get task by ID
router.get("/tasks/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.aITask.findUnique({
      where: { id },
      include: {
        workflow: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// Create task
router.post(
  "/tasks",
  authenticateToken,
  requireAdmin,
  [
    body("workflowId").optional().isString(),
    body("type").notEmpty().trim(),
    body("data").isObject(),
    body("priority").optional().isInt({ min: 0, max: 10 }),
    body("requiresApproval").optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { workflowId, type, data, priority = 5, requiresApproval = true } = req.body;

      const task = await getTaskQueue().addTask({
        workflowId,
        type,
        data,
        priority,
        requiresApproval,
      });

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  }
);

// Retry failed task
router.post("/tasks/:id/retry", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = await getTaskQueue().retryTask(id);

    res.json(task);
  } catch (error) {
    console.error("Error retrying task:", error);
    res.status(500).json({ error: "Failed to retry task" });
  }
});

// Get monitoring metrics
router.get("/monitoring/metrics", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { timeRange = "24h" } = req.query;

    const metrics = await getMonitoring().getMetrics(timeRange as string);

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// Get system health
router.get("/monitoring/health", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const health = await getMonitoring().checkSystemHealth();

    res.json(health);
  } catch (error) {
    console.error("Error checking health:", error);
    res.status(500).json({ error: "Failed to check system health" });
  }
});

// Get alerts
router.get("/monitoring/alerts", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { severity, limit = "50" } = req.query;

    const where: any = { resolved: false };
    if (severity) where.severity = severity;

    const alerts = await prisma.aIAlert.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: parseInt(limit as string),
    });

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Resolve alert
router.post(
  "/monitoring/alerts/:id/resolve",
  authenticateToken,
  requireAdmin,
  [body("notes").optional().isString()],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = (req as any).user?.userId;

      const alert = await getMonitoring().resolveAlert(id, userId, notes);

      res.json(alert);
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  }
);

// Get AI suggestions
router.get("/suggestions", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { type, limit = "20" } = req.query;

    const where: any = {};
    if (type) where.type = type;

    const suggestions = await prisma.ai_suggestions.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: parseInt(limit as string),
    });

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Apply suggestion
router.post("/suggestions/:id/apply", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const suggestion = await prisma.ai_suggestions.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return res.status(404).json({ error: "Suggestion not found" });
    }

    // Apply the suggestion based on type
    // This would be implemented based on your specific use cases

    const updated = await prisma.ai_suggestions.update({
      where: { id },
      data: {
        accepted: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error applying suggestion:", error);
    res.status(500).json({ error: "Failed to apply suggestion" });
  }
});

// Dashboard stats
router.get("/dashboard/stats", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalWorkflows, activeWorkflows, pendingTasks, completedTasks, failedTasks, activeAlerts] =
      await Promise.all([
        prisma.aIWorkflow.count(),
        prisma.aIWorkflow.count(),
        prisma.aITask.count(),
        prisma.aITask.count(),
        prisma.aITask.count(),
        prisma.aIAlert.count(),
      ]);

    res.json({
      workflows: {
        total: totalWorkflows,
        active: activeWorkflows,
      },
      tasks: {
        pending: pendingTasks,
        completed: completedTasks,
        failed: failedTasks,
      },
      alerts: {
        active: activeAlerts,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
