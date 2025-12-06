import { NextRequest, NextResponse } from 'next/server';

import { generateToken } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { forgotPasswordSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate reset token
    const token = generateToken(64);
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expires,
      },
    });

    // TODO: Send email with reset link
    // For now, we'll just log the token in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset token for ${email}: ${token}`);
      console.log(`Reset link: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`);
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
