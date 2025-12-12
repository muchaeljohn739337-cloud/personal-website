import { Router } from "express";
import type { Server as IOServer } from "socket.io";
import { momAICore } from "../ai/mom-core";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import { serializeDecimalFields } from "../utils/decimal";

const router = Router();

let ioRef: IOServer | null = null;
export function setAdminLedgerSocketIO(io: IOServer) {
  ioRef = io;
}

// ============================================================
// ADMIN LEDGER SYSTEM - Financial Operations Management
// ============================================================
// Purpose: Admin-only financial operations with full audit trail
// Features:
// - Deductions, Credits, Adjustments
// - Automatic audit logging
// - AI Supervisor fraud detection
// - Account freeze/unfreeze
// - User-friendly status messages
// ============================================================

interface LedgerEntry {
  id: string;
  userId: string;
  type: "DEDUCTION" | "CREDIT" | "ADJUSTMENT";
  amount: string;
  currency: string;
  actorId: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper: Create audit log entry
async function createAuditLog(action: string, userId: string, adminId: string, details: any) {
  await prisma.audit_logs.create({
    data: {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      action,
      userId,
      adminId,
      details,
      timestamp: new Date(),
    },
  });
}

// Helper: Notify user via Socket.IO
function notifyUser(userId: string, event: string, data: any) {
  if (ioRef) {
    ioRef.to(`user-${userId}`).emit(event, data);
  }
}

// Helper: Check user suspension status
async function checkUserStatus(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { active: true, suspended: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.suspended) {
    throw new Error("❌ User account is suspended. Cannot process financial operations.");
  }

  return user;
}

// ============================================================
// POST /api/admin/ledger/deduction
// Admin-only: Deduct funds from user account
// ============================================================
router.post("/deduction", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user.userId;
    const { userId, amount, currency, reason, requiresApproval = true } = req.body;

    // Validation
    if (!userId || !amount || !currency || !reason) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing required fields: userId, amount, currency, reason",
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "❌ Amount must be greater than 0",
      });
    }

    if (reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "❌ Reason must be at least 10 characters long for audit compliance",
      });
    }

    // Check user status
    await checkUserStatus(userId);

    // Check for duplicate deductions (within last 1 minute)
    const recentDeduction = await prisma.financial_ledger.findFirst({
      where: {
        userId,
        type: "DEDUCTION",
        amount: parseFloat(amount),
        currency,
        createdAt: { gte: new Date(Date.now() - 60000) },
      },
    });

    if (recentDeduction) {
      return res.status(409).json({
        success: false,
        message: "⚠️ Duplicate deduction detected. Please wait 1 minute before retrying.",
      });
    }

    // Check user balance
    const userWallet = await prisma.user_wallets.findFirst({
      where: { userId, currency },
    });

    if (!userWallet || parseFloat(userWallet.balance.toString()) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: `❌ Insufficient balance. User has ${userWallet?.balance || 0} ${currency}`,
      });
    }

    // AI Supervisor check for suspicious deductions
    const aiAnalysis = await momAICore.handleIncident({
      type: "ADMIN_DEDUCTION",
      severity: parseFloat(amount) > 1000 ? "HIGH" : "MEDIUM",
      metadata: {
        adminId,
        userId,
        amount,
        currency,
        reason,
        userBalance: userWallet.balance.toString(),
      },
    });

    const status = aiAnalysis.requiresApproval || requiresApproval ? "PENDING" : "APPROVED";

    // Create ledger entry
    const ledgerEntry = await prisma.financial_ledger.create({
      data: {
        id: `ledger-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        type: "DEDUCTION",
        amount: parseFloat(amount),
        currency,
        actorId: adminId,
        reason,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // If auto-approved, process deduction immediately
    if (status === "APPROVED") {
      await prisma.user_wallets.update({
        where: { id: userWallet.id },
        data: {
          balance: {
            decrement: parseFloat(amount),
          },
        },
      });

      // Create transaction record
      await prisma.transactions.create({
        data: {
          id: `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          userId,
          type: "DEDUCTION",
          amount: parseFloat(amount),
          currency,
          status: "COMPLETED",
          description: `Admin deduction: ${reason}`,
          metadata: { ledgerId: ledgerEntry.id, adminId },
          createdAt: new Date(),
        },
      });
    }

    // Create audit log
    await createAuditLog("deduction", userId, adminId, {
      amount,
      currency,
      reason,
      ledgerId: ledgerEntry.id,
      status,
      aiRiskLevel: aiAnalysis.riskLevel,
    });

    // Notify user
    notifyUser(userId, "ledger-update", {
      type: "DEDUCTION",
      amount,
      currency,
      status,
      message: status === "PENDING" ? "⏳ Admin deduction pending approval" : "✅ Admin deduction processed",
    });

    res.json({
      success: true,
      message:
        status === "PENDING" ? "⏳ Deduction created and pending approval" : "✅ Deduction processed successfully",
      ledgerEntry: serializeDecimalFields(ledgerEntry, ["amount"]),
      requiresApproval: status === "PENDING",
      aiAnalysis: {
        riskLevel: aiAnalysis.riskLevel,
        decision: aiAnalysis.decision,
      },
    });
  } catch (error: any) {
    console.error("Deduction error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "❌ Failed to process deduction",
    });
  }
});

