/**
 * KPI Dashboard Service
 * Provides business metrics calculation and analytics
 */

import prisma from "../prismaClient";

export interface KPIDashboardData {
  mrr: number;
  arr: number;
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  churnRate: number;
  conversionRate: number;
  avgRevenuePerUser: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  timestamp: string;
}

export class KPIDashboardService {
  /**
   * Get complete KPI dashboard data
   */
  async getFullDashboard(): Promise<KPIDashboardData> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [totalUsers, activeUsers, newUsersToday, newUsersThisMonth, subscriptionData, transactionData] =
      await Promise.all([
        // Total users
        prisma.users.count(),

        // Active users (logged in within 30 days)
        prisma.users.count({
          where: {
            lastLogin: { gte: thirtyDaysAgo },
          },
        }),

        // New users today
        prisma.users.count({
          where: { createdAt: { gte: startOfDay } },
        }),

        // New users this month
        prisma.users.count({
          where: { createdAt: { gte: startOfMonth } },
        }),

        // Subscription revenue data
        this.getSubscriptionMetrics(),

        // Transaction data
        this.getTransactionMetrics(),
      ]);

    const mrr = subscriptionData.mrr;
    const arr = mrr * 12;
    const avgRevenuePerUser = totalUsers > 0 ? mrr / totalUsers : 0;

