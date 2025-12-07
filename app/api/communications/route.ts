import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  getAIAnsweringEnabled,
  getBusinessHoursOnly,
  getSMSPool,
  setAIAnsweringEnabled,
  setBusinessHoursOnly,
} from '@/lib/communications/sms-pool';

// GET - Get communication settings and stats
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const smsPool = getSMSPool();

    switch (action) {
      case 'stats':
        return NextResponse.json({
          stats: smsPool.getStats(),
          settings: {
            aiAnsweringEnabled: getAIAnsweringEnabled(),
            businessHoursOnly: getBusinessHoursOnly(),
          },
        });

      case 'numbers':
        return NextResponse.json({
          numbers: smsPool.getActiveNumbers(),
        });

      case 'messages': {
        const msgLimit = parseInt(searchParams.get('limit') || '50');
        return NextResponse.json({
          messages: smsPool.getMessageHistory(msgLimit),
        });
      }

      case 'calls': {
        const callLimit = parseInt(searchParams.get('limit') || '50');
        return NextResponse.json({
          calls: smsPool.getCallHistory(callLimit),
        });
      }

      case 'settings':
        return NextResponse.json({
          aiAnsweringEnabled: getAIAnsweringEnabled(),
          businessHoursOnly: getBusinessHoursOnly(),
          configured: smsPool.isConfigured(),
        });

      default:
        // Return overview
        return NextResponse.json({
          stats: smsPool.getStats(),
          settings: {
            aiAnsweringEnabled: getAIAnsweringEnabled(),
            businessHoursOnly: getBusinessHoursOnly(),
            configured: smsPool.isConfigured(),
          },
          recentMessages: smsPool.getMessageHistory(5),
          recentCalls: smsPool.getCallHistory(5),
          activeNumbers: smsPool.getActiveNumbers(),
        });
    }
  } catch (error) {
    console.error('Communications GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Update settings or rent numbers
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const smsPool = getSMSPool();

    switch (action) {
      case 'toggle-ai': {
        const newAIState = !getAIAnsweringEnabled();
        setAIAnsweringEnabled(newAIState);
        return NextResponse.json({
          success: true,
          aiAnsweringEnabled: newAIState,
          message: `AI answering ${newAIState ? 'enabled' : 'disabled'}`,
        });
      }

      case 'toggle-business-hours': {
        const newBHState = !getBusinessHoursOnly();
        setBusinessHoursOnly(newBHState);
        return NextResponse.json({
          success: true,
          businessHoursOnly: newBHState,
          message: `Business hours mode ${newBHState ? 'enabled' : 'disabled'}`,
        });
      }

      case 'set-ai-enabled': {
        setAIAnsweringEnabled(body.enabled);
        return NextResponse.json({
          success: true,
          aiAnsweringEnabled: body.enabled,
        });
      }

      case 'set-business-hours': {
        setBusinessHoursOnly(body.enabled);
        return NextResponse.json({
          success: true,
          businessHoursOnly: body.enabled,
        });
      }

      case 'rent-number': {
        const { country, type } = body;
        const number = await smsPool.rentNumber(country || 'US', type || 'both');
        if (number) {
          return NextResponse.json({ success: true, number });
        }
        return NextResponse.json({ error: 'Failed to rent number' }, { status: 500 });
      }

      case 'release-number': {
        const released = await smsPool.releaseNumber(body.numberId);
        return NextResponse.json({ success: released });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Communications POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
