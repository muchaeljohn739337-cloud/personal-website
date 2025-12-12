/**
 * BACKEND INTEGRATION ENTRY POINT
 * Unified Security + Guardian AI + Anti-Detect
 *
 * Drop-in replacement for existing backend initialization
 */

const { UnifiedSecurityOrchestrator } = require("./ai/unified_security");
const prisma = require("../prismaClient");
let securityOrchestrator = null;

/**
 * Initialize all security systems
 * Call this BEFORE starting Express app
 */
async function initializeSecurity() {
  console.log("\n🚀 Initializing Advancia Security Stack...\n");

  try {
    // Check database connection
    await prisma.$connect();
    console.log("✅ Database connected\n");

    // Initialize Unified Security Orchestrator
    securityOrchestrator = new UnifiedSecurityOrchestrator();
    await securityOrchestrator.initialize();

    console.log("✅ Security stack initialized successfully\n");

    return securityOrchestrator;
  } catch (error) {
    console.error("❌ Security initialization failed:", error);
    throw error;
  }
}

/**
 * Get security middleware for Express
 */
function getSecurityMiddleware() {
  if (!securityOrchestrator) {
    throw new Error(
      "Security not initialized. Call initializeSecurity() first."
    );
  }
  return securityOrchestrator.unifiedSecurityMiddleware();
}

/**
 * Get security instance for manual operations
 */
function getSecurity() {
  if (!securityOrchestrator) {
    throw new Error(
      "Security not initialized. Call initializeSecurity() first."
    );
  }
  return securityOrchestrator;
}

/**
 * Graceful shutdown
 */
async function shutdownSecurity() {
  if (securityOrchestrator) {
    console.log("\n🛡️ Shutting down security systems...");
    await prisma.$disconnect();
    console.log("✅ Security shutdown complete\n");
  }
}

module.exports = {
  initializeSecurity,
  getSecurityMiddleware,
  getSecurity,
  shutdownSecurity,
  prisma,
};
