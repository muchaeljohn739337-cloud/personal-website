import { NextRequest, NextResponse } from 'next/server';

import { hashPassword } from '@/lib/auth';
import { registerForApproval } from '@/lib/auth/user-approval';
import { createEmailVerificationToken } from '@/lib/auth/email-verification';
import { sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prismaClient';
import { registerSchema } from '@/lib/validations/auth';
import { checkRedisRateLimit, redisRateLimitConfigs } from '@/lib/security/redis-rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting (with fallback if Redis is unavailable)
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    try {
      const rateLimit = await checkRedisRateLimit(
        `register:${ipAddress}`,
        redisRateLimitConfigs.api
      );

      if (!rateLimit.success) {
        return NextResponse.json(
          { error: 'Too many registration attempts. Please try again later.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': redisRateLimitConfigs.api.maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimit.remaining.toString(),
              'X-RateLimit-Reset': rateLimit.resetTime.toString(),
              ...(rateLimit.retryAfter ? { 'Retry-After': rateLimit.retryAfter.toString() } : {}),
            },
          }
        );
      }
    } catch (rateLimitError) {
      // If rate limiting fails, log but continue (don't block registration)
      console.warn('[REGISTER] Rate limiting check failed, continuing:', rateLimitError);
    }

    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user (pending admin approval)
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        isApproved: false, // Requires admin approval before login
      },
    });

    // Create default wallet for the user
    await prisma.wallet.create({
      data: {
        name: 'Primary Wallet',
        userId: user.id,
        type: 'PERSONAL',
      },
    });

    // Create and send email verification token
    const verificationToken = await createEmailVerificationToken(user.id, user.email);

    try {
      await sendVerificationEmail(user, verificationToken);
      console.log('[REGISTER] Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('[REGISTER] Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Register user for approval (pending until admin approves)
    const userAgent = req.headers.get('user-agent') || 'unknown';

    registerForApproval({
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        message:
          'Registration successful! Please check your email to verify your account. Your account is also pending admin approval.',
        pendingApproval: true,
        emailSent: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data. Please check your email and password format.' },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint') || error.message.includes('unique')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
      if (
        error.message.includes('connect') ||
        error.message.includes('database') ||
        error.message.includes('P1001') ||
        error.message.includes('P1002')
      ) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Registration failed. Please try again.',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error
          ? { details: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}
