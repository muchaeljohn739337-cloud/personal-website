/**
 * Sandbox API Routes
 *
 * Endpoints for testing code changes in isolated Docker environments
 */

import express from "express";
import { requireAdmin } from "../middleware/adminAuth";
import { authenticateToken } from "../middleware/auth";
import { sandboxRunner } from "../services/SandboxRunner";

const router = express.Router();

/**
 * POST /api/sandbox/test
 * Test code changes in sandbox environment
 */
router.post("/test", authenticateToken, async (req, res) => {
  try {
    const { codeChanges, testCommand, timeout, branchName } = req.body;

    if (!codeChanges || !Array.isArray(codeChanges)) {
      return res.status(400).json({
        success: false,
        error: "codeChanges array is required",
      });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job = {
      id: jobId,
      branchName: branchName || `sandbox-${jobId}`,
      codeChanges,
      testCommand: testCommand || "npm test",
      timeout: timeout || 600,
      createdAt: new Date(),
    };

    // Run sandbox asynchronously
    const result = await sandboxRunner.runSandbox(job);

    res.json({
      success: true,
      jobId,
      result,
    });
  } catch (error: any) {
    console.error("Failed to run sandbox test:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/sandbox/jobs/:jobId
 * Cancel running sandbox job
 */
router.delete("/jobs/:jobId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { jobId } = req.params;
    const cancelled = await sandboxRunner.cancelJob(jobId);

    res.json({
      success: true,
      cancelled,
      message: cancelled ? "Job cancelled" : "Job not found or already completed",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/sandbox/status
 * Get sandbox runner status
 */
router.get("/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      activeJobs: sandboxRunner.getActiveJobsCount(),
      activeJobIds: sandboxRunner.getActiveJobIds(),
      dockerAvailable: true,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      dockerAvailable: false,
    });
  }
});

/**
 * GET /api/sandbox/health
 * Health check
 */
router.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
