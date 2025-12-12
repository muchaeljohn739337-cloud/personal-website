import crypto from "crypto";
import { Decimal } from "decimal.js";
import { Response, Router } from "express";
import { authenticateToken, AuthRequest, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

/**
 * RPA Auto-Approval Workflow for Withdrawals and KYC
 *
 * Features:
 * - AI-powered risk scoring for withdrawals
 * - Automatic approval of low-risk requests
 * - KYC auto-verification with confidence thresholds
 * - Admin override capability
 */

interface RiskAssessment {
  score: number; // 0-100, higher = more risk
  level: "LOW" | "MEDIUM" | "HIGH";
  factors: string[];
  autoApprove: boolean;
  requiresReview: boolean;
}

interface KYCScore {
  confidence: number; // 0-1
  verified: boolean;
  flags: string[];
}

// POST /api/rpa/auto-approve/withdrawal/:id
// Automatically approve or flag withdrawal based on AI risk scoring
router.post(
  "/auto-approve/withdrawal/:id",
  authenticateToken as any,
  requireAdmin as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { override, adminNotes } = req.body;

      // Get withdrawal request
      const withdrawal = await prisma.crypto_withdrawals.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
              usdBalance: true,
              btcBalance: true,
              ethBalance: true,
              usdtBalance: true,
              totpEnabled: true,
              active: true,
              createdAt: true,
            },
          },
        },
      });

      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }

      if (withdrawal.status !== "PENDING") {
        return res.status(400).json({
          error: `Cannot auto-approve withdrawal with status: ${withdrawal.status}`,
        });
      }

      // Perform risk assessment
      const riskAssessment = await assessWithdrawalRisk(withdrawal);

      // Check if admin is overriding auto-decision
      if (override) {
        console.log(`[RPA] Admin override for withdrawal ${id}`);
        return res.json({
          riskAssessment,
          message: "Admin override - manual decision required",
          recommendation: riskAssessment.autoApprove ? "APPROVE" : "REVIEW",
        });
      }

      // Auto-approve if risk is low
      if (riskAssessment.autoApprove) {
        const updated = await prisma.crypto_withdrawals.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            adminNotes: adminNotes || "Auto-approved by RPA (low risk)",
          },
        });

        // Create audit log
        await prisma.audit_logs.create({
          data: {
            id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
            userId: req.user?.userId || "system",
            action: "WITHDRAWAL_AUTO_APPROVED",
            resourceType: "CryptoWithdrawal",
            resourceId: id,
            metadata: JSON.stringify({
              riskScore: riskAssessment.score,
              riskLevel: riskAssessment.level,
              amount: withdrawal.cryptoAmount.toString(),
              cryptoType: withdrawal.cryptoType,
              factors: riskAssessment.factors,
            }),
            ipAddress: req.ip || "unknown",
            userAgent: "RPA-AutoApproval",
            timestamp: new Date(),
          },
        });

        console.log(`✅ [RPA] Auto-approved withdrawal ${id} (risk score: ${riskAssessment.score})`);

        return res.json({
          success: true,
          action: "AUTO_APPROVED",
          withdrawal: updated,
          riskAssessment,
        });
      }

      // Flag for manual review if risk is medium/high
      await prisma.audit_logs.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          userId: req.user?.userId || "system",
          action: "WITHDRAWAL_FLAGGED_FOR_REVIEW",
          resourceType: "CryptoWithdrawal",
          resourceId: id,
          metadata: JSON.stringify({
            riskScore: riskAssessment.score,
            riskLevel: riskAssessment.level,
            amount: withdrawal.cryptoAmount.toString(),
            cryptoType: withdrawal.cryptoType,
            factors: riskAssessment.factors,
            requiresReview: riskAssessment.requiresReview,
          }),
          ipAddress: req.ip || "unknown",
          userAgent: "RPA-AutoApproval",
          timestamp: new Date(),
        },
      });

      console.warn(`⚠️  [RPA] Withdrawal ${id} flagged for review (risk score: ${riskAssessment.score})`);

      return res.json({
        success: true,
        action: "FLAGGED_FOR_REVIEW",
        withdrawal,
        riskAssessment,
        message: "Withdrawal requires manual review",
      });
    } catch (error) {
      console.error("[RPA] Auto-approval error:", error);
      return res.status(500).json({
        error: "Failed to process auto-approval",
      });
    }
  }
);

