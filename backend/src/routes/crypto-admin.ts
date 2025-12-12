import { Router } from "express";
import { Server } from "socket.io";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import { serializeDecimal, serializeDecimalFields } from "../utils/decimal";

const router = Router();
let io: Server;

export function setCryptoAdminSocketIO(socketIO: Server) {
  io = socketIO;
}

// Get pending deposits/withdrawals
router.get("/pending", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [deposits, withdrawals] = await Promise.all([
      prisma.crypto_deposits.findMany({
        where: { status: "PENDING" },
        include: { user: { select: { id: true, email: true, name: true, tier: true, kycStatus: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.crypto_withdrawals.findMany({
        where: { status: "PENDING", requiresApproval: true },
        include: { user: { select: { id: true, email: true, name: true, tier: true, kycStatus: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      deposits: deposits.map((d) => serializeDecimalFields(d)),
      withdrawals: withdrawals.map((w) => serializeDecimalFields(w)),
    });
  } catch (error) {
    console.error("Get pending transactions error:", error);
    res.status(500).json({ error: "Failed to fetch pending transactions" });
  }
});

// Approve deposit
router.post("/deposits/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;
  const { notes } = req.body;

  try {
    const deposit = await prisma.crypto_deposits.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!deposit || deposit.status !== "PENDING") {
      return res.status(400).json({ error: "Invalid deposit" });
    }

    // Update deposit status
    await prisma.crypto_deposits.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Credit user crypto balance
    await prisma.user_crypto_balances.upsert({
      where: {
        userId_currency: {
          userId: deposit.userId,
          currency: deposit.currency,
        },
      },
      update: {
        balance: { increment: deposit.amount },
      },
      create: {
        userId: deposit.userId,
        currency: deposit.currency,
        balance: deposit.amount,
      },
    });

    // Create ledger entry
    await prisma.crypto_ledger.create({
      data: {
        userId: deposit.userId,
        type: "DEPOSIT",
        amount: deposit.amount,
        currency: deposit.currency,
        txHash: deposit.txHash,
        actorId: adminId,
        status: "APPROVED",
      },
    });

    // Create audit log
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: "CRYPTO_DEPOSIT_APPROVED",
        resourceType: "CryptoDeposit",
        resourceId: id,
        details: {
          depositId: id,
          amount: serializeDecimal(deposit.amount),
          currency: deposit.currency,
          userId: deposit.userId,
          notes,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    // Notify user
    if (io) {
      io.to(`user-${deposit.userId}`).emit("crypto-deposit-approved", {
        depositId: id,
        amount: serializeDecimal(deposit.amount),
        currency: deposit.currency,
        message: "Deposit successful ✅ Funds are available",
      });
    }

    res.json({ message: "Deposit approved" });
  } catch (error) {
    console.error("Approve deposit error:", error);
    res.status(500).json({ error: "Failed to approve deposit" });
  }
});

// Reject deposit
router.post("/deposits/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Rejection reason required" });
  }

  try {
    const deposit = await prisma.crypto_deposits.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!deposit || deposit.status !== "PENDING") {
      return res.status(400).json({ error: "Invalid deposit" });
    }

    // Update deposit status
    await prisma.crypto_deposits.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Create audit log
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: "CRYPTO_DEPOSIT_REJECTED",
        resourceType: "CryptoDeposit",
        resourceId: id,
        details: {
          depositId: id,
          amount: serializeDecimal(deposit.amount),
          currency: deposit.currency,
          userId: deposit.userId,
          reason,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    // Notify user
    if (io) {
      io.to(`user-${deposit.userId}`).emit("crypto-deposit-rejected", {
        depositId: id,
        amount: serializeDecimal(deposit.amount),
        currency: deposit.currency,
        reason,
        message: "Deposit was rejected ⚠️ Please contact support",
      });
    }

    res.json({ message: "Deposit rejected" });
  } catch (error) {
    console.error("Reject deposit error:", error);
    res.status(500).json({ error: "Failed to reject deposit" });
  }
});

// Approve withdrawal
router.post("/withdrawals/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;

  try {
    const withdrawal = await prisma.crypto_withdrawals.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    // Execute blockchain transaction
    const txHash = await executeBlockchainTransaction(
      withdrawal.currency,
      withdrawal.sourceWallet,
      withdrawal.destinationWallet,
      withdrawal.amount.toString()
    );

    // Update withdrawal
    await prisma.crypto_withdrawals.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        txHash,
      },
    });

    // Create ledger entry
    await prisma.crypto_ledger.create({
      data: {
        userId: withdrawal.userId,
        type: "WITHDRAWAL",
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        txHash,
        actorId: adminId,
        status: "APPROVED",
      },
    });

    // Create audit log
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: "CRYPTO_WITHDRAWAL_APPROVED",
        resourceType: "CryptoWithdrawal",
        resourceId: id,
        details: {
          withdrawalId: id,
          amount: serializeDecimal(withdrawal.amount),
          currency: withdrawal.currency,
          userId: withdrawal.userId,
          txHash,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    // Notify user
    if (io) {
      io.to(`user-${withdrawal.userId}`).emit("crypto-withdrawal-approved", {
        withdrawalId: id,
        amount: serializeDecimal(withdrawal.amount),
        currency: withdrawal.currency,
        txHash,
        message: "Withdrawal successful ✅ Funds have been sent",
      });
    }

    res.json({ message: "Withdrawal approved", txHash });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ error: "Failed to approve withdrawal" });
  }
});

