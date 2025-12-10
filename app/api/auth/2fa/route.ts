import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  enable2FA,
  verify2FASetup,
  disable2FA,
  has2FAEnabled,
  regenerateBackupCodes,
} from '@/lib/auth/two-factor';
import { checkRedisRateLimit, redisRateLimitConfigs } from '@/lib/security/redis-rate-limit';
import { getClientIP } from '@/lib/security/rate-limit';
import { auditHelpers } from '@/lib/security/audit-log';

/**
 * GET /api/auth/2fa
 * Get 2FA status for current user
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const enabled = await has2FAEnabled(session.user.id);
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json({ error: 'Failed to get 2FA status' }, { status: 500 });
  }
}

/**
 * POST /api/auth/2fa
 * Enable 2FA - generates secret and backup codes
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const ip = getClientIP(req.headers);

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, code } = body;

    if (action === 'setup') {
      // Generate new 2FA secret
      const result = await enable2FA(session.user.id, session.user.email);

      return NextResponse.json({
        secret: result.secret,
        uri: result.uri,
        backupCodes: result.backupCodes,
      });
    }

    if (action === 'verify') {
      // Rate limit verification attempts
      const rateLimit = await checkRedisRateLimit(
        `2fa:${session.user.id}`,
        redisRateLimitConfigs.twoFactor
      );
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        );
      }

      if (!code) {
        return NextResponse.json({ error: 'Code is required' }, { status: 400 });
      }

      const verified = await verify2FASetup(session.user.id, code);

      if (verified) {
        await auditHelpers.twoFactorEnabled(session.user.id, ip);
        return NextResponse.json({ success: true, message: '2FA enabled successfully' });
      } else {
        await auditHelpers.twoFactorFailed(session.user.id, ip);
        return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
      }
    }

    if (action === 'regenerate-backup') {
      const backupCodes = await regenerateBackupCodes(session.user.id);
      return NextResponse.json({ backupCodes });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/2fa
 * Disable 2FA
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const ip = getClientIP(req.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required to disable 2FA' }, { status: 400 });
    }

    // Verify code before disabling
    const { verify2FALogin } = await import('@/lib/auth/two-factor');
    const verified = await verify2FALogin(session.user.id, code);

    if (!verified) {
      await auditHelpers.twoFactorFailed(session.user.id, ip);
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    await disable2FA(session.user.id);

    // Log the event
    await auditHelpers.loginSuccess(session.user.id, ip); // Using loginSuccess as placeholder

    return NextResponse.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}
