/**
 * Admin Agent Checkpoints API
 * List pending checkpoints for admin review
 */

import { CheckpointType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { listPendingCheckpoints } from '@/lib/agents/checkpoint-manager';
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
 * GET /api/admin/agent-checkpoints - List pending checkpoints (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await checkAdminAccess();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const checkpointType = searchParams.get('checkpointType') as CheckpointType | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const checkpoints = await listPendingCheckpoints({
      limit,
      offset,
      checkpointType: checkpointType || undefined,
    });

    return NextResponse.json({
      success: true,
      checkpoints,
      pagination: {
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('[API] Error listing pending checkpoints:', error);
    return NextResponse.json({ error: 'Failed to list pending checkpoints' }, { status: 500 });
  }
}
