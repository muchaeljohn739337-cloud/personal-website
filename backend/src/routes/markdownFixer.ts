/**
 * ═══════════════════════════════════════════════════════════════
 * MARKDOWN AUTO-FIXER ADMIN ROUTES
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Admin endpoints to trigger markdown auto-fixing
 * ═══════════════════════════════════════════════════════════════
 */

import { Router } from "express";
import path from "path";
import {
  markdownAutoFixer,
  runMarkdownAutoFixer,
} from "../ai/markdownAutoFixer";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

// ═══════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/markdown-fixer/stats
 * Get current markdown fixer statistics
 */
router.get(
  "/stats",
  authenticateToken as any,
  requireAdmin,
  async (req: any, res) => {
    try {
      const stats = markdownAutoFixer.getStats();
      return res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Error getting markdown fixer stats:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get stats",
      });
    }
  }
);

/**
 * POST /api/markdown-fixer/run
 * Manually trigger markdown auto-fixing
 */
router.post(
  "/run",
  authenticateToken as any,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { directory } = req.body;

      // Run async (don't wait for completion)
      const projectRoot = path.resolve(__dirname, "../../..");
      const targetDir = directory || projectRoot;

      // Reset stats before run
      markdownAutoFixer.resetStats();

      // Start fixing in background
      runMarkdownAutoFixer(targetDir)
        .then(() => {
          console.log("✅ Markdown auto-fixing completed");
        })
        .catch((error) => {
          console.error("❌ Markdown auto-fixing failed:", error);
        });

      return res.json({
        success: true,
        message: "Markdown auto-fixing started",
        targetDirectory: targetDir,
      });
    } catch (error) {
      console.error("Error running markdown fixer:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to start markdown fixer",
      });
    }
  }
);

/**
 * POST /api/markdown-fixer/fix-file
 * Fix a specific markdown file
 */
router.post(
  "/fix-file",
  authenticateToken as any,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: "File path is required",
        });
      }

      const result = await markdownAutoFixer.fixMarkdownFile(filePath);

      return res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error("Error fixing markdown file:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fix markdown file",
      });
    }
  }
);

/**
 * POST /api/markdown-fixer/reset-stats
 * Reset markdown fixer statistics
 */
router.post(
  "/reset-stats",
  authenticateToken as any,
  requireAdmin,
  async (req: any, res) => {
    try {
      markdownAutoFixer.resetStats();

      return res.json({
        success: true,
        message: "Statistics reset",
      });
    } catch (error) {
      console.error("Error resetting stats:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to reset stats",
      });
    }
  }
);

export default router;
