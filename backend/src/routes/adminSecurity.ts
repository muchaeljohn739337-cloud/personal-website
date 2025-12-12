/**
 * ═══════════════════════════════════════════════════════════════
 * ADMIN SECURITY MONITORING & AI CONTROL ROUTES
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Admin console endpoints for monitoring security and AI systems
 * Features:
 * - View AI rate limiting metrics
 * - Monitor resource usage
 * - Run security tests
 * - Validate HTML
 * - Review and manage AI job queue
 * ═══════════════════════════════════════════════════════════════
 */

import express from "express";
import { aiSecurityTester } from "../ai/aiSecurityTester";
import { htmlValidator } from "../ai/htmlValidator";
import {
  getConnectorMetrics,
  getResourceMetrics,
} from "../middleware/aiRateLimiter";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════
// AI RATE LIMITING & RESOURCE MONITORING
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/security/ai-metrics
 * Get AI connector usage metrics and resource monitoring
 */
router.get(
  "/ai-metrics",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const resourceMetrics = getResourceMetrics();
      const connectorMetrics = getConnectorMetrics();

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        resources: {
          cpu: `${resourceMetrics.cpuUsage.toFixed(2)}%`,
          memory: `${resourceMetrics.memoryPercent.toFixed(2)}%`,
          memoryUsed: `${(
            resourceMetrics.memoryUsage /
            1024 /
            1024 /
            1024
          ).toFixed(2)} GB`,
          activeConnections: resourceMetrics.activeConnections,
          queueLength: resourceMetrics.queueLength,
          throttled: resourceMetrics.throttled,
          status: resourceMetrics.throttled ? "⚠️ THROTTLED" : "✅ HEALTHY",
        },
        connectors: connectorMetrics,
        thresholds: {
          cpu: "80%",
          memory: "85%",
          maxConnections: 100,
        },
      });
    } catch (error) {
      console.error("Failed to get AI metrics:", error);
      return res.status(500).json({
        error: "Failed to retrieve AI metrics",
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// SECURITY TESTING
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/admin/security/scan
 * Run security tests on specified endpoints
 */
router.post(
  "/scan",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { endpoints } = req.body;

      if (!endpoints || !Array.isArray(endpoints)) {
        return res.status(400).json({
          error: "Invalid request. Provide array of endpoints to scan.",
        });
      }

      console.log(
        `🔍 Starting security scan on ${endpoints.length} endpoints...`
      );

      const results = [];
      for (const endpoint of endpoints) {
        const report = await aiSecurityTester.scan(endpoint);
        results.push(report);
      }

      const fullReport = aiSecurityTester.generateReport(results);

      return res.json({
        success: true,
        results,
        report: fullReport,
        summary: {
          totalEndpoints: results.length,
          totalVulnerabilities: results.reduce(
            (sum, r) => sum + r.vulnerabilities.length,
            0
          ),
          avgRiskScore:
            results.reduce((sum, r) => sum + r.riskScore, 0) / results.length,
        },
      });
    } catch (error) {
      console.error("Security scan failed:", error);
      return res.status(500).json({
        error: "Failed to complete security scan",
      });
    }
  }
);

/**
 * POST /api/admin/security/auto-patch
 * Auto-patch detected vulnerabilities
 */
router.post(
  "/auto-patch",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { endpoint, vulnerabilities } = req.body;

      if (!endpoint || !vulnerabilities) {
        return res.status(400).json({
          error: "Invalid request. Provide endpoint and vulnerabilities.",
        });
      }

      console.log(
        `🔧 Auto-patching ${vulnerabilities.length} vulnerabilities...`
      );

      const result = await aiSecurityTester.autoPatch(
        endpoint,
        vulnerabilities
      );

      return res.json({
        success: true,
        patched: result.patched,
        failed: result.failed,
        recommendations: result.recommendations,
      });
    } catch (error) {
      console.error("Auto-patch failed:", error);
      return res.status(500).json({
        error: "Failed to auto-patch vulnerabilities",
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// HTML VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/admin/security/validate-html
 * Validate HTML content for issues
 */
router.post(
  "/validate-html",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const { html, autoFix } = req.body;

      if (!html) {
        return res.status(400).json({
          error: "Invalid request. Provide HTML content to validate.",
        });
      }

      console.log("🔍 Validating HTML content...");

      const issues = await htmlValidator.detectIssues(html);

      let fixedHtml = html;
      if (autoFix && issues.length > 0) {
        fixedHtml = await htmlValidator.autoFix(html, issues);
      }

      return res.json({
        success: true,
        issues,
        issueCount: issues.length,
        summary: {
          errors: issues.filter((i) => i.type === "error").length,
          warnings: issues.filter((i) => i.type === "warning").length,
          info: issues.filter((i) => i.type === "info").length,
        },
        fixed: autoFix,
        fixedHtml: autoFix ? fixedHtml : undefined,
      });
    } catch (error) {
      console.error("HTML validation failed:", error);
      return res.status(500).json({
        error: "Failed to validate HTML",
      });
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// SECURITY DASHBOARD
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/security/dashboard
 * Get comprehensive security dashboard data
 */
router.get(
  "/dashboard",
  authenticateToken as any,
  requireAdmin as any,
  async (req, res) => {
    try {
      const resourceMetrics = getResourceMetrics();
      const connectorMetrics = getConnectorMetrics();

      // Calculate health score
      const cpuHealth = Math.max(0, 100 - resourceMetrics.cpuUsage);
      const memoryHealth = Math.max(0, 100 - resourceMetrics.memoryPercent);
      const queueHealth =
        resourceMetrics.queueLength === 0
          ? 100
          : Math.max(0, 100 - resourceMetrics.queueLength);

      const overallHealth = (cpuHealth + memoryHealth + queueHealth) / 3;

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        health: {
          score: Math.round(overallHealth),
          status:
            overallHealth >= 80
              ? "HEALTHY"
              : overallHealth >= 60
              ? "WARNING"
              : "CRITICAL",
          components: {
            cpu: {
              usage: `${resourceMetrics.cpuUsage.toFixed(2)}%`,
              health: Math.round(cpuHealth),
            },
            memory: {
              usage: `${resourceMetrics.memoryPercent.toFixed(2)}%`,
              health: Math.round(memoryHealth),
            },
            queue: {
              length: resourceMetrics.queueLength,
              health: Math.round(queueHealth),
            },
          },
        },
        security: {
          throttled: resourceMetrics.throttled,
          activeConnections: resourceMetrics.activeConnections,
          connectors: connectorMetrics,
        },
        alerts: [
          ...(resourceMetrics.cpuUsage > 80
            ? [
                {
                  type: "warning",
                  message: `High CPU usage: ${resourceMetrics.cpuUsage.toFixed(
                    2
                  )}%`,
                },
              ]
            : []),
          ...(resourceMetrics.memoryPercent > 85
            ? [
                {
                  type: "critical",
                  message: `High memory usage: ${resourceMetrics.memoryPercent.toFixed(
                    2
                  )}%`,
                },
              ]
            : []),
          ...(resourceMetrics.throttled
            ? [
                {
                  type: "critical",
                  message: "System is currently throttling requests",
                },
              ]
            : []),
        ],
      });
    } catch (error) {
      console.error("Failed to get security dashboard:", error);
      return res.status(500).json({
        error: "Failed to retrieve security dashboard",
      });
    }
  }
);

export default router;
