import { NextRequest, NextResponse } from 'next/server';

import { hashPassword } from '@/lib/auth';
import { registerForApproval } from '@/lib/auth/user-approval';
import { prisma } from '@/lib/prismaClient';
import { registerSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
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

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
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

    // Register user for approval (pending until admin approves)
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
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
        message: 'Registration successful! Your account is pending approval.',
        pendingApproval: true,
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
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
