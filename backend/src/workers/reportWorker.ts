import { Job } from 'bullmq';
import prisma from '../prismaClient';
import { jobService } from '../services/JobService';
import { logger } from '../utils/logger';

/**
 * Report Worker - Generates various reports
 */
export async function generateReportJob(job: Job) {
  const { reportType, period, userId, parameters } = job.data;
  
  logger.info(`Generating ${reportType} report for period ${period}`);

  try {
    await job.updateProgress(10);

    let reportData: any = {};

    switch (reportType) {
      case 'TRANSACTION_SUMMARY':
        reportData = await generateTransactionReport(period, userId);
        break;
      case 'USER_ACTIVITY':
        reportData = await generateUserActivityReport(period, userId);
        break;
      case 'FINANCIAL_SUMMARY':
        reportData = await generateFinancialReport(period);
        break;
      case 'SYSTEM_HEALTH':
        reportData = await generateSystemHealthReport();
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    await job.updateProgress(80);

    // Store report result
    const report = {
      type: reportType,
      period,
      data: reportData,
      generatedAt: new Date(),
      parameters,
    };

    await job.updateProgress(100);

    logger.info(`Report ${reportType} generated successfully`);
    return report;
  } catch (error) {
    logger.error(`Failed to generate report ${reportType}:`, error);
    throw error;
  }
}

async function generateTransactionReport(period: string, userId?: string) {
  const { start, end } = getPeriodDates(period);

  const where: any = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (userId) {
    where.userId = userId;
  }

  const [transactions, totalCount, totalAmount] = await Promise.all([
    prisma.transactions.findMany({
      where,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.transactions.count({ where }),
    prisma.transactions.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
  ]);

  // Group by type
  const byType = await prisma.transactions.groupBy({
    by: ['type'],
    where,
    _count: true,
    _sum: { amount: true },
  });

  return {
    period: { start, end },
    totalTransactions: totalCount,
    totalAmount: totalAmount._sum.amount?.toNumber() || 0,
    transactions,
    byType,
  };
}

async function generateUserActivityReport(period: string, userId?: string) {
  const { start, end } = getPeriodDates(period);

  const where: any = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (userId) {
    where.userId = userId;
  }

  const [loginCount, transactionCount, notificationCount] = await Promise.all([
    prisma.users.count({
      where: {
        ...where,
        lastLogin: {
          gte: start,
          lte: end,
        },
      },
    }),
    prisma.transactions.count({ where }),
    prisma.notifications.count({ where }),
  ]);

  return {
    period: { start, end },
    logins: loginCount,
    transactions: transactionCount,
    notifications: notificationCount,
  };
}

async function generateFinancialReport(period: string) {
  const { start, end } = getPeriodDates(period);

  const [deposits, withdrawals, revenue] = await Promise.all([
    prisma.transactions.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.transactions.aggregate({
      where: {
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.transactions.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    period: { start, end },
    totalDeposits: deposits._sum.amount?.toNumber() || 0,
    totalWithdrawals: withdrawals._sum.amount?.toNumber() || 0,
    totalRevenue: revenue._sum.amount?.toNumber() || 0,
    netFlow: (deposits._sum.amount?.toNumber() || 0) - (withdrawals._sum.amount?.toNumber() || 0),
  };
}

async function generateSystemHealthReport() {
  const [
    totalUsers,
    activeUsers,
    pendingTransactions,
    failedJobs,
    queueMetrics,
  ] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({ where: { active: true } }),
    prisma.transactions.count({ where: { status: 'PENDING' } }),
    prisma.jobLog.count({ where: { status: 'failed' } }),
    jobService.getAllQueueMetrics(),
  ]);

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    transactions: {
      pending: pendingTransactions,
    },
    jobs: {
      failed: failedJobs,
    },
    queues: queueMetrics,
    timestamp: new Date(),
  };
}

function getPeriodDates(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 7);
  }

  return { start, end };
}
