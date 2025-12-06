import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaClient';
import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import { serializeDecimal } from '@/lib/utils/decimal';
import { emitToUser } from '@/lib/socket';

// POST /api/admin/crypto/deposits/[id]/reject
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authenticateToken(req);
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminCheck = await requireAdmin(authResult.user);
  if (!adminCheck.success) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = params;
  const adminId = authResult.user.userId;
  const body = await req.json().catch(() => ({}));
  const { reason } = body;

  if (!reason) {
    return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
  }

  try {
    const deposit = await prisma.crypto_deposits.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!deposit || deposit.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invalid deposit' }, { status: 400 });
    }

    // Update deposit status
    await prisma.crypto_deposits.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Create audit log
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: 'CRYPTO_DEPOSIT_REJECTED',
        resourceType: 'CryptoDeposit',
        resourceId: id,
        details: {
          depositId: id,
          amount: serializeDecimal(deposit.amount),
          currency: deposit.currency,
          userId: deposit.userId,
          reason,
        },
        ipAddress,
      },
    });

    // Notify user via socket
    emitToUser(deposit.userId, 'crypto-deposit-rejected', {
      depositId: id,
      amount: serializeDecimal(deposit.amount),
      currency: deposit.currency,
      reason,
      message: 'Deposit was rejected ⚠️ Please contact support',
    });

    return NextResponse.json({ message: 'Deposit rejected' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    return NextResponse.json({ error: 'Failed to reject deposit' }, { status: 500 });
  }
}
