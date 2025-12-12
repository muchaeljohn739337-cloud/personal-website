import { Decimal } from "decimal.js";
import { Router } from "express";
import { Server as SocketServer } from "socket.io";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import { serializeDecimalFields } from "../utils/decimal";

const router = Router();

// Socket.IO instance (injected from index.ts)
let io: SocketServer | null = null;

export function setTokenSocketIO(socketServer: SocketServer) {
  io = socketServer;
  console.log("✅ Socket.IO injected into token service");
}

router.get("/balance/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;

    let wallet = await prisma.token_wallets.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.token_wallets.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          userId,
        },
      });
    }

    res.json(serializeDecimalFields(wallet));
  } catch (error: any) {
    console.error("[TOKENS] Error fetching balance:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

router.get("/history/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const wallet = await prisma.token_wallets.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.json({ transactions: [], total: 0 });
    }

    const [transactions, total] = await Promise.all([
      prisma.token_transactions.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.token_transactions.count({
        where: { walletId: wallet.id },
      }),
    ]);

    res.json({
      transactions: transactions.map((t: any) => serializeDecimalFields(t)),
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[TOKENS] Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
});

router.post("/transfer", authenticateToken as any, async (req, res) => {
  try {
    const { fromUserId, toUserId, amount, description } = req.body;

    if (!fromUserId || !toUserId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transferAmount = new Decimal(amount);

    if (transferAmount.lte(0)) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      let fromWallet = await tx.token_wallets.findUnique({
        where: { userId: fromUserId },
      });

      if (!fromWallet) {
        fromWallet = await tx.token_wallets.create({
          data: {
            id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
            updatedAt: new Date(),
            userId: fromUserId,
          },
        });
      }

      if (fromWallet.balance.lt(transferAmount)) {
        throw new Error("Insufficient balance");
      }

      let toWallet = await tx.token_wallets.findUnique({
        where: { userId: toUserId },
      });

      if (!toWallet) {
        toWallet = await tx.token_wallets.create({
          data: {
            id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
            updatedAt: new Date(),
            userId: toUserId,
          },
        });
      }

      await tx.token_wallets.update({
        where: { id: fromWallet.id },
        data: { balance: { decrement: transferAmount } },
      });

      await tx.token_wallets.update({
        where: { id: toWallet.id },
        data: {
          balance: { increment: transferAmount },
          lifetimeEarned: { increment: transferAmount },
        },
      });

      const fromTx = await tx.token_transactions.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          walletId: fromWallet.id,
          amount: transferAmount.neg(),
          type: "transfer",
          status: "COMPLETED",
          description: description || `Transfer to ${toUserId}`,
          toAddress: toUserId,
          metadata: JSON.stringify({
            toUserId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      const toTx = await tx.token_transactions.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          walletId: toWallet.id,
          amount: transferAmount,
          type: "transfer",
          status: "COMPLETED",
          description: description || `Transfer from ${fromUserId}`,
          fromAddress: fromUserId,
          metadata: JSON.stringify({
            fromUserId,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return { fromTx, toTx, fromWallet, toWallet };
    });

    // Emit Socket.IO events to notify users
    if (io) {
      io.to(`user-${fromUserId}`).emit("token:transfer", {
        type: "sent",
        amount: transferAmount.toString(),
        to: toUserId,
        transaction_id: result.fromTx.id,
      });

      io.to(`user-${toUserId}`).emit("token:transfer", {
        type: "received",
        amount: transferAmount.toString(),
        from: fromUserId,
        transaction_id: result.toTx.id,
      });
    }

    res.json({
      success: true,
      transaction_id: result.fromTx.id,
      message: "Transfer completed successfully",
    });
  } catch (error: any) {
    console.error("[TOKENS] Error processing transfer:", error);
    res.status(500).json({ error: error.message || "Failed to process transfer" });
  }
});

// Withdraw tokens to a blockchain address
router.post("/withdraw", authenticateToken as any, async (req, res) => {
  try {
    const { userId, amount, toAddress } = req.body;

    if (!userId || !amount || !toAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const withdrawAmount = new Decimal(amount);

    if (withdrawAmount.lte(0)) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    // Validate address format (basic check)
    if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: "Invalid blockchain address" });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      let wallet = await tx.token_wallets.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.balance.lt(withdrawAmount)) {
        throw new Error("Insufficient balance for withdrawal");
      }

      // Deduct from wallet
      await tx.token_wallets.update({
        where: { id: wallet.id },
        data: { balance: { decrement: withdrawAmount } },
      });

      // Record transaction
      const transaction = await tx.token_transactions.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          walletId: wallet.id,
          amount: withdrawAmount.neg(),
          type: "withdraw",
          status: "PENDING",
          description: `Withdrawal to ${toAddress.substring(0, 10)}...`,
          toAddress: toAddress,
          metadata: JSON.stringify({
            toAddress,
            withdrawnAt: new Date().toISOString(),
          }),
        },
      });

      return transaction;
    });

    // Emit Socket.IO event
    if (io) {
      io.to(`user-${userId}`).emit("token:withdrawn", {
        amount: withdrawAmount.toString(),
        toAddress,
        transaction_id: result.id,
        status: "PENDING",
      });
    }

    res.json({
      success: true,
      transaction_id: result.id,
      amount: withdrawAmount.toString(),
      toAddress,
      status: "PENDING",
      message: "Withdrawal initiated. Processing...",
    });
  } catch (error: any) {
    console.error("[TOKENS] Error processing withdrawal:", error);
    res.status(500).json({ error: error.message || "Failed to process withdrawal" });
  }
});

