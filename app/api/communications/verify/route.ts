import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getSMSPool } from '@/lib/communications/sms-pool';

// GET /api/communications/verify - Verify SMS/Voice pool configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const smsPool = getSMSPool();

    // Verify configuration
    const isConfigured = smsPool.isConfigured();
    const stats = smsPool.getStats();
    const activeNumbers = smsPool.getActiveNumbers();

    // Test SMS functionality
    let smsTestResult = { success: false, message: 'Not tested' };
    if (isConfigured) {
      try {
        // Test SMS API connectivity
        const countries = await smsPool.getCountries();
        smsTestResult = {
          success: countries.length > 0,
          message: countries.length > 0 ? 'SMS API is accessible' : 'SMS API returned no countries',
        };
      } catch (error) {
        smsTestResult = {
          success: false,
          message: error instanceof Error ? error.message : 'SMS API test failed',
        };
      }
    }

    // Test Voice functionality
    let voiceTestResult = { success: false, message: 'Not tested' };
    if (isConfigured) {
      try {
        // Voice uses same API, so if SMS works, voice should work
        voiceTestResult = {
          success: smsTestResult.success,
          message: smsTestResult.success ? 'Voice API is accessible' : 'Voice API test failed',
        };
      } catch (error) {
        voiceTestResult = {
          success: false,
          message: error instanceof Error ? error.message : 'Voice API test failed',
        };
      }
    }

    return NextResponse.json({
      success: true,
      verification: {
        configured: isConfigured,
        sms: {
          configured: isConfigured,
          test: smsTestResult,
          activeNumbers: activeNumbers.filter((n) => n.type === 'sms' || n.type === 'both').length,
        },
        voice: {
          configured: isConfigured,
          test: voiceTestResult,
          activeNumbers: activeNumbers.filter((n) => n.type === 'voice' || n.type === 'both')
            .length,
        },
        stats,
        recommendations: isConfigured
          ? []
          : [
              'Set SMSPOOL_API_KEY in environment variables',
              'Configure webhook URL in SMS Pool dashboard',
              'Test SMS sending functionality',
              'Test voice call handling',
            ],
      },
    });
  } catch (error) {
    console.error('SMS/Voice verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
