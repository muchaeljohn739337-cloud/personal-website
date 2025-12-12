import { CryptoPaymentStatus, Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get payments from Transaction and CryptoPayment models
    const whereTransaction: Prisma.TransactionWhereInput = { type: TransactionType.PAYMENT };
    const whereCrypto: Prisma.CryptoPaymentWhereInput = {};

    if (status) {
      const upperStatus = status.toUpperCase();
      if (Object.values(TransactionStatus).includes(upperStatus as TransactionStatus)) {
        whereTransaction.status = upperStatus as TransactionStatus;
      }
      if (Object.values(CryptoPaymentStatus).includes(upperStatus as CryptoPaymentStatus)) {
        whereCrypto.status = upperStatus as CryptoPaymentStatus;
      }
    }

    const [transactions, cryptoPayments] = await Promise.all([
      prisma.transaction.findMany({
        where: whereTransaction,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.cryptoPayment.findMany({
        where: whereCrypto,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Combine and format payments
    const payments = [
      ...transactions.map((tx) => ({
        id: tx.id,
        userId: tx.senderId || '',
        userEmail: tx.sender?.email || 'Unknown',
        amount: Number(tx.amount) * 100, // Convert to cents
        currency: tx.currency.toLowerCase(),
        status: tx.status.toLowerCase(),
        provider: tx.stripePaymentId ? 'stripe' : 'crypto',
        createdAt: tx.createdAt.toISOString(),
        description: tx.description || undefined,
      })),
      ...cryptoPayments.map((cp) => ({
        id: cp.id,
        userId: cp.userId,
        userEmail: cp.user.email,
        amount: Number(cp.amountUsd) * 100, // Convert to cents
        currency: cp.currency.toLowerCase(),
        status: cp.status.toLowerCase(),
        provider: cp.provider.toLowerCase(),
        createdAt: cp.createdAt.toISOString(),
        description: cp.description || undefined,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      payments: payments.slice(0, limit),
      total: payments.length,
    });
  } catch (error) {
    console.error('Payment admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
