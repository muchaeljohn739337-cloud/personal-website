import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import { getOrCreateUserRewards, TIER_CONFIG } from '@/lib/rewards';

// GET /api/rewards - Get user's rewards profile
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rewards = await getOrCreateUserRewards(session.user.id);

    // Get available rewards
    const availableRewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Get all achievements
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      profile: {
        totalPoints: rewards.totalPoints,
        currentTier: rewards.currentTier,
        tierMultiplier: Number(rewards.tierMultiplier),
        currentStreak: rewards.currentStreak,
        longestStreak: rewards.longestStreak,
        lastCheckIn: rewards.lastCheckIn,
        totalRewardsClaimed: rewards.totalRewardsClaimed,
        totalAchievements: rewards.totalAchievements,
      },
      tierConfig: TIER_CONFIG,
      achievements: achievements.map((a) => {
        const userAchievement = rewards.achievements.find((ua) => ua.achievementId === a.id);
        return {
          ...a,
          progress: userAchievement?.progress || 0,
          completed: userAchievement?.completed || false,
          claimed: userAchievement?.claimed || false,
        };
      }),
      availableRewards,
      recentClaims: rewards.claimedRewards,
    });
  } catch (error) {
    console.error('Rewards error:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}