// Reject withdrawal
router.post("/withdrawals/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user!.userId;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: "Rejection reason required" });
  }

  try {
    const withdrawal = await prisma.crypto_withdrawals.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal || withdrawal.status !== "PENDING") {
      return res.status(400).json({ error: "Invalid withdrawal" });
    }

    // Update withdrawal status
    await prisma.crypto_withdrawals.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Refund to user balance
    await prisma.user_crypto_balances.update({
      where: {
        userId_currency: {
          userId: withdrawal.userId,
          currency: withdrawal.currency,
        },
      },
      data: {
        balance: {
          increment: withdrawal.totalAmount,
        },
      },
    });

    // Create audit log
    await prisma.audit_logs.create({
      data: {
        userId: adminId,
        action: "CRYPTO_WITHDRAWAL_REJECTED",
        resourceType: "CryptoWithdrawal",
        resourceId: id,
        details: {
          withdrawalId: id,
          amount: serializeDecimal(withdrawal.amount),
          currency: withdrawal.currency,
          userId: withdrawal.userId,
          reason,
        },
        ipAddress: req.ip || "unknown",
      },
    });

    // Notify user
    if (io) {
      io.to(`user-${withdrawal.userId}`).emit("crypto-withdrawal-rejected", {
        withdrawalId: id,
        amount: serializeDecimal(withdrawal.amount),
        currency: withdrawal.currency,
        reason,
        message: "Your withdrawal was rejected ⚠️ Try again later",
      });
    }

    res.json({ message: "Withdrawal rejected" });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ error: "Failed to reject withdrawal" });
  }
});

// Get crypto statistics
router.get("/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [depositStats, withdrawalStats] = await Promise.all([
      prisma.crypto_deposits.groupBy({
        by: ["status", "currency"],
        _count: true,
        _sum: { amount: true },
      }),
      prisma.crypto_withdrawals.groupBy({
        by: ["status", "currency"],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    const pendingCount = await prisma.$transaction([
      prisma.crypto_deposits.count({ where: { status: "PENDING" } }),
      prisma.crypto_withdrawals.count({ where: { status: "PENDING", requiresApproval: true } }),
    ]);

    res.json({
      deposits: depositStats.map((s) => ({
        status: s.status,
        currency: s.currency,
        count: s._count,
        totalAmount: serializeDecimal(s._sum.amount || 0),
      })),
      withdrawals: withdrawalStats.map((s) => ({
        status: s.status,
        currency: s.currency,
        count: s._count,
        totalAmount: serializeDecimal(s._sum.amount || 0),
      })),
      pendingDeposits: pendingCount[0],
      pendingWithdrawals: pendingCount[1],
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Helper: Execute blockchain transaction (placeholder)
async function executeBlockchainTransaction(
  currency: string,
  from: string,
  to: string,
  amount: string
): Promise<string> {
  // In production: Use ethers.js, bitcoinjs-lib, etc.
  // For now, return mock tx hash
  return "0x" + Math.random().toString(16).substr(2, 64);
}

export default router;
