import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import {
  getUserDetails,
  updateUser,
  changeUserRole,
  suspendUser,
  unsuspendUser,
  deleteUser,
  verifyUser,
  adjustTokenBalance,
} from '@/lib/admin';
import { prisma } from '@/lib/prismaClient';

// Check admin access
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { userId: session.user.id };
}

// GET /api/admin/users/[userId] - Get user details
export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = await getUserDetails(params.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[userId] - Update user
export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { action, ...data } = body;

    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    let result;

    switch (action) {
      case 'update':
        result = await updateUser(auth.userId, params.userId, data, ipAddress);
        break;

      case 'changeRole':
        const roleSchema = z.object({ role: z.enum(['USER', 'ADMIN', 'MODERATOR']) });
        const { role } = roleSchema.parse(data);
        result = await changeUserRole(auth.userId, params.userId, role, ipAddress);
        break;

      case 'suspend':
        const suspendSchema = z.object({
          reason: z.string().min(1),
          type: z.enum(['WARNING', 'TEMPORARY', 'PERMANENT', 'REVIEW']),
          endDate: z.string().datetime().optional(),
        });
        const suspendData = suspendSchema.parse(data);
        result = await suspendUser(
          auth.userId,
          params.userId,
          {
            reason: suspendData.reason,
            type: suspendData.type,
            endDate: suspendData.endDate ? new Date(suspendData.endDate) : undefined,
          },
          ipAddress
        );
        break;

      case 'unsuspend':
        const unsuspendSchema = z.object({ reason: z.string().min(1) });
        const { reason } = unsuspendSchema.parse(data);
        result = await unsuspendUser(auth.userId, params.userId, reason, ipAddress);
        break;

      case 'verify':
        result = await verifyUser(auth.userId, params.userId, ipAddress);
        break;

      case 'adjustBalance':
        const balanceSchema = z.object({
          amount: z.number(),
          reason: z.string().min(1),
        });
        const balanceData = balanceSchema.parse(data);
        result = await adjustTokenBalance(
          auth.userId,
          params.userId,
          balanceData.amount,
          balanceData.reason,
          ipAddress
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Prevent self-deletion
    if (auth.userId === params.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    await deleteUser(auth.userId, params.userId, ipAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    );
  }
}
