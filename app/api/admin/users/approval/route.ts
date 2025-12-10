import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  approveUser,
  getAllUsers,
  getApprovalStats,
  getPendingUsers,
  rejectUser,
} from '@/lib/auth/user-approval';

// GET - Get pending users and stats
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin (in production, verify role)
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'pending':
        return NextResponse.json({ users: getPendingUsers() });

      case 'all':
        return NextResponse.json({ users: getAllUsers() });

      case 'stats':
        return NextResponse.json({ stats: getApprovalStats() });

      default:
        return NextResponse.json({
          pending: getPendingUsers(),
          stats: getApprovalStats(),
        });
    }
  } catch (error) {
    console.error('User approval GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Approve or reject users
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, reason } = body;
    const adminId = session.user.id;

    switch (action) {
      case 'approve': {
        const user = approveUser(userId, adminId);
        if (user) {
          return NextResponse.json({
            success: true,
            message: `User ${user.email} has been approved`,
            user,
          });
        }
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      case 'reject': {
        const user = rejectUser(userId, adminId, reason);
        if (user) {
          return NextResponse.json({
            success: true,
            message: `User ${user.email} has been rejected`,
            user,
          });
        }
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('User approval POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
