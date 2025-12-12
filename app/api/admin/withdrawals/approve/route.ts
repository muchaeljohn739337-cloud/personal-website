/**
 * Admin Withdrawal Approval API
 * Admins can approve or reject withdrawal requests
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logAdminAction } from '@/lib/admin';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { protectAPI } from '@/lib/security/api-protection';

const approvalSchema = z.object({
  withdrawalId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'cancel']),
  reason: z.string().optional(),
  txHash: z.string().optional(),
});

/**
 * POST /api/admin/withdrawals/approve - Approve or reject a withdrawal request
 */
export async function POST(req: NextRequest) {
  try {
    // Strict admin-only protection
    const protection = await protectAPI(req, {
      requireAuth: true,
      requireRole: 'ADMIN',
      rateLimit: 'sensitive',
      checkIP: true,
    });

    if (!protection.allowed) {
      return protection.response || NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await approvalSchema.parse(await req.json());
    const { withdrawalId, action, reason, txHash } = body;

    // Get withdrawal request
    const withdrawal = await prisma.cryptoWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          include: {
            wallets: {
              where: { type: 'PERSONAL' },
            },
          },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    // Check if already processed
    if (withdrawal.status !== 'PENDING') {
      return NextResponse.json(
        {
          error: `Withdrawal is already ${withdrawal.status.toLowerCase()}`,
          currentStatus: withdrawal.status,
        },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    let result;

    if (action === 'approve') {
      // Verify user has sufficient balance
      const wallet = withdrawal.user.wallets[0];
      if (!wallet) {
        return NextResponse.json({ error: 'User has no wallet' }, { status: 400 });
      }

      const currentBalance = Number(wallet.balance);
      const withdrawalAmount = Number(withdrawal.amount);

      if (currentBalance < withdrawalAmount) {
        return NextResponse.json(
          {
            error: 'User has insufficient balance',
            currentBalance,
            requestedAmount: withdrawalAmount,
          },
          { status: 400 }
        );
      }

      // Deduct from user's wallet
      const newBalance = currentBalance - withdrawalAmount;
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // Update withdrawal status to PROCESSING
      await prisma.cryptoWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PROCESSING',
          processedAt: new Date(),
          txHash: txHash || null,
          metadata: {
            ...((withdrawal.metadata as Record<string, unknown>) || {}),
            approvedBy: session.user.id,
            approvedAt: new Date().toISOString(),
            reason: reason || 'Approved by admin',
          },
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          amount: withdrawalAmount,
          currency: withdrawal.currency,
          type: 'WITHDRAWAL',
          status: 'PROCESSING',
          description: `Withdrawal approved by admin - ${withdrawal.address}`,
          fromWalletId: wallet.id,
          senderId: withdrawal.userId,
          metadata: {
            withdrawalId: withdrawal.id,
            approvedBy: session.user.id,
            adminApproval: true,
            txHash: txHash || null,
          },
        },
      });

      // Mark as COMPLETED if txHash is provided
      if (txHash) {
        await prisma.cryptoWithdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'COMPLETED',
            txHash,
          },
        });

        await prisma.transaction.updateMany({
          where: {
            metadata: {
              path: ['withdrawalId'],
              equals: withdrawalId,
            },
          },
          data: {
            status: 'COMPLETED',
          },
        });
      }

      result = {
        success: true,
        message: 'Withdrawal approved and processed',
        withdrawal: {
          id: withdrawal.id,
          status: txHash ? 'COMPLETED' : 'PROCESSING',
          newBalance,
        },
      };

      // Log admin action
      await logAdminAction(session.user.id, {
        action: 'WITHDRAWAL_APPROVE',
        targetUserId: withdrawal.userId,
        description: `Approved withdrawal ${withdrawalId}: ${withdrawalAmount} ${withdrawal.currency} to ${withdrawal.address}`,
        metadata: {
          withdrawalId,
          amount: withdrawalAmount,
          currency: withdrawal.currency,
          address: withdrawal.address,
          txHash: txHash || null,
          reason: reason || 'Approved by admin',
        },
        ipAddress,
        userAgent,
      });
    } else if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Reason is required for rejection' }, { status: 400 });
      }

      await prisma.cryptoWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: reason,
          metadata: {
            ...((withdrawal.metadata as Record<string, unknown>) || {}),
            rejectedBy: session.user.id,
            rejectedAt: new Date().toISOString(),
            reason,
          },
        },
      });

      result = {
        success: true,
        message: 'Withdrawal rejected',
        withdrawal: {
          id: withdrawal.id,
          status: 'FAILED',
          reason,
        },
      };

      // Log admin action
      await logAdminAction(session.user.id, {
        action: 'WITHDRAWAL_REJECT',
        targetUserId: withdrawal.userId,
        description: `Rejected withdrawal ${withdrawalId}: ${reason}`,
        metadata: {
          withdrawalId,
          amount: Number(withdrawal.amount),
          currency: withdrawal.currency,
          reason,
        },
        ipAddress,
        userAgent,
      });
    } else if (action === 'cancel') {
      await prisma.cryptoWithdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'CANCELED',
          metadata: {
            ...((withdrawal.metadata as Record<string, unknown>) || {}),
            canceledBy: session.user.id,
            canceledAt: new Date().toISOString(),
            reason: reason || 'Canceled by admin',
          },
        },
      });

      result = {
        success: true,
        message: 'Withdrawal canceled',
        withdrawal: {
          id: withdrawal.id,
          status: 'CANCELED',
        },
      };

      // Log admin action
      await logAdminAction(session.user.id, {
        action: 'WITHDRAWAL_CANCEL',
        targetUserId: withdrawal.userId,
        description: `Canceled withdrawal ${withdrawalId}`,
        metadata: {
          withdrawalId,
          reason: reason || 'Canceled by admin',
        },
        ipAddress,
        userAgent,
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Withdrawal approval error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process withdrawal approval' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/withdrawals/approve - Get all pending withdrawal requests
 */
export async function GET(req: NextRequest) {
  try {
    const protection = await protectAPI(req, {
      requireAuth: true,
      requireRole: 'ADMIN',
      rateLimit: 'api',
      checkIP: true,
    });

    if (!protection.allowed) {
      return protection.response || NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const limit = parseInt(searchParams.get('limit') || '50');

    const withdrawals = await prisma.cryptoWithdrawal.findMany({
      where: {
        status: status as 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            wallets: {
              where: { type: 'PERSONAL' },
              select: {
                balance: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
        userId: w.userId,
        userEmail: w.user.email,
        userName: w.user.name,
        userBalance: w.user.wallets[0] ? Number(w.user.wallets[0].balance) : 0,
        amount: Number(w.amount),
        amountUsd: Number(w.amountUsd),
        currency: w.currency,
        address: w.address,
        network: w.network,
        status: w.status,
        provider: w.provider,
        txHash: w.txHash,
        createdAt: w.createdAt,
        processedAt: w.processedAt,
        failedAt: w.failedAt,
        failureReason: w.failureReason,
        metadata: w.metadata,
      })),
      total: withdrawals.length,
      status,
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}