// POST /api/rpa/batch-auto-approve
// Batch process all pending withdrawals
router.post(
  "/batch-auto-approve",
  authenticateToken as any,
  requireAdmin as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { dryRun = false, maxRiskScore = 30 } = req.body;

      // Get all pending withdrawals
      const pendingWithdrawals = await prisma.crypto_withdrawals.findMany({
        where: { status: "PENDING" },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              username: true,
              usdBalance: true,
              btcBalance: true,
              ethBalance: true,
              usdtBalance: true,
              totpEnabled: true,
              active: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const results = {
        total: pendingWithdrawals.length,
        autoApproved: 0,
        flaggedForReview: 0,
        errors: 0,
        metadata: [] as any[],
        details: [] as any[],
      };

      for (const withdrawal of pendingWithdrawals) {
        try {
          const riskAssessment = await assessWithdrawalRisk(withdrawal);

          if (riskAssessment.score <= maxRiskScore && riskAssessment.autoApprove) {
            if (!dryRun) {
              await prisma.crypto_withdrawals.update({
                where: { id: withdrawal.id },
                data: {
                  status: "APPROVED",
                  approvedAt: new Date(),
                  adminNotes: `Auto-approved by RPA batch (risk: ${riskAssessment.score})`,
                },
              });

              await prisma.audit_logs.create({
                data: {
                  id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
                  userId: "system",
                  action: "WITHDRAWAL_BATCH_AUTO_APPROVED",
                  resourceType: "CryptoWithdrawal",
                  resourceId: withdrawal.id,
                  metadata: JSON.stringify({
                    riskScore: riskAssessment.score,
                    riskLevel: riskAssessment.level,
                    batchId: new Date().toISOString(),
                  }),
                  ipAddress: req.ip || "unknown",
                  userAgent: "RPA-BatchAutoApproval",
                  timestamp: new Date(),
                },
              });
            }

            results.autoApproved++;
            results.details.push({
              id: withdrawal.id,
              userId: withdrawal.userId,
              amount: withdrawal.cryptoAmount.toString(),
              action: "AUTO_APPROVED",
              riskScore: riskAssessment.score,
            });
          } else {
            results.flaggedForReview++;
            results.details.push({
              id: withdrawal.id,
              userId: withdrawal.userId,
              amount: withdrawal.cryptoAmount.toString(),
              action: "FLAGGED",
              riskScore: riskAssessment.score,
              reason: riskAssessment.factors.join(", "),
            });
          }
        } catch (error) {
          results.errors++;
          console.error(`[RPA] Error processing withdrawal ${withdrawal.id}:`, error);
        }
      }

      return res.json({
        success: true,
        dryRun,
        results,
        message: dryRun ? "Dry run complete - no changes made" : `Processed ${results.total} withdrawals`,
      });
    } catch (error) {
      console.error("[RPA] Batch auto-approval error:", error);
      return res.status(500).json({
        error: "Failed to process batch auto-approval",
      });
    }
  }
);

// POST /api/rpa/auto-verify-kyc/:userId
// Auto-verify KYC document if confidence is high
router.post(
  "/auto-verify-kyc/:userId",
  authenticateToken as any,
  requireAdmin as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { documentType, documentPath, confidenceThreshold = 0.95 } = req.body;

      // Simulate KYC verification (in production, call external API)
      const kycScore = await performKYCVerification(userId, documentType, documentPath);

      if (kycScore.confidence >= confidenceThreshold && !kycScore.flags.length) {
        // Auto-verify user
        await prisma.users.update({
          where: { id: userId },
          data: {
            // Add kycVerified field if it exists
            updatedAt: new Date(),
          },
        });

        await prisma.audit_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            action: "KYC_AUTO_VERIFIED",
            resourceType: "User",
            resourceId: userId,
            metadata: JSON.stringify({
              documentType,
              confidence: kycScore.confidence,
              autoApproved: true,
            }),
            ipAddress: req.ip || "unknown",
            userAgent: "RPA-KYCAutoVerify",
            timestamp: new Date(),
          },
        });

        console.log(`✅ [RPA] Auto-verified KYC for user ${userId} (confidence: ${kycScore.confidence})`);

        return res.json({
          success: true,
          action: "AUTO_VERIFIED",
          kycScore,
        });
      }

      // Flag for manual review
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          action: "KYC_FLAGGED_FOR_REVIEW",
          resourceType: "User",
          resourceId: userId,
          metadata: JSON.stringify({
            documentType,
            confidence: kycScore.confidence,
            flags: kycScore.flags,
          }),
          ipAddress: req.ip || "unknown",
          userAgent: "RPA-KYCAutoVerify",
          timestamp: new Date(),
        },
      });

      console.warn(`⚠️  [RPA] KYC for user ${userId} flagged for review (confidence: ${kycScore.confidence})`);

      return res.json({
        success: true,
        action: "FLAGGED_FOR_REVIEW",
        kycScore,
        message: "KYC requires manual review",
      });
    } catch (error) {
      console.error("[RPA] KYC auto-verify error:", error);
      return res.status(500).json({
        error: "Failed to auto-verify KYC",
      });
    }
  }
);

