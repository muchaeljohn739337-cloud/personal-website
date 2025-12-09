import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

import { prisma } from '@/lib/prismaClient';

// One-time admin setup endpoint
// DELETE THIS FILE AFTER CREATING YOUR ADMIN USER!
// SECURITY: This endpoint is disabled in production
export async function POST(req: NextRequest) {
  // Block in production
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production. Use scripts/create-admin.ts instead.' },
      { status: 403 }
    );
  }

  try {
    // Security: Check for setup secret
    const { secret, email, password, name } = await req.json();

    // Use environment variable for setup secret (required in production-like environments)
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json(
        { error: 'ADMIN_SETUP_SECRET environment variable must be set' },
        { status: 500 }
      );
    }

    if (secret !== setupSecret) {
      return NextResponse.json({ error: 'Invalid setup secret' }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update to admin role
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      return NextResponse.json({
        success: true,
        message: 'Existing user updated to ADMIN role',
      });
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    // Create default wallet
    await prisma.wallet.create({
      data: {
        name: 'Primary Wallet',
        userId: user.id,
        type: 'PERSONAL',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      userId: user.id,
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}
