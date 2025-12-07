import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, resendVerificationEmail } from '@/lib/auth/email-verification';
import { checkRedisRateLimit, redisRateLimitConfigs } from '@/lib/security/redis-rate-limit';
import { getClientIP } from '@/lib/security/rate-limit';
import { auditHelpers } from '@/lib/security/audit-log';

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify email with token
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const ip = getClientIP(req.headers);

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const result = await verifyEmailToken(token);

    if (result.success && result.userId) {
      await auditHelpers.loginSuccess(
        result.userId,
        ip,
        req.headers.get('user-agent') || undefined
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      message: result.message,
      redirect: '/auth/login?verified=true',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

/**
 * POST /api/auth/verify-email
 * Resend verification email
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req.headers);

  // Rate limit resend requests
  const rateLimit = await checkRedisRateLimit(ip, redisRateLimitConfigs.emailVerification);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': rateLimit.retryAfter?.toString() || '300' },
      }
    );
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await resendVerificationEmail(email);

    // Log the verification email in development
    if (process.env.NODE_ENV === 'development' && result.token) {
      console.log(
        `Verification link: ${process.env.NEXTAUTH_URL}/auth/verify-email?token=${result.token}`
      );
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
  }
}
