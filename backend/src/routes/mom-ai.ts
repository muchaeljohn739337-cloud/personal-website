/**
 * Mom AI Core Routes
 *
 * Endpoints for Mom AI incident handling and monitoring
 */

import express from "express";
import { momAICore } from "../ai/mom-core";
import { requireAdmin } from "../middleware/adminAuth";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

/**
 * POST /api/mom/handle-incident
 * Handle an incident using Mom AI Core
 *
 * Body:
 * {
 *   errorMessage: string,
 *   logEntries?: string[],
 *   stackTrace?: string,
 *   affectedFiles?: string[],
 *   severity: "INFO" | "WARN" | "ERROR" | "CRITICAL",
 *   userId?: string
 * }
 */
router.post("/handle-incident", authenticateToken, async (req, res) => {
  try {
    const context = {
      errorMessage: req.body.errorMessage,
      logEntries: req.body.logEntries,
      stackTrace: req.body.stackTrace,
      affectedFiles: req.body.affectedFiles,
      severity: req.body.severity || "ERROR",
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      systemState: req.body.systemState,
    };

    const result = await momAICore.handleIncident(context);

    // If decision requires approval, create approval request
    let approvalRequestId: string | undefined;
    if (result.decision.requiresApproval) {
      try {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();

        approvalRequestId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.audit_logs.create({
          data: {
            id: approvalRequestId,
            action: "APPROVAL_REQUEST_CREATED",
            userId: req.user?.id || "mom_ai",
            resourceType: "APPROVAL_REQUEST",
            resourceId: approvalRequestId,
            changes: JSON.stringify({
              codeChanges: result.solution.codeChanges,
              configChanges: result.solution.configChanges,
            }),
            metadata: JSON.stringify({
              type: "code_change",
              riskLevel: result.decision.riskLevel,
              title: `Fix: ${result.diagnosis.rootCause.substring(0, 100)}`,
              momRequestId: result.requestId,
              approvalsRequired: result.decision.riskLevel === "HIGH" ? 2 : 1,
            }),
            ipAddress: req.ip || "unknown",
            userAgent: "Mom AI Core",
            severity:
              result.decision.riskLevel === "HIGH" || result.decision.riskLevel === "EMERGENCY" ? "HIGH" : "MEDIUM",
          },
        });

        console.log(`📋 [Mom AI] Created approval request ${approvalRequestId} for ${result.requestId}`);
      } catch (error) {
        console.error("[Mom AI] Failed to create approval request:", error);
      }
    }

    res.json({
      success: true,
      requestId: result.requestId,
      approvalRequestId,
      diagnosis: {
        rootCause: result.diagnosis.rootCause,
        affectedComponents: result.diagnosis.affectedComponents,
        impactAssessment: result.diagnosis.impactAssessment,
        confidence: result.diagnosis.confidence,
      },
      solution: {
        description: result.solution.description,
        codeChanges: result.solution.codeChanges,
        configChanges: result.solution.configChanges,
        confidence: result.solution.confidence,
        estimatedImpact: result.solution.estimatedImpact,
      },
      decision: {
        approved: result.decision.approved,
        riskLevel: result.decision.riskLevel,
        confidence: result.decision.confidence,
        reasoning: result.decision.reasoning,
        requiresApproval: result.decision.requiresApproval,
        approverRoles: result.decision.approverRoles,
        sandboxRequired: result.decision.sandboxRequired,
      },
      status: result.status,
      nextSteps: result.nextSteps,
    });
  } catch (error: any) {
    console.error("[Mom AI Routes] Handle incident error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to handle incident",
    });
  }
});

/**
 * POST /api/mom/record-outcome
 * Record execution outcome after solution is applied
 *
 * Body:
 * {
 *   requestId: string,
 *   diagnosis: object,
 *   solution: object,
 *   decision: object,
 *   status: string,
 *   nextSteps: string[],
 *   executionResult: {
 *     success: boolean,
 *     error?: string,
 *     metrics?: object
 *   },
 *   feedback?: {
 *     rating: number,
 *     comments: string
 *   }
 * }
 */
router.post("/record-outcome", authenticateToken, async (req, res) => {
  try {
    const { requestId, diagnosis, solution, decision, status, nextSteps, executionResult, feedback } = req.body;

    await momAICore.recordOutcome(
      { requestId, diagnosis, solution, decision, status, nextSteps },
      executionResult,
      feedback
    );

    res.json({
      success: true,
      message: "Outcome recorded successfully",
    });
  } catch (error: any) {
    console.error("[Mom AI Routes] Record outcome error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to record outcome",
    });
  }
});

/**
 * GET /api/mom/statistics
 * Get Mom AI learning statistics
 */
router.get("/statistics", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await momAICore.getStatistics();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error: any) {
    console.error("[Mom AI Routes] Get statistics error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get statistics",
    });
  }
});

/**
 * GET /api/mom/similar-incidents
 * Query similar past incidents
 *
 * Query params:
 * - query: string (search query)
 * - limit: number (default 5)
 */
router.get("/similar-incidents", authenticateToken, async (req, res) => {
  try {
    const query = req.query.query as string;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: "Query parameter is required",
      });
    }

    const incidents = await momAICore.querySimilarIncidents(query, limit);

    res.json({
      success: true,
      count: incidents.length,
      incidents: incidents.map((incident) => ({
        requestId: incident.requestId,
        diagnosis: incident.diagnosis.rootCause,
        solution: incident.solution.description,
        success: incident.executionResult.success,
        confidence: incident.solution.confidence,
        riskLevel: incident.decision.riskLevel,
        timestamp: incident.timestamp,
      })),
    });
  } catch (error: any) {
    console.error("[Mom AI Routes] Query similar incidents error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to query incidents",
    });
  }
});

/**
 * GET /api/mom/health
 * Health check for Mom AI Core
 */
router.get("/health", async (req, res) => {
  try {
    const health = await momAICore.healthCheck();

    res.json({
      success: true,
      healthy: health.healthy,
      agents: health.agents,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Mom AI Routes] Health check error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Health check failed",
    });
  }
});

export default router;