// ============================================================
// POST /api/admin/ledger/credit
// Admin-only: Add funds to user account
// ============================================================
router.post("/credit", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user.userId;
    const { userId, amount, currency, reason, txHash } = req.body;

    // Validation
    if (!userId || !amount || !currency || !reason) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing required fields: userId, amount, currency, reason",
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "❌ Amount must be greater than 0",
      });
    }

    // Check user status
    await checkUserStatus(userId);

    // Create ledger entry (credits auto-approved)
    const ledgerEntry = await prisma.financial_ledger.create({
      data: {
        id: `ledger-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        type: "CREDIT",
        amount: parseFloat(amount),
        currency,
        actorId: adminId,
        reason,
        status: "APPROVED",
        txHash: txHash || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Update user wallet
    const userWallet = await prisma.user_wallets.upsert({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
      update: {
        balance: {
          increment: parseFloat(amount),
        },
      },
      create: {
        id: `wallet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        currency,
        balance: parseFloat(amount),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create transaction record
    await prisma.transactions.create({
      data: {
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        type: "CREDIT",
        amount: parseFloat(amount),
        currency,
        status: "COMPLETED",
        description: `Admin credit: ${reason}`,
        metadata: { ledgerId: ledgerEntry.id, adminId, txHash },
        createdAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog("credit", userId, adminId, {
      amount,
      currency,
      reason,
      ledgerId: ledgerEntry.id,
      txHash,
    });

    // Notify user
    notifyUser(userId, "ledger-update", {
      type: "CREDIT",
      amount,
      currency,
      status: "APPROVED",
      message: "✅ Funds credited to your account",
    });

    res.json({
      success: true,
      message: "✅ Credit processed successfully",
      ledgerEntry: serializeDecimalFields(ledgerEntry, ["amount"]),
      newBalance: serializeDecimalFields(userWallet, ["balance"]).balance,
    });
  } catch (error: any) {
    console.error("Credit error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "❌ Failed to process credit",
    });
  }
});

// ============================================================
// POST /api/admin/ledger/adjustment
// Admin-only: Manual balance adjustment (correction)
// ============================================================
router.post("/adjustment", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user.userId;
    const { userId, amount, currency, reason } = req.body;

    // Validation
    if (!userId || amount === undefined || !currency || !reason) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing required fields: userId, amount, currency, reason",
      });
    }

    if (reason.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: "❌ Adjustment reason must be at least 15 characters for audit compliance",
      });
    }

    // Check user status
    await checkUserStatus(userId);

    // AI Supervisor check (adjustments always require approval)
    const aiAnalysis = await momAICore.handleIncident({
      type: "ADMIN_ADJUSTMENT",
      severity: "HIGH",
      metadata: {
        adminId,
        userId,
        amount,
        currency,
        reason,
      },
    });

    // Create ledger entry (always pending)
    const ledgerEntry = await prisma.financial_ledger.create({
      data: {
        id: `ledger-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId,
        type: "ADJUSTMENT",
        amount: parseFloat(amount),
        currency,
        actorId: adminId,
        reason,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog("adjustment", userId, adminId, {
      amount,
      currency,
      reason,
      ledgerId: ledgerEntry.id,
      aiRiskLevel: aiAnalysis.riskLevel,
    });

    // Notify user
    notifyUser(userId, "ledger-update", {
      type: "ADJUSTMENT",
      amount,
      currency,
      status: "PENDING",
      message: "⏳ Account adjustment pending supervisor approval",
    });

    res.json({
      success: true,
      message: "⏳ Adjustment created and pending supervisor approval",
      ledgerEntry: serializeDecimalFields(ledgerEntry, ["amount"]),
      requiresApproval: true,
      aiAnalysis: {
        riskLevel: aiAnalysis.riskLevel,
        decision: aiAnalysis.decision,
      },
    });
  } catch (error: any) {
    console.error("Adjustment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "❌ Failed to create adjustment",
    });
  }
});

// ============================================================
// POST /api/admin/ledger/approve/:id
// Admin-only: Approve pending ledger entry
// ============================================================
router.post("/approve/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user.userId;
    const { id } = req.params;

    const ledgerEntry = await prisma.financial_ledger.findUnique({
      where: { id },
    });

    if (!ledgerEntry) {
      return res.status(404).json({
        success: false,
        message: "❌ Ledger entry not found",
      });
    }

    if (ledgerEntry.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `⚠️ Ledger entry already ${ledgerEntry.status.toLowerCase()}`,
      });
    }

    // Update ledger status
    const updatedEntry = await prisma.financial_ledger.update({
      where: { id },
      data: {
        status: "APPROVED",
        updatedAt: new Date(),
      },
    });

    // Process the financial operation
    const userWallet = await prisma.user_wallets.findFirst({
      where: {
        userId: ledgerEntry.userId,
        currency: ledgerEntry.currency,
      },
    });

    if (!userWallet) {
      throw new Error("User wallet not found");
    }

    // Apply balance change
    const balanceChange =
      ledgerEntry.type === "DEDUCTION"
        ? -parseFloat(ledgerEntry.amount.toString())
        : parseFloat(ledgerEntry.amount.toString());

    await prisma.user_wallets.update({
      where: { id: userWallet.id },
      data: {
        balance: {
          increment: balanceChange,
        },
      },
    });

    // Create transaction record
    await prisma.transactions.create({
      data: {
        id: `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId: ledgerEntry.userId,
        type: ledgerEntry.type,
        amount: parseFloat(ledgerEntry.amount.toString()),
        currency: ledgerEntry.currency,
        status: "COMPLETED",
        description: `Admin ${ledgerEntry.type.toLowerCase()}: ${ledgerEntry.reason}`,
        metadata: { ledgerId: ledgerEntry.id, approvedBy: adminId },
        createdAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog("ledger_approval", ledgerEntry.userId, adminId, {
      ledgerId: ledgerEntry.id,
      type: ledgerEntry.type,
      amount: ledgerEntry.amount.toString(),
      currency: ledgerEntry.currency,
    });

    // Notify user
    notifyUser(ledgerEntry.userId, "ledger-update", {
      type: ledgerEntry.type,
      amount: ledgerEntry.amount.toString(),
      currency: ledgerEntry.currency,
      status: "APPROVED",
      message: `✅ ${ledgerEntry.type} approved and processed`,
    });

    res.json({
      success: true,
      message: "✅ Ledger entry approved and processed",
      ledgerEntry: serializeDecimalFields(updatedEntry, ["amount"]),
    });
  } catch (error: any) {
    console.error("Approval error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "❌ Failed to approve ledger entry",
    });
  }
});

