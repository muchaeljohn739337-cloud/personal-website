import crypto from "crypto";
import { Response, Router } from "express";
import { authenticateToken, AuthRequest, logAdminAction, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

/**
 * Admin Bonus Automation API
 *
 * Endpoints for bulk bonus assignment to user wallets with validation and logging
 */

// POST /api/admin/bonus/bulk-assign
// Bulk assign Trump Coin or MedBed bonuses to multiple users
router.post(
  "/bulk-assign",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userIds, bonusType, amount, currency, description } = req.body;

      // Validation
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          error: "userIds must be a non-empty array",
        });
      }

      if (userIds.length > 1000) {
        return res.status(400).json({
          error: "Maximum 1000 users per bulk operation",
        });
      }

      if (!bonusType || !["TRUMP_COIN", "MEDBED_CREDIT", "USD", "TOKEN"].includes(bonusType)) {
        return res.status(400).json({
          error: "Invalid bonusType. Must be TRUMP_COIN, MEDBED_CREDIT, USD, or TOKEN",
        });
      }

      const bonusAmount = parseFloat(amount);
      if (isNaN(bonusAmount) || bonusAmount <= 0) {
        return res.status(400).json({
          error: "Amount must be a positive number",
        });
      }

      // Verify all users exist
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true, active: true },
      });

      if (users.length !== userIds.length) {
        const foundIds = users.map((u) => u.id);
        const missingIds = userIds.filter((id) => !foundIds.includes(id));
        return res.status(404).json({
          error: "Some users not found",
          missingUserIds: missingIds,
        });
      }

      // Filter out inactive users
      const activeUsers = users.filter((u) => u.active);
      if (activeUsers.length === 0) {
        return res.status(400).json({
          error: "No active users in the provided list",
        });
      }

      const results = {
        successful: [] as any[],
        failed: [] as any[],
        totalAmount: 0,
      };

      // Process each user
      for (const user of activeUsers) {
        try {
          switch (bonusType) {
            case "TRUMP_COIN":
            case "TOKEN":
              // Award to token wallet
              const wallet = await prisma.token_wallets.upsert({
                where: { userId: user.id },
                update: {
                  balance: { increment: bonusAmount },
                  lifetimeEarned: { increment: bonusAmount },
                },
                create: {
                  id: (await import("crypto")).randomUUID(),
                  userId: user.id,
                  balance: bonusAmount,
                  lifetimeEarned: bonusAmount,
                  tokenType: bonusType === "TRUMP_COIN" ? "TRUMP" : "ADVANCIA",
                  updatedAt: new Date(),
                },
              });

              await prisma.token_transactions.create({
                data: {
                  id: (await import("crypto")).randomUUID(),
                  walletId: wallet.id,
                  amount: bonusAmount,
                  type: "bonus",
                  status: "COMPLETED",
                  description: description || `Admin bulk bonus: ${bonusType}`,
                  metadata: JSON.stringify({
                    adminId: req.user?.userId,
                    bonusType,
                  }),
                },
              });
              break;

            case "USD":
              // Award to USD balance
              await prisma.users.update({
                where: { id: user.id },
                data: { usdBalance: { increment: bonusAmount } },
              });

              await prisma.transactions.create({
                data: {
                  id: (await import("crypto")).randomUUID(),
                  userId: user.id,
                  amount: bonusAmount,
                  type: "credit",
                  status: "COMPLETED",
                  description: description || "Admin bulk USD bonus",
                  updatedAt: new Date(),
                },
              });
              break;

            case "MEDBED_CREDIT":
              // Award MedBed credit (stored in user's custom field or wallet)
              // This assumes you have a medBedCredits field or similar
              await prisma.users.update({
                where: { id: user.id },
                data: {
                  // Add custom field handling here
                  usdBalance: { increment: bonusAmount }, // Fallback to USD for now
                },
              });

              await prisma.transactions.create({
                data: {
                  id: (await import("crypto")).randomUUID(),
                  userId: user.id,
                  amount: bonusAmount,
                  type: "credit",
                  status: "COMPLETED",
                  description: description || "Admin MedBed credit bonus",
                  updatedAt: new Date(),
                },
              });
              break;
          }

          results.successful.push({
            userId: user.id,
            email: user.email,
            amount: bonusAmount,
          });
          results.totalAmount += bonusAmount;
        } catch (error) {
          console.error(`Failed to award bonus to user ${user.id}:`, error);
          results.failed.push({
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Note: AdminTransfer logging commented out (model doesn't exist in schema)

      // Create audit log
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: req.user?.userId || "system",
          action: "BULK_BONUS_ASSIGNMENT",
          resourceType: "bonus",
          resourceId: "bulk",
          metadata: JSON.stringify({
            bonusType,
            amount: bonusAmount,
            totalUsers: userIds.length,
            successfulUsers: results.successful.length,
            failedUsers: results.failed.length,
            totalAmount: results.totalAmount,
          }),
          ipAddress: req.ip || "unknown",
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      return res.json({
        success: true,
        message: `Successfully awarded bonuses to ${results.successful.length} users`,
        results: {
          totalUsers: userIds.length,
          activeUsers: activeUsers.length,
          successful: results.successful.length,
          failed: results.failed.length,
          totalAmount: results.totalAmount,
          failedUsers: results.failed,
        },
      });
    } catch (error) {
      console.error("Error in bulk bonus assignment:", error);
      return res.status(500).json({
        error: "Failed to process bulk bonus assignment",
      });
    }
  }
);

// POST /api/admin/bonus/award-single
// Award bonus to a single user with detailed validation
router.post(
  "/award-single",
  authenticateToken as any,
  requireAdmin as any,
  logAdminAction as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, bonusType, amount, currency, description, autoApprove } = req.body;

      // Validation
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      if (!bonusType || !["TRUMP_COIN", "MEDBED_CREDIT", "USD", "TOKEN"].includes(bonusType)) {
        return res.status(400).json({
          error: "Invalid bonusType. Must be TRUMP_COIN, MEDBED_CREDIT, USD, or TOKEN",
        });
      }

      const bonusAmount = parseFloat(amount);
      if (isNaN(bonusAmount) || bonusAmount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }

      // Get user
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          active: true,
          usdBalance: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.active) {
        return res.status(400).json({ error: "Cannot award bonus to inactive user" });
      }

      // Award bonus based on type
      let wallet: any = null;
      let transaction: any = null;

      if (bonusType === "TRUMP_COIN" || bonusType === "TOKEN") {
        wallet = await prisma.token_wallets.upsert({
          where: { userId: user.id },
          update: {
            balance: { increment: bonusAmount },
            lifetimeEarned: { increment: bonusAmount },
          },
          create: {
            id: (await import("crypto")).randomUUID(),
            userId: user.id,
            balance: bonusAmount,
            lifetimeEarned: bonusAmount,
            tokenType: bonusType === "TRUMP_COIN" ? "TRUMP" : "ADVANCIA",
            updatedAt: new Date(),
          },
        });

        transaction = await prisma.token_transactions.create({
          data: {
            id: (await import("crypto")).randomUUID(),
            walletId: wallet.id,
            amount: bonusAmount,
            type: "bonus",
            status: "COMPLETED",
            description: description || `Admin bonus: ${bonusType}`,
          },
        });
      } else {
        // USD or MedBed credit
        await prisma.users.update({
          where: { id: user.id },
          data: { usdBalance: { increment: bonusAmount } },
        });

        transaction = await prisma.transactions.create({
          data: {
            id: (await import("crypto")).randomUUID(),
            userId: user.id,
            amount: bonusAmount,
            type: "credit",
            status: "COMPLETED",
            description: description || `Admin ${bonusType} bonus`,
            updatedAt: new Date(),
          },
        });
      }

      // Create audit log
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: req.user?.userId || "system",
          action: "SINGLE_BONUS_AWARD",
          resourceType: "bonus",
          resourceId: "bulk",
          metadata: {
            targetUserId: user.id,
            targetEmail: user.email,
            bonusType,
            amount: bonusAmount,
            description,
          },
          ipAddress: req.ip || "unknown",
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      return res.json({
        success: true,
        message: `Successfully awarded ${bonusAmount} ${bonusType} to ${user.email}`,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        bonus: {
          type: bonusType,
          amount: bonusAmount,
        },
        wallet: wallet
          ? {
              balance: wallet.balance.toString(),
              lifetimeEarned: wallet.lifetimeEarned.toString(),
            }
          : null,
        transaction: transaction
          ? {
              id: transaction.id,
              status: transaction.status,
              createdAt: transaction.createdAt,
            }
          : null,
      });
    } catch (error) {
      console.error("Error awarding single bonus:", error);
      return res.status(500).json({
        error: "Failed to award bonus",
      });
    }
  }
);

// GET /api/admin/bonus/history
// Get bonus assignment history with pagination
router.get("/history", authenticateToken as any, requireAdmin as any, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [transfers, total] = await Promise.all([
      prisma.admin_transfers.findMany({
        where: {
          source: {
            in: ["admin:bulk-bonus", "admin_bulk_bonus", "admin_medbed_bonus"],
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          adminId: true,
          currency: true,
          amount: true,
          note: true,
          createdAt: true,
        },
      }),
      prisma.admin_transfers.count({
        where: {
          source: {
            in: ["admin:bulk-bonus", "admin_bulk_bonus", "admin_medbed_bonus"],
          },
        },
      }),
    ]);

    return res.json({
      items: transfers.map((t) => ({
        ...t,
        amount: t.amount.toString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching bonus history:", error);
    return res.status(500).json({
      error: "Failed to fetch bonus history",
    });
  }
});

export default router;
