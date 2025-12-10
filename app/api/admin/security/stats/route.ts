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

    // Get security stats from AuditLog
    const [totalAttempts, failedAttempts, suspiciousAttempts, twoFactorUsers] =
      await Promise.all([
        prisma.auditLog.count({
          where: { eventType: 'LOGIN_ATTEMPT' },
        }),
        prisma.auditLog.count({
          where: {
            eventType: 'LOGIN_ATTEMPT',
            severity: { in: ['ERROR', 'CRITICAL'] },
          },
        }),
        prisma.auditLog.count({
          where: {
            eventType: 'LOGIN_ATTEMPT',
            severity: 'CRITICAL',
          },
        }),
        prisma.user.count({
          where: { twoFactorEnabled: true },
        }),
      ]);

    return NextResponse.json({
      loginAttempts: {
        total: totalAttempts,
        failed: failedAttempts,
        suspicious: suspiciousAttempts,
      },
      blockedIPs: 0, // TODO: Implement IP blocking
      activeSessions: 0, // TODO: Track active sessions
      twoFactorEnabled: twoFactorUsers,
      recentAlerts: [],
    });
  } catch (error) {
    console.error('Security stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

