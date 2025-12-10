import { NextResponse } from 'next/server';

import { getSMSPool } from '@/lib/communications/sms-pool';

// Webhook endpoint for incoming SMS/Calls from SMS Pool
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, from, to, message, callId } = body;

    const smsPool = getSMSPool();

    if (type === 'sms') {
      // Handle incoming SMS
      const response = await smsPool.processIncomingSMS(from, to, message);

      return NextResponse.json({
        success: true,
        response,
      });
    }

    if (type === 'call_start') {
      // Handle incoming call
      const session = await smsPool.processIncomingCall(from, to);

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        aiHandled: session.aiHandled,
        status: session.status,
      });
    }

    if (type === 'call_end') {
      // Handle call end
      const session = smsPool.endCall(callId, body.transcript);

      return NextResponse.json({
        success: true,
        session,
      });
    }

    return NextResponse.json({ error: 'Unknown webhook type' }, { status: 400 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET for webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: 'Webhook endpoint active' });
}
