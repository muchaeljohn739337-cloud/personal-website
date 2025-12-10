import { NextRequest, NextResponse } from 'next/server';

import { handleIPNWebhook, verifyIPNSignature } from '@/lib/payments/nowpayments';

// POST /api/payments/nowpayments/webhook - Handle NOWPayments IPN
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-nowpayments-sig');

    // Verify signature
    if (signature && !verifyIPNSignature(body, signature)) {
      console.error('Invalid NOWPayments webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    console.log('NOWPayments webhook received:', data);

    await handleIPNWebhook(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('NOWPayments webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
