import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/lib/prismaClient';

// Verify webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

// POST - Receive incoming webhooks
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const webhookId = req.headers.get('x-webhook-id');

    // Find webhook by ID if provided
    if (webhookId) {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (webhook && webhook.secret) {
        const isValid = verifySignature(body, signature, webhook.secret);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
    }

    // Parse the payload
    const payload = JSON.parse(body);
    const event = payload.event || 'unknown';

    // Log the webhook
    await prisma.webhookLog.create({
      data: {
        webhookId: webhookId || '',
        event,
        payload,
        success: true,
        statusCode: 200,
      },
    });

    // Process the webhook based on event type
    switch (event) {
      case 'contact.created':
        // Handle new contact
        console.log('New contact created:', payload.data);
        break;
      case 'deal.updated':
        // Handle deal update
        console.log('Deal updated:', payload.data);
        break;
      case 'payment.completed':
        // Handle payment
        console.log('Payment completed:', payload.data);
        break;
      default:
        console.log('Unknown event:', event);
    }

    return NextResponse.json({ received: true, event });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET - List webhooks (admin only)
export async function GET() {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { logs: true },
        },
      },
    });

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}
