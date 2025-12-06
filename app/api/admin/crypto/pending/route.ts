import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaClient';
import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import { serializeDecimalFields } from '@/lib/utils/decimal';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

// GET /api/admin/crypto/pending
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
    const [deposits, withdrawals] = await Promise.all([
      prisma.crypto_deposits.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: { id: true, email: true, name: true, tier: true, kycStatus: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.crypto_withdrawals.findMany({
        where: { status: 'PENDING', requiresApproval: true },
        include: {
          user: {
            select: { id: true, email: true, name: true, tier: true, kycStatus: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      deposits: (deposits as AnyRecord[]).map((d: AnyRecord) => serializeDecimalFields(d)),
      withdrawals: (withdrawals as AnyRecord[]).map((w: AnyRecord) => serializeDecimalFields(w)),
    });
  } catch (error) {
    console.error('Get pending transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending transactions' }, { status: 500 });
  }
}
