import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check database connection
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Get job stats
    const [activeJobs, queuedJobs, failedJobs] = await Promise.all([
      prisma.aIJob.count({
        where: { status: 'RUNNING' },
      }),
      prisma.aIJob.count({
        where: { status: 'PENDING' },
      }),
      prisma.aIJob.count({
        where: { status: 'FAILED' },
      }),
    ]);

    return NextResponse.json({
      status: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'down',
      uptime: process.uptime(),
      database: {
        status: dbLatency < 100 ? 'connected' : 'disconnected',
        latency: dbLatency,
      },
      api: {
        status: 'operational',
        responseTime: 50,
      },
      jobs: {
        active: activeJobs,
        queued: queuedJobs,
        failed: failedJobs,
      },
    });
  } catch (error) {
    console.error('System health error:', error);
    return NextResponse.json(
      {
        status: 'down',
        uptime: process.uptime(),
        database: {
          status: 'disconnected',
          latency: 0,
        },
        api: {
          status: 'down',
          responseTime: 0,
        },
        jobs: {
          active: 0,
          queued: 0,
          failed: 0,
        },
      },
      { status: 500 }
    );
  }
}
