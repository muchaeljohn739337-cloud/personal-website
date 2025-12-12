/**
 * Slack Integration Status Route
 * Checks if Slack is connected for the current user
 */

import { prisma } from '@/lib/prismaClient';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: 'slack',
        },
      },
    });

    const config = integration?.config as Record<string, unknown> | null;
    return NextResponse.json({
      connected: !!integration && integration.isActive,
      teamName: config?.teamName as string | undefined,
      teamId: config?.teamId as string | undefined,
    });
  } catch (error) {
    console.error('[Slack Status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
