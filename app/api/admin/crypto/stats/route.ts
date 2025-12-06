import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaClient';
import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import { serializeDecimal } from '@/lib/utils/decimal';

interface StatGroup {
  status: string;
  currency: string;
  _count: number;
  _sum: { amount: unknown };
}

// GET /api/admin/crypto/stats
export async function GET(req: NextRequest) {
  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminCheck = await requireAdmin(authResult.user);
  if (!adminCheck.success) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const [depositStats, withdrawalStats] = await Promise.all([
      prisma.crypto_deposits.groupBy({
        by: ['status', 'currency'],
        _count: true,
        _sum: { amount: true },
      }),
      prisma.crypto_withdrawals.groupBy({
        by: ['status', 'currency'],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    const pendingCount = await prisma.$transaction([
      prisma.crypto_deposits.count({ where: { status: 'PENDING' } }),
      prisma.crypto_withdrawals.count({
        where: { status: 'PENDING', requiresApproval: true },
      }),
    ]);

    return NextResponse.json({
      deposits: (depositStats as StatGroup[]).map((s: StatGroup) => ({
        status: s.status,
        currency: s.currency,
        count: s._count,
        totalAmount: serializeDecimal(s._sum.amount || 0),
      })),
      withdrawals: (withdrawalStats as StatGroup[]).map((s: StatGroup) => ({
        status: s.status,
        currency: s.currency,
        count: s._count,
        totalAmount: serializeDecimal(s._sum.amount || 0),
      })),
      pendingDeposits: pendingCount[0],
      pendingWithdrawals: pendingCount[1],
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
