import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { createCheckoutSession, createStripeCustomer } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, organizationId } = await req.json();

    if (!priceId || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { owner: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: session.user.id,
        },
      },
    });

    if (organization.ownerId !== session.user.id && membership?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not authorized to manage billing' }, { status: 403 });
    }

    // Create or get Stripe customer
    let stripeCustomerId = organization.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await createStripeCustomer(
        organization.billingEmail || organization.owner.email,
        organization.name
      );
      stripeCustomerId = customer.id;

      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId },
      });
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
      organizationId,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
