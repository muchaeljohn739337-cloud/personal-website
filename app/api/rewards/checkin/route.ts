import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { dailyCheckIn } from '@/lib/rewards';

// POST /api/rewards/checkin - Daily check-in for streak bonus
export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await dailyCheckIn(session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      streak: result.streak,
      tokensEarned: result.tokensEarned,
      pointsEarned: result.pointsEarned,
      message: `Day ${result.streak} streak! Earned ${result.tokensEarned} ADV tokens.`,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
