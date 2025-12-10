import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { retryPaymentWithOptimization } from '@/lib/payments/stripe-enhanced';
import { prisma } from '@/lib/prismaClient';

// POST /api/payments/stripe/retry - Retry failed payment with optimization
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentIntentId, paymentMethodId } = body;

    if (!paymentIntentId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment intent ID and payment method ID are required' },
        { status: 400 }
      );
    }

    // Verify payment intent belongs to user
    const paymentIntent = await prisma.transaction.findFirst({
      where: {
        senderId: session.user.id,
        stripePaymentId: paymentIntentId,
      },
    });

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment intent not found or unauthorized' },
        { status: 404 }
      );
    }

    // Retry payment with optimization
    const result = await retryPaymentWithOptimization({
      paymentIntentId,
      paymentMethodId,
    });

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: result.id,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
      },
    });
  } catch (error) {
    console.error('Payment retry error:', error);
    return NextResponse.json({ error: 'Failed to retry payment' }, { status: 500 });
  }
}
