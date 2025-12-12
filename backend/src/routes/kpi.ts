/**
 * KPI Dashboard Routes
 * Provides real-time business metrics and analytics
 *
 * Endpoints:
 * - GET /api/kpi/dashboard - Full KPI dashboard data
 * - GET /api/kpi/mrr - Monthly Recurring Revenue
 * - GET /api/kpi/churn - Churn rate and analysis
 * - GET /api/kpi/users - User acquisition and growth
 * - GET /api/kpi/usage - Feature usage analytics
 * - GET /api/kpi/real-time - Real-time metrics stream
 */

import express, { Request, Response } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import { KPIDashboardService } from "../services/kpiDashboard";

const router = express.Router();

// Initialize KPI service
const kpiService = new KPIDashboardService();

// Helper function for admin role check
const checkAdminRole = requireAdmin;

// ===== ADMIN KPI ENDPOINTS =====

/**
 * GET /api/kpi/dashboard
 * Get complete KPI dashboard with all metrics
 * Admin only
 */
router.get(
  "/dashboard",
  authenticateToken,
  checkAdminRole as any,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const dashboard = await kpiService.getFullDashboard();

      return res.json({
        success: true,
        data: dashboard,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("KPI dashboard error:", err);
      return res.status(500).json({ error: "Failed to fetch KPI dashboard" });
    }
  }
);

/**
 * GET /api/kpi/mrr
 * Get Monthly Recurring Revenue metrics
 * Admin only
 */
router.get("/mrr", authenticateToken, checkAdminRole as any, async (req: Request, res: Response): Promise<any> => {
  try {
    const { months = 12 } = req.query;
    const monthsNum = Math.min(parseInt(months as string) || 12, 24);

    const mrrData = await kpiService.getMRRHistory(monthsNum);
    const currentMRR = await kpiService.calculateMRR();

    return res.json({
      success: true,
      data: {
        current: currentMRR,
        history: mrrData,
        arr: currentMRR * 12,
      },
    });
  } catch (err) {
    console.error("MRR fetch error:", err);
    return res.status(500).json({ error: "Failed to fetch MRR data" });
  }
});

/**
 * GET /api/kpi/churn
 * Get churn rate and analysis
 * Admin only
 */
router.get("/churn", authenticateToken, checkAdminRole as any, async (req: Request, res: Response): Promise<any> => {
  try {
    const { period = 30 } = req.query;
    const periodDays = Math.min(parseInt(period as string) || 30, 365);

    const churnData = await kpiService.getChurnAnalysis(periodDays);

    return res.json({
      success: true,
      data: churnData,
    });
  } catch (err) {
    console.error("Churn analysis error:", err);
    return res.status(500).json({ error: "Failed to fetch churn data" });
  }
});

/**
 * GET /api/kpi/users
 * Get user acquisition and growth metrics
 * Admin only
 */
