import crypto from "crypto";
import { Decimal } from "decimal.js";
import prisma from "../prismaClient";
import { getBotRiskScore } from "./botDetection";

export async function assessFraudRisk(
  userId: string,
  transaction_id: string,
  amount: number,
  transactionType: string
): Promise<{ score: number; factors: any[]; status: string }> {
  const factors: any[] = [];
  let riskScore = 0;

  const botRisk = await getBotRiskScore(userId);
  if (botRisk > 50) {
    riskScore += 30;
    factors.push({ type: "high_bot_risk", value: botRisk });
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { usdBalance: true },
  });

  if (user && amount > Number(user.usdBalance) * 10) {
    riskScore += 25;
    factors.push({
      type: "amount_exceeds_balance_10x",
      value: amount,
    });
  }

  const recentTransactions = await prisma.transactions.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000),
      },
    },
  });

  if (recentTransactions > 10) {
    riskScore += 20;
    factors.push({
      type: "high_transaction_velocity",
      value: recentTransactions,
    });
  }

  if (amount > 10000) {
    riskScore += 15;
    factors.push({ type: "large_amount", value: amount });
  }

  let status = "APPROVED";
  if (riskScore >= 70) {
    status = "pending";
  } else if (riskScore >= 50) {
    status = "flagged";
  }

  await prisma.fraud_scores.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      transaction_id: transactionId,
      score: new Decimal(riskScore),
      factors,
      status,
    },
  });

  return { score: riskScore, factors, status };
}
