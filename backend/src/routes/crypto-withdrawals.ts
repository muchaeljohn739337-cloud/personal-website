import Decimal from "decimal.js";
import { ethers } from "ethers";
import { Router } from "express";
import { Server } from "socket.io";
import { momAICore } from "../ai/mom-core";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import { serializeDecimal, serializeDecimalFields } from "../utils/decimal";

const router = Router();
let io: Server;

export function setCryptoWithdrawalsSocketIO(socketIO: Server) {
  io = socketIO;
}

// User requests withdrawal
router.post("/", authenticateToken, async (req, res) => {
  const { amount, currency, destinationWallet } = req.body;
  const userId = req.user!.userId;

  if (!amount || !currency || !destinationWallet) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Validate destination wallet format
    if (!isValidWalletAddress(currency, destinationWallet)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    // Check user balance
    const userBalance = await prisma.user_crypto_balances.findUnique({
      where: { userId_currency: { userId, currency } },
    });

    if (!userBalance || userBalance.balance.lt(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Estimate network fee
    const networkFee = await estimateNetworkFee(currency, amount);
    const totalAmount = new Decimal(amount).plus(networkFee);

    if (userBalance.balance.lt(totalAmount)) {
      return res.status(400).json({
        error: "Insufficient balance for amount + network fee",
        networkFee: serializeDecimal(networkFee),
      });
    }

    // Get platform source wallet
    const platformWallet = await getPlatformWallet(currency);

    // Create pending withdrawal
    const withdrawal = await prisma.crypto_withdrawals.create({
      data: {
        userId,
        amount: new Decimal(amount),
        currency,
        destinationWallet,
        sourceWallet: platformWallet.address,
        networkFee: new Decimal(networkFee),
        totalAmount,
        status: "PENDING",
        requiresApproval: shouldRequireApproval(amount, currency),
      },
    });

    // Deduct from available balance (hold)
    await prisma.user_crypto_balances.update({
      where: { userId_currency: { userId, currency } },
      data: {
        balance: {
          decrement: totalAmount,
        },
      },
    });

    // Trigger AI Agent analysis
    analyzeWithdrawalAsync(withdrawal.id).catch((err) => {
      console.error("Crypto agent analysis error:", err);
    });

    // Check if auto-approval (small amounts from trusted users)
    if (!withdrawal.requiresApproval) {
      processWithdrawal(withdrawal.id).catch((err) => {
        console.error("Auto-process withdrawal error:", err);
      });
    } else {
      // Alert admins for approval
      if (io) {
        io.to("admin-room").emit("withdrawal-pending-approval", {
          withdrawalId: withdrawal.id,
          userId,
          amount: serializeDecimal(withdrawal.amount),
          currency,
        });
      }
    }

    // Notify user
    if (io) {
      io.to(`user-${userId}`).emit("crypto-withdrawal-created", {
        withdrawalId: withdrawal.id,
        amount: serializeDecimal(withdrawal.amount),
        currency,
        status: "PENDING",
        message: getUserFriendlyStatus("WITHDRAWAL", "PENDING"),
      });
    }

    res.json({
      success: true,
      withdrawal: serializeDecimalFields(withdrawal),
      message: "Withdrawal request submitted successfully",
      requiresApproval: withdrawal.requiresApproval,
    });
  } catch (error) {
    console.error("Create withdrawal error:", error);
    res.status(500).json({ error: "Failed to create withdrawal" });
  }
});

// Get user withdrawal history
router.get("/history", authenticateToken, async (req, res) => {
  const userId = req.user!.userId;

  try {
    const withdrawals = await prisma.crypto_withdrawals.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      withdrawals: withdrawals.map((w) => serializeDecimalFields(w)),
    });
  } catch (error) {
    console.error("Get withdrawals error:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

// Estimate withdrawal fee
router.post("/estimate-fee", authenticateToken, async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const networkFee = await estimateNetworkFee(currency, amount);

    res.json({
      networkFee: serializeDecimal(networkFee),
      totalAmount: serializeDecimal(new Decimal(amount).plus(networkFee)),
    });
  } catch (error) {
    console.error("Estimate fee error:", error);
    res.status(500).json({ error: "Failed to estimate fee" });
  }
});

// Helper: Validate wallet address format
function isValidWalletAddress(currency: string, address: string): boolean {
  try {
    if (currency === "BTC") {
      // Bitcoin address validation (simplified)
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    } else if (["ETH", "USDT", "USDC"].includes(currency)) {
      // Ethereum address validation
      return ethers.utils.isAddress(address);
    }
    return false;
  } catch {
    return false;
  }
}

// Helper: Estimate network fee
async function estimateNetworkFee(currency: string, amount: string): Promise<Decimal> {
  // Simplified - in production, query blockchain for current gas prices
  const feeRates: { [key: string]: Decimal } = {
    BTC: new Decimal(0.0001), // ~$5 at $50k BTC
    ETH: new Decimal(0.001), // Variable gas
    USDT: new Decimal(0.002), // ERC-20 gas
    USDC: new Decimal(0.002),
  };

  return feeRates[currency] || new Decimal(0);
}

// Helper: Determine if approval required
function shouldRequireApproval(amount: string, currency: string): boolean {
  const threshold: { [key: string]: number } = {
    BTC: 0.1, // Auto-approve below 0.1 BTC
    ETH: 1.0, // Auto-approve below 1 ETH
    USDT: 1000, // Auto-approve below $1000
    USDC: 1000,
  };

  return new Decimal(amount).gt(threshold[currency] || 0);
}

// Helper: Process withdrawal (execute blockchain tx)
async function processWithdrawal(withdrawalId: string) {
  const withdrawal = await prisma.crypto_withdrawals.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal) throw new Error("Withdrawal not found");

  try {
    // Execute blockchain transaction (simplified)
    const txHash = await executeBlockchainTransaction(
      withdrawal.currency,
      withdrawal.sourceWallet,
      withdrawal.destinationWallet,
      withdrawal.amount.toString()
    );

    // Update withdrawal with tx hash
    await prisma.crypto_withdrawals.update({
      where: { id: withdrawalId },
      data: {
        txHash,
        status: "APPROVED",
      },
    });

    // Create ledger entry
    await prisma.cryptoLedger.create({
      data: {
        userId: withdrawal.userId,
        type: "WITHDRAWAL",
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        txHash,
        status: "APPROVED",
      },
    });

    // Notify user
    if (io) {
      io.to(`user-${withdrawal.userId}`).emit("crypto-withdrawal-approved", {
        withdrawalId,
        amount: serializeDecimal(withdrawal.amount),
        currency: withdrawal.currency,
        txHash,
        message: getUserFriendlyStatus("WITHDRAWAL", "APPROVED"),
      });
    }
  } catch (error) {
    console.error("Process withdrawal error:", error);

    // Mark as failed and refund
    await prisma.crypto_withdrawals.update({
      where: { id: withdrawalId },
      data: { status: "FAILED" },
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

    // Notify user
    if (io) {
      io.to(`user-${withdrawal.userId}`).emit("crypto-withdrawal-failed", {
        withdrawalId,
        message: getUserFriendlyStatus("WITHDRAWAL", "FAILED"),
      });
    }
  }
}

// Helper: Analyze withdrawal (async)
async function analyzeWithdrawalAsync(withdrawalId: string) {
  const withdrawal = await prisma.crypto_withdrawals.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal) return;

  // Check velocity (rapid withdrawals)
  const recentWithdrawals = await prisma.crypto_withdrawals.count({
    where: {
      userId: withdrawal.userId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  const riskScore = calculateRiskScore({
    amount: withdrawal.amount.toNumber(),
    userTier: withdrawal.user.tier,
    kycStatus: withdrawal.user.kycStatus,
    velocityCount: recentWithdrawals,
  });

  const analysis = {
    riskScore,
    velocityCount: recentWithdrawals,
    recommendations: riskScore > 70 ? ["REQUIRE_ADMIN_APPROVAL"] : ["AUTO_APPROVE"],
  };

  await prisma.crypto_withdrawals.update({
    where: { id: withdrawalId },
    data: { agentAnalysis: analysis },
  });

  // If high risk, create Mom AI incident
  if (riskScore > 70) {
    await momAICore.handleIncident({
      type: "SUSPICIOUS_CRYPTO_WITHDRAWAL",
      severity: "HIGH",
      metadata: {
        withdrawalId,
        userId: withdrawal.userId,
        amount: withdrawal.amount.toString(),
        currency: withdrawal.currency,
        destinationWallet: withdrawal.destinationWallet,
        riskScore,
      },
    });
  }
}

function calculateRiskScore(factors: any): number {
  let score = 0;

  // Amount-based risk
  if (factors.amount > 10000) score += 30;
  else if (factors.amount > 5000) score += 15;

  // KYC status
  if (factors.kycStatus !== "APPROVED") score += 20;

  // User tier
  if (factors.userTier === "FREE") score += 10;

  // Velocity
  if (factors.velocityCount && factors.velocityCount > 5) score += 25;

  return Math.min(score, 100);
}

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

function getUserFriendlyStatus(type: "DEPOSIT" | "WITHDRAWAL", status: string) {
  const messages = {
    DEPOSIT: {
      PENDING: "Your deposit is pending confirmation ⚠️",
      APPROVED: "Deposit successful ✅ Funds are available",
      REJECTED: "Deposit was rejected ⚠️ Please contact support",
      FAILED: "Deposit failed ⚠️ Please try again later",
    },
    WITHDRAWAL: {
      PENDING: "Your withdrawal request has been submitted ✅. Awaiting admin approval.",
      APPROVED: "Withdrawal successful ✅ Funds have been sent",
      REJECTED: "Your withdrawal was rejected ⚠️ Try again later",
      FAILED: "Withdrawal failed ⚠️ Please contact support",
    },
  };

  return messages[type][status] || "Status unknown";
}

async function getPlatformWallet(currency: string) {
  const wallet = await prisma.tokenWallet.findFirst({
    where: { userId: "PLATFORM" },
  });
  if (!wallet) throw new Error(`Platform wallet not found for ${currency}`);
  return wallet;
}

export default router;
