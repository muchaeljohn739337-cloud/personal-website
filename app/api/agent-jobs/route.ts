/**
 * Agent Jobs API
 * Endpoints for enqueueing and listing agent jobs
 */

import { AIJobStatus, Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

/**
 * POST /api/agent-jobs - Enqueue a new agent job
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jobType, taskDescription, inputData, priority = 5 } = body;

    if (!jobType || !taskDescription) {
      return NextResponse.json(
        { error: 'jobType and taskDescription are required' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriority = Math.max(1, Math.min(10, priority));

    // Create job
    const job = await prisma.aIJob.create({
      data: {
        jobType,
        taskDescription,
        inputData: inputData || {},
        priority: validPriority,
        status: AIJobStatus.PENDING,
        userId: session.user.id,
      },
      include: {
        logs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating agent job:', error);
    return NextResponse.json({ error: 'Failed to create agent job' }, { status: 500 });
  }
}

/**
 * GET /api/agent-jobs - List jobs with filters
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as AIJobStatus | null;
    const jobType = searchParams.get('jobType');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause
    const where: Prisma.AIJobWhereInput = {
      userId: session.user.id, // Users can only see their own jobs
    };

    if (status) {
      where.status = status;
    }

    if (jobType) {
      where.jobType = jobType;
    }

    // Get jobs
    const [jobs, total] = await Promise.all([
      prisma.aIJob.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          checkpoints: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              logs: true,
              checkpoints: true,
            },
          },
        },
      }),
      prisma.aIJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('[API] Error listing agent jobs:', error);
    return NextResponse.json({ error: 'Failed to list agent jobs' }, { status: 500 });
  }
}
