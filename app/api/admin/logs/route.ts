import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// Check admin access
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { userId: session.user.id };
}

// GET /api/admin/logs - Get audit logs
export async function GET() {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      severity: log.severity,
      userId: log.userId,
      userEmail: log.user?.email,
      ipAddress: log.ipAddress,
      details: log.details,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
