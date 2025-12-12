/**
 * Admin Security Management Routes
 * Provides endpoints for IP whitelist/blacklist management and secret rotation
 * Admin-only access with comprehensive audit logging
 */

import express, { Request, Response } from "express";
import { adminAuth } from "../middleware/adminAuth";
import { blockIP, BlockReason, getIPStats, unblockIP, whitelistIP } from "../middleware/ipFilter";
import prisma from "../prismaClient";

const router = express.Router();

/**
 * GET /api/admin/security/ip/whitelist
 * List all whitelisted IPs
 */
router.get("/ip/whitelist", adminAuth, async (req: Request, res: Response) => {
  try {
    const whitelist = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        ip_address: string;
        description: string;
        created_at: Date;
        expires_at: Date | null;
        active: boolean;
      }>
    >(`
      SELECT * FROM ip_whitelist 
      WHERE active = TRUE 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      count: whitelist.length,
      data: whitelist,
    });
  } catch (error) {
    console.error("Error fetching whitelist:", error);
    res.status(500).json({ error: "Failed to fetch whitelist" });
  }
});

/**
 * GET /api/admin/security/ip/blacklist
 * List all blacklisted IPs
 */
router.get("/ip/blacklist", adminAuth, async (req: Request, res: Response) => {
  try {
    const blacklist = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        ip_address: string;
        reason: string;
        block_count: number;
        created_at: Date;
        expires_at: Date | null;
        active: boolean;
      }>
    >(`
      SELECT * FROM ip_blacklist 
      WHERE active = TRUE 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      count: blacklist.length,
      data: blacklist,
    });
  } catch (error) {
    console.error("Error fetching blacklist:", error);
    res.status(500).json({ error: "Failed to fetch blacklist" });
  }
});

/**
 * POST /api/admin/security/ip/whitelist
 * Add IP to whitelist
 */
router.post("/ip/whitelist", adminAuth, async (req: Request, res: Response) => {
  try {
    const { ip_address, description, expires_in_hours } = req.body;

    if (!ip_address) {
      return res.status(400).json({ error: "IP address is required" });
    }

    const userId = (req as any).userId;

    await whitelistIP(ip_address, description || "Added via admin panel", userId, expires_in_hours);

    // Log action
    await prisma.audit_logs.create({
      data: {
        userId: userId,
        action: "IP_WHITELISTED",
        resourceType: "SECURITY",
        resourceId: ip_address,
        ipAddress: req.ip || "unknown",
        metadata: {
          target_ip: ip_address,
          description,
          expires_in_hours,
        } as any,
        severity: "MEDIUM",
      },
    });

    res.json({
      success: true,
      message: `IP ${ip_address} added to whitelist`,
    });
  } catch (error) {
    console.error("Error whitelisting IP:", error);
    res.status(500).json({ error: "Failed to whitelist IP" });
  }
});

/**
 * POST /api/admin/security/ip/blacklist
 * Add IP to blacklist
 */
router.post("/ip/blacklist", adminAuth, async (req: Request, res: Response) => {
  try {
    const { ip_address, reason, expires_in_hours } = req.body;

    if (!ip_address) {
      return res.status(400).json({ error: "IP address is required" });
    }

    const userId = (req as any).userId;

    await blockIP(ip_address, reason || BlockReason.MANUAL_BLOCK, expires_in_hours, userId);

    // Log action
    await prisma.audit_logs.create({
      data: {
        userId: userId,
        action: "IP_BLOCKED",
        resourceType: "SECURITY",
        resourceId: ip_address,
        ipAddress: req.ip || "unknown",
        metadata: {
          target_ip: ip_address,
          reason,
          expires_in_hours,
        } as any,
        severity: "HIGH",
      },
    });

    res.json({
      success: true,
      message: `IP ${ip_address} added to blacklist`,
    });
  } catch (error) {
    console.error("Error blacklisting IP:", error);
    res.status(500).json({ error: "Failed to blacklist IP" });
  }
});

/**
 * DELETE /api/admin/security/ip/blacklist/:ip
 * Remove IP from blacklist
 */
router.delete("/ip/blacklist/:ip", adminAuth, async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const userId = (req as any).userId;

    await unblockIP(ip);

    // Log action
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        action: "IP_UNBLOCKED",
        resource_type: "SECURITY",
        resource_id: ip,
        ip_address: req.ip || "unknown",
        metadata: {
          target_ip: ip,
        } as any,
        severity: "MEDIUM",
      },
    });

    res.json({
      success: true,
      message: `IP ${ip} removed from blacklist`,
    });
  } catch (error) {
    console.error("Error unblocking IP:", error);
    res.status(500).json({ error: "Failed to unblock IP" });
  }
});

