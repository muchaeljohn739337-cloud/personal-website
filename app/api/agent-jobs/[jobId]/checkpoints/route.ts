/**
 * Agent Job Checkpoints API
 * List checkpoints for a specific job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { listCheckpointsByJob } from '@/lib/agents/checkpoint-manager';
import { prisma } from '@/lib/prismaClient';

/**
 * GET /api/agent-jobs/[jobId]/checkpoints - List checkpoints for a job
 */
export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;

    // Verify job exists and user has access
    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
      select: { userId: true },
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

    // Get checkpoints
    const checkpoints = await listCheckpointsByJob(jobId);

    return NextResponse.json({ success: true, checkpoints });
  } catch (error) {
    console.error('[API] Error listing checkpoints:', error);
    return NextResponse.json({ error: 'Failed to list checkpoints' }, { status: 500 });
  }
}
