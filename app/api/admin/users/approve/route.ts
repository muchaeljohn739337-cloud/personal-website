import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { logAdminAction } from '@/lib/admin';

// Middleware to check admin access
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { userId: session.user.id, role: user.role };
}

// POST /api/admin/users/approve - Approve a user
export async function POST(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user to approve
    const userToApprove = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, isApproved: true, role: true },
    });

    if (!userToApprove) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent approving admins (they auto-approve)
    if (userToApprove.role === 'ADMIN' || userToApprove.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Admin users are automatically approved' },
        { status: 400 }
      );
    }

    if (userToApprove.isApproved) {
      return NextResponse.json({ error: 'User is already approved' }, { status: 400 });
    }

    // Approve the user
    const approvedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: auth.userId,
        rejectionReason: null,
      },
    });

    // Log admin action
    await logAdminAction(auth.userId, {
      action: 'USER_APPROVE',
      targetUserId: userId,
      description: `Approved user: ${userToApprove.email}`,
      metadata: { reason },
    });

    return NextResponse.json({
      success: true,
      message: 'User approved successfully',
      user: {
        id: approvedUser.id,
        email: approvedUser.email,
        name: approvedUser.name,
        isApproved: approvedUser.isApproved,
      },
    });
  } catch (error) {
    console.error('Admin approve user error:', error);
    return NextResponse.json({ error: 'Failed to approve user' }, { status: 500 });
  }
}

// POST /api/admin/users/reject - Reject a user
export async function DELETE(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const reason = searchParams.get('reason') || undefined;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user to reject
    const userToReject = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, isApproved: true, role: true },
    });

    if (!userToReject) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent rejecting admins
    if (userToReject.role === 'ADMIN' || userToReject.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot reject admin users' }, { status: 400 });
    }

    // Reject the user
    const rejectedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: false,
        rejectionReason: reason || 'Account rejected by administrator',
      },
    });

    // Log admin action
    await logAdminAction(auth.userId, {
      action: 'USER_REJECT',
      targetUserId: userId,
      description: `Rejected user: ${userToReject.email}`,
      metadata: { reason },
    });

    return NextResponse.json({
      success: true,
      message: 'User rejected successfully',
      user: {
        id: rejectedUser.id,
        email: rejectedUser.email,
        isApproved: rejectedUser.isApproved,
      },
    });
  } catch (error) {
    console.error('Admin reject user error:', error);
    return NextResponse.json({ error: 'Failed to reject user' }, { status: 500 });
  }
}

// GET /api/admin/users/pending - Get pending users
export async function GET() {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const pendingUsers = await prisma.user.findMany({
      where: {
        isApproved: false,
        role: { notIn: ['ADMIN', 'SUPER_ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        rejectionReason: true,
        _count: {
          select: {
            wallets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      users: pendingUsers,
      count: pendingUsers.length,
    });
  } catch (error) {
    console.error('Admin get pending users error:', error);
    return NextResponse.json({ error: 'Failed to fetch pending users' }, { status: 500 });
  }
}