/**
 * GET /api/admin/security/ip/stats/:ip
 * Get detailed statistics for an IP
 */
router.get("/ip/stats/:ip", adminAuth, async (req: Request, res: Response) => {
  try {
    const { ip } = req.params;
    const stats = await getIPStats(ip);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching IP stats:", error);
    res.status(500).json({ error: "Failed to fetch IP stats" });
  }
});

/**
 * GET /api/admin/security/audit-logs
 * Get recent security audit logs
 */
router.get("/audit-logs", adminAuth, async (req: Request, res: Response) => {
  try {
    const { severity, action, limit = 100 } = req.query;

    const where: any = {};

    if (severity) {
      where.severity = severity;
    }

    if (action) {
      where.action = action;
    }

    const logs = await prisma.audit_logs.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      take: parseInt(limit as string),
      select: {
        id: true,
        user_id: true,
        action: true,
        resource_type: true,
        resource_id: true,
        ip_address: true,
        user_agent: true,
        metadata: true,
        severity: true,
        created_at: true,
      },
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

/**
 * GET /api/admin/security/secret-exposures
 * Get logs of prevented secret exposures
 */
router.get("/secret-exposures", adminAuth, async (req: Request, res: Response) => {
  try {
    const exposures = await prisma.audit_logs.findMany({
      where: {
        action: "SECRET_EXPOSURE_PREVENTED",
      },
      orderBy: {
        created_at: "desc",
      },
      take: 50,
      select: {
        id: true,
        user_id: true,
        resource_id: true,
        ip_address: true,
        user_agent: true,
        metadata: true,
        created_at: true,
      },
    });

    res.json({
      success: true,
      count: exposures.length,
      data: exposures,
    });
  } catch (error) {
    console.error("Error fetching secret exposures:", error);
    res.status(500).json({ error: "Failed to fetch secret exposures" });
  }
});

/**
 * GET /api/admin/security/dashboard
 * Get security dashboard statistics
 */
router.get("/dashboard", adminAuth, async (req: Request, res: Response) => {
  try {
    // Get counts
    const [totalWhitelisted, totalBlacklisted, recentBlocks, secretExposures, criticalEvents] = await Promise.all([
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM ip_whitelist WHERE active = TRUE`
      ),
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM ip_blacklist WHERE active = TRUE`
      ),
      prisma.audit_logs.count({
        where: {
          action: "IP_BLOCKED",
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
      prisma.audit_logs.count({
        where: {
          action: "SECRET_EXPOSURE_PREVENTED",
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.audit_logs.count({
        where: {
          severity: "CRITICAL",
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get top blocked IPs
    const topBlockedIPs = await prisma.$queryRawUnsafe<
      Array<{ ip_address: string; block_count: number; reason: string }>
    >(`
      SELECT ip_address, block_count, reason 
      FROM ip_blacklist 
      WHERE active = TRUE 
      ORDER BY block_count DESC 
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        whitelisted_count: Number(totalWhitelisted[0]?.count || 0),
        blacklisted_count: Number(totalBlacklisted[0]?.count || 0),
        recent_blocks_24h: recentBlocks,
        secret_exposures_24h: secretExposures,
        critical_events_24h: criticalEvents,
        top_blocked_ips: topBlockedIPs,
        status: secretExposures === 0 ? "✅ SECURE" : "⚠️  MONITORING",
      },
    });
  } catch (error) {
    console.error("Error fetching security dashboard:", error);
    res.status(500).json({ error: "Failed to fetch security dashboard" });
  }
});

/**
 * POST /api/admin/security/test-secret-protection
 * Test endpoint to verify secret protection is working
 */
router.post("/test-secret-protection", adminAuth, async (req: Request, res: Response) => {
  try {
    const testSecret = "sk-test-1234567890abcdefghijklmnopqrstuvwxyz";

    // This should be auto-redacted
    const result = {
      message: "Testing secret protection",
      test_data: {
        exposed_secret: testSecret,
        api_key: testSecret,
      },
    };

    // The middleware will auto-correct this before sending
    res.json(result);
  } catch (error) {
    console.error("Error in secret protection test:", error);
    res.status(500).json({ error: "Test failed" });
  }
});

export default router;
