import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getOrCreateTokenWallet } from '@/lib/tokens';
import { prisma } from '@/lib/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get or create token wallet (ensures 0 balance for new users)
    const tokenWallet = await getOrCreateTokenWallet(userId);

    // Get regular wallet balance
    const wallet = await prisma.wallet.findFirst({
      where: { userId },
      select: { balance: true, currency: true },
    });

    // Calculate total balance (token wallet USD value + regular wallet)
    const tokenBalance = Number(tokenWallet.balance);
    const tokenUsdValue = tokenBalance * Number(tokenWallet.exchangeRate);
    const walletBalance = wallet ? Number(wallet.balance) : 0;
    const totalBalance = tokenUsdValue + walletBalance;

    // Get transaction counts
    const [totalTransactions, thisMonthTransactions] = await Promise.all([
      prisma.transaction.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      }),
      prisma.transaction.count({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Get payment stats
    const [totalPayments, thisMonthPayments] = await Promise.all([
      prisma.cryptoPayment.count({
        where: { userId, status: 'FINISHED' },
      }),
      prisma.cryptoPayment.count({
        where: {
          userId,
          status: 'FINISHED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Calculate monthly revenue (from completed payments this month)
    const monthlyRevenue = await prisma.cryptoPayment.aggregate({
      where: {
        userId,
        status: 'FINISHED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: {
        amountUsd: true,
      },
    });

    const revenue = Number(monthlyRevenue._sum.amountUsd || 0);

    // Calculate growth rate (mock for now, can be enhanced with historical data)
    const growthRate = 0; // New users start with 0% growth

    return NextResponse.json({
      totalBalance: totalBalance || 0,
      tokenBalance: tokenBalance || 0,
      tokenUsdValue: tokenUsdValue || 0,
      walletBalance: walletBalance || 0,
      monthlyRevenue: revenue || 0,
      transactionVolume: totalTransactions || 0,
      activeUsers: 0, // This would be organization-level data
      growthRate: growthRate || 0,
      pendingPayouts: 0, // Can be calculated from pending transactions
      fraudBlocked: 0, // Can be calculated from blocked transactions
      successRate: totalTransactions > 0 ? 100 : 0, // Can be calculated from transaction statuses
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}
