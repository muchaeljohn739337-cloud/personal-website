/**
 * ═══════════════════════════════════════════════════════════════
 * GOVERNANCE AI INTEGRATION MODULE
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Singleton pattern for Governance AI initialization
 */

const { GovernanceAI } = require("./governance_ai");
const prisma = require("../prismaClient");

let governanceAI = null;

/**
 * Initialize Governance AI
 */
async function initializeGovernanceAI(options = {}) {
  if (governanceAI) {
    console.log("⚠️  Governance AI already initialized");
    return governanceAI;
  }

  try {
    console.log("═══════════════════════════════════════════════════════");
    console.log("🏛️  INITIALIZING GOVERNANCE AI");
    console.log("═══════════════════════════════════════════════════════\n");

    // Prisma client is already connected via singleton

    // Create Governance AI instance
    const config = {
      enableAutoRouting: options.enableAutoRouting !== false,
      enableRiskAdaptation: options.enableRiskAdaptation !== false,
      enableComplianceLogging: options.enableComplianceLogging !== false,
      defaultRiskThreshold: options.defaultRiskThreshold || 0.7,
      ...options,
    };

    governanceAI = new GovernanceAI(config);
    console.log(
      "✅ Governance AI created with config:",
      JSON.stringify(config, null, 2)
    );

    // Set up event listeners
    governanceAI.on("payment_routed", (data) => {
      console.log(
        `✅ Payment routed: ${data.jurisdiction} via ${data.processor} ($${data.amount})`
      );
    });

    governanceAI.on("compliance_violation", (violation) => {
      console.warn(
        `⚠️  Compliance violation: ${violation.type} - ${violation.message}`
      );
    });

    governanceAI.on("risk_alert", (alert) => {
      console.warn(`🚨 Risk alert: ${alert.level} - ${alert.reason}`);
    });

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ GOVERNANCE AI READY");
    console.log("═══════════════════════════════════════════════════════\n");

    return governanceAI;
  } catch (error) {
    console.error("❌ Failed to initialize Governance AI:", error);
    throw error;
  }
}

/**
 * Get Governance AI instance
 */
function getGovernanceAI() {
  if (!governanceAI) {
    throw new Error(
      "Governance AI not initialized. Call initializeGovernanceAI() first."
    );
  }
  return governanceAI;
}

/**
 * Shutdown Governance AI
 */
async function shutdownGovernanceAI() {
  try {
    console.log("\n🛑 Shutting down Governance AI...");

    if (governanceAI) {
      const stats = governanceAI.getStatistics();
      console.log("📊 Final statistics:", JSON.stringify(stats, null, 2));

      governanceAI.clearCaches();
      console.log("✅ Caches cleared");

      governanceAI = null;
    }

    if (prisma) {
      await prisma.$disconnect();
      console.log("✅ Prisma disconnected");
      prisma = null;
    }

    console.log("✅ Governance AI shutdown complete\n");
  } catch (error) {
    console.error("❌ Error during Governance AI shutdown:", error);
    throw error;
  }
}

/**
 * Route payment with governance compliance
 */
async function routeCompliantPayment(paymentData, userData) {
  const governance = getGovernanceAI();
  return await governance.routePayment(paymentData, userData);
}

/**
 * Detect user jurisdiction
 */
async function detectUserJurisdiction(userData) {
  const governance = getGovernanceAI();
  return await governance.detectJurisdiction(userData);
}

/**
 * Calculate transaction risk
 */
async function assessTransactionRisk(paymentData, userData) {
  const governance = getGovernanceAI();
  return await governance.calculateRiskScore(paymentData, userData);
}

module.exports = {
  initializeGovernanceAI,
  getGovernanceAI,
  shutdownGovernanceAI,
  routeCompliantPayment,
  detectUserJurisdiction,
  assessTransactionRisk,
  get prisma() {
    return prisma;
  },
};
