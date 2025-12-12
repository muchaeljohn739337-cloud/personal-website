import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { getAdminDashboardStats } from '@/lib/admin';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET() {
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

    const stats = await getAdminDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
