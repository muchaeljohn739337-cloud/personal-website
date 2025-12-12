import express, { Request, Response } from "express";
import { Server as SocketIOServer } from "socket.io";
import { aiLoadBalancer } from "../ai/aiLoadBalancer";
import { AIWorkerMetadata, aiWorkerRegistry } from "../ai/aiWorkerRegistry";
import { guardianAI } from "../ai/guardian_integration";
import { typescriptErrorFixer } from "../ai/typescriptErrorFixer";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = express.Router();
let io: SocketIOServer | null = null;

/**
 * Set Socket.IO instance for real-time updates
 */
export function setAIWorkersSocketIO(ioInstance: SocketIOServer): void {
  io = ioInstance;
  console.log("✅ Socket.IO injected into AI Workers service");

  // Listen to worker registry events and broadcast to clients
  aiWorkerRegistry.on("worker:operational", (worker: AIWorkerMetadata) => {
    io?.emit("ai-worker:status-change", {
      workerId: worker.id,
      status: "operational",
      worker,
    });
  });

  aiWorkerRegistry.on("worker:degraded", (worker: AIWorkerMetadata) => {
    io?.emit("ai-worker:status-change", {
      workerId: worker.id,
      status: "degraded",
      worker,
    });
  });

  aiWorkerRegistry.on("worker:failed", (worker: AIWorkerMetadata) => {
    io?.emit("ai-worker:status-change", {
      workerId: worker.id,
      status: "failed",
      worker,
    });

    // Alert admin
    io?.emit("ai-worker:alert", {
      severity: "critical",
      message: `AI Worker ${worker.name} has failed`,
      workerId: worker.id,
      timestamp: new Date(),
    });
  });

  aiWorkerRegistry.on(
    "worker:circuit-breaker-open",
    (worker: AIWorkerMetadata) => {
      io?.emit("ai-worker:alert", {
        severity: "warning",
        message: `Circuit breaker opened for ${worker.name}`,
        workerId: worker.id,
        timestamp: new Date(),
      });
    }
  );

  aiWorkerRegistry.on("worker:recovered", (worker: AIWorkerMetadata) => {
    io?.emit("ai-worker:status-change", {
      workerId: worker.id,
      status: "operational",
      worker,
    });

    io?.emit("ai-worker:alert", {
      severity: "info",
      message: `AI Worker ${worker.name} has recovered`,
      workerId: worker.id,
      timestamp: new Date(),
    });
  });

  // Load balancer events
  aiLoadBalancer.on("threshold:reached", (count: number) => {
    io?.emit("ai-worker:alert", {
      severity: "info",
      message: `Active users threshold reached (${count}). All AI workers active.`,
      timestamp: new Date(),
    });
  });

  aiLoadBalancer.on("threshold:below", (count: number) => {
    io?.emit("ai-worker:alert", {
      severity: "info",
      message: `Active users below threshold (${count}). Graceful degradation enabled.`,
      timestamp: new Date(),
    });
  });
}

/**
 * GET /api/ai-workers/status
 * Get overall system status and all workers
 */
