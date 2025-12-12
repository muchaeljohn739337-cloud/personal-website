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

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, newToday, newThisWeek, newThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfWeek } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
    ]);

    // Mock analytics data - replace with actual analytics service integration
    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday,
        newThisWeek,
        newThisMonth,
      },
      traffic: {
        total: 0,
        unique: 0,
        pageViews: 0,
        bounceRate: 0,
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        growth: 0,
      },
      ai: {
        requests: 0,
        tokens: 0,
        cost: 0,
      },
      regions: [],
      sources: [],
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