// ============================================================
// POST /api/admin/ledger/reject/:id
// Admin-only: Reject pending ledger entry
// ============================================================
router.post("/reject/:id", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "❌ Rejection reason must be at least 10 characters",
      });
    }

    const ledgerEntry = await prisma.financial_ledger.findUnique({
      where: { id },
    });

    if (!ledgerEntry) {
      return res.status(404).json({
        success: false,
        message: "❌ Ledger entry not found",
      });
    }

    if (ledgerEntry.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `⚠️ Ledger entry already ${ledgerEntry.status.toLowerCase()}`,
      });
    }

    // Update ledger status
    const updatedEntry = await prisma.financial_ledger.update({
      where: { id },
      data: {
        status: "REJECTED",
        reason: `${ledgerEntry.reason} [REJECTED: ${reason}]`,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog("ledger_rejection", ledgerEntry.userId, adminId, {
      ledgerId: ledgerEntry.id,
      type: ledgerEntry.type,
      amount: ledgerEntry.amount.toString(),
      currency: ledgerEntry.currency,
      rejectionReason: reason,
    });

    // Notify user
    notifyUser(ledgerEntry.userId, "ledger-update", {
      type: ledgerEntry.type,
      amount: ledgerEntry.amount.toString(),
      currency: ledgerEntry.currency,
      status: "REJECTED",
      message: `❌ ${ledgerEntry.type} rejected: ${reason}`,
    });

    res.json({
      success: true,
      message: "✅ Ledger entry rejected",
      ledgerEntry: serializeDecimalFields(updatedEntry, ["amount"]),
    });
  } catch (error: any) {
    console.error("Rejection error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "❌ Failed to reject ledger entry",
    });
  }
});

