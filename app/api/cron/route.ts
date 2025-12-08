/**
 * Cron Job Handler
 * Called by Vercel Cron or external scheduler
 * Runs automated tasks based on schedule
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prismaClient';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// =============================================================================
// AUTOMATED TASKS
// =============================================================================

async function cleanupExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  });
  return { task: 'session_cleanup', deleted: result.count };
}

async function cleanupOldLogs() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
    },
  });
  return { task: 'log_cleanup', deleted: result.count };
}

async function checkPendingApprovals() {
  const pending = await prisma.user.count({
    where: { isVerified: false },
  });
  return { task: 'pending_approvals', count: pending };
}

async function checkExpiredSubscriptions() {
  const expired = await prisma.subscription.findMany({
    where: {
      status: 'active',
      currentPeriodEnd: { lt: new Date() },
    },
    select: { id: true, userId: true },
  });

  // Mark as expired
  if (expired.length > 0) {
    await prisma.subscription.updateMany({
      where: { id: { in: expired.map((s) => s.id) } },
      data: { status: 'expired' },
    });
  }

  return { task: 'subscription_check', expired: expired.length };
}

async function generateDailyStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [newUsers, transactions, revenue] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.transaction.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: today }, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
  ]);

  return {
    task: 'daily_stats',
    date: today.toISOString().split('T')[0],
    newUsers,
    transactions,
    revenue: revenue._sum.amount || 0,
  };
}

async function runSecurityScan() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Check for suspicious activity
  const failedLogins = await prisma.auditLog.count({
    where: {
      action: 'LOGIN_FAILED',
      createdAt: { gte: oneHourAgo },
    },
  });

  const suspiciousIPs = await prisma.auditLog.groupBy({
    by: ['ipAddress'],
    where: {
      action: 'LOGIN_FAILED',
      createdAt: { gte: oneHourAgo },
    },
    having: {
      ipAddress: { _count: { gt: 5 } },
    },
  });

  return {
    task: 'security_scan',
    failedLogins,
    suspiciousIPs: suspiciousIPs.length,
  };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function GET(req: NextRequest) {
  // Verify authorization
  const authHeader = req.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskParam = req.nextUrl.searchParams.get('task');
  const results: Record<string, unknown>[] = [];

  try {
    // Run specific task or all tasks
    if (!taskParam || taskParam === 'all') {
      // Run all automated tasks
      results.push(await cleanupExpiredSessions());
      results.push(await cleanupOldLogs());
      results.push(await checkPendingApprovals());
      results.push(await checkExpiredSubscriptions());
      results.push(await generateDailyStats());
      results.push(await runSecurityScan());
    } else {
      // Run specific task
      switch (taskParam) {
        case 'cleanup':
          results.push(await cleanupExpiredSessions());
          results.push(await cleanupOldLogs());
          break;
        case 'approvals':
          results.push(await checkPendingApprovals());
          break;
        case 'subscriptions':
          results.push(await checkExpiredSubscriptions());
          break;
        case 'stats':
          results.push(await generateDailyStats());
          break;
        case 'security':
          results.push(await runSecurityScan());
          break;
        default:
          return NextResponse.json({ error: 'Unknown task' }, { status: 400 });
      }
    }

    console.log('[CRON] Tasks completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      { error: 'Task execution failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