    return {
      mrr,
      arr,
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisMonth,
      churnRate: subscriptionData.churnRate,
      conversionRate: subscriptionData.conversionRate,
      avgRevenuePerUser,
      totalRevenue: transactionData.totalRevenue,
      pendingWithdrawals: transactionData.pendingWithdrawals,
      completedWithdrawals: transactionData.completedWithdrawals,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Get MRR history for chart
   */
  async getMRRHistory(months: number = 12): Promise<Array<{ month: string; mrr: number }>> {
    const history: Array<{ month: string; mrr: number }> = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const subs = await prisma.subscription.findMany({
        where: {
          status: "active",
          createdAt: { lte: endDate },
        },
        include: { plan: true },
      });

      const mrr = subs.reduce((sum, sub) => sum + Number(sub.plan.priceMonthly || 0), 0);
      history.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        mrr,
      });
    }

    return history;
  }

  /**
   * Calculate current MRR
   */
  async calculateMRR(): Promise<number> {
    const subs = await prisma.subscription.findMany({
      where: { status: "active" },
      include: { plan: true },
    });
    return subs.reduce((sum, sub) => sum + Number(sub.plan.priceMonthly || 0), 0);
  }

  /**
   * Get churn analysis
   */
  async getChurnAnalysis(periodDays: number = 30): Promise<{
    rate: number;
    cancelled: number;
    retained: number;
    atRisk: number;
  }> {
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const [cancelled, retained, atRisk] = await Promise.all([
      prisma.subscription.count({
        where: { status: "cancelled", cancelledAt: { gte: startDate } },
      }),
      prisma.subscription.count({
        where: { status: "active" },
      }),
      prisma.subscription.count({
        where: { status: "active", currentPeriodEnd: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const rate = retained > 0 ? (cancelled / (cancelled + retained)) * 100 : 0;
    return { rate, cancelled, retained, atRisk };
  }

  /**
   * Get user growth data
   */
  async getUserGrowth(days: number = 30): Promise<{
    daily: Array<{ date: string; count: number }>;
    total: number;
    growth: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const users = await prisma.users.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    // Group by date
    const dailyMap = new Map<string, number>();
    users.forEach((u) => {
      const date = u.createdAt.toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const total = await prisma.users.count();
    const previousTotal = await prisma.users.count({
      where: { createdAt: { lt: startDate } },
    });

    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    return { daily, total, growth };
  }

  /**
   * Get MRR (Monthly Recurring Revenue) breakdown
   */
  async getMRR(): Promise<{
    total: number;
    byPlan: Record<string, number>;
    growth: number;
  }> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
      },
      include: {
        plan: true,
      },
    });

    const byPlan: Record<string, number> = {};
    let total = 0;

    for (const sub of subscriptions) {
      const planName = sub.plan.name;
      const price = Number(sub.plan.priceMonthly || 0);

      byPlan[planName] = (byPlan[planName] || 0) + price;
      total += price;
    }

    // Calculate growth (compare to previous month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const previousMonthSubs = await prisma.subscription.count({
      where: {
        status: "active",
        createdAt: { lt: lastMonth },
      },
    });

    const growth = previousMonthSubs > 0 ? ((subscriptions.length - previousMonthSubs) / previousMonthSubs) * 100 : 0;

    return { total, byPlan, growth };
  }

  /**
   * Get churn rate and analysis
   */
  async getChurnRate(): Promise<{
    rate: number;
    cancelledThisMonth: number;
    reasons: Record<string, number>;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [cancelledSubs, totalActiveStart] = await Promise.all([
      prisma.subscription.count({
        where: {
          status: "cancelled",
          cancelledAt: { gte: startOfMonth },
        },
      }),
      prisma.subscription.count({
        where: {
          status: "active",
          createdAt: { lt: startOfMonth },
        },
      }),
    ]);

    const rate = totalActiveStart > 0 ? (cancelledSubs / totalActiveStart) * 100 : 0;

    return {
      rate,
      cancelledThisMonth: cancelledSubs,
      reasons: {}, // Would need a cancellation_reason field to populate
    };
  }

  /**
   * Get user acquisition metrics
   */
  async getUserMetrics(): Promise<{
    total: number;
    active: number;
    newThisMonth: number;
    bySource: Record<string, number>;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, active, newThisMonth] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({
        where: { lastLogin: { gte: thirtyDaysAgo } },
      }),
      prisma.users.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    return {
      total,
      active,
      newThisMonth,
      bySource: {}, // Would need a signup_source field to populate
    };
  }

  /**
   * Get feature usage analytics
   */
  async getUsageMetrics(): Promise<{
    aiRequests: number;
    workflows: number;
    agents: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [aiUsage, workflows] = await Promise.all([
      prisma.aIUsageQuota.aggregate({
        _sum: {
          aiRequestsToday: true,
        },
      }),
      prisma.aIWorkflow.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    return {
      aiRequests: aiUsage._sum?.aiRequestsToday || 0,
      workflows,
      agents: 0, // Would need agent execution model
    };
  }

  // Private helper methods

  private async getSubscriptionMetrics(): Promise<{
    mrr: number;
    churnRate: number;
    conversionRate: number;
  }> {
    const [activeSubs, totalUsers, cancelledThisMonth] = await Promise.all([
      prisma.subscription.findMany({
        where: { status: "active" },
        include: { plan: true },
      }),
      prisma.users.count(),
      prisma.subscription.count({
        where: {
          status: "cancelled",
          cancelledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    let mrr = 0;
    for (const sub of activeSubs) {
      mrr += Number(sub.plan.priceMonthly || 0);
    }

    const conversionRate = totalUsers > 0 ? (activeSubs.length / totalUsers) * 100 : 0;

    const churnRate = activeSubs.length > 0 ? (cancelledThisMonth / activeSubs.length) * 100 : 0;

    return { mrr, churnRate, conversionRate };
  }

  private async getTransactionMetrics(): Promise<{
    totalRevenue: number;
    pendingWithdrawals: number;
    completedWithdrawals: number;
  }> {
    const [deposits, cryptoWithdrawals] = await Promise.all([
      prisma.transactions.aggregate({
        _sum: { amount: true },
        where: { type: "DEPOSIT", status: "COMPLETED" },
      }),
      prisma.crypto_withdrawals.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const pendingWithdrawals = cryptoWithdrawals.find((w) => w.status === "pending")?._count?.id || 0;
    const completedWithdrawals = cryptoWithdrawals.find((w) => w.status === "completed")?._count?.id || 0;

    return {
      totalRevenue: Number(deposits._sum?.amount || 0),
      pendingWithdrawals,
      completedWithdrawals,
    };
  }
}

export const kpiDashboardService = new KPIDashboardService();
