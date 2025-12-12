import { Request, Response, Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { getTracing } from "../ai-core/tracing";
import prisma from "../lib/prisma";

/**
 * Real-time AI Dashboard API
 * Provides WebSocket and REST endpoints for monitoring AI agent activity
 */

export function createAIDashboardRouter(io?: SocketIOServer): Router {
  const router = Router();

  /**
   * GET /api/ai-dashboard/overview
   * Get high-level overview of AI system
   */
  router.get("/overview", async (req: Request, res: Response) => {
    try {
      const tracing = getTracing();
      const allMetrics = tracing.getAllAgentMetrics();

      // Get task statistics
      const [totalTasks, pendingTasks, completedTasks, failedTasks] = await Promise.all([
        prisma.aITask.count(),
        prisma.aITask.count({ where: { status: "pending" } }),
        prisma.aITask.count({ where: { status: "completed" } }),
        prisma.aITask.count({ where: { status: "failed" } }),
      ]);

      // Get workflow statistics
      const [totalWorkflows, activeWorkflows] = await Promise.all([
        prisma.aIWorkflow.count(),
        prisma.aIWorkflow.count({ where: { isActive: true } }),
      ]);

      // Calculate aggregate metrics
      const totalExecutions = allMetrics.reduce((sum, m) => sum + m.metrics.totalExecutions, 0);
      const avgSuccessRate =
        allMetrics.length > 0 ? allMetrics.reduce((sum, m) => sum + m.metrics.successRate, 0) / allMetrics.length : 0;

      const overview = {
        agents: {
          total: allMetrics.length,
          active: allMetrics.filter((m) => m.metrics.totalExecutions > 0).length,
        },
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          completed: completedTasks,
          failed: failedTasks,
        },
        workflows: {
          total: totalWorkflows,
          active: activeWorkflows,
        },
        performance: {
          totalExecutions,
          avgSuccessRate: Math.round(avgSuccessRate * 100),
          avgResponseTime: Math.round(
            allMetrics.reduce((sum, m) => sum + m.metrics.avgDuration, 0) / allMetrics.length || 0
          ),
        },
      };

      res.json(overview);
    } catch (error) {
      console.error("[AI Dashboard] Error getting overview:", error);
      res.status(500).json({ error: "Failed to get overview" });
    }
  });

  /**
   * GET /api/ai-dashboard/agents
   * Get all agent metrics
   */
  router.get("/agents", async (req: Request, res: Response) => {
    try {
      const tracing = getTracing();
      const allMetrics = tracing.getAllAgentMetrics();

      const agents = allMetrics.map(({ agentName, metrics }) => ({
        name: agentName,
        status: metrics.totalExecutions > 0 ? "active" : "idle",
        executions: metrics.totalExecutions,
        avgDuration: Math.round(metrics.avgDuration),
        successRate: Math.round(metrics.successRate * 100),
        errorRate: Math.round(metrics.errorRate * 100),
        recentErrors: metrics.recentErrors,
        lastActivity: new Date(),
      }));

      res.json({ agents });
    } catch (error) {
      console.error("[AI Dashboard] Error getting agents:", error);
      res.status(500).json({ error: "Failed to get agents" });
    }
  });

  /**
   * GET /api/ai-dashboard/agents/:name
   * Get detailed metrics for a specific agent
   */
  router.get("/agents/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const tracing = getTracing();
      const metrics = tracing.getAgentMetrics(name);

      if (metrics.totalExecutions === 0) {
        return res.status(404).json({ error: "Agent not found or has no activity" });
      }

      res.json({
        name,
        metrics: {
          totalExecutions: metrics.totalExecutions,
          avgDuration: Math.round(metrics.avgDuration),
          successRate: Math.round(metrics.successRate * 100),
          errorRate: Math.round(metrics.errorRate * 100),
          recentErrors: metrics.recentErrors,
        },
      });
    } catch (error) {
      console.error("[AI Dashboard] Error getting agent details:", error);
      res.status(500).json({ error: "Failed to get agent details" });
    }
  });

  /**
   * GET /api/ai-dashboard/tasks/recent
   * Get recent task activity
   */
  router.get("/tasks/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const tasks = await prisma.aITask.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          status: true,
          priority: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          error: true,
        },
      });

      const taskStats = tasks.map((task) => ({
        ...task,
        duration: task.startedAt && task.completedAt ? task.completedAt.getTime() - task.startedAt.getTime() : null,
      }));

      res.json({ tasks: taskStats });
    } catch (error) {
      console.error("[AI Dashboard] Error getting recent tasks:", error);
      res.status(500).json({ error: "Failed to get recent tasks" });
    }
  });

  /**
   * GET /api/ai-dashboard/workflows/active
   * Get all active workflows
   */
  router.get("/workflows/active", async (req: Request, res: Response) => {
    try {
      const workflows = await prisma.aIWorkflow.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          trigger: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({ workflows });
    } catch (error) {
      console.error("[AI Dashboard] Error getting active workflows:", error);
      res.status(500).json({ error: "Failed to get active workflows" });
    }
  });

  /**
   * GET /api/ai-dashboard/performance/slow
   * Get slow operations
   */
  router.get("/performance/slow", async (req: Request, res: Response) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 5000;
      const tracing = getTracing();
      const slowOps = tracing.getSlowOperations(threshold);

      res.json({
        threshold,
        count: slowOps.length,
        operations: slowOps.map((op) => ({
          agent: op.agentName,
          task: op.taskType,
          duration: op.duration,
          status: op.status,
          timestamp: op.timestamp,
          error: op.error,
        })),
      });
    } catch (error) {
      console.error("[AI Dashboard] Error getting slow operations:", error);
      res.status(500).json({ error: "Failed to get slow operations" });
    }
  });

  /**
   * GET /api/ai-dashboard/stats/timeline
   * Get time-series data for dashboard charts
   */
  router.get("/stats/timeline", async (req: Request, res: Response) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const tasks = await prisma.aITask.findMany({
        where: { createdAt: { gte: since } },
        select: {
          createdAt: true,
          status: true,
          type: true,
        },
      });

      // Group by hour
      const hourlyStats = new Map<string, { total: number; completed: number; failed: number }>();

      for (const task of tasks) {
        const hour = new Date(task.createdAt);
        hour.setMinutes(0, 0, 0);
        const key = hour.toISOString();

        const stats = hourlyStats.get(key) || { total: 0, completed: 0, failed: 0 };
        stats.total++;
        if (task.status === "completed") stats.completed++;
        if (task.status === "failed") stats.failed++;
        hourlyStats.set(key, stats);
      }

      const timeline = Array.from(hourlyStats.entries()).map(([timestamp, stats]) => ({
        timestamp,
        ...stats,
      }));

      res.json({ timeline });
    } catch (error) {
      console.error("[AI Dashboard] Error getting timeline stats:", error);
      res.status(500).json({ error: "Failed to get timeline stats" });
    }
  });

  // WebSocket support for real-time updates
  if (io) {
    const dashboardNamespace = io.of("/ai-dashboard");

    dashboardNamespace.on("connection", (socket) => {
      console.log("[AI Dashboard] Client connected:", socket.id);

      // Send initial data
      getTracing()
        .getAllAgentMetrics()
        .then((metrics) => {
          socket.emit("agents:update", { agents: metrics });
        });

      socket.on("disconnect", () => {
        console.log("[AI Dashboard] Client disconnected:", socket.id);
      });
    });

    // Emit updates periodically
    setInterval(() => {
      const metrics = getTracing().getAllAgentMetrics();
      dashboardNamespace.emit("agents:update", { agents: metrics });
    }, 5000); // Update every 5 seconds
  }

  return router;
}

/**
 * Emit real-time event to dashboard
 */
export function emitDashboardEvent(io: SocketIOServer | undefined, event: string, data: any): void {
  if (io) {
    io.of("/ai-dashboard").emit(event, data);
  }
}
