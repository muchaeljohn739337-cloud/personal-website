/**
 * Admin Agent Worker Control API
 * Start, stop, and check status of the agent worker
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { getWorker, startWorker, stopWorker } from '@/lib/agents/worker';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { error: 'Admin access required', status: 403 };
  }

  return { userId: session.user.id };
}

/**
 * GET /api/admin/agent-worker - Get worker status
 */
export async function GET() {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const worker = getWorker();
    const stats = worker.getStats();

    // Get job counts
    const [pendingJobs, runningJobs, completedJobs, failedJobs] = await Promise.all([
      prisma.aIJob.count({ where: { status: 'PENDING' } }),
      prisma.aIJob.count({ where: { status: 'RUNNING' } }),
      prisma.aIJob.count({ where: { status: 'COMPLETED' } }),
      prisma.aIJob.count({ where: { status: 'FAILED' } }),
    ]);

    return NextResponse.json({
      success: true,
      worker: stats,
      jobs: {
        pending: pendingJobs,
        running: runningJobs,
        completed: completedJobs,
        failed: failedJobs,
      },
    });
  } catch (error) {
    console.error('[API] Error getting worker status:', error);
    return NextResponse.json({ error: 'Failed to get worker status' }, { status: 500 });
  }
}

/**
 * POST /api/admin/agent-worker - Start worker
 */
export async function POST() {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    startWorker();

    return NextResponse.json({
      success: true,
      message: 'Worker started successfully',
    });
  } catch (error) {
    console.error('[API] Error starting worker:', error);
    return NextResponse.json({ error: 'Failed to start worker' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/agent-worker - Stop worker
 */
export async function DELETE() {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    stopWorker();

    return NextResponse.json({
      success: true,
      message: 'Worker stopped successfully',
    });
  } catch (error) {
    console.error('[API] Error stopping worker:', error);
    return NextResponse.json({ error: 'Failed to stop worker' }, { status: 500 });
  }
}
