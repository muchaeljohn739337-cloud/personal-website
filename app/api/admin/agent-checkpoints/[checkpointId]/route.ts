/**
 * Admin Agent Checkpoint Actions API
 * Approve or reject specific checkpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  approveCheckpoint,
  getCheckpoint,
  rejectCheckpoint,
} from '@/lib/agents/checkpoint-manager';
import { addCheckpointActionBreadcrumb } from '@/lib/agents/sentry-helpers';
import { prisma } from '@/lib/prismaClient';

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
    return { error: 'Admin access required', status: 403 };
  }

  return { userId: session.user.id };
}

/**
 * POST /api/admin/agent-checkpoints/[checkpointId]/approve - Approve checkpoint
 */
export async function POST(req: NextRequest, { params }: { params: { checkpointId: string } }) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { checkpointId } = params;

    // Get checkpoint
    const checkpoint = await getCheckpoint(checkpointId);
    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    if (checkpoint.status !== 'PENDING') {
      return NextResponse.json({ error: 'Checkpoint is not pending' }, { status: 400 });
    }

    // Approve checkpoint
    const updated = await approveCheckpoint(checkpointId, auth.userId);

    // Add Sentry breadcrumb
    addCheckpointActionBreadcrumb(updated, 'approved', auth.userId);

    return NextResponse.json({
      success: true,
      checkpoint: updated,
      message: 'Checkpoint approved successfully',
    });
  } catch (error) {
    console.error('[API] Error approving checkpoint:', error);
    return NextResponse.json({ error: 'Failed to approve checkpoint' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/agent-checkpoints/[checkpointId] - Reject checkpoint
 */
export async function DELETE(req: NextRequest, { params }: { params: { checkpointId: string } }) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { checkpointId } = params;
    const body = await req.json().catch(() => ({}));
    const rejectionReason = body.reason || 'Rejected by admin';

    // Get checkpoint
    const checkpoint = await getCheckpoint(checkpointId);
    if (!checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    if (checkpoint.status !== 'PENDING') {
      return NextResponse.json({ error: 'Checkpoint is not pending' }, { status: 400 });
    }

    // Reject checkpoint
    const updated = await rejectCheckpoint(checkpointId, auth.userId, rejectionReason);

    // Add Sentry breadcrumb
    addCheckpointActionBreadcrumb(updated, 'rejected', auth.userId);

    return NextResponse.json({
      success: true,
      checkpoint: updated,
      message: 'Checkpoint rejected successfully',
    });
  } catch (error) {
    console.error('[API] Error rejecting checkpoint:', error);
    return NextResponse.json({ error: 'Failed to reject checkpoint' }, { status: 500 });
  }
}
