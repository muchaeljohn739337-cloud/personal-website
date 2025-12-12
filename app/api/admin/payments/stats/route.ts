import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get payment statistics from Transaction and CryptoPayment models
    const [
      totalTransactions,
      totalCrypto,
      thisMonthTransactions,
      thisMonthCrypto,
      thisWeekTransactions,
      thisWeekCrypto,
      todayTransactions,
      todayCrypto,
      failedTransactions,
      failedCrypto,
      pendingTransactions,
      pendingCrypto,
      refundedTransactions,
    ] = await Promise.all([
      prisma.transaction.count({
        where: { type: 'PAYMENT', status: 'COMPLETED' },
      }),
      prisma.cryptoPayment.count({
        where: { status: 'CONFIRMED' },
      }),
      prisma.transaction.count({
        where: {
          type: 'PAYMENT',
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.cryptoPayment.count({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.transaction.count({
        where: {
          type: 'PAYMENT',
          status: 'COMPLETED',
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.cryptoPayment.count({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfWeek },
        },
      }),
      prisma.transaction.count({
        where: {
          type: 'PAYMENT',
          status: 'COMPLETED',
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.cryptoPayment.count({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.transaction.count({
        where: { type: 'PAYMENT', status: 'FAILED' },
      }),
      prisma.cryptoPayment.count({
        where: { status: 'FAILED' },
      }),
      prisma.transaction.count({
        where: { type: 'PAYMENT', status: 'PENDING' },
      }),
      prisma.cryptoPayment.count({
        where: { status: 'WAITING' },
      }),
      prisma.transaction.count({
        where: { type: 'PAYMENT', status: 'REFUNDED' },
      }),
    ]);

    const total = totalTransactions + totalCrypto;
    const thisMonth = thisMonthTransactions + thisMonthCrypto;
    const thisWeek = thisWeekTransactions + thisWeekCrypto;
    const today = todayTransactions + todayCrypto;
    const failed = failedTransactions + failedCrypto;
    const pending = pendingTransactions + pendingCrypto;
    const refunded = refundedTransactions;

    return NextResponse.json({
      total,
      thisMonth,
      thisWeek,
      today,
      failed,
      pending,
      refunded,
    });
  } catch (error) {
    console.error('Payment stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
