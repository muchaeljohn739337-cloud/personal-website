import { NextRequest, NextResponse } from 'next/server';

import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { resetPasswordSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (resetToken.used) {
      return NextResponse.json({ error: 'Token has already been used' }, { status: 400 });
    }

    if (resetToken.expires < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