router.get(
  "/status",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const systemHealth = aiWorkerRegistry.getSystemHealth();
      const allWorkers = aiWorkerRegistry.getAllWorkers();
      const loadBalancerStats = aiLoadBalancer.getStats();
      const allocation = aiLoadBalancer.allocateWorkers();

      res.json({
        success: true,
        systemHealth,
        workers: allWorkers,
        loadBalancer: loadBalancerStats,
        allocation,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get AI workers status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve AI workers status",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/ai-workers/:id
 * Get specific worker details
 */
router.get(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const worker = aiWorkerRegistry.getWorker(id);

      if (!worker) {
        return res.status(404).json({
          success: false,
          error: "Worker not found",
        });
      }

      res.json({
        success: true,
        worker,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get worker metadata:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve worker details",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/ai-workers/:id/restart
 * Manually restart a worker
 */
router.post(
  "/:id/restart",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const worker = aiWorkerRegistry.getWorker(id);

      if (!worker) {
        return res.status(404).json({
          success: false,
          error: "Worker not found",
        });
      }

      const success = await aiWorkerRegistry.manualRestart(id);

      if (success) {
        await guardianAI.logAction(
          "Admin",
          "worker_restart",
          `Manually restarted worker: ${worker.name}`,
          { workerId: id, adminUser: (req as any).user?.email }
        );

        res.json({
          success: true,
          message: `Worker ${worker.name} restart initiated`,
          worker,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to restart worker",
        });
      }
    } catch (error: any) {
      console.error("Failed to restart worker:", error);
      res.status(500).json({
        success: false,
        error: "Failed to restart worker",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/ai-workers/metrics/system
 * Get system-wide metrics
 */
router.get(
  "/metrics/system",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const systemHealth = aiWorkerRegistry.getSystemHealth();
      const workers = aiWorkerRegistry.getAllWorkers();

      // Calculate aggregate metrics
      const totalRequests = workers.reduce(
        (sum, w) => sum + w.health.totalRequests,
        0
      );
      const successfulRequests = workers.reduce(
        (sum, w) => sum + w.health.successfulRequests,
        0
      );
      const failedRequests = workers.reduce(
        (sum, w) => sum + w.health.failedRequests,
        0
      );
      const avgResponseTime =
        workers.reduce((sum, w) => sum + w.health.avgResponseTime, 0) /
        workers.length;

      const categoryBreakdown = workers.reduce((acc, worker) => {
        if (!acc[worker.category]) {
          acc[worker.category] = {
            count: 0,
            operational: 0,
            degraded: 0,
            failed: 0,
          };
        }
        acc[worker.category].count++;
        acc[worker.category][worker.health.status]++;
        return acc;
      }, {} as Record<string, any>);

      res.json({
        success: true,
        metrics: {
          systemHealth,
          totalRequests,
          successfulRequests,
          failedRequests,
          successRate:
            totalRequests > 0
              ? (successfulRequests / totalRequests) * 100
              : 100,
          avgResponseTime,
          categoryBreakdown,
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get system metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve system metrics",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/ai-workers/categories/:category
 * Get workers by category
 */
router.get(
  "/categories/:category",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { category } = req.params;
      const workers = aiWorkerRegistry.getWorkersByCategory(category as any);

      res.json({
        success: true,
        category,
        workers,
        count: workers.length,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get workers by category:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve workers by category",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/ai-workers/typescript-fixer/run
 * Run TypeScript error detection and fixing
 */
router.post(
  "/typescript-fixer/run",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await typescriptErrorFixer.run();

      await guardianAI.logAction(
        "Admin",
        "typescript_fixer_run",
        `TypeScript error fixer executed: ${result.totalErrors} errors, ${result.fixesApplied} fixes applied`,
        { result, adminUser: (req as any).user?.email }
      );

      res.json({
        success: true,
        result,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to run TypeScript fixer:", error);
      res.status(500).json({
        success: false,
        error: "Failed to run TypeScript error fixer",
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/ai-workers/typescript-fixer/status
 * Get TypeScript fixer status
 */
router.get(
  "/typescript-fixer/status",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const status = typescriptErrorFixer.getStatus();

      res.json({
        success: true,
        status,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get TypeScript fixer status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve TypeScript fixer status",
        message: error.message,
      });
    }
  }
);

/**
 * PUT /api/ai-workers/load-balancer/active-users
 * Update active user count
 */
router.put(
  "/load-balancer/active-users",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { count } = req.body;

      if (typeof count !== "number" || count < 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid active user count",
        });
      }

      aiLoadBalancer.setActiveUsers(count);

      res.json({
        success: true,
        activeUsers: count,
        stats: aiLoadBalancer.getStats(),
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to update active users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update active user count",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/ai-workers/:id/heartbeat
 * Send heartbeat for a worker (for external workers)
 */
router.post("/:id/heartbeat", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    aiWorkerRegistry.heartbeat(id);

    res.json({
      success: true,
      message: "Heartbeat received",
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error("Failed to process heartbeat:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process heartbeat",
      message: error.message,
    });
  }
});

export default router;
