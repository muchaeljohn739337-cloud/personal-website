// Agent Routes - API endpoints for agent management

import express from "express";
import { getAgentScheduler } from "./scheduler";
import prisma from "../prismaClient";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = express.Router();

// Get status of all agents
router.get("/status", authenticateToken, requireAdmin, (req, res) => {
  try {
    const scheduler = getAgentScheduler(prisma);
    const agents = scheduler.getAgentStatus();

    res.json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (error) {
    console.error("[Agent Routes] Error getting agent status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve agent status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Manually execute a specific agent
router.post(
  "/execute/:agentName",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { agentName } = req.params;
      const scheduler = getAgentScheduler(prisma);

      console.log(`[Agent Routes] Manually executing agent: ${agentName}`);

      const result = await scheduler.executeAgent(agentName);

      res.json({
        success: true,
        agent: agentName,
        result,
      });
    } catch (error) {
      console.error("[Agent Routes] Error executing agent:", error);
      res.status(error instanceof Error && error.message.includes("not found") ? 404 : 500).json({
        success: false,
        message: "Failed to execute agent",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get available agent names
router.get("/list", authenticateToken, requireAdmin, (req, res) => {
  const agents = [
    "MonitorAgent",
    "TransactionAuditAgent",
    "CryptoRecoveryAgent",
    "UserSupportAgent",
    "AdminInsightAgent",
    "SecurityFraudAgent",
    "CompliancePolicyAgent",
    "CostOptimizationAgent",
    "DeployOrchestratorAgent",
  ];

  res.json({
    success: true,
    agents,
  });
});

export default router;