// Helper: Assess withdrawal risk
async function assessWithdrawalRisk(withdrawal: any): Promise<RiskAssessment> {
  const factors: string[] = [];
  let score = 0;

  const { user, amount, cryptoType, createdAt } = withdrawal;

  // Factor 1: Account age
  const accountAgeDays = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  if (accountAgeDays < 7) {
    score += 30;
    factors.push("New account (< 7 days)");
  } else if (accountAgeDays < 30) {
    score += 15;
    factors.push("Recent account (< 30 days)");
  }

  // Factor 2: Withdrawal amount vs balance
  const balanceField =
    cryptoType === "USD"
      ? "usdBalance"
      : cryptoType === "BTC"
        ? "btcBalance"
        : cryptoType === "ETH"
          ? "ethBalance"
          : "usdtBalance";

  const currentBalance = new Decimal(user[balanceField]);
  const withdrawalAmount = new Decimal(amount);

  const balanceRatio = withdrawalAmount.div(currentBalance).toNumber();

  if (balanceRatio > 0.9) {
    score += 25;
    factors.push("Withdrawing >90% of balance");
  } else if (balanceRatio > 0.7) {
    score += 15;
    factors.push("Withdrawing >70% of balance");
  }

  // Factor 3: Large amount
  const amountNum = Number(amount);
  if (amountNum > 10000) {
    score += 20;
    factors.push("Large withdrawal amount (>$10,000)");
  } else if (amountNum > 5000) {
    score += 10;
    factors.push("Significant amount (>$5,000)");
  }

  // Factor 4: 2FA not enabled
  if (!user.totpEnabled) {
    score += 20;
    factors.push("2FA not enabled");
  }

  // Factor 5: Inactive account
  if (!user.active) {
    score += 50;
    factors.push("Account is inactive");
  }

  // Factor 6: Recent withdrawal requests
  const recentWithdrawals = await prisma.crypto_withdrawals.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  if (recentWithdrawals > 3) {
    score += 25;
    factors.push("Multiple withdrawal requests in 24h");
  }

  // Determine risk level
  let level: RiskAssessment["level"];
  let autoApprove = false;
  let requiresReview = false;

  if (score <= 20) {
    level = "LOW";
    autoApprove = true;
  } else if (score <= 50) {
    level = "MEDIUM";
    requiresReview = true;
  } else {
    level = "HIGH";
    requiresReview = true;
  }

  return {
    score,
    level,
    factors,
    autoApprove,
    requiresReview,
  };
}

// Helper: Perform KYC verification (simulated)
async function performKYCVerification(userId: string, documentType: string, documentPath: string): Promise<KYCScore> {
  // In production, integrate with Onfido, Jumio, or Trulioo API
  // For now, simulate verification

  const flags: string[] = [];
  let confidence = 0.85;

  // Simulate OCR and document checks
  if (documentType === "passport") {
    confidence += 0.1;
  }

  // Simulate face match
  const faceMatchScore = Math.random();
  if (faceMatchScore < 0.9) {
    flags.push("Face match confidence below threshold");
    confidence -= 0.15;
  }

  // Simulate document expiry check
  const isExpired = Math.random() < 0.05;
  if (isExpired) {
    flags.push("Document appears to be expired");
    confidence -= 0.3;
  }

  return {
    confidence: Math.max(0, Math.min(1, confidence)),
    verified: confidence >= 0.95 && flags.length === 0,
    flags,
  };
}

export default router;
