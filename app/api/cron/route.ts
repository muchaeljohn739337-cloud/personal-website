/**
 * Cron Job Handler
 * Called by Vercel Cron or external scheduler
 * Runs automated tasks based on schedule
 *
 * SECURITY: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';

import { executeTask, getAllTasks } from '@/lib/automation/scheduler';
import { executeWorkflow } from '@/lib/automation/workflows';
import { prisma } from '@/lib/prismaClient';

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
  // TODO: Add Subscription model to Prisma schema when needed
  // For now, return placeholder
  return { task: 'subscription_check', expired: 0, note: 'Subscription model not yet implemented' };
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
  // Vercel Cron automatically adds Authorization header with CRON_SECRET
  // For manual calls, require CRON_SECRET in Authorization header
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-vercel-cron');

  // Check if CRON_SECRET is configured
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  // Allow Vercel cron (x-vercel-cron header) or secret-based auth
  const isAuthorized =
    cronHeader === '1' || // Vercel cron (automatically authorized)
    authHeader === `Bearer ${CRON_SECRET}`; // Manual call with secret

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskParam = req.nextUrl.searchParams.get('task');
  const workflowParam = req.nextUrl.searchParams.get('workflow');
  const results: Record<string, unknown>[] = [];

  try {
    // Run workflow if specified
    if (workflowParam) {
      try {
        const runId = await executeWorkflow(workflowParam);
        results.push({
          task: 'workflow_execution',
          workflowId: workflowParam,
          runId,
          status: 'started',
        });
      } catch (error) {
        results.push({
          task: 'workflow_execution',
          workflowId: workflowParam,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Run scheduled task if specified
    if (taskParam && !workflowParam) {
      const tasks = getAllTasks();
      const task = tasks.find((t) => t.id === taskParam);

      if (task) {
        const result = await executeTask(taskParam);
        results.push(result as unknown as Record<string, unknown>);
      } else {
        // Fall back to legacy task names
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
          case 'all':
            // Run all tasks
            results.push(await cleanupExpiredSessions());
            results.push(await cleanupOldLogs());
            results.push(await checkPendingApprovals());
            results.push(await checkExpiredSubscriptions());
            results.push(await generateDailyStats());
            results.push(await runSecurityScan());
            break;
          default:
            return NextResponse.json({ error: 'Unknown task' }, { status: 400 });
        }
      }
    }

    // If no params, return status
    if (!taskParam && !workflowParam) {
      const tasks = getAllTasks();
      return NextResponse.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        availableTasks: tasks.map((t) => ({
          id: t.id,
          name: t.name,
          schedule: t.schedule,
          enabled: t.enabled,
          lastRun: t.lastRun,
        })),
        message: 'Use ?task=<taskId> or ?workflow=<workflowId> to run',
      });
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
      {
        error: 'Task execution failed',
        details: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 500 }
    );
  }
}
