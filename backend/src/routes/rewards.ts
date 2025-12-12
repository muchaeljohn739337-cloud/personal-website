import crypto from "crypto";
import { Decimal } from "decimal.js";
import { Router } from "express";
import type { Server as IOServer } from "socket.io";
import { logAdminAction } from "../middleware/auditLog";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

let ioRef: IOServer | null = null;
export function setRewardSocketIO(io: IOServer) {
  ioRef = io;
}

router.get("/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type } = req.query;

    const where: any = { userId };
    if (status) where.status = status as string;
    if (type) where.type = type as string;

    const rewards = await prisma.rewards.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const total = rewards.reduce((sum: Decimal, r: any) => sum.add(r.amount), new Decimal(0));

    res.json({
      rewards: rewards.map((r: any) => ({
        ...r,
        amount: r.amount.toString(),
      })),
      summary: {
        total: total.toString(),
        pending: rewards.filter((r: any) => r.status === "PENDING").length,
        claimed: rewards.filter((r: any) => r.status === "CLAIMED").length,
        expired: rewards.filter((r: any) => r.status === "EXPIRED").length,
      },
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching rewards:", error);
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
});

router.post("/claim/:rewardId", authenticateToken as any, async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { userId } = req.body;

    const reward = await prisma.rewards.findUnique({
      where: { id: rewardId },
    });

    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }

    if (reward.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (reward.status !== "PENDING") {
      return res.status(400).json({ error: `Reward is ${reward.status}, cannot claim` });
    }

    if (reward.expiresAt && new Date() > reward.expiresAt) {
      await prisma.rewards.update({
        where: { id: rewardId },
        data: { status: "EXPIRED" },
      });
      return res.status(400).json({ error: "Reward has expired" });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const claimedReward = await tx.reward.update({
        where: { id: rewardId },
        data: {
          status: "CLAIMED",
          claimedAt: new Date(),
        },
      });

      let wallet = await tx.tokenWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        wallet = await tx.tokenWallet.create({
          data: { userId },
        });
      }

      await tx.tokenWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: reward.amount },
          lifetimeEarned: { increment: reward.amount },
        },
      });

      await tx.tokenTransaction.create({
        data: {
          walletId: wallet.id,
          amount: reward.amount,
          type: "earn",
          status: "COMPLETED",
          description: `Claimed reward: ${reward.description}`,
          metadata: JSON.stringify({
            rewardId: reward.id,
            rewardType: reward.type,
            claimedAt: new Date().toISOString(),
          }),
        },
      });

      return claimedReward;
    });

    res.json({
      success: true,
      reward: {
        ...result,
        amount: result.amount.toString(),
      },
      message: "Reward claimed successfully!",
    });
  } catch (error: any) {
    console.error("[REWARDS] Error claiming reward:", error);
    res.status(500).json({ error: "Failed to claim reward" });
  }
});

router.get("/tier/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;

    let tier = await prisma.user_tiers.findUnique({
      where: { userId },
    });

    if (!tier) {
      tier = await prisma.user_tiers.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          userId,
          currentTier: "bronze",
          points: 0,
        },
      });
    }

    const tierThresholds = {
      bronze: { next: "silver", pointsNeeded: 1000 },
      silver: { next: "gold", pointsNeeded: 5000 },
      gold: { next: "platinum", pointsNeeded: 15000 },
      platinum: { next: "diamond", pointsNeeded: 50000 },
      diamond: { next: null, pointsNeeded: null },
    };

    const currentTierInfo = tierThresholds[tier.currentTier as keyof typeof tierThresholds];
    const nextTierProgress = currentTierInfo.pointsNeeded ? (tier.points / currentTierInfo.pointsNeeded) * 100 : 100;

    res.json({
      tier: {
        ...tier,
        lifetimeRewards: tier.lifetimeRewards.toString(),
      },
      nextTier: currentTierInfo.next,
      pointsToNextTier: currentTierInfo.pointsNeeded ? currentTierInfo.pointsNeeded - tier.points : 0,
      progress: Math.min(nextTierProgress, 100),
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching tier:", error);
    res.status(500).json({ error: "Failed to fetch tier information" });
  }
});

