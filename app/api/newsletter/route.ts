import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prismaClient';

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  source: z.string().optional(),
});

// POST - Subscribe to newsletter
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, source } = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === 'UNSUBSCRIBED') {
        // Re-subscribe
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: {
            status: 'PENDING',
            unsubscribedAt: null,
          },
        });
        return NextResponse.json({ message: 'Re-subscribed successfully' });
      }
      return NextResponse.json({ message: 'Already subscribed' }, { status: 400 });
    }

    // Create new subscriber
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        source: source || 'website',
        status: 'PENDING',
      },
    });

    // TODO: Send confirmation email

    return NextResponse.json({
      message: 'Subscribed successfully',
      id: subscriber.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
  }
}

// GET - Get subscriber count (public)
export async function GET() {
  try {
    const count = await prisma.newsletterSubscriber.count({
      where: { status: 'CONFIRMED' },
    });

    return NextResponse.json({ subscriberCount: count });
  } catch (error) {
    console.error('Error fetching subscriber count:', error);
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