// Cashout tokens to USD (convert to fiat)
router.post("/cashout", authenticateToken as any, async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const cashoutAmount = new Decimal(amount);
    const conversionRate = new Decimal("0.10"); // 1 token = $0.10 USD

    if (cashoutAmount.lte(0)) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      let wallet = await tx.token_wallets.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.balance.lt(cashoutAmount)) {
        throw new Error("Insufficient balance for cashout");
      }

      const usdValue = cashoutAmount.mul(conversionRate);

      // Deduct tokens
      await tx.token_wallets.update({
        where: { id: wallet.id },
        data: { balance: { decrement: cashoutAmount } },
      });

      // Record cashout transaction
      const transaction = await tx.token_transactions.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          walletId: wallet.id,
          amount: cashoutAmount.neg(),
          type: "cashout",
          status: "COMPLETED",
          description: `Cashed out ${cashoutAmount.toString()} tokens for $${usdValue.toString()}`,
          metadata: JSON.stringify({
            usdValue: usdValue.toString(),
            conversionRate: conversionRate.toString(),
            cashedOutAt: new Date().toISOString(),
          }),
        },
      });

      return { transaction, usdValue };
    });

    // Emit Socket.IO event
    if (io) {
      io.to(`user-${userId}`).emit("token:cashout", {
        tokensSpent: cashoutAmount.toString(),
        usdReceived: result.usdValue.toString(),
        transaction_id: result.transaction.id,
      });
    }

    res.json({
      success: true,
      transaction_id: result.transaction.id,
      tokensSpent: cashoutAmount.toString(),
      usdReceived: result.usdValue.toString(),
      message: `Successfully cashed out $${result.usdValue.toString()}!`,
    });
  } catch (error: any) {
    console.error("[TOKENS] Error processing cashout:", error);
    res.status(500).json({ error: error.message || "Failed to process cashout" });
  }
});

// ========================================
// ADMIN ENDPOINTS - Token Statistics & Management
// ========================================

// GET /api/tokens/admin/stats - Get overall token statistics
router.get("/admin/stats", async (req, res) => {
  try {
    // Get all wallets
    const wallets = await prisma.token_wallets.findMany({
      select: {
        balance: true,
        lockedBalance: true,
      },
    });

    const totalSupply = wallets.reduce(
      (sum: Decimal, w: any) => sum.add(w.balance).add(w.lockedBalance),
      new Decimal(0)
    );

    const totalInCirculation = wallets.reduce((sum: Decimal, w: any) => sum.add(w.balance), new Decimal(0));

    const totalLocked = wallets.reduce((sum: Decimal, w: any) => sum.add(w.lockedBalance), new Decimal(0));

    // Get active users (users with token balance > 0)
    const activeUsers = wallets.filter((w: any) => w.balance.gt(0)).length;

    // Get total transactions
    const totalTransactions = await prisma.token_transactions.count();

    res.json({
      totalSupply: totalSupply.toString(),
      totalInCirculation: totalInCirculation.toString(),
      totalLocked: totalLocked.toString(),
      activeUsers,
      totalTransactions,
      conversionRate: "0.10", // 1 token = $0.10 USD
    });
  } catch (error: any) {
    console.error("[TOKENS] Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch token statistics" });
  }
});

// GET /api/tokens/admin/recent-activity - Get recent token transactions
router.get("/admin/recent-activity", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const transactions = await prisma.token_transactions.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get wallet and user info for each transaction
    const activities = await Promise.all(
      transactions.map(async (tx: any) => {
        const wallet = await prisma.token_wallets.findUnique({
          where: { id: tx.walletId },
          select: { userId: true },
        });

        let userEmail = "Unknown";
        if (wallet) {
          const user = await prisma.users.findUnique({
            where: { id: wallet.userId },
            select: { email: true },
          });
          userEmail = user?.email || "Unknown";
        }

        return {
          id: tx.id,
          type: tx.type,
          userId: wallet?.userId || "N/A",
          userEmail,
          amount: tx.amount.toString(),
          status: tx.status,
          timestamp: tx.createdAt,
        };
      })
    );

    res.json({
      activities,
      count: activities.length,
    });
  } catch (error: any) {
    console.error("[TOKENS] Error fetching recent activity:", error);
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
});

// GET /api/tokens/admin/top-holders - Get top token holders
router.get("/admin/top-holders", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 10);

    const wallets = await prisma.token_wallets.findMany({
      orderBy: { balance: "desc" },
      take: limit,
    });

    const holders = await Promise.all(
      wallets
        .filter((w: any) => w.balance.gt(0))
        .map(async (wallet: any) => {
          const user = await prisma.users.findUnique({
            where: { id: wallet.userId },
            select: { email: true, username: true },
          });

          return {
            userId: wallet.userId,
            userEmail: user?.email || "Unknown",
            username: user?.username || "N/A",
            balance: wallet.balance.toString(),
            lifetimeEarned: wallet.lifetimeEarned.toString(),
          };
        })
    );

    res.json({
      holders,
      count: holders.length,
    });
  } catch (error: any) {
    console.error("[TOKENS] Error fetching top holders:", error);
    res.status(500).json({ error: "Failed to fetch top holders" });
  }
});

export default router;
