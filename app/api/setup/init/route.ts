import { NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';

import { prisma } from '@/lib/prismaClient';

// One-time database initialization endpoint
// DELETE THIS FILE AFTER SETUP!
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Create admin user
    const email = 'admin@advanciapayledger.com';
    const password = 'Admin@123456';
    const hashedPassword = await hash(password, 12);

    // Delete existing user first to ensure clean state
    await prisma.user.deleteMany({
      where: { email },
    });

    // Create fresh admin user
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });

    // Verify password works
    const testCompare = await compare(password, hashedPassword);

    return NextResponse.json({
      success: true,
      message: 'Database initialized and admin user created',
      userId: user.id,
      email: user.email,
      passwordVerified: testCompare,
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize', details: String(error) },
      { status: 500 }
    );
  }
}
