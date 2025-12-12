import Decimal from "decimal.js";
import { Router } from "express";
import { Server } from "socket.io";
import { momAICore } from "../ai/mom-core";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import { serializeDecimal, serializeDecimalFields } from "../utils/decimal";

const router = Router();
let io: Server;

export function setCryptoDepositsSocketIO(socketIO: Server) {
  io = socketIO;
}

// User initiates deposit
router.post("/", authenticateToken, async (req, res) => {
  const { amount, currency, sourceWallet } = req.body;
  const userId = req.user!.userId;

  if (!amount || !currency || !sourceWallet) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const validCurrencies = ["BTC", "ETH", "USDT", "USDC"];
  if (!validCurrencies.includes(currency)) {
    return res.status(400).json({ error: "Invalid currency" });
  }

  try {
    // Get platform wallet address for this currency
    const platformWallet = await getPlatformWallet(currency);

    // Create pending deposit
    const deposit = await prisma.crypto_deposits.create({
      data: {
        userId,
        amount: new Decimal(amount),
        currency,
        sourceWallet,
        destinationWallet: platformWallet.address,
        status: "PENDING",
      },
    });

    // Trigger AI Agent analysis (async)
    analyzeDepositAsync(deposit.id).catch((err) => {
      console.error("Crypto agent analysis error:", err);
    });

    // Notify user
    if (io) {
      io.to(`user-${userId}`).emit("crypto-deposit-created", {
        depositId: deposit.id,
        amount: serializeDecimal(deposit.amount),
        currency,
        status: "PENDING",
        message: "Your deposit is pending confirmation ⚠️",
      });
    }

    res.json({
      success: true,
      deposit: serializeDecimalFields(deposit),
      message: "Deposit request created. Please send funds to the provided address.",
      platformWallet: platformWallet.address,
    });
  } catch (error) {
    console.error("Create deposit error:", error);
    res.status(500).json({ error: "Failed to create deposit" });
  }
});

// Get user deposit history
router.get("/history", authenticateToken, async (req, res) => {
  const userId = req.user!.userId;

  try {
    const deposits = await prisma.crypto_deposits.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      deposits: deposits.map((d) => serializeDecimalFields(d)),
    });
  } catch (error) {
    console.error("Get deposits error:", error);
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
});

// Get deposit details
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const deposit = await prisma.crypto_deposits.findFirst({
      where: { id, userId },
    });

    if (!deposit) {
      return res.status(404).json({ error: "Deposit not found" });
    }

    res.json({
      deposit: serializeDecimalFields(deposit),
      userFriendlyStatus: getUserFriendlyStatus("DEPOSIT", deposit.status),
    });
  } catch (error) {
    console.error("Get deposit details error:", error);
    res.status(500).json({ error: "Failed to fetch deposit" });
  }
});

// Helper: Get platform wallet
async function getPlatformWallet(currency: string) {
  const wallet = await prisma.token_wallets.findFirst({
    where: {
      userId: "PLATFORM",
    },
  });

  if (!wallet) {
    throw new Error(`Platform wallet not found for ${currency}`);
  }

  return wallet;
}

// Helper: Analyze deposit (async)
async function analyzeDepositAsync(depositId: string) {
  const deposit = await prisma.crypto_deposits.findUnique({
    where: { id: depositId },
    include: { user: true },
  });

  if (!deposit) return;

  // Calculate risk score (simplified)
  const riskScore = calculateRiskScore({
    amount: deposit.amount.toNumber(),
    userTier: deposit.user.tier,
    kycStatus: deposit.user.kycStatus,
  });

  const analysis = {
    riskScore,
    recommendations: riskScore > 70 ? ["REQUIRE_ADMIN_APPROVAL", "FLAG_FOR_REVIEW"] : ["AUTO_APPROVE"],
  };

  // Update deposit with analysis
  await prisma.crypto_deposits.update({
    where: { id: depositId },
    data: { agentAnalysis: analysis },
  });

  // If high risk, create Mom AI incident
  if (riskScore > 70) {
    const incident = await momAICore.handleIncident({
      type: "SUSPICIOUS_CRYPTO_DEPOSIT",
      severity: "CRITICAL",
      metadata: {
        depositId,
        userId: deposit.userId,
        amount: deposit.amount.toString(),
        currency: deposit.currency,
        sourceWallet: deposit.sourceWallet,
        riskScore,
      },
    });

    await prisma.crypto_deposits.update({
      where: { id: depositId },
      data: { momIncidentId: incident.id },
    });

    // Alert admins
    if (io) {
      io.to("admin-room").emit("crypto-deposit-flagged", {
        depositId,
        userId: deposit.userId,
        amount: serializeDecimal(deposit.amount),
        currency: deposit.currency,
        riskScore,
      });
    }
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

  return Math.min(score, 100);
}

// Helper: User-friendly status messages
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

export default router;
