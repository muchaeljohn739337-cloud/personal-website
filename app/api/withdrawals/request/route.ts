/**
 * User Withdrawal Request API
 * Users can request withdrawals which require admin approval
 */

import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { protectAPI } from '@/lib/security/api-protection';

const withdrawalRequestSchema = z.object({
  amount: z.number().positive().min(0.01),
  currency: z.string().min(2).max(10),
  address: z.string().min(26).max(100),
  network: z.string().optional(),
  provider: z.enum(['NOWPAYMENTS', 'ALCHEMY_PAY', 'STRIPE', 'MANUAL']).default('MANUAL'),
});

/**
 * POST /api/withdrawals/request - Create a withdrawal request
 * Requires admin approval before processing
 */
export async function POST(req: NextRequest) {
  try {
    // Apply API protection with strict rate limiting for withdrawals
    const protection = await protectAPI(req, {
      requireAuth: true,
      requireRole: 'USER',
      rateLimit: 'sensitive', // Strict rate limit for withdrawal requests
      checkIP: true,
    });

    if (!protection.allowed) {
      return protection.response || NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Additional role check - ensure user is not admin trying to bypass
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token?.role === 'ADMIN' || token?.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admins cannot create withdrawal requests. Use admin panel instead.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount, currency, address, network, provider } = withdrawalRequestSchema.parse(body);

    // Get user's wallet balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        wallets: {
          where: { type: 'PERSONAL' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const wallet = user.wallets[0];
    if (!wallet) {
      return NextResponse.json(
        { error: 'No wallet found. Please create a wallet first.' },
        { status: 400 }
      );
    }

    const currentBalance = Number(wallet.balance);
    if (currentBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance', currentBalance, requestedAmount: amount },
        { status: 400 }
      );
    }

    // Calculate USD amount (simplified - in production, use real-time exchange rates)
    const amountUsd = amount; // Assuming 1:1 for now, replace with actual conversion

    // Create withdrawal request (status: PENDING - requires admin approval)
    const withdrawal = await prisma.cryptoWithdrawal.create({
      data: {
        userId: session.user.id,
        provider,
        amount,
        amountUsd,
        currency: currency.toUpperCase(),
        address,
        network: network || currency.toUpperCase(),
        status: 'PENDING', // Requires admin approval
        metadata: {
          requestedAt: new Date().toISOString(),
          userAgent: req.headers.get('user-agent') || 'unknown',
          ipAddress:
            req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown',
        },
      },
    });

    // Log admin action for audit
    try {
      const { logAdminAction } = await import('@/lib/admin');
      const ipAddress =
        req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      await logAdminAction('system', {
        action: 'WITHDRAWAL_REQUEST',
        targetUserId: session.user.id,
        description: `User ${user.email} requested withdrawal of ${amount} ${currency} to ${address}`,
        metadata: {
          withdrawalId: withdrawal.id,
          amount,
          currency,
          address,
          network,
          provider,
          type: 'USER_WITHDRAWAL_REQUEST',
        },
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Awaiting admin approval.',
      withdrawal: {
        id: withdrawal.id,
        amount,
        currency,
        address,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
      },
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create withdrawal request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/withdrawals/request - Get user's withdrawal requests
 */
export async function GET(req: NextRequest) {
  try {
    const protection = await protectAPI(req, {
      requireAuth: true,
      requireRole: 'USER',
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

    const withdrawals = await prisma.cryptoWithdrawal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      withdrawals: withdrawals.map((w) => ({
        id: w.id,
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
      })),
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}
