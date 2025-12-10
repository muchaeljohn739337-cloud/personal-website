import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getSMSVerification } from '@/lib/communications/sms-verification';

// GET - Get verification data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const smsVerification = getSMSVerification();

    switch (action) {
      case 'services': {
        const category = searchParams.get('category') || undefined;
        return NextResponse.json({
          services: smsVerification.getServices(category),
        });
      }

      case 'countries': {
        return NextResponse.json({
          countries: smsVerification.getCountries(),
        });
      }

      case 'balance': {
        const balance = await smsVerification.getBalance();
        return NextResponse.json(balance);
      }

      case 'price': {
        const country = searchParams.get('country') || 'US';
        const service = searchParams.get('service') || 'any';
        const price = await smsVerification.getPrice(country, service);
        return NextResponse.json({ price });
      }

      case 'active': {
        return NextResponse.json({
          verifications: smsVerification.getActiveVerifications(),
        });
      }

      case 'history': {
        const limit = parseInt(searchParams.get('limit') || '50');
        return NextResponse.json({
          history: smsVerification.getHistory(limit),
        });
      }

      case 'check': {
        const verificationId = searchParams.get('id');
        if (!verificationId) {
          return NextResponse.json({ error: 'Verification ID required' }, { status: 400 });
        }
        const verification = await smsVerification.checkCode(verificationId);
        return NextResponse.json({ verification });
      }

      case 'stats': {
        return NextResponse.json({
          stats: smsVerification.getStats(),
        });
      }

      default: {
        // Return overview
        const balance = await smsVerification.getBalance();
        return NextResponse.json({
          balance,
          active: smsVerification.getActiveVerifications(),
          stats: smsVerification.getStats(),
          services: smsVerification.getServices(),
          countries: smsVerification.getCountries(),
        });
      }
    }
  } catch (error) {
    console.error('Verification GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Verification actions
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const smsVerification = getSMSVerification();

    switch (action) {
      case 'rent': {
        const { country, service } = body;
        if (!country || !service) {
          return NextResponse.json({ error: 'Country and service required' }, { status: 400 });
        }

        const verification = await smsVerification.rentNumber(country, service);
        if (verification) {
          return NextResponse.json({
            success: true,
            verification,
            message: `Number rented: ${verification.number}`,
          });
        }
        return NextResponse.json(
          { error: 'Failed to rent number. Check balance or try another country.' },
          { status: 500 }
        );
      }

      case 'check': {
        const { verificationId } = body;
        if (!verificationId) {
          return NextResponse.json({ error: 'Verification ID required' }, { status: 400 });
        }

        const verification = await smsVerification.checkCode(verificationId);
        return NextResponse.json({
          success: true,
          verification,
          codeReceived: verification?.status === 'received',
        });
      }

      case 'cancel': {
        const { verificationId } = body;
        if (!verificationId) {
          return NextResponse.json({ error: 'Verification ID required' }, { status: 400 });
        }

        const cancelled = await smsVerification.cancelVerification(verificationId);
        return NextResponse.json({
          success: cancelled,
          message: cancelled ? 'Verification cancelled' : 'Failed to cancel',
        });
      }

      case 'resend': {
        const { verificationId } = body;
        if (!verificationId) {
          return NextResponse.json({ error: 'Verification ID required' }, { status: 400 });
        }

        const resent = await smsVerification.resendSMS(verificationId);
        return NextResponse.json({
          success: resent,
          message: resent ? 'SMS resend requested' : 'Failed to resend',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Verification POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
