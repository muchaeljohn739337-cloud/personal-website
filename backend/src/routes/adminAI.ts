/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN AI ROUTES - AI SYSTEM MONITORING & MANAGEMENT
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Admin endpoints for monitoring and managing AI systems
 * - Record Cleanup AI
 * - Task Orchestrator AI
 * - Mapper AI
 * - Surveillance AI
 * ═══════════════════════════════════════════════════════════════
 */

import { Router } from "express";
import { mapperAI } from "../ai/mapperAI";
import { recordCleanupAI } from "../ai/recordCleanupAI";
import { surveillanceAI } from "../ai/surveillanceAI";
import { taskOrchestratorAI } from "../ai/taskOrchestratorAI";
import { allowRoles, authenticateToken } from "../middleware/auth";

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(allowRoles("ADMIN"));

/**
 * ═══════════════════════════════════════════════════════════════
 * RECORD CLEANUP AI ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * GET /api/admin/ai/cleanup/stats
 * Get cleanup statistics
 */
router.get("/cleanup/stats", async (req, res) => {
  try {
    const stats = await recordCleanupAI.getCleanupStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch cleanup stats",
    });
  }
});

/**
 * POST /api/admin/ai/cleanup/run
 * Manually trigger cleanup
 * Body: { dryRun?: boolean, targets?: string[] }
 */
router.post("/cleanup/run", async (req, res) => {
  try {
    const { dryRun = false, targets = [] } = req.body;

    const config: any = { dryRun };

    // Filter targets if specified
    if (targets.length > 0) {
      config.cleanJobs = targets.includes("jobs");
      config.cleanAuditLogs = targets.includes("auditLogs");
      config.cleanNotifications = targets.includes("notifications");
      config.cleanSessions = targets.includes("sessions");
      config.cleanOrphaned = targets.includes("orphaned");
    }

    const result = await recordCleanupAI.cleanAllOldRecords(config);

    res.json({
      success: true,
      message: dryRun ? "Dry run completed - no records deleted" : "Cleanup completed successfully",
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Cleanup failed",
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * TASK ORCHESTRATOR AI ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * GET /api/admin/ai/tasks/stats
 * Get task orchestrator statistics
 */
router.get("/tasks/stats", (req, res) => {
  try {
    const stats = taskOrchestratorAI.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch task stats",
    });
  }
});

/**
 * GET /api/admin/ai/tasks/queue
 * View current task queue
 */
router.get("/tasks/queue", (req, res) => {
  try {
    const stats = taskOrchestratorAI.getStats();
    res.json({
      success: true,
      queue: {
        pending: stats.pendingTasks,
        running: stats.runningTasks,
        completed: stats.completedTasksToday,
        failed: stats.failedTasksToday,
        totalWorkers: stats.totalWorkers,
        availableWorkers: stats.availableWorkers,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch task queue",
    });
  }
});

/**
 * POST /api/admin/ai/tasks/submit
 * Submit a new task
 * Body: { type: string, payload: any, priority?: string }
 */
router.post("/tasks/submit", async (req, res) => {
  try {
    const { type, payload, priority = "medium" } = req.body;

    if (!type || !payload) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: type, payload",
      });
    }

    const taskId = await taskOrchestratorAI.submitTask(type, payload, {
      priority: priority as any,
    });

    res.json({
      success: true,
      message: "Task submitted successfully",
      taskId,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to submit task",
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * MAPPER AI ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * GET /api/admin/ai/mapper/validate
 * Run comprehensive mapping validation
 */
router.get("/mapper/validate", async (req, res) => {
  try {
    const report = await mapperAI.validateAllMappings();
    res.json({
      success: true,
      report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Validation failed",
    });
  }
});

/**
 * POST /api/admin/ai/mapper/autofix
 * Automatically fix mapping issues
 */
router.post("/mapper/autofix", async (req, res) => {
  try {
    const result = await mapperAI.autoFixMappings();
    res.json({
      success: true,
      message: `Fixed ${result.fixed} issues, ${result.failed} failed`,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Auto-fix failed",
    });
  }
});

/**
 * GET /api/admin/ai/mapper/stats
 * Get mapper statistics
 */
router.get("/mapper/stats", async (req, res) => {
  try {
    const stats = await mapperAI.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch mapper stats",
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * SURVEILLANCE AI ENDPOINTS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * GET /api/admin/ai/surveillance/dashboard
 * Get complete surveillance dashboard data
 */
router.get("/surveillance/dashboard", async (req, res) => {
  try {
    const dashboard = await surveillanceAI.getDashboardData();
    res.json({
      success: true,
      dashboard,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch dashboard data",
    });
  }
});

/**
 * GET /api/admin/ai/surveillance/events
 * Get recent security events
 */
router.get("/surveillance/events", (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const events = surveillanceAI.getRecentSecurityEvents(limit);
    res.json({
      success: true,
      events,
      count: events.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch security events",
    });
  }
});

/**
 * GET /api/admin/ai/surveillance/alerts
 * Get unacknowledged alerts
 */
router.get("/surveillance/alerts", (req, res) => {
  try {
    const alerts = surveillanceAI.getUnacknowledgedAlerts();
    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch alerts",
    });
  }
});

/**
 * POST /api/admin/ai/surveillance/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.post("/surveillance/alerts/:alertId/acknowledge", (req, res) => {
  try {
    const { alertId } = req.params;
    const success = surveillanceAI.acknowledgeAlert(alertId);

    if (success) {
      res.json({
        success: true,
        message: "Alert acknowledged",
      });
    } else {
      res.status(404).json({
        success: false,
        error: "Alert not found",
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to acknowledge alert",
    });
  }
});

/**
 * ═══════════════════════════════════════════════════════════════
 * UNIFIED AI SYSTEM STATUS
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * GET /api/admin/ai/status
 * Get overall AI system status
 */
router.get("/status", async (req, res) => {
  try {
    const [cleanupStats, taskStats, mapperStats, surveillanceDashboard] = await Promise.all([
      recordCleanupAI.getCleanupStats(),
      Promise.resolve(taskOrchestratorAI.getStats()),
      mapperAI.getStats(),
      surveillanceAI.getDashboardData(),
    ]);

    res.json({
      success: true,
      status: {
        overall: surveillanceDashboard.health.overall,
        cleanup: {
          totalOldJobs: cleanupStats.oldJobsCount,
          totalOldAuditLogs: cleanupStats.oldAuditLogsCount,
          estimatedSpaceSavings: cleanupStats.estimatedSpaceSavings,
        },
        tasks: {
          pending: taskStats.pendingTasks,
          running: taskStats.runningTasks,
          workers: {
            available: taskStats.availableWorkers,
            total: taskStats.totalWorkers,
          },
        },
        mapper: {
          totalWorkflows: mapperStats.totalWorkflows,
          validWorkflows: mapperStats.validWorkflows,
          orphanedRecords: mapperStats.orphanedRecords,
        },
        surveillance: {
          health: surveillanceDashboard.health,
          activeAlerts: surveillanceDashboard.activeAlerts.length,
          recentEvents: surveillanceDashboard.recentEvents.length,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch AI system status",
    });
  }
});

export default router;
