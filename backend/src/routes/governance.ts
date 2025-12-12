// ═══════════════════════════════════════════════════════════════
// GOVERNANCE AI API ROUTES
// ═══════════════════════════════════════════════════════════════
// Purpose: API endpoints for multi-jurisdiction payment compliance
// Routes: /api/governance/*

import { Request, Response, Router } from "express";
import {
  assessTransactionRisk,
  detectUserJurisdiction,
  getGovernanceAI,
  routeCompliantPayment,
} from "../ai/governance_integration";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE: Extract User Data
// ═══════════════════════════════════════════════════════════════

/**
 * Extract user data for governance checks
 * Gets IP, country, KYC status, transaction history
 */
async function enrichUserData(req: Request, userId?: string) {
  const ipAddress = req.ip || (req.headers["x-forwarded-for"] as string) || "0.0.0.0";

  if (!userId) {
    return {
      ipAddress,
      country: null,
      kycStatus: "none",
      transactionHistory: { total: 0, last24h: 0, last30d: 0 },
    };
  }

  // Fetch user from database
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      // country, kycStatus, isPEP don't exist in users schema
    },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  // Get transaction counts
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [count24h, count30d] = await Promise.all([
    prisma.transactions.count({
      where: { userId, createdAt: { gte: last24h } },
    }),
    prisma.transactions.count({
      where: { userId, createdAt: { gte: last30d } },
    }),
  ]);

  return {
    userId: user.id,
    ipAddress,
    country: null, // Field doesn't exist in users schema
    kycStatus: "none", // Field doesn't exist in users schema
    isPEP: false, // Field doesn't exist in users schema
    transactionHistory: {
      total: 0, // _count.transactions doesn't exist
      last24h: count24h,
      last30d: count30d,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// ROUTE 1: Route Payment with Compliance
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/governance/route
 * Route payment through compliance checks
 * Body: { amount, currency, method, userId? }
 */
router.post("/route", async (req: Request, res: Response) => {
  try {
    const { amount, currency, method, userId } = req.body;

    // Validate input
    if (!amount || !currency || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, currency, method",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than 0",
      });
    }

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      method,
      description: req.body.description || "Payment",
      metadata: req.body.metadata || {},
    };

    // Enrich user data
    const userData = await enrichUserData(req, userId);

    // Route payment through Governance AI
    const result = await routeCompliantPayment(paymentData, userData);

    // Return result
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    console.error("❌ Payment routing error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during payment routing",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 2: Detect User Jurisdiction
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/governance/jurisdiction
 * Detect user's jurisdiction based on multiple signals
 * Query: userId (optional)
 */
router.get("/jurisdiction", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    // Enrich user data
    const userData = await enrichUserData(req, userId as string);

    // Detect jurisdiction
    const result = await detectUserJurisdiction(userData);

    return res.status(200).json({
      success: true,
      jurisdiction: result.jurisdiction,
      confidence: result.confidence,
      signals: result.signals,
    });
  } catch (error: any) {
    console.error("❌ Jurisdiction detection error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during jurisdiction detection",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 3: Assess Transaction Risk
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/governance/risk
 * Assess risk for a transaction
 * Body: { amount, currency, method, userId? }
 */
router.post("/risk", async (req: Request, res: Response) => {
  try {
    const { amount, currency, method, userId } = req.body;

    // Validate input
    if (!amount || !currency || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, currency, method",
      });
    }

    // Prepare payment data
    const paymentData = {
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      method,
    };

    // Enrich user data
    const userData = await enrichUserData(req, userId);

    // Assess risk
    const result = await assessTransactionRisk(paymentData, userData);

    return res.status(200).json({
      success: true,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      factors: result.factors,
      recommendation: result.recommendation,
    });
  } catch (error: any) {
    console.error("❌ Risk assessment error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during risk assessment",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 4: Get Available Processors
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/governance/processors
 * Get available payment processors for jurisdiction
 * Query: jurisdiction (optional, auto-detect if not provided)
 */
router.get("/processors", async (req: Request, res: Response) => {
  try {
    const { jurisdiction, userId } = req.query;

    let detectedJurisdiction = jurisdiction as string;

    // Auto-detect jurisdiction if not provided
    if (!detectedJurisdiction && userId) {
      const userData = await enrichUserData(req, userId as string);
      const result = await detectUserJurisdiction(userData);
      detectedJurisdiction = result.jurisdiction;
    }

    if (!detectedJurisdiction) {
      detectedJurisdiction = "GLOBAL"; // Fallback
    }

    // Get processors from database
    const processors = await prisma.processor_configs.findMany({
      where: {
        enabled: true,
        jurisdictions: {
          has: detectedJurisdiction,
        },
      },
      select: {
        processor_id: true,
        processor_name: true,
        features: true,
        fees: true,
        settlement_time_days: true,
        max_amount: true,
        rating: true,
      },
      orderBy: {
        rating: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      jurisdiction: detectedJurisdiction,
      processors,
    });
  } catch (error: any) {
    console.error("❌ Processor lookup error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during processor lookup",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 5: Get Jurisdiction Rules
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/governance/rules/:jurisdiction
 * Get compliance rules for specific jurisdiction
 * Params: jurisdiction (USA, CAN, GBR, EUR, GLOBAL)
 */
router.get("/rules/:jurisdiction", async (req: Request, res: Response) => {
  try {
    const { jurisdiction } = req.params;

    // Normalize jurisdiction
    const normalizedJurisdiction = jurisdiction.toUpperCase();

    // Get rules from database
    const rules = await prisma.jurisdiction_rules.findUnique({
      where: { jurisdiction: normalizedJurisdiction },
    });

    if (!rules) {
      return res.status(404).json({
        success: false,
        error: `Rules for jurisdiction ${normalizedJurisdiction} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      rules,
    });
  } catch (error: any) {
    console.error("❌ Rules lookup error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during rules lookup",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 6: Get Compliance Report for Transaction
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/governance/compliance/:transactionId
 * Get compliance report for specific transaction
 * Params: transactionId
 */
router.get("/compliance/:transactionId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    // Get compliance logs for transaction
    const logs = await prisma.compliance_logs.findMany({
      where: {
        payment_id: transactionId,
      },
      orderBy: {
        timestamp: "desc",
      },
    });

    if (logs.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No compliance logs found for transaction ${transactionId}`,
      });
    }

    // Get risk assessment if exists
    const riskAssessment = await prisma.risk_assessments.findFirst({
      where: { transaction_id: transactionId },
      orderBy: { assessedAt: "desc" },
    });

    // Get compliance alerts if any
    const alerts = await prisma.compliance_alerts.findMany({
      where: { transaction_id: transactionId },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({
      success: true,
      transaction_id: transactionId,
      compliance_logs: logs,
      risk_assessment: riskAssessment,
      alerts,
    });
  } catch (error: any) {
    console.error("❌ Compliance report error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during compliance report",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 7: Get Governance Statistics (Admin Only)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/governance/statistics
 * Get Governance AI statistics
 * Requires admin authentication
 */
router.get("/statistics", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const governanceAI = getGovernanceAI();
    const stats = governanceAI.getStatistics();

    // Get database statistics
    const [totalLogs, totalAlerts, openAlerts, totalRiskAssessments] = await Promise.all([
      prisma.compliance_logs.count(),
      prisma.compliance_alerts.count(),
      prisma.compliance_alerts.count({ where: { status: "OPEN" } }),
      prisma.risk_assessments.count(),
    ]);

    // Get jurisdiction breakdown
    const jurisdictionBreakdown = await prisma.compliance_logs.groupBy({
      by: ["jurisdiction"],
      _count: true,
      orderBy: {
        _count: {
          jurisdiction: "desc",
        },
      },
    });

    // Get processor usage
    const processorUsage = await prisma.compliance_logs.groupBy({
      by: ["processor"],
      _count: true,
      where: {
        processor: { not: null },
      },
      orderBy: {
        _count: {
          processor: "desc",
        },
      },
    });

    return res.status(200).json({
      success: true,
      runtime_stats: stats,
      database_stats: {
        total_logs: totalLogs,
        total_alerts: totalAlerts,
        open_alerts: openAlerts,
        total_risk_assessments: totalRiskAssessments,
      },
      jurisdiction_breakdown: jurisdictionBreakdown,
      processor_usage: processorUsage,
    });
  } catch (error: any) {
    console.error("❌ Statistics error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during statistics retrieval",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 8: Update Jurisdiction Rules (Admin Only)
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/governance/rules/:jurisdiction
 * Update compliance rules for jurisdiction
 * Requires admin authentication
 */
router.put("/rules/:jurisdiction", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { jurisdiction } = req.params;
    const { regulators, requirements, allowed_processors, restricted_countries, compliance_level } = req.body;

    // Normalize jurisdiction
    const normalizedJurisdiction = jurisdiction.toUpperCase();

    // Update rules
    const updatedRules = await prisma.jurisdiction_rules.update({
      where: { jurisdiction: normalizedJurisdiction },
      data: {
        regulators: regulators || undefined,
        requirements: requirements || undefined,
        allowed_processors: allowed_processors || undefined,
        restrictedCountries: restricted_countries || undefined,
        complianceLevel: compliance_level || undefined,
        lastUpdated: new Date(),
      },
    });

    // Clear cache in Governance AI
    const governanceAI = getGovernanceAI();
    governanceAI.clearCaches();

    return res.status(200).json({
      success: true,
      message: `Jurisdiction rules for ${normalizedJurisdiction} updated successfully`,
      rules: updatedRules,
    });
  } catch (error: any) {
    console.error("❌ Rules update error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during rules update",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 9: Resolve Compliance Alert (Admin Only)
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/governance/alerts/:alertId/resolve
 * Resolve a compliance alert
 * Requires admin authentication
 */
router.put("/alerts/:alertId/resolve", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolution_notes, status } = req.body;

    if (!status || !["RESOLVED", "FALSE_POSITIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be RESOLVED or FALSE_POSITIVE",
      });
    }

    // Update alert
    const updatedAlert = await prisma.compliance_alerts.update({
      where: { id: alertId },
      data: {
        status,
        resolution_notes: resolution_notes || "",
        resolvedAt: new Date(),
        assignedTo: (req as any).user?.id, // From authenticateToken middleware
      },
    });

    return res.status(200).json({
      success: true,
      message: `Compliance alert ${alertId} resolved`,
      alert: updatedAlert,
    });
  } catch (error: any) {
    console.error("❌ Alert resolution error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during alert resolution",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 10: Get Open Compliance Alerts (Admin Only)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/governance/alerts
 * Get all open compliance alerts
 * Requires admin authentication
 */
router.get("/alerts", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, severity, limit } = req.query;

    const alerts = await prisma.compliance_alerts.findMany({
      where: {
        status: status ? (status as string) : "OPEN",
        severity: severity ? (severity as string) : undefined,
      },
      orderBy: [{ severity: "desc" }, { created_at: "desc" }],
      take: limit ? parseInt(limit as string) : 100,
    });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error: any) {
    console.error("❌ Alerts retrieval error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during alerts retrieval",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE 11: Tax Calculator
// ═══════════════════════════════════════════════════════════════

/**
 * Tax rates by jurisdiction
 */
const TAX_RATES: Record<string, { name: string; rates: Record<string, number>; currency: string }> = {
  IN: {
    name: "India (GST)",
    currency: "INR",
    rates: {
      exempt: 0,
      essential: 0,
      reduced: 5,
      standard: 12,
      higher: 18,
      luxury: 28,
    },
  },
  US: {
    name: "United States (Sales Tax)",
    currency: "USD",
    rates: {
      exempt: 0,
      reduced: 4,
      standard: 7,
      higher: 10,
    },
  },
  GB: {
    name: "United Kingdom (VAT)",
    currency: "GBP",
    rates: {
      exempt: 0,
      reduced: 5,
      standard: 20,
    },
  },
  EU: {
    name: "European Union (VAT)",
    currency: "EUR",
    rates: {
      exempt: 0,
      reduced: 9,
      standard: 21,
      luxury: 27,
    },
  },
};

/**
 * POST /api/governance/calculate
 * Calculate tax for a given amount and jurisdiction
 * Body: { amount, jurisdiction, rateType, hsnCode? }
 */
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const { amount, jurisdiction = "IN", rateType = "standard", hsnCode } = req.body;

    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount. Must be a positive number.",
      });
    }

    const baseAmount = parseFloat(amount);
    const jurisdictionUpper = jurisdiction.toUpperCase();

    // Get tax rates for jurisdiction
    const taxConfig = TAX_RATES[jurisdictionUpper];
    if (!taxConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported jurisdiction: ${jurisdiction}. Supported: ${Object.keys(TAX_RATES).join(", ")}`,
      });
    }

    // Get rate
    const rateKey = rateType.toLowerCase();
    const rate = taxConfig.rates[rateKey];
    if (rate === undefined) {
      return res.status(400).json({
        success: false,
        error: `Invalid rate type: ${rateType}. Available for ${jurisdictionUpper}: ${Object.keys(taxConfig.rates).join(", ")}`,
      });
    }

    // Calculate tax
    const taxAmount = (baseAmount * rate) / 100;
    const totalAmount = baseAmount + taxAmount;

    // Build response
    const result = {
      success: true,
      calculation: {
        baseAmount: Number(baseAmount.toFixed(2)),
        taxRate: rate,
        taxAmount: Number(taxAmount.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        currency: taxConfig.currency,
      },
      jurisdiction: {
        code: jurisdictionUpper,
        name: taxConfig.name,
        rateType: rateKey,
      },
      breakdown: {
        subtotal: Number(baseAmount.toFixed(2)),
        [`${taxConfig.name.includes("GST") ? "GST" : taxConfig.name.includes("VAT") ? "VAT" : "Tax"} @ ${rate}%`]:
          Number(taxAmount.toFixed(2)),
        total: Number(totalAmount.toFixed(2)),
      },
      hsnCode: hsnCode || null,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Tax calculation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during tax calculation",
    });
  }
});

/**
 * GET /api/governance/tax-rates
 * Get available tax rates for all jurisdictions
 */
router.get("/tax-rates", async (req: Request, res: Response) => {
  try {
    const { jurisdiction } = req.query;

    if (jurisdiction) {
      const code = (jurisdiction as string).toUpperCase();
      const config = TAX_RATES[code];
      if (!config) {
        return res.status(404).json({
          success: false,
          error: `Jurisdiction not found: ${code}`,
        });
      }
      return res.status(200).json({
        success: true,
        jurisdiction: {
          code,
          ...config,
        },
      });
    }

    // Return all jurisdictions
    const jurisdictions = Object.entries(TAX_RATES).map(([code, config]) => ({
      code,
      name: config.name,
      currency: config.currency,
      rates: config.rates,
    }));

    return res.status(200).json({
      success: true,
      jurisdictions,
    });
  } catch (error: any) {
    console.error("❌ Tax rates retrieval error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// EXPORT ROUTER
// ═══════════════════════════════════════════════════════════════

export default router;
