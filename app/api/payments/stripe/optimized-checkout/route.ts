import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { createOptimizedCheckoutSession } from '@/lib/payments/stripe-enhanced';
import { prisma } from '@/lib/prismaClient';

// POST /api/payments/stripe/optimized-checkout - Create optimized checkout for Bank of America
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, organizationId, trialDays = 14, metadata = {} } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Import Stripe client
    const { createStripeCustomer } = await import('@/lib/stripe');

    if (!user.stripeCustomerId) {
      const customer = await createStripeCustomer(user.email, user.name || undefined);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customer.id },
      });
      user.stripeCustomerId = customer.id;
    }

    // Create optimized checkout session
    const checkoutSession = await createOptimizedCheckoutSession({
      customerId: user.stripeCustomerId,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://advanciapayledger.com'}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://advanciapayledger.com'}/dashboard/billing?canceled=true`,
      organizationId: organizationId || session.user.id,
      trialDays,
      metadata: {
        userId: session.user.id,
        ...metadata,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Optimized checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
