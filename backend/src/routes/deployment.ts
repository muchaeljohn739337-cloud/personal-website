// Deployment Routes - API for AI Deployment Agent
// Manual trigger and status endpoints for deployment orchestration

import express, { Request, Response } from "express";
import { getAgentScheduler } from "../agents/scheduler";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = express.Router();

/**
 * GET /api/deployment/status
 * Get current deployment system status
 */
router.get("/status", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Get recent deployment history
    const recentDeployments = await prisma.audit_logs.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get AI Deployment Agent status
    const agentScheduler = getAgentScheduler(prisma);
    const agents = agentScheduler.getAgents();
    const deploymentAgent = agents.find((a) => a.getConfig().name === "AIDeploymentAgent");

    res.json({
      agent: {
        name: deploymentAgent?.getConfig().name,
        enabled: deploymentAgent?.getConfig().enabled,
        schedule: deploymentAgent?.getConfig().schedule,
        lastRun: deploymentAgent?.getLastRun(),
        status: deploymentAgent?.metadata.status,
      },
      recentDeployments: recentDeployments.map((d: any) => ({
        id: d.entityId,
        action: d.action,
        timestamp: d.createdAt,
        data: typeof d.changes === "string" ? JSON.parse(d.changes) : d.changes,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve deployment status",
      metadata: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/deployment/trigger
 * Manually trigger AI deployment agent
 */
router.post("/trigger", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const agentScheduler = getAgentScheduler(prisma);
    const result = await agentScheduler.executeAgent("AIDeploymentAgent");

    res.json({
      success: true,
      message: "Deployment triggered",
      result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to trigger deployment",
      metadata: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/deployment/risk-assessment
 * Get current deployment risk assessment
 */
router.get("/risk-assessment", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Calculate current risk factors
    const recentErrors = await prisma.audit_logs.count({
      where: {
        action: "error",
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
    });

    const activeUsers = await prisma.users.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 15 * 60 * 1000),
        },
      },
    });

    const pendingTransactions = await prisma.transactions.count({
      where: {
        status: { in: ["pending", "processing"] },
      },
    });

    // Recent deployment failure rate
    const recentDeployments = await prisma.audit_logs.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      take: 20,
    });

    const failureRate =
      recentDeployments.filter((d: any) => d.action === "deployment_failed").length /
      Math.max(recentDeployments.length, 1);

    // Calculate risk score
    let riskScore = 0;
    const factors: string[] = [];

    if (failureRate > 0.3) {
      riskScore += 3;
      factors.push(`High recent failure rate: ${(failureRate * 100).toFixed(0)}%`);
    } else if (failureRate > 0.1) {
      riskScore += 1;
      factors.push(`Moderate failure rate: ${(failureRate * 100).toFixed(0)}%`);
    }

    if (activeUsers > 50) {
      riskScore += 2;
      factors.push(`High user activity: ${activeUsers} users`);
    } else if (activeUsers > 20) {
      riskScore += 1;
      factors.push(`Moderate user activity: ${activeUsers} users`);
    }

    if (pendingTransactions > 10) {
      riskScore += 2;
      factors.push(`${pendingTransactions} pending transactions`);
    }

    if (recentErrors > 10) {
      riskScore += 2;
      factors.push(`${recentErrors} recent errors`);
    }

    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      riskScore += 1;
      factors.push("Business hours");
    }

    let recommendation: "auto-deploy" | "require-approval" | "block";
    if (riskScore <= 3) {
      recommendation = "auto-deploy";
    } else if (riskScore <= 7) {
      recommendation = "require-approval";
    } else {
      recommendation = "block";
    }

    res.json({
      riskScore,
      factors,
      recommendation,
      metrics: {
        recentErrors,
        activeUsers,
        pendingTransactions,
        failureRate: `${(failureRate * 100).toFixed(1)}%`,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to assess deployment risk",
      metadata: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/deployment/rollback
 * Trigger manual rollback
 */
router.post("/rollback", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    // Log rollback action
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "manual_rollback",
        userId: req.user?.id || "admin",
        resourceType: "SYSTEM",
        resourceId: "deployment",
        changes: JSON.stringify({
          reason: reason || "Manual rollback requested",
          timestamp: new Date().toISOString(),
        }),
      },
    });

    res.json({
      success: true,
      message: "Rollback initiated - check Render dashboard to redeploy previous version",
      instructions: [
        "1. Go to https://dashboard.render.com",
        "2. Select 'advancia-backend-upnrf'",
        "3. Click 'Deploys' tab",
        "4. Find last successful deployment",
        "5. Click '⋯' → 'Redeploy'",
      ],
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to initiate rollback",
      metadata: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/deployment/history
 * Get deployment history with learning insights
 */
router.get("/history", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const deployments = await prisma.audit_logs.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    // Calculate insights
    const successCount = deployments.filter((d: any) => d.action === "deployment_success").length;
    const failureCount = deployments.filter((d: any) => d.action === "deployment_failed").length;
    const rollbackCount = deployments.filter(
      (d: any) => d.action === "rollback_triggered" || d.action === "manual_rollback"
    ).length;

    // Average deployment duration
    const durationsMs = deployments
      .filter((d: any) => d.action === "deployment_success")
      .map((d: any) => {
        try {
          const changes = typeof d.changes === "string" ? JSON.parse(d.changes) : d.changes;
          return changes.duration || 0;
        } catch {
          return 0;
        }
      });

    const avgDuration =
      durationsMs.length > 0 ? durationsMs.reduce((a: number, b: number) => a + b, 0) / durationsMs.length : 0;

    res.json({
      deployments: deployments.map((d: any) => ({
        id: d.entityId,
        action: d.action,
        timestamp: d.createdAt,
        userId: d.userId,
        data: typeof d.changes === "string" ? JSON.parse(d.changes) : d.changes,
      })),
      insights: {
        totalDeployments: deployments.length,
        successCount,
        failureCount,
        rollbackCount,
        successRate: `${((successCount / Math.max(deployments.length, 1)) * 100).toFixed(1)}%`,
        avgDurationSeconds: Math.round(avgDuration / 1000),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to retrieve deployment history",
      metadata: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
