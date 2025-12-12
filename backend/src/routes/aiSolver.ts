/**
 * Prisma AI Solver & Multi-Brain Agent API Routes
 *
 * Admin-only endpoints for AI-powered database optimization and autonomous code generation
 */

import express from "express";
import { multiBrainAgent } from "../ai/prisma/multiBrainAgent";
import { prismaSolverCore } from "../ai/prisma/prismaSolverCore";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = express.Router();

// ============================================================================
// PRISMA AI SOLVER ROUTES
// ============================================================================

/**
 * GET /api/ai-solver/prisma/status
 * Get Prisma AI Solver status and statistics
 */
router.get(
  "/prisma/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const connectionStatus = await prismaSolverCore.monitorConnectionPool();

      res.json({
        success: true,
        status: {
          healthy: connectionStatus.healthy,
          metrics: connectionStatus.metrics,
        },
      });
    } catch (error) {
      console.error("Prisma status check failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check Prisma status",
      });
    }
  }
);

/**
 * POST /api/ai-solver/prisma/analyze-schema
 * Analyze Prisma schema for issues
 */
router.post(
  "/prisma/analyze-schema",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const issues = await prismaSolverCore.analyzeSchema();

      res.json({
        success: true,
        issues,
        summary: {
          total: issues.length,
          critical: issues.filter((i) => i.severity === "critical").length,
          warnings: issues.filter((i) => i.severity === "warning").length,
          autoFixable: issues.filter((i) => i.autoFixable).length,
        },
      });
    } catch (error) {
      console.error("Schema analysis failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze schema",
      });
    }
  }
);

/**
 * POST /api/ai-solver/prisma/validate-migration
 * Validate pending migrations
 */
router.post(
  "/prisma/validate-migration",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { migrationName } = req.body;

      const validation = await prismaSolverCore.validateMigration(
        migrationName
      );

      res.json({
        success: true,
        validation,
      });
    } catch (error) {
      console.error("Migration validation failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to validate migration",
      });
    }
  }
);

/**
 * POST /api/ai-solver/prisma/optimize-query
 * Analyze and optimize a Prisma query
 */
router.post(
  "/prisma/optimize-query",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { query, context } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Query string required",
        });
      }

      const analysis = await prismaSolverCore.analyzeQuery(query, context);

      res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error("Query optimization failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to optimize query",
      });
    }
  }
);

/**
 * POST /api/ai-solver/prisma/check-type-safety
 * Check Prisma type safety
 */
router.post(
  "/prisma/check-type-safety",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const result = await prismaSolverCore.checkTypeSafety();

      res.json({
        success: true,
        typeSafety: result,
      });
    } catch (error) {
      console.error("Type safety check failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check type safety",
      });
    }
  }
);

/**
 * POST /api/ai-solver/prisma/resolve-error
 * Resolve a Prisma runtime error
 */
router.post(
  "/prisma/resolve-error",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { error, context } = req.body;

      if (!error) {
        return res.status(400).json({
          success: false,
          error: "Error object required",
        });
      }

      const resolution = await prismaSolverCore.resolveRuntimeError(
        error,
        context
      );

      res.json({
        success: true,
        resolution,
      });
    } catch (error) {
      console.error("Error resolution failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to resolve error",
      });
    }
  }
);

/**
 * POST /api/ai-solver/prisma/generate-docs
 * Generate Prisma schema documentation
 */
router.post(
  "/prisma/generate-docs",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const documentation = await prismaSolverCore.generateDocumentation();

      res.json({
        success: true,
        documentation,
        message: "Documentation generated at docs/PRISMA_SCHEMA.md",
      });
    } catch (error) {
      console.error("Documentation generation failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate documentation",
      });
    }
  }
);

/**
 * POST /api/ai-solver/prisma/full-autofix
 * Run full Prisma auto-fix pipeline
 */
router.post(
  "/prisma/full-autofix",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      console.log("🚀 Starting full Prisma auto-fix...");

      const result = await prismaSolverCore.runFullAutoFix();

      res.json({
        success: true,
        result,
        message: "Prisma auto-fix complete",
      });
    } catch (error) {
      console.error("Full auto-fix failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to run full auto-fix",
      });
    }
  }
);

// ============================================================================
// MULTI-BRAIN AI AGENT ROUTES
// ============================================================================

/**
 * GET /api/ai-solver/agent/stats
 * Get Multi-Brain AI Agent statistics
 */
router.get(
  "/agent/stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const stats = multiBrainAgent.getStatistics();

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      console.error("Failed to get agent stats:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get agent statistics",
      });
    }
  }
);

/**
 * POST /api/ai-solver/agent/execute-task
 * Execute a task with the Multi-Brain AI Agent
 */
router.post(
  "/agent/execute-task",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { title, description, target } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          error: "Title and description required",
        });
      }

      console.log(`🤖 AI Agent executing task: ${title}`);

      // Execute task asynchronously
      const result = await multiBrainAgent.executeTask({
        title,
        description,
        target,
      });

      res.json({
        success: true,
        result,
        message: "Task executed successfully",
      });
    } catch (error) {
      console.error("Task execution failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to execute task: " + (error as Error).message,
      });
    }
  }
);

/**
 * POST /api/ai-solver/agent/generate-code
 * Generate code for a specific requirement
 */
router.post(
  "/agent/generate-code",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { requirement } = req.body;

      if (!requirement) {
        return res.status(400).json({
          success: false,
          error: "Requirement description required",
        });
      }

      console.log(`🤖 Generating code for: ${requirement}`);

      const result = await multiBrainAgent.executeTask({
        title: "Code Generation",
        description: requirement,
      });

      res.json({
        success: true,
        code: result.code,
        documentation: result.documentation,
        improvements: result.improvements,
      });
    } catch (error) {
      console.error("Code generation failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate code",
      });
    }
  }
);

/**
 * POST /api/ai-solver/agent/optimize-code
 * Optimize existing code with Claude Brain
 */
router.post(
  "/agent/optimize-code",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: "Code required",
        });
      }

      const result = await multiBrainAgent.executeTask({
        title: "Code Optimization",
        description: `Optimize the following code: ${code.substring(
          0,
          100
        )}...`,
      });

      res.json({
        success: true,
        optimized: result.code,
        improvements: result.improvements,
      });
    } catch (error) {
      console.error("Code optimization failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to optimize code",
      });
    }
  }
);

/**
 * GET /api/ai-solver/health
 * Health check for AI Solver systems
 */
router.get("/health", async (req, res) => {
  try {
    const prismaHealth = await prismaSolverCore.monitorConnectionPool();
    const agentStats = multiBrainAgent.getStatistics();

    res.json({
      success: true,
      status: "healthy",
      systems: {
        prismaSolver: {
          healthy: prismaHealth.healthy,
          metrics: prismaHealth.metrics,
        },
        multiBrainAgent: {
          active: true,
          tasksExecuted: agentStats.tasksExecuted,
          successRate: agentStats.successRate,
          brainsActive: agentStats.brainsActive,
        },
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      success: false,
      error: "Health check failed",
    });
  }
});

export default router;
