import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { createPayment, SUPPORTED_CRYPTOS } from '@/lib/payments/nowpayments';
import { createBuyOrder, SUPPORTED_CRYPTO_ONRAMP, SUPPORTED_FIAT } from '@/lib/payments/alchemypay';
import { prisma } from '@/lib/prismaClient';

const paymentSchema = z.object({
  provider: z.enum(['NOWPAYMENTS', 'ALCHEMY_PAY']),
  amount: z.number().positive().min(10),
  currency: z.string().min(2).max(10),
  fiatCurrency: z.string().optional(),
  walletAddress: z.string().optional(),
});

// GET /api/payments/crypto - Get supported currencies and user's payment history
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's payment history
    const payments = await prisma.cryptoPayment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      supportedCryptos: {
        nowpayments: SUPPORTED_CRYPTOS,
        alchemypay: SUPPORTED_CRYPTO_ONRAMP,
      },
      supportedFiat: SUPPORTED_FIAT,
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        amountUsd: Number(p.amountUsd),
        fiatAmount: p.fiatAmount ? Number(p.fiatAmount) : null,
        exchangeRate: p.exchangeRate ? Number(p.exchangeRate) : null,
      })),
    });
  } catch (error) {
    console.error('Crypto payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments/crypto - Create a new crypto payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { provider, amount, currency, fiatCurrency, walletAddress } = paymentSchema.parse(body);

    let result;

    if (provider === 'NOWPAYMENTS') {
      result = await createPayment({
        userId: session.user.id,
        priceAmount: amount,
        priceCurrency: 'usd',
        payCurrency: currency.toLowerCase(),
        orderDescription: `Token purchase - ${amount} USD`,
      });

      return NextResponse.json({
        success: true,
        payment: {
          id: result.payment.id,
          payAddress: result.paymentDetails.pay_address,
          payAmount: result.paymentDetails.pay_amount,
          payCurrency: currency.toUpperCase(),
          expiresAt: result.payment.expiresAt,
        },
      });
    } else if (provider === 'ALCHEMY_PAY') {
      if (!walletAddress) {
        return NextResponse.json({ error: 'Wallet address required for Alchemy Pay' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });

      result = await createBuyOrder({
        userId: session.user.id,
        crypto: currency.toUpperCase(),
        network: 'ETH', // Default network
        fiat: fiatCurrency || 'USD',
        fiatAmount: amount,
        walletAddress,
        email: user?.email,
      });

      return NextResponse.json({
        success: true,
        payment: {
          id: result.payment.id,
          paymentUrl: result.paymentUrl,
          quote: result.orderDetails,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
}
