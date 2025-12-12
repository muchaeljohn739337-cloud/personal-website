import { Response, Router } from "express";
import { getSecurity } from "../ai";
import {
  authenticateToken,
  AuthRequest,
  requireAdmin,
} from "../middleware/auth";

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/security/status
 * Get unified security system status
 */
router.get("/status", async (req: AuthRequest, res: Response) => {
  try {
    const security = getSecurity();
    const status = security.getUnifiedStatus();
    res.json(status);
  } catch (error) {
    console.error("Error fetching security status:", error);
    res.status(500).json({ error: "Failed to fetch security status" });
  }
});

/**
 * GET /api/admin/security/forensic-report
 * Get comprehensive forensic analysis
 */
router.get("/forensic-report", async (req: AuthRequest, res: Response) => {
  try {
    const security = getSecurity();
    const report = await security.getForensicReport();
    res.json(report);
  } catch (error) {
    console.error("Error generating forensic report:", error);
    res.status(500).json({ error: "Failed to generate forensic report" });
  }
});

/**
 * GET /api/admin/security/approvals
 * List pending approvals (optionally filter by status)
 */
router.get("/approvals", async (req: AuthRequest, res: Response) => {
  try {
    const { status = "PENDING" } = req.query;

    const { prisma } = require("../ai");
    const approvals = await prisma.approvalQueue.findMany({
      where: status ? { status: String(status) } : {},
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    res.json(approvals);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    res.status(500).json({ error: "Failed to fetch approvals" });
  }
});

/**
 * GET /api/admin/security/approvals/:id
 * Get specific approval details
 */
router.get("/approvals/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { prisma } = require("../ai");
    const approval = await prisma.approvalQueue.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!approval) {
      return res.status(404).json({ error: "Approval not found" });
    }

    res.json(approval);
  } catch (error) {
    console.error("Error fetching approval:", error);
    res.status(500).json({ error: "Failed to fetch approval" });
  }
});

/**
 * POST /api/admin/security/approvals/:id
 * Approve or reject an operation
 */
router.post("/approvals/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({ error: "approved must be boolean" });
    }

    if (!approved && !reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const security = getSecurity();
    const result = await security.processAdminApproval(
      id,
      req.user,
      approved ? "APPROVE" : "REJECT",
      reason
    );

    res.json(result);
  } catch (error) {
    console.error("Error processing approval:", error);
    res.status(500).json({ error: "Failed to process approval" });
  }
});

/**
 * POST /api/admin/security/disable-protect-mode
 * Emergency disable of protect mode
 */
router.post(
  "/disable-protect-mode",
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const security = getSecurity();
      const antiDetect = security.antiDetectLayer;

      if (!antiDetect.protectMode) {
        return res.status(400).json({ error: "Protect mode is not active" });
      }

      // Disable protect mode
      antiDetect.protectMode = false;
      antiDetect.frozenEndpoints.clear();

      // Log the action
      const { prisma } = require("../ai");
      await prisma.auditTrail.create({
        data: {
          event_type: "PROTECT_MODE_DISABLED",
          layer: "UNIFIED",
          admin_id: (req.user as any).id,
          action: "DISABLE_PROTECT_MODE",
          ip_address: req.ip,
          user_agent: req.get("user-agent"),
          success: true,
          forensic_data: {
            admin_email: (req.user as any).email,
            reason: req.body.reason || "Manual override by admin",
          },
        },
      });

      console.log(
        `⚠️ Protect mode DISABLED by admin ${(req.user as any).email}`
      );

      res.json({
        success: true,
        message: "Protect mode disabled",
        status: security.getUnifiedStatus(),
      });
    } catch (error) {
      console.error("Error disabling protect mode:", error);
      res.status(500).json({ error: "Failed to disable protect mode" });
    }
  }
);

/**
 * GET /api/admin/security/blocked-ips
 * List all blocked IPs
 */
router.get("/blocked-ips", async (req: AuthRequest, res: Response) => {
  try {
    const { prisma } = require("../ai");
    const blockedIPs = await prisma.blockedIP.findMany({
      where: {
        expires_at: {
          gte: new Date(),
        },
      },
      orderBy: { blocked_at: "desc" },
    });

    res.json(blockedIPs);
  } catch (error) {
    console.error("Error fetching blocked IPs:", error);
    res.status(500).json({ error: "Failed to fetch blocked IPs" });
  }
});

/**
 * POST /api/admin/security/unblock-ip/:ip
 * Manually unblock an IP address
 */