router.get("/users", authenticateToken, checkAdminRole as any, async (req: Request, res: Response): Promise<any> => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days as string) || 30, 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get user growth data
    const [totalUsers, newUsers, activeUsers, usersByRole] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.users.count({
        where: {
          active: true,
          updatedAt: { gte: startDate },
        },
      }),
      prisma.users.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
    ]);

    // Calculate daily signups for chart
    const dailySignups = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*) as count
        FROM "users"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `;

    return res.json({
      success: true,
      data: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
        growthRate: totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : 0,
        byRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count.id,
        })),
        dailySignups: dailySignups.map((d) => ({
          date: d.date,
          count: Number(d.count),
        })),
      },
    });
  } catch (err) {
    console.error("User metrics error:", err);
    return res.status(500).json({ error: "Failed to fetch user metrics" });
  }
});

/**
 * GET /api/kpi/usage
 * Get feature usage analytics
 * Admin only
 */
router.get("/usage", authenticateToken, checkAdminRole as any, async (req: Request, res: Response): Promise<any> => {
  try {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days as string) || 30, 90);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get AI usage
    const aiUsage = await prisma.aIUsageQuota.aggregate({
      where: {
        createdAt: { gte: startDate },
      },
      _sum: {
        aiRequestsToday: true,
      },
      _count: {
        _all: true,
      },
    });

    // Get workflow usage
    const workflowUsage = await prisma.aIWorkflow.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Get AI task executions instead of agentExecution
    const taskExecutions = await prisma.aITask.count({
      where: {
        createdAt: { gte: startDate },
      },
    });

    // Get transaction volume
    const transactionVolume = await prisma.transactions.aggregate({
      where: {
        createdAt: { gte: startDate },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    return res.json({
      success: true,
      data: {
        period: `${daysNum} days`,
        aiRequests: aiUsage._sum?.aiRequestsToday || 0,
        aiActiveUsers: aiUsage._count?._all || 0,
        workflowsCreated: workflowUsage,
        agentExecutions: taskExecutions,
        transactions: {
          count: transactionVolume._count?.id || 0,
          volume: transactionVolume._sum?.amount || 0,
        },
      },
    });
  } catch (err) {
    console.error("Usage metrics error:", err);
    return res.status(500).json({ error: "Failed to fetch usage metrics" });
  }
});

/**
 * GET /api/kpi/revenue
 * Get revenue breakdown by tier
 * Admin only
 */
router.get("/revenue", authenticateToken, checkAdminRole as any, async (req: Request, res: Response): Promise<any> => {
  try {
    // Get subscription counts by plan
    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ["planId"],
      where: {
        status: "active",
      },
      _count: {
        id: true,
      },
    });

    // Get plans with pricing
    const plans = await prisma.pricingPlan.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        priceMonthly: true,
        priceYearly: true,
      },
    });

    // Calculate revenue by tier
    const revenueByTier = plans.map((plan) => {
      const subCount = subscriptionsByPlan.find((s) => s.planId === plan.id)?._count.id || 0;
      return {
        planId: plan.id,
        planName: plan.name,
        subscribers: subCount,
        monthlyRevenue: Number(plan.priceMonthly) * subCount,
        yearlyEquivalent: Number(plan.priceMonthly) * subCount * 12,
      };
    });

    const totalMRR = revenueByTier.reduce((sum, tier) => sum + tier.monthlyRevenue, 0);

    return res.json({
      success: true,
      data: {
        totalMRR,
        totalARR: totalMRR * 12,
        byTier: revenueByTier,
        totalSubscribers: subscriptionsByPlan.reduce((sum, s) => sum + s._count.id, 0),
      },
    });
  } catch (err) {
    console.error("Revenue metrics error:", err);
    return res.status(500).json({ error: "Failed to fetch revenue metrics" });
  }
});

/**
 * GET /api/kpi/health
 * Get system health metrics
 * Admin only
 */
router.get("/health", authenticateToken, checkAdminRole as any, async (req: Request, res: Response): Promise<any> => {
  try {
    const startTime = Date.now();

    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // Get error counts from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get error counts from audit logs in last 24 hours
    const errorCount = await prisma.audit_logs.count({
      where: {
        action: { contains: "error" },
        createdAt: { gte: yesterday },
      },
    });

    // Get active sessions
    const activeSessions = await prisma.sessions.count({
      where: {
        expiresAt: { gt: new Date() },
      },
    });

    // Get queue health - use AI tasks instead
    const pendingJobs = await prisma.aITask.count({
      where: {
        status: "pending",
      },
    });

    return res.json({
      success: true,
      data: {
        status: "healthy",
        database: {
          connected: true,
          latencyMs: dbLatency,
        },
        errors24h: errorCount,
        activeSessions,
        pendingJobs,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (err) {
    console.error("Health metrics error:", err);
    return res.status(500).json({
      success: false,
      data: {
        status: "unhealthy",
        error: (err as Error).message,
      },
    });
  }
});

/**
 * GET /api/kpi/summary
 * Quick summary of key metrics (for dashboard cards)
 * Admin only
 */
router.get("/summary", authenticateToken, checkAdminRole as any, async (req: Request, res: Response): Promise<any> => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [totalUsers, newUsersThisMonth, activeSubscriptions, totalRevenue, pendingWithdrawals] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: { createdAt: { gte: thisMonth } },
      }),
      prisma.subscription.count({
        where: { status: "active" },
      }),
      prisma.transactions.aggregate({
        where: {
          createdAt: { gte: thisMonth },
          type: "DEPOSIT",
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
      prisma.crypto_withdrawals.count({
        where: { status: "pending" },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
        },
        subscriptions: {
          active: activeSubscriptions,
        },
        revenue: {
          thisMonth: totalRevenue._sum.amount || 0,
        },
        pending: {
          withdrawals: pendingWithdrawals,
        },
      },
    });
  } catch (err) {
    console.error("Summary metrics error:", err);
    return res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;