// ============================================================
// POST /api/admin/ledger/freeze-account
// Admin-only: Freeze user account
// ============================================================
router.post("/freeze-account", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user.userId;
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing required fields: userId, reason",
      });
    }

    if (reason.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: "❌ Freeze reason must be at least 15 characters for compliance",
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "❌ User not found",
      });
    }

    if (user.suspended) {
      return res.status(400).json({
        success: false,
        message: "⚠️ User account is already frozen",
      });
    }

    // Freeze account
    await prisma.users.update({
      where: { id: userId },
      data: {
        suspended: true,
        active: false,
      },
    });

    // Create audit log
    await createAuditLog("account_freeze", userId, adminId, {
      reason,
      previousStatus: { suspended: user.suspended, active: user.active },
    });

    // Notify user
    notifyUser(userId, "account-status", {
      status: "FROZEN",
      message: "🔒 Your account has been frozen. Please contact support.",
      reason,
    });

    res.json({
      success: true,
      message: "🔒 User account frozen successfully",
      userId,
    });
  } catch (error: any) {
    console.error("Freeze account error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "❌ Failed to freeze account",
    });
  }
});

// ============================================================
// POST /api/admin/ledger/unfreeze-account
// Admin-only: Unfreeze user account
// ============================================================
router.post("/unfreeze-account", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user.userId;
    const { userId, reason } = req.body;

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing required fields: userId, reason",
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "❌ User not found",
      });
    }

    if (!user.suspended) {
      return res.status(400).json({
        success: false,
        message: "⚠️ User account is not frozen",
      });
    }

    // Unfreeze account
    await prisma.users.update({
      where: { id: userId },
      data: {
        suspended: false,
        active: true,
      },
    });

    // Create audit log
    await createAuditLog("account_unfreeze", userId, adminId, {
      reason,
      previousStatus: { suspended: user.suspended, active: user.active },
    });

    // Notify user
    notifyUser(userId, "account-status", {
      status: "ACTIVE",
      message: "✅ Your account has been unfrozen. You can now access all features.",
      reason,
    });

    res.json({
      success: true,
      message: "✅ User account unfrozen successfully",
      userId,
    });
  } catch (error: any) {
    console.error("Unfreeze account error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "❌ Failed to unfreeze account",
    });
  }
});

// ============================================================
// GET /api/admin/ledger/history
// Admin-only: View ledger history
// ============================================================
router.get("/history", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const { userId, type, status, page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [total, entries] = await Promise.all([
      prisma.financial_ledger.count({ where }),
      prisma.financial_ledger.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
          actor: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: entries.map((entry) => serializeDecimalFields(entry, ["amount"])),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Ledger history error:", error);
    res.status(500).json({
      success: false,
      message: "❌ Failed to fetch ledger history",
    });
  }
});

// ============================================================
// GET /api/admin/ledger/audit-logs
// Admin-only: View audit logs
// ============================================================
router.get("/audit-logs", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const { userId, adminId, action, page = "1", limit = "50" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (userId) where.userId = userId;
    if (adminId) where.adminId = adminId;
    if (action) where.action = action;

    const [total, logs] = await Promise.all([
      prisma.audit_logs.count({ where }),
      prisma.audit_logs.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limitNum,
      }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "❌ Failed to fetch audit logs",
    });
  }
});

// ============================================================
// GET /api/admin/ledger/pending
// Admin-only: Get all pending ledger entries
// ============================================================
router.get("/pending", authenticateToken as any, requireAdmin as any, async (req, res) => {
  try {
    const pendingEntries = await prisma.financial_ledger.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
        actor: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: pendingEntries.map((entry) => serializeDecimalFields(entry, ["amount"])),
      count: pendingEntries.length,
    });
  } catch (error: any) {
    console.error("Pending entries error:", error);
    res.status(500).json({
      success: false,
      message: "❌ Failed to fetch pending entries",
    });
  }
});

export default router;