router.post("/unblock-ip/:ip", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { ip } = req.params;

    const security = getSecurity();
    const antiDetect = security.antiDetectLayer;

    // Remove from in-memory set
    antiDetect.blockedIPs.delete(ip);

    // Update database
    const { prisma } = require("../ai");
    await prisma.blockedIP.updateMany({
      where: {
        ip_address: ip,
        expires_at: {
          gte: new Date(),
        },
      },
      data: {
        expires_at: new Date(), // Set to now (expired)
      },
    });

    // Log the action
    await prisma.auditTrail.create({
      data: {
        event_type: "IP_UNBLOCKED",
        layer: "ANTI_SECURE",
        admin_id: (req.user as any).id,
        action: "UNBLOCK_IP",
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        success: true,
        forensic_data: {
          unblocked_ip: ip,
          admin_email: (req.user as any).email,
          reason: req.body.reason || "Manual unblock by admin",
        },
      },
    });

    console.log(`✅ IP ${ip} unblocked by admin ${(req.user as any).email}`);

    res.json({
      success: true,
      message: `IP ${ip} has been unblocked`,
    });
  } catch (error) {
    console.error("Error unblocking IP:", error);
    res.status(500).json({ error: "Failed to unblock IP" });
  }
});

/**
 * GET /api/admin/security/events
 * Get security events log
 */
router.get("/events", async (req: AuthRequest, res: Response) => {
  try {
    const { limit = "20", severity } = req.query;

    const { prisma } = require("../ai");
    const events = await prisma.securityEvent.findMany({
      where: severity ? { severity: String(severity) } : {},
      orderBy: { created_at: "desc" },
      take: parseInt(String(limit)),
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching security events:", error);
    res.status(500).json({ error: "Failed to fetch security events" });
  }
});

/**
 * GET /api/admin/security/audit-trail
 * Get audit trail entries
 */
router.get("/audit-trail", async (req: AuthRequest, res: Response) => {
  try {
    const { limit = "50", event_type, layer } = req.query;

    const { prisma } = require("../ai");
    const where: any = {};

    if (event_type) where.event_type = String(event_type);
    if (layer) where.layer = String(layer);

    const auditEntries = await prisma.auditTrail.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: parseInt(String(limit)),
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.json(auditEntries);
  } catch (error) {
    console.error("Error fetching audit trail:", error);
    res.status(500).json({ error: "Failed to fetch audit trail" });
  }
});

/**
 * GET /api/admin/security/honeypots
 * Get honeypot access attempts
 */
router.get("/honeypots", async (req: AuthRequest, res: Response) => {
  try {
    const { limit = "50" } = req.query;

    const { prisma } = require("../ai");
    const honeypotAccesses = await prisma.honeypotAccess.findMany({
      orderBy: { created_at: "desc" },
      take: parseInt(String(limit)),
    });

    res.json(honeypotAccesses);
  } catch (error) {
    console.error("Error fetching honeypot accesses:", error);
    res.status(500).json({ error: "Failed to fetch honeypot accesses" });
  }
});

/**
 * POST /api/admin/security/rules
 * Create custom security rule
 */
router.post("/rules", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { rule_name, layer, rule_type, pattern, action, severity } = req.body;

    if (!rule_name || !layer || !rule_type || !pattern || !action) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { prisma } = require("../ai");
    const rule = await prisma.securityRule.create({
      data: {
        rule_name,
        layer,
        rule_type,
        pattern,
        action,
        severity: severity || "MEDIUM",
        enabled: true,
      },
    });

    // Log the action
    await prisma.auditTrail.create({
      data: {
        event_type: "SECURITY_RULE_CREATED",
        layer: "UNIFIED",
        admin_id: (req.user as any).id,
        action: "CREATE_RULE",
        after_state: rule,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        success: true,
      },
    });

    res.json(rule);
  } catch (error) {
    console.error("Error creating security rule:", error);
    res.status(500).json({ error: "Failed to create security rule" });
  }
});

/**
 * GET /api/admin/security/rules
 * List all security rules
 */
router.get("/rules", async (req: AuthRequest, res: Response) => {
  try {
    const { layer, enabled } = req.query;

    const { prisma } = require("../ai");
    const where: any = {};

    if (layer) where.layer = String(layer);
    if (enabled !== undefined) where.enabled = enabled === "true";

    const rules = await prisma.securityRule.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    res.json(rules);
  } catch (error) {
    console.error("Error fetching security rules:", error);
    res.status(500).json({ error: "Failed to fetch security rules" });
  }
});

/**
 * PATCH /api/admin/security/rules/:id
 * Update security rule (enable/disable or modify)
 */
router.patch("/rules/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.params;
    const updates = req.body;

    const { prisma } = require("../ai");
    const before = await prisma.securityRule.findUnique({ where: { id } });

    if (!before) {
      return res.status(404).json({ error: "Rule not found" });
    }

    const updated = await prisma.securityRule.update({
      where: { id },
      data: updates,
    });

    // Log the action
    await prisma.auditTrail.create({
      data: {
        event_type: "SECURITY_RULE_UPDATED",
        layer: "UNIFIED",
        admin_id: (req.user as any).id,
        action: "UPDATE_RULE",
        before_state: before,
        after_state: updated,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
        success: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating security rule:", error);
    res.status(500).json({ error: "Failed to update security rule" });
  }
});

export default router;
