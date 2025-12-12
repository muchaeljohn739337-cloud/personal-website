import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

export const dynamic = 'force-dynamic';

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
      attempts: logs.map((log) => {
        const metadata =
          typeof log.metadata === 'object' && log.metadata !== null
            ? (log.metadata as Record<string, unknown>)
            : {};
        return {
          id: log.id,
          email: (metadata.email as string) || 'Unknown',
          ipAddress: log.ipAddress || 'Unknown',
          userAgent: (metadata.userAgent as string) || 'Unknown',
          success: log.severity === 'INFO',
          timestamp: log.createdAt.toISOString(),
          location: log.ipAddress ? 'Unknown' : undefined,
        };
      }),
    });
  } catch (error) {
    console.error('Login attempts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