router.post("/tier/points", authenticateToken as any, async (req, res) => {
  try {
    const { userId, points } = req.body;

    if (!userId || points === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let tier = await prisma.user_tiers.findUnique({
      where: { userId },
    });

    if (!tier) {
      tier = await prisma.user_tiers.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          userId,
          points: 0,
        },
      });
    }

    const newPoints = tier.points + points;

    let newTier = "bronze";
    if (newPoints >= 50000) newTier = "diamond";
    else if (newPoints >= 15000) newTier = "platinum";
    else if (newPoints >= 5000) newTier = "gold";
    else if (newPoints >= 1000) newTier = "silver";

    const tierChanged = newTier !== tier.currentTier;

    const updatedTier = await prisma.user_tiers.update({
      where: { userId },
      data: {
        points: newPoints,
        lifetimePoints: { increment: points },
        currentTier: newTier,
      },
    });

    if (tierChanged) {
      const bonusAmount = new Decimal(
        newTier === "diamond"
          ? 1000
          : newTier === "platinum"
            ? 500
            : newTier === "gold"
              ? 200
              : newTier === "silver"
                ? 50
                : 0
      );

      if (bonusAmount.gt(0)) {
        await prisma.rewards.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            type: "milestone",
            amount: bonusAmount,
            title: `${newTier.toUpperCase()} Tier Achieved!`,
            description: `Congratulations! You've reached ${newTier.toUpperCase()} tier!`,
            status: "PENDING",
          },
        });
      }
    }

    res.json({
      success: true,
      tier: {
        ...updatedTier,
        lifetimeRewards: updatedTier.lifetimeRewards.toString(),
      },
      tierChanged,
      message: tierChanged
        ? `Congratulations! You've reached ${newTier.toUpperCase()} tier!`
        : `${points} points added`,
    });
  } catch (error: any) {
    console.error("[REWARDS] Error updating tier points:", error);
    res.status(500).json({ error: "Failed to update tier points" });
  }
});

// Get pending rewards for a user
router.get("/pending/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;

    const rewards = await prisma.rewards.findMany({
      where: {
        userId,
        status: "PENDING",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    });

    const total = rewards.reduce((sum: Decimal, r: any) => sum.add(r.amount), new Decimal(0));

    res.json({
      rewards: rewards.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      })),
      summary: {
        total: total.toString(),
        count: rewards.length,
      },
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching pending rewards:", error);
    res.status(500).json({ error: "Failed to fetch pending rewards" });
  }
});

// Get global leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 10);

    const leaderboard = await prisma.user_tiers.findMany({
      orderBy: { points: "desc" },
      take: limit,
    });

    // Get user details for formatted response
    const formatted = await Promise.all(
      leaderboard.map(async (entry: any, index: any) => {
        const user = await prisma.users.findUnique({
          where: { id: entry.userId },
          select: { email: true, firstName: true, lastName: true },
        });

        return {
          rank: index + 1,
          userId: entry.userId,
          userName: user?.firstName || user?.email || "Anonymous",
          points: entry.points,
          tier: entry.currentTier,
          lifetimePoints: entry.lifetimePoints,
        };
      })
    );

    res.json({
      leaderboard: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// ========================================
// ADMIN ENDPOINTS - Reward Management
// ========================================

// POST /api/rewards/admin/send - Admin sends reward to a user
router.post(
  "/admin/send",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req: any, res) => {
    try {
      const { userId, amount, title, description, type, expiresInDays } = req.body;

      if (!userId || !amount || !title) {
        return res.status(400).json({
          error: "Missing required fields: userId, amount, title",
        });
      }

      const rewardAmount = new Decimal(amount);
      if (rewardAmount.lte(0)) {
        return res.status(400).json({
          error: "Amount must be positive",
        });
      }

      // Verify user exists
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate expiry date if specified
      let expiresAt: Date | null = null;
      if (expiresInDays && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      // Create reward
      const reward = await prisma.rewards.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: type || "admin_bonus",
          amount: rewardAmount,
          title,
          description: description || `Reward from admin`,
          status: "PENDING",
          expiresAt,
        },
      });

      // Notify user via socket
      if (ioRef) {
        ioRef.to(`user-${userId}`).emit("reward-received", {
          rewardId: reward.id,
          amount: rewardAmount.toString(),
          title,
          description: description || "",
        });
      }

      // Log audit
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: req.user.userId,
          action: "send_reward",
          resourceType: "reward",
          resourceId: reward.id,
          metadata: JSON.stringify({
            recipientId: userId,
            recipientEmail: user.email,
            amount: rewardAmount.toString(),
            title,
            type: type || "admin_bonus",
          }),
        },
      });

      return res.json({
        success: true,
        message: `Reward sent to ${user.email}`,
        reward: {
          id: reward.id,
          amount: rewardAmount.toString(),
          userId,
          userEmail: user.email,
          title,
          status: reward.status,
        },
      });
    } catch (error: any) {
      console.error("[REWARDS] Error sending admin reward:", error);
      return res.status(500).json({ error: "Failed to send reward" });
    }
  }
);

