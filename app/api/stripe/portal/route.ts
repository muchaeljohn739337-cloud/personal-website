import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { createBillingPortalSession } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await req.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    if (!organization.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
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

    // Create billing portal session
    const portalSession = await createBillingPortalSession({
      customerId: organization.stripeCustomerId,
      returnUrl: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
