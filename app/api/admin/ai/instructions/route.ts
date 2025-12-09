import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { logAdminAction } from '@/lib/admin';
import { Orchestrator } from '@/lib/agents/orchestrator';

// Middleware to check admin access
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
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { userId: session.user.id, role: user.role };
}

// POST /api/admin/ai/instructions - Admin instructs AI to complete a task
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { instruction, priority = 5, context = {} } = body;

    if (!instruction || typeof instruction !== 'string') {
      return NextResponse.json(
        { error: 'Instruction is required and must be a string' },
        { status: 400 }
      );
    }

    // Create AI job in database
    const aiJob = await prisma.aIJob.create({
      data: {
        jobType: 'admin_instruction',
        status: 'PENDING',
        priority: Math.min(Math.max(priority, 1), 10), // Clamp between 1-10
        taskDescription: `Admin Instruction: ${instruction}`,
        inputData: {
          instruction,
          context,
          adminId: auth.userId,
          timestamp: new Date().toISOString(),
        },
        userId: auth.userId,
      },
    });

    // Submit task to orchestrator
    const orchestrator = new Orchestrator();
    const taskId = await orchestrator.submitTask(
      instruction,
      {
        ...context,
        adminId: auth.userId,
        jobId: aiJob.id,
        priority: aiJob.priority,
      },
      auth.userId,
      aiJob.priority
    );

    // Update job with task ID
    await prisma.aIJob.update({
      where: { id: aiJob.id },
      data: {
        orchestratorId: taskId,
        status: 'QUEUED',
      },
    });

    // Log admin action (to both Prisma and Supabase)
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await logAdminAction(auth.userId, {
      action: 'AI_INSTRUCTION',
      description: `Submitted AI instruction: ${instruction.substring(0, 100)}...`,
      metadata: {
        jobId: aiJob.id,
        taskId,
        instruction,
        priority,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'AI instruction submitted successfully',
      job: {
        id: aiJob.id,
        taskId,
        status: aiJob.status,
        priority: aiJob.priority,
      },
    });
  } catch (error) {
    console.error('Admin AI instruction error:', error);
    return NextResponse.json({ error: 'Failed to submit AI instruction' }, { status: 500 });
  }
}

// GET /api/admin/ai/instructions - Get AI job status and results
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (jobId) {
      // Get specific job
      const job = await prisma.aIJob.findUnique({
        where: { id: jobId },
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        job,
      });
    }

    // Get all jobs
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const jobs = await prisma.aIJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        logs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('Admin get AI jobs error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI jobs' }, { status: 500 });
  }
}
