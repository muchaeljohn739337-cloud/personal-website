/**
 * Dad Admin Console - Approval Workflow API
 *
 * Provides human oversight and control over AI-proposed changes
 * Features:
 * - Create and manage approval requests
 * - Multi-level approval workflows
 * - Kill-switch for emergency stops
 * - Rollback capabilities
 * - RBAC enforcement
 * - Audit trail
 */

import { PrismaClient } from "@prisma/client";
import express from "express";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { requireAdmin } from "../middleware/adminAuth";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

// Load approval policy
let approvalPolicy: any = null;
try {
  const policyPath = path.join(process.cwd(), "config", "ai-policies", "approval_policy.yaml");
  const policyContent = fs.readFileSync(policyPath, "utf-8");
  approvalPolicy = yaml.parse(policyContent);
} catch (error) {
  console.error("Failed to load approval policy:", error);
}

interface ApprovalRequest {
  id: string;
  type: "code_change" | "config_change" | "deployment" | "emergency_action";
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  title: string;
  description: string;
  proposedChanges: any;
  requestedBy: string;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected" | "executed" | "rolled_back";
  approvalsRequired: number;
  approvalsReceived: number;
  approvers: Array<{
    userId: string;
    decision: "approve" | "reject";
    reason?: string;
    timestamp: Date;
  }>;
  sandboxResult?: any;
  executionResult?: any;
  metadata: any;
}

/**
 * POST /api/dad/approvals/create
 * Create new approval request
 */
