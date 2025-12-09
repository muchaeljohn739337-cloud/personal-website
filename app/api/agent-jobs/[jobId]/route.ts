/**
 * Agent Job Detail API
 * Get and update specific agent jobs
 */

import { AIJobStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

/**
 * GET /api/agent-jobs/[jobId] - Get job details with checkpoints
 */
export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
      include: {
        checkpoints: {
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user owns this job (or is admin)
    if (job.userId !== session.user.id) {
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error('[API] Error getting agent job:', error);
    return NextResponse.json({ error: 'Failed to get agent job' }, { status: 500 });
  }
}

/**
 * PATCH /api/agent-jobs/[jobId] - Update job (cancel, retry)
 */
export async function PATCH(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;
    const body = await req.json();
    const { action } = body;

    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if user owns this job (or is admin)
    if (job.userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let updatedJob;

    switch (action) {
      case 'cancel':
        if (job.status === AIJobStatus.COMPLETED || job.status === AIJobStatus.FAILED) {
          return NextResponse.json(
            { error: 'Cannot cancel completed or failed job' },
            { status: 400 }
          );
        }
        updatedJob = await prisma.aIJob.update({
          where: { id: jobId },
          data: { status: AIJobStatus.CANCELLED },
        });
        break;

      case 'retry':
        if (job.status !== AIJobStatus.FAILED) {
          return NextResponse.json({ error: 'Can only retry failed jobs' }, { status: 400 });
        }
        if (job.attempts >= job.maxAttempts) {
          return NextResponse.json({ error: 'Maximum retry attempts reached' }, { status: 400 });
        }
        updatedJob = await prisma.aIJob.update({
          where: { id: jobId },
          data: {
            status: AIJobStatus.PENDING,
            failureReason: null,
            failedAt: null,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "cancel" or "retry"' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('[API] Error updating agent job:', error);
    return NextResponse.json({ error: 'Failed to update agent job' }, { status: 500 });
  }
}
