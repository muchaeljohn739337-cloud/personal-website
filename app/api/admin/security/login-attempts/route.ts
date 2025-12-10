import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await prisma.auditLog.findMany({
      where: { eventType: 'LOGIN_ATTEMPT' },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      attempts: logs.map((log) => ({
        id: log.id,
        email: (log.metadata as any)?.email || 'Unknown',
        ipAddress: log.ipAddress || 'Unknown',
        userAgent: (log.metadata as any)?.userAgent || 'Unknown',
        success: log.severity === 'INFO',
        timestamp: log.createdAt.toISOString(),
        location: log.ipAddress ? 'Unknown' : undefined,
      })),
    });
  } catch (error) {
    console.error('Login attempts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

