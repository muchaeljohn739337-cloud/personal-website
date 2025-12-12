import express from "express";
import { config } from "../config";
import prisma from "../prismaClient";

const router = express.Router();

// GET /api/system/cors-origins - returns computed allowed CORS origins
router.get("/cors-origins", (req, res) => {
  return res.json({
    allowedOrigins: config.allowedOrigins,
    count: config.allowedOrigins.length,
    nodeEnv: config.nodeEnv,
  });
});

// Simple health extension (optional)
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "system",
    time: new Date().toISOString(),
    version: "2025-11-01-v3", // Version marker to confirm deployment
    buildTime: "2025-11-01T20:33:00Z",
  });
});

// GET /api/system/status - returns system-wide status for frontend banner
router.get("/status", async (req, res) => {
  try {
    // Check if SystemStatus table has any alerts
    const services = await prisma.system_status.findMany({
      orderBy: { updatedAt: "desc" },
    });

    // Determine overall status
    let overallStatus: "operational" | "degraded" | "down" = "operational";
    let alertLevel: "none" | "warning" | "danger" = "none";

    if (services.length > 0) {
      const hasDown = services.some((s: any) => s.status === "down");
      const hasDegraded = services.some((s: any) => s.status === "degraded");
      const hasDanger = services.some((s: any) => s.alertLevel === "danger");
      const hasWarning = services.some((s: any) => s.alertLevel === "warning");

      if (hasDown) overallStatus = "down";
      else if (hasDegraded) overallStatus = "degraded";

      if (hasDanger) alertLevel = "danger";
      else if (hasWarning) alertLevel = "warning";
    }

    return res.json({
      overall: {
        status: overallStatus,
        alertLevel,
        timestamp: new Date().toISOString(),
      },
      services: services.map((s: any) => ({
        serviceName: s.serviceName,
        status: s.status,
        statusMessage: s.statusMessage || "",
        alertLevel: s.alertLevel || "none",
      })),
    });
  } catch (error) {
    console.error("Error fetching system status:", error);
    return res.status(500).json({
      overall: {
        status: "operational",
        alertLevel: "none",
        timestamp: new Date().toISOString(),
      },
      services: [],
    });
  }
});

export default router;
