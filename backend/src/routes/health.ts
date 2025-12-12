import express, { Request, Response } from "express";
import os from "os";
import { config } from "../config";
import prisma from "../prismaClient";

const router = express.Router();

// Track start time for uptime calculation
const startTime = Date.now();

/**
 * Basic health check endpoint for monitoring and deployment validation
 * GET /api/health
 *
 * Returns:
 * - 200: Service healthy, database connected
 * - 503: Service unhealthy, database disconnected
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: "connected",
      version: "1.0.0",
    });
  } catch (error: any) {
    console.error("[HEALTH CHECK] Database connection failed:", error.message);

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: "disconnected",
      error: process.env.NODE_ENV === "production" ? "Service unavailable" : error.message,
    });
  }
});

/**
 * Detailed health check endpoint with comprehensive system metrics
 * GET /api/health/detailed
 *
 * Returns detailed information about:
 * - System resources (CPU, memory, disk)
 * - Database connectivity and metrics
 * - Service configuration
 * - Recent deployments and features
 * - Performance metrics
 */
router.get("/health/detailed", async (req: Request, res: Response) => {
  const startCheck = Date.now();

  try {
    // Database health check with timing
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;

    // Get database connection pool info
    let activeConnections = 0;
    let totalTransactions = 0;

    try {
      // Get recent transaction count (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTransactions = await prisma.transaction.count({
        where: {
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });
      totalTransactions = recentTransactions;
    } catch (error) {
      console.error("Failed to get transaction count:", error);
    }

    // System metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    const cpus = os.cpus();
    const loadAverage = os.loadavg();

    // Service configuration status
    const serviceStatus = {
      database: "connected",
      redis: process.env.REDIS_URL ? "configured" : "not-configured",
      stripe: config.stripeSecretKey ? "configured" : "not-configured",
      sendgrid: process.env.SENDGRID_API_KEY ? "configured" : "not-configured",
      smtp: process.env.SMTP_HOST ? "configured" : "not-configured",
      vault: process.env.VAULT_ADDR ? "configured" : "not-configured",
      openai: process.env.OPENAI_API_KEY ? "configured" : "not-configured",
      anthropic: process.env.ANTHROPIC_API_KEY ? "configured" : "not-configured",
    };

    // Email service status
    let emailService = "not-configured";
    if (process.env.SENDGRID_API_KEY) {
      emailService = "sendgrid";
    } else if (process.env.SMTP_HOST) {
      emailService = "smtp";
    } else if (process.env.NODE_ENV === "development") {
      emailService = "dev-mode (console)";
    }

    // Recent features and deployments (mock data for now - can be replaced with actual deployment tracking)
    const recentFeatures = [
      "Email service with SendGrid/SMTP",
      "Enhanced payment refunds with notifications",
      "Webhook handling for payment events",
      "Auto-failover maintenance page",
      "Comprehensive health monitoring",
    ];

    const deployments = [
      {
        timestamp: new Date().toISOString(),
        status: "active",
        features: recentFeatures.length,
      },
    ];

    // Performance metrics
    const healthCheckTime = Date.now() - startCheck;

    // Calculate overall status
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

    if (dbResponseTime > 1000) {
      overallStatus = "degraded";
    }

    if (parseFloat(memoryUsagePercent) > 90) {
      overallStatus = "degraded";
    }

    res.status(200).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),

      // System information
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: process.uptime(),
        nodeVersion: process.version,
      },

      // Resource usage
      resources: {
        memory: {
          total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
          usagePercent: `${memoryUsagePercent}%`,
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model || "Unknown",
          loadAverage: {
            "1min": loadAverage[0].toFixed(2),
            "5min": loadAverage[1].toFixed(2),
            "15min": loadAverage[2].toFixed(2),
          },
        },
      },

      // Database metrics
      database: {
        status: "connected",
        responseTime: `${dbResponseTime}ms`,
        activeConnections,
        recentTransactions: totalTransactions,
      },

      // Service configuration
      services: serviceStatus,
      emailService,

      // Recent deployments
      deployments_completed: deployments,
      new_features: recentFeatures,

      // Performance metrics
      performance: {
        healthCheckTime: `${healthCheckTime}ms`,
        databaseResponseTime: `${dbResponseTime}ms`,
        errorRate: "0%", // Placeholder - implement actual error tracking
        uptime: `${(process.uptime() / 3600).toFixed(2)} hours`,
      },

      // Environment
      environment: {
        nodeEnv: process.env.NODE_ENV || "development",
        frontendUrl: config.frontendUrl,
        port: config.port,
      },
    });
  } catch (error: any) {
    console.error("[HEALTH CHECK DETAILED] Error:", error.message);

    const healthCheckTime = Date.now() - startCheck;

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),

      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
      },

      database: {
        status: "disconnected",
        error: process.env.NODE_ENV === "production" ? "Database unavailable" : error.message,
      },

      performance: {
        healthCheckTime: `${healthCheckTime}ms`,
      },

      error: process.env.NODE_ENV === "production" ? "Service unavailable" : error.message,
    });
  }
});

export default router;