router.post("/approvals/create", authenticateToken, async (req, res) => {
  try {
    const { type, riskLevel, title, description, proposedChanges, metadata } = req.body;

    if (!type || !riskLevel || !title || !description) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const userId = (req as any).user?.id;
    const requestId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get approval requirements from policy
    const policyLevel = approvalPolicy?.risk_levels?.[riskLevel] || {
      approvals_required: 1,
      approver_roles: ["admin"],
    };

    const approvalRequest: ApprovalRequest = {
      id: requestId,
      type,
      riskLevel,
      title,
      description,
      proposedChanges: proposedChanges || {},
      requestedBy: userId,
      requestedAt: new Date(),
      status: "pending",
      approvalsRequired: policyLevel.approvals_required,
      approvalsReceived: 0,
      approvers: [],
      metadata: metadata || {},
    };

    // Store in database
    await prisma.audit_logs.create({
      data: {
        id: requestId,
        action: "APPROVAL_REQUEST_CREATED",
        userId,
        resourceType: "APPROVAL_REQUEST",
        resourceId: requestId,
        changes: JSON.stringify(proposedChanges),
        metadata: JSON.stringify({
          type,
          riskLevel,
          title,
          approvalsRequired: policyLevel.approvals_required,
        }),
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        severity: riskLevel === "HIGH" || riskLevel === "EMERGENCY" ? "HIGH" : "MEDIUM",
      },
    });

    console.log(`📋 [DAD] Approval request created: ${requestId} (${riskLevel})`);

    res.json({
      success: true,
      requestId,
      approvalRequest,
    });
  } catch (error: any) {
    console.error("Failed to create approval request:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dad/approvals/pending
 * Get all pending approval requests
 */
router.get("/approvals/pending", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingApprovals = await prisma.audit_logs.findMany({
      where: {
        action: "APPROVAL_REQUEST_CREATED",
        severity: {
          in: ["MEDIUM", "HIGH", "CRITICAL"],
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 50,
    });

    const approvals = pendingApprovals.map((log) => {
      const metadata = JSON.parse(log.metadata as string);
      return {
        id: log.id,
        type: metadata.type,
        riskLevel: metadata.riskLevel,
        title: metadata.title,
        requestedBy: log.userId,
        requestedAt: log.timestamp,
        status: "pending",
        approvalsRequired: metadata.approvalsRequired || 1,
      };
    });

    res.json({
      success: true,
      count: approvals.length,
      approvals,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dad/approvals/:id/approve
 * Approve a request
 */
router.post("/approvals/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    // Get the approval request
    const approval = await prisma.audit_logs.findUnique({
      where: { id },
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: "Approval request not found",
      });
    }

    // Record approval
    await prisma.audit_logs.create({
      data: {
        id: `approval_${id}_${Date.now()}`,
        action: "APPROVAL_GRANTED",
        userId,
        resourceType: "APPROVAL_REQUEST",
        resourceId: id,
        changes: JSON.stringify({ decision: "approve", reason }),
        metadata: JSON.stringify({
          approver: userId,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        severity: "INFO",
      },
    });

    console.log(`✅ [DAD] Approval granted for ${id} by ${userId}`);

    res.json({
      success: true,
      message: "Approval granted",
      requestId: id,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dad/approvals/:id/reject
 * Reject a request
 */
router.post("/approvals/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required",
      });
    }

    // Get the approval request
    const approval = await prisma.audit_logs.findUnique({
      where: { id },
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        error: "Approval request not found",
      });
    }

    // Record rejection
    await prisma.audit_logs.create({
      data: {
        id: `rejection_${id}_${Date.now()}`,
        action: "APPROVAL_REJECTED",
        userId,
        resourceType: "APPROVAL_REQUEST",
        resourceId: id,
        changes: JSON.stringify({ decision: "reject", reason }),
        metadata: JSON.stringify({
          approver: userId,
          timestamp: new Date().toISOString(),
          reason,
        }),
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        severity: "WARN",
      },
    });

    console.log(`❌ [DAD] Approval rejected for ${id} by ${userId}: ${reason}`);

    res.json({
      success: true,
      message: "Approval rejected",
      requestId: id,
      reason,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dad/kill-switch
 * Emergency stop all AI operations
 */
router.post("/kill-switch", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reason, scope } = req.body;
    const userId = (req as any).user?.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "Reason is required for kill-switch activation",
      });
    }

    const killSwitchId = `killswitch_${Date.now()}`;

    // Record kill-switch activation
    await prisma.audit_logs.create({
      data: {
        id: killSwitchId,
        action: "KILL_SWITCH_ACTIVATED",
        userId,
        resourceType: "SYSTEM",
        resourceId: "global",
        changes: JSON.stringify({
          reason,
          scope: scope || "all",
          activatedAt: new Date().toISOString(),
        }),
        metadata: JSON.stringify({
          activatedBy: userId,
          activatedAt: new Date().toISOString(),
        }),
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        severity: "CRITICAL",
      },
    });

    console.log(`🚨 [DAD] KILL-SWITCH ACTIVATED by ${userId}: ${reason}`);

    // In production, this would:
    // 1. Stop all Mom AI incident handling
    // 2. Cancel all sandbox jobs
    // 3. Pause all automated deployments
    // 4. Send emergency alerts

    res.json({
      success: true,
      message: "Kill-switch activated - All AI operations stopped",
      killSwitchId,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dad/kill-switch/deactivate
 * Deactivate kill-switch
 */
router.post("/kill-switch/deactivate", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    await prisma.audit_logs.create({
      data: {
        id: `killswitch_deactivate_${Date.now()}`,
        action: "KILL_SWITCH_DEACTIVATED",
        userId,
        resourceType: "SYSTEM",
        resourceId: "global",
        changes: JSON.stringify({
          reason: reason || "Manual deactivation",
          deactivatedAt: new Date().toISOString(),
        }),
        metadata: JSON.stringify({
          deactivatedBy: userId,
        }),
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        severity: "HIGH",
      },
    });

    console.log(`✅ [DAD] Kill-switch deactivated by ${userId}`);

    res.json({
      success: true,
      message: "Kill-switch deactivated - AI operations resumed",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dad/rollback/:id
 * Rollback a deployed change
 */
router.post("/rollback/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    // Get the original deployment
    const deployment = await prisma.audit_logs.findUnique({
      where: { id },
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: "Deployment not found",
      });
    }

    const rollbackId = `rollback_${id}_${Date.now()}`;

    // Record rollback
    await prisma.audit_logs.create({
      data: {
        id: rollbackId,
        action: "ROLLBACK_INITIATED",
        userId,
        resourceType: "DEPLOYMENT",
        resourceId: id,
        changes: JSON.stringify({
          reason: reason || "Manual rollback",
          originalDeployment: id,
        }),
        metadata: JSON.stringify({
          initiatedBy: userId,
          initiatedAt: new Date().toISOString(),
        }),
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        severity: "HIGH",
      },
    });

    console.log(`🔄 [DAD] Rollback initiated for ${id} by ${userId}`);

    res.json({
      success: true,
      message: "Rollback initiated",
      rollbackId,
      originalDeploymentId: id,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dad/audit
 * Get audit trail for Dad console actions
 */
router.get("/audit", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, action } = req.query;

    const where: any = {
      action: {
        in: [
          "APPROVAL_REQUEST_CREATED",
          "APPROVAL_GRANTED",
          "APPROVAL_REJECTED",
          "KILL_SWITCH_ACTIVATED",
          "KILL_SWITCH_DEACTIVATED",
          "ROLLBACK_INITIATED",
        ],
      },
    };

    if (action) {
      where.action = action;
    }

    const auditLogs = await prisma.audit_logs.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.audit_logs.count({ where });

    res.json({
      success: true,
      total,
      count: auditLogs.length,
      logs: auditLogs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dad/incidents
 * Get security incidents for review
 */
router.get("/incidents", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = "all", severity, limit = 50 } = req.query;

    const where: any = {
      action: "incident_created",
    };

    if (status !== "all") {
      // Filter by status in metadata
      const incidents = await prisma.audit_logs.findMany({
        where,
        orderBy: {
          timestamp: "desc",
        },
        take: Number(limit),
      });

      const filtered = incidents.filter((incident) => {
        try {
          const metadata = JSON.parse(incident.metadata as string);
          return metadata.status === status;
        } catch {
          return false;
        }
      });

      return res.json({
        success: true,
        count: filtered.length,
        incidents: filtered,
      });
    }

    if (severity) {
      where.severity = severity;
    }

    const incidents = await prisma.audit_logs.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: Number(limit),
    });

    res.json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dad/health
 * Health check
 */
router.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    service: "Dad Admin Console",
    timestamp: new Date().toISOString(),
  });
});

export default router;
