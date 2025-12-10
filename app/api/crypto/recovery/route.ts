import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getCryptoRecoverySystem } from '@/lib/crypto/recovery';

// GET /api/crypto/recovery - Get recovery status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const recoverySystem = getCryptoRecoverySystem();

    if (action === 'auto-recover') {
      const recovered = await recoverySystem.autoRecoverExpiredPayments();
      return NextResponse.json({
        success: true,
        message: `Auto-recovered ${recovered} expired payment(s)`,
        recovered,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Crypto recovery system is active',
      capabilities: [
        'Recover expired payments',
        'Recover stuck payments',
        'Process refunds',
        'Verify payment legitimacy',
        'Auto-recover expired payments',
      ],
    });
  } catch (error) {
    console.error('Crypto recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/crypto/recovery - Recover a payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, reason, action } = body;

    const recoverySystem = getCryptoRecoverySystem();

    if (action === 'recover') {
      if (!paymentId || !reason) {
        return NextResponse.json({ error: 'Payment ID and reason are required' }, { status: 400 });
      }

      const recovery = await recoverySystem.recoverPayment(paymentId, reason);
      return NextResponse.json({ success: true, recovery });
    }

    if (action === 'verify') {
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      }

      const verification = await recoverySystem.verifyPaymentLegitimacy(paymentId);
      return NextResponse.json({ success: true, verification });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Crypto recovery error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
