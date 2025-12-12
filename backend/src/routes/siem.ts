/**
 * SIEM Analytics Routes
 *
 * Endpoints for querying threat intelligence and security analytics
 */

import express from "express";
import { requireAdmin } from "../middleware/adminAuth";
import { authenticateToken } from "../middleware/auth";
import { siemIntegration } from "../services/SIEMIntegration";

const router = express.Router();

/**
 * GET /api/siem/analytics
 * Query threat analytics from Elasticsearch
 */
router.get("/analytics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const timeRange = (req.query.timeRange as string) || "24h";
    const analytics = await siemIntegration.queryThreatAnalytics(timeRange);

    res.json({
      success: true,
      data: analytics,
      enabled: siemIntegration.isEnabled(),
    });
  } catch (error: any) {
    console.error("Failed to query SIEM analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/siem/status
 * Get SIEM integration status
 */
router.get("/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      enabled: siemIntegration.isEnabled(),
      elasticsearch: {
        configured: !!process.env.ELASTICSEARCH_URL,
        url: process.env.ELASTICSEARCH_URL || "Not configured",
      },
      alertChannels: {
        slack: !!process.env.SLACK_WEBHOOK_URL,
        pagerduty: !!process.env.PAGERDUTY_API_KEY,
        email: !!process.env.EMAIL_ENABLED,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/siem/health
 * Health check for SIEM service
 */
router.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    siem_enabled: siemIntegration.isEnabled(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
