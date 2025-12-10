import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// GET - Fetch all passwords for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const passwords = await prisma.passwordEntry.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ passwords });
  } catch (error) {
    console.error('Error fetching passwords:', error);
    return NextResponse.json({ error: 'Failed to fetch passwords' }, { status: 500 });
  }
}

// POST - Create a new password entry
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { siteName, siteUrl, username, password, notes, category } = body;

    if (!siteName || !password) {
      return NextResponse.json({ error: 'Site name and password are required' }, { status: 400 });
    }

    const entry = await prisma.passwordEntry.create({
      data: {
        userId: session.user.id,
        siteName,
        siteUrl: siteUrl || '',
        username: username || '',
        password, // Already encrypted on client side
        notes: notes || '',
        category: category || 'other',
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error creating password:', error);
    return NextResponse.json({ error: 'Failed to create password' }, { status: 500 });
  }
}

// PUT - Update a password entry
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, siteName, siteUrl, username, password, notes, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.passwordEntry.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 });
    }

    const entry = await prisma.passwordEntry.update({
      where: { id },
      data: {
        siteName,
        siteUrl: siteUrl || '',
        username: username || '',
        password,
        notes: notes || '',
        category: category || 'other',
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}

// DELETE - Delete a password entry
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.passwordEntry.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Password not found' }, { status: 404 });
    }

    await prisma.passwordEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting password:', error);
    return NextResponse.json({ error: 'Failed to delete password' }, { status: 500 });
  }
}
