import { prisma } from './prismaClient';
import { addTokens, TIER_CONFIG, TierName } from './tokens';

// Get or create user rewards profile
export async function getOrCreateUserRewards(userId: string) {
  let rewards = await prisma.userRewards.findUnique({
    where: { userId },
    include: {
      achievements: {
        include: { achievement: true },
        orderBy: { createdAt: 'desc' },
      },
      claimedRewards: {
        include: { reward: true },
        orderBy: { claimedAt: 'desc' },
        take: 10,
      },
      milestones: {
        include: { milestone: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!rewards) {
    rewards = await prisma.userRewards.create({
      data: { userId },
      include: {
        achievements: {
          include: { achievement: true },
        },
        claimedRewards: {
          include: { reward: true },
        },
        milestones: {
          include: { milestone: true },
        },
      },
    });
  }

  return rewards;
}

// Add points to user
export async function addPoints(userId: string, points: number, reason?: string) {
  const rewards = await getOrCreateUserRewards(userId);
  const newTotal = rewards.totalPoints + points;

  // Check for tier upgrade
  const currentTier = rewards.currentTier as TierName;
  const newTier = calculateTier(newTotal);
  const tierUpgraded = newTier !== currentTier;

  const updated = await prisma.userRewards.update({
    where: { userId },
    data: {
      totalPoints: newTotal,
      currentTier: newTier,
      tierMultiplier: TIER_CONFIG[newTier].multiplier,
    },
  });

  // Award tier bonus if upgraded
  if (tierUpgraded) {
    const tierBonus = 100 * TIER_CONFIG[newTier].multiplier;
    await addTokens(userId, tierBonus, 'TIER_BONUS', `Tier upgrade to ${newTier}`);

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Tier Upgraded!',
        message: `Congratulations! You've reached ${TIER_CONFIG[newTier].name} tier and earned ${tierBonus} ADV tokens!`,
        data: { tier: newTier, bonus: tierBonus },
      },
    });
  }

  return { rewards: updated, tierUpgraded, newTier };
}

// Calculate tier based on points
export function calculateTier(points: number): TierName {
  if (points >= TIER_CONFIG.DIAMOND.points) return 'DIAMOND';
  if (points >= TIER_CONFIG.PLATINUM.points) return 'PLATINUM';
  if (points >= TIER_CONFIG.GOLD.points) return 'GOLD';
  if (points >= TIER_CONFIG.SILVER.points) return 'SILVER';
  return 'BRONZE';
}

// Daily check-in for streak
export async function dailyCheckIn(userId: string) {
  const rewards = await getOrCreateUserRewards(userId);
  const now = new Date();
  const lastCheckIn = rewards.lastCheckIn;

  // Check if already checked in today
  if (lastCheckIn) {
    const lastCheckInDate = new Date(lastCheckIn);
    if (
      lastCheckInDate.getFullYear() === now.getFullYear() &&
      lastCheckInDate.getMonth() === now.getMonth() &&
      lastCheckInDate.getDate() === now.getDate()
    ) {
      return { success: false, message: 'Already checked in today', rewards };
    }

    // Check if streak is broken (more than 48 hours)
    const hoursSinceLastCheckIn = (now.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastCheckIn > 48) {
      // Reset streak
      await prisma.userRewards.update({
        where: { userId },
        data: { currentStreak: 0 },
      });
    }
  }

  // Calculate streak bonus
  const newStreak = rewards.currentStreak + 1;
  let streakBonus = 10; // Base bonus

  if (newStreak <= 7) {
    streakBonus = 10 * newStreak;
  } else if (newStreak <= 14) {
    streakBonus = 15 * newStreak;
  } else {
    streakBonus = 20 * newStreak;
  }

  // Apply tier multiplier
  const tierMultiplier = Number(rewards.tierMultiplier);
  const finalBonus = Math.floor(streakBonus * tierMultiplier);

  // Update rewards
  const updated = await prisma.userRewards.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, rewards.longestStreak),
      lastCheckIn: now,
    },
  });

  // Add tokens
  await addTokens(userId, finalBonus, 'STREAK_BONUS', `Day ${newStreak} streak bonus`);

  // Add points
  await addPoints(userId, newStreak * 5);

  return {
    success: true,
    streak: newStreak,
    tokensEarned: finalBonus,
    pointsEarned: newStreak * 5,
    rewards: updated,
  };
}