// POST /api/rewards/admin/bulk-send - Admin sends rewards to multiple users
router.post(
  "/admin/bulk-send",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req: any, res) => {
    try {
      const { userIds, amount, title, description, type, expiresInDays } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          error: "userIds must be a non-empty array",
        });
      }

      if (!amount || !title) {
        return res.status(400).json({
          error: "Missing required fields: amount, title",
        });
      }

      const rewardAmount = new Decimal(amount);
      if (rewardAmount.lte(0)) {
        return res.status(400).json({
          error: "Amount must be positive",
        });
      }

      // Verify users exist
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true },
      });

      if (users.length === 0) {
        return res.status(404).json({ error: "No valid users found" });
      }

      // Calculate expiry date
      let expiresAt: Date | null = null;
      if (expiresInDays && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      // Create rewards for all users
      const rewards = await Promise.all(
        users.map((user: any) =>
          prisma.rewards.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              type: type || "admin_bulk_bonus",
              amount: rewardAmount,
              title,
              description: description || `Bulk reward from admin`,
              status: "PENDING",
              expiresAt,
            },
          })
        )
      );

      // Notify all users via socket
      if (ioRef) {
        for (const user of users) {
          ioRef.to(`user-${user.id}`).emit("reward-received", {
            rewardId: rewards.find((r) => r.userId === user.id)?.id,
            amount: rewardAmount.toString(),
            title,
            description: description || "",
          });
        }
      }

      // Log audit
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: req.user.userId,
          action: "bulk_send_rewards",
          resourceType: "reward",
          resourceId: "bulk",
          metadata: JSON.stringify({
            recipientCount: users.length,
            recipientIds: users.map((u: any) => u.id),
            amount: rewardAmount.toString(),
            title,
            type: type || "admin_bulk_bonus",
            totalValue: rewardAmount.mul(users.length).toString(),
          }),
        },
      });

      return res.json({
        success: true,
        message: `Rewards sent to ${users.length} users`,
        summary: {
          totalRecipients: users.length,
          amountPerUser: rewardAmount.toString(),
          totalValue: rewardAmount.mul(users.length).toString(),
          recipients: users.map((u: any) => ({
            id: u.id,
            email: u.email,
          })),
        },
      });
    } catch (error: any) {
      console.error("[REWARDS] Error bulk sending rewards:", error);
      return res.status(500).json({ error: "Failed to send bulk rewards" });
    }
  }
);

// GET /api/rewards/admin/statistics - Get reward statistics
router.get("/admin/statistics", authenticateToken as any, requireAdmin as any, async (req: any, res) => {
  try {
    const [totalRewards, pendingRewards, claimedRewards, expiredRewards] = await Promise.all([
      prisma.rewards.count(),
      prisma.rewards.count({ where: { status: "PENDING" } }),
      prisma.rewards.count({ where: { status: "CLAIMED" } }),
      prisma.rewards.count({ where: { status: "EXPIRED" } }),
    ]);

    const rewardsData = await prisma.rewards.findMany({
      select: { amount: true, status: true },
    });

    const totalValue = rewardsData.reduce((sum: Decimal, r: any) => sum.add(r.amount), new Decimal(0));

    const claimedValue = rewardsData
      .filter((r: any) => r.status === "CLAIMED")
      .reduce((sum: Decimal, r: any) => sum.add(r.amount), new Decimal(0));

    const pendingValue = rewardsData
      .filter((r: any) => r.status === "PENDING")
      .reduce((sum: Decimal, r: any) => sum.add(r.amount), new Decimal(0));

    return res.json({
      totals: {
        rewards: totalRewards,
        pending: pendingRewards,
        claimed: claimedRewards,
        expired: expiredRewards,
      },
      values: {
        total: totalValue.toString(),
        claimed: claimedValue.toString(),
        pending: pendingValue.toString(),
        claimRate: totalRewards > 0 ? ((claimedRewards / totalRewards) * 100).toFixed(2) : "0.00",
      },
    });
  } catch (error: any) {
    console.error("[REWARDS] Error fetching statistics:", error);
    return res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
