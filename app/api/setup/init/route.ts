import { NextResponse } from 'next/server';
import { hash, compare } from 'bcryptjs';

import { prisma } from '@/lib/prismaClient';

// One-time database initialization endpoint
// DELETE THIS FILE AFTER SETUP!
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // List all users
    if (action === 'list') {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      });
      return NextResponse.json({ users });
    }

    // Demote OAuth user to regular USER
    if (action === 'demote') {
      const email = searchParams.get('email');
      if (email) {
        await prisma.user.updateMany({
          where: { email: email.toLowerCase() },
          data: { role: 'USER' },
        });
        return NextResponse.json({ success: true, message: `Demoted ${email} to USER` });
      }
    }

    // Change admin password
    if (action === 'changepass') {
      const newPassword = searchParams.get('newpass');
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      const hashedPassword = await hash(newPassword, 12);
      await prisma.user.updateMany({
        where: { email: 'admin@advanciapayledger.com' },
        data: { password: hashedPassword },
      });
      return NextResponse.json({
        success: true,
        message: 'Admin password changed successfully. Please delete this endpoint after use!',
      });
    }

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