// Claim a reward
export async function claimReward(userId: string, rewardId: string) {
  const rewards = await getOrCreateUserRewards(userId);
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });

  if (!reward || !reward.isActive) {
    throw new Error('Reward not found or inactive');
  }

  // Check tier requirement
  if (reward.requiredTier) {
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
    const userTierIndex = tierOrder.indexOf(rewards.currentTier);
    const requiredTierIndex = tierOrder.indexOf(reward.requiredTier);
    if (userTierIndex < requiredTierIndex) {
      throw new Error(`Requires ${reward.requiredTier} tier or higher`);
    }
  }

  // Check points requirement
  if (rewards.totalPoints < reward.requiredPoints) {
    throw new Error(`Requires ${reward.requiredPoints} points`);
  }

  // Check cooldown
  if (reward.claimCooldown) {
    const lastClaim = await prisma.claimedReward.findFirst({
      where: { userId, rewardId },
      orderBy: { claimedAt: 'desc' },
    });

    if (lastClaim) {
      const hoursSinceClaim = (Date.now() - lastClaim.claimedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceClaim < reward.claimCooldown) {
        const hoursRemaining = Math.ceil(reward.claimCooldown - hoursSinceClaim);
        throw new Error(`Can claim again in ${hoursRemaining} hours`);
      }
    }
  }

  // Check max claims
  if (reward.maxClaims) {
    const claimCount = await prisma.claimedReward.count({
      where: { userId, rewardId },
    });
    if (claimCount >= reward.maxClaims) {
      throw new Error('Maximum claims reached');
    }
  }

  // Apply tier multiplier to token reward
  const tierMultiplier = Number(rewards.tierMultiplier);
  const tokenAmount = Number(reward.tokenAmount) * tierMultiplier;

  // Create claim record
  const claim = await prisma.claimedReward.create({
    data: {
      userId,
      rewardId,
      tokenAmount,
      pointsAmount: reward.pointsAmount,
    },
  });

  // Add tokens
  if (tokenAmount > 0) {
    await addTokens(userId, tokenAmount, 'REWARD_CLAIM', `Claimed: ${reward.name}`, {
      rewardId,
    });
  }

  // Add points
  if (reward.pointsAmount > 0) {
    await addPoints(userId, reward.pointsAmount);
  }

  // Update stats
  await prisma.userRewards.update({
    where: { userId },
    data: {
      totalRewardsClaimed: { increment: 1 },
    },
  });

  return { claim, tokenAmount, pointsAmount: reward.pointsAmount };
}

// Update achievement progress
export async function updateAchievementProgress(
  userId: string,
  achievementSlug: string,
  progress: number
) {
  const achievement = await prisma.achievement.findUnique({
    where: { slug: achievementSlug },
  });

  if (!achievement || !achievement.isActive) {
    return null;
  }

  const rewards = await getOrCreateUserRewards(userId);

  // Get or create user achievement
  let userAchievement = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
  });

  if (!userAchievement) {
    userAchievement = await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        progress: 0,
      },
    });
  }

  // Already completed
  if (userAchievement.completed) {
    return userAchievement;
  }

  // Update progress
  const newProgress = Math.min(progress, achievement.requirement);
  const completed = newProgress >= achievement.requirement;

  const updated = await prisma.userAchievement.update({
    where: { id: userAchievement.id },
    data: {
      progress: newProgress,
      completed,
      completedAt: completed ? new Date() : null,
    },
    include: { achievement: true },
  });

  // If just completed, notify user
  if (completed && !userAchievement.completed) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Achievement Unlocked!',
        message: `You've unlocked "${achievement.name}"! Claim your reward.`,
        data: { achievementId: achievement.id },
      },
    });

    await prisma.userRewards.update({
      where: { userId },
      data: {
        totalAchievements: { increment: 1 },
      },
    });
  }

  return updated;
}

// Claim achievement reward
export async function claimAchievementReward(userId: string, achievementId: string) {
  const userAchievement = await prisma.userAchievement.findFirst({
    where: { userId, achievementId },
    include: { achievement: true },
  });

  if (!userAchievement) {
    throw new Error('Achievement not found');
  }

  if (!userAchievement.completed) {
    throw new Error('Achievement not completed');
  }

  if (userAchievement.claimed) {
    throw new Error('Already claimed');
  }

  const rewards = await getOrCreateUserRewards(userId);
  const tierMultiplier = Number(rewards.tierMultiplier);
  const tokenAmount = Number(userAchievement.achievement.tokenReward) * tierMultiplier;

  // Mark as claimed
  await prisma.userAchievement.update({
    where: { id: userAchievement.id },
    data: {
      claimed: true,
      claimedAt: new Date(),
    },
  });

  // Add tokens
  if (tokenAmount > 0) {
    await addTokens(userId, tokenAmount, 'ACHIEVEMENT', userAchievement.achievement.name, {
      achievementId,
    });
  }

  // Add points
  if (userAchievement.achievement.pointsReward > 0) {
    await addPoints(userId, userAchievement.achievement.pointsReward);
  }

  return {
    tokenAmount,
    pointsAmount: userAchievement.achievement.pointsReward,
  };
}

// Get leaderboard
export async function getLeaderboard(
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME',
  limit: number = 10
) {
  const now = new Date();
  let periodStart: Date;

  switch (period) {
    case 'DAILY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'WEEKLY':
      const dayOfWeek = now.getDay();
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      break;
    case 'MONTHLY':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'ALL_TIME':
    default:
      periodStart = new Date(0);
  }

  const leaderboard = await prisma.leaderboard.findMany({
    where: {
      period,
      periodStart: { gte: periodStart },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { totalPoints: 'desc' },
    take: limit,
  });

  return leaderboard.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
