import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line import/no-unresolved
import { authOptions } from '@/lib/auth';
// eslint-disable-next-line import/no-unresolved
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const level = searchParams.get('level');

    const where: { severity?: string } = {};
    if (level) {
      where.severity = level.toUpperCase();
    }

    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        level: log.severity.toLowerCase() as 'info' | 'warning' | 'error',
        message: log.details,
        timestamp: log.createdAt.toISOString(),
        source: log.eventType,
      })),
    });
  } catch (error) {
    console.error('System logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
