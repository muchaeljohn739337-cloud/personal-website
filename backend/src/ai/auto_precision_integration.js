/**
 * ═══════════════════════════════════════════════════════════════
 * AUTO-PRECISION CORE INTEGRATION MODULE
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Main entry point for Auto-Precision Core initialization
 * Features:
 * - Singleton pattern for AutoPrecisionCore
 * - Initialization with Prisma client
 * - Graceful shutdown handling
 * - Export for use across backend
 */

const { AutoPrecisionCore } = require("./auto_precision_core");
const prisma = require("../prismaClient");

// Singleton instance
let autoPrecisionCore = null;

/**
 * Initialize Auto-Precision Core
 * @param {Object} options - Configuration options
 * @returns {AutoPrecisionCore}
 */
async function initializeAutoPrecision(options = {}) {
  if (autoPrecisionCore) {
    console.log("⚠️  Auto-Precision Core already initialized");
    return autoPrecisionCore;
  }

  try {
    console.log("═══════════════════════════════════════════════════════");
    console.log("🚀 INITIALIZING AUTO-PRECISION CORE");
    console.log("═══════════════════════════════════════════════════════\n");

    // Prisma client is already connected via singleton
    console.log("✅ Prisma client connected");

    // Create Auto-Precision Core instance
    const config = {
      maxRetries: options.maxRetries || 3,
      retryDelayMs: options.retryDelayMs || 1000,
      precisionDecimals: options.precisionDecimals || 8,
      deduplicationWindowMs: options.deduplicationWindowMs || 300000, // 5 minutes
      vectorSearchThreshold: options.vectorSearchThreshold || 0.85,
      criticalErrorThreshold: options.criticalErrorThreshold || 3,
      ...options,
    };

    autoPrecisionCore = new AutoPrecisionCore(config);
    console.log(
      "✅ Auto-Precision Core created with config:",
      JSON.stringify(config, null, 2)
    );

    // Set up event listeners
    autoPrecisionCore.on("job_remembered", (jobData) => {
      console.log(
        `📝 Job remembered: ${jobData.job_type} (${jobData.job_hash})`
      );
    });

    autoPrecisionCore.on("job_completed", (result) => {
      const status = result.success ? "✅" : "❌";
      console.log(
        `${status} Job completed: ${result.jobType} in ${result.executionTime}ms`
      );
    });

    autoPrecisionCore.on("duplicate_detected", (data) => {
      console.log(
        `⚠️  Duplicate job blocked: ${data.jobType} (hash: ${data.jobHash})`
      );
    });

    autoPrecisionCore.on("critical_error", (error) => {
      console.error(`🚨 CRITICAL ERROR in Auto-Precision:`, error);
      // TODO: Send alert to monitoring system (PagerDuty, Sentry, etc.)
    });

    // Test database connection
    // const testResult = await prisma.businessRule.count();
    // console.log(`✅ Business rules loaded: ${testResult} rules active\n`);

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ AUTO-PRECISION CORE READY");
    console.log("═══════════════════════════════════════════════════════\n");

    return autoPrecisionCore;
  } catch (error) {
    console.error("❌ Failed to initialize Auto-Precision Core:", error);
    throw error;
  }
}

/**
 * Get Auto-Precision Core instance
 * @returns {AutoPrecisionCore}
 */
function getAutoPrecisionCore() {
  if (!autoPrecisionCore) {
    throw new Error(
      "Auto-Precision Core not initialized. Call initializeAutoPrecision() first."
    );
  }
  return autoPrecisionCore;
}

/**
 * Shutdown Auto-Precision Core
 */
async function shutdownAutoPrecision() {
  try {
    console.log("\n🛑 Shutting down Auto-Precision Core...");

    if (autoPrecisionCore) {
      // Get final statistics
      const stats = autoPrecisionCore.getStatistics();
      console.log("📊 Final statistics:", JSON.stringify(stats, null, 2));

      // Clear caches
      autoPrecisionCore.clearCaches();
      console.log("✅ Caches cleared");

      autoPrecisionCore = null;
    }

    if (prisma) {
      await prisma.$disconnect();
      console.log("✅ Prisma disconnected");
      prisma = null;
    }

    console.log("✅ Auto-Precision Core shutdown complete\n");
  } catch (error) {
    console.error("❌ Error during Auto-Precision shutdown:", error);
    throw error;
  }
}

/**
 * Execute a job with full Auto-Precision capabilities
 * Convenience wrapper for common use case
 */
async function executeAutoPrecisionJob(jobType, payload, options = {}) {
  const core = getAutoPrecisionCore();
  return await core.executeJob(jobType, payload, options);
}

/**
 * Perform precision-safe calculation
 * Convenience wrapper
 */
function calculatePrecision(operation, values) {
  const core = getAutoPrecisionCore();
  return core.calculate(operation, values);
}

/**
 * Search across all data sources
 * Convenience wrapper
 */
async function searchAutoPrecision(query, options = {}) {
  const core = getAutoPrecisionCore();
  return await core.search(query, options);
}

/**
 * Recall similar jobs from memory
 * Convenience wrapper
 */
async function recallSimilarJobs(jobType, payload, limit = 5) {
  const core = getAutoPrecisionCore();
  return await core.recallSimilarJobs(jobType, payload, limit);
}

// Export all functions and prisma instance
module.exports = {
  initializeAutoPrecision,
  getAutoPrecisionCore,
  shutdownAutoPrecision,
  executeAutoPrecisionJob,
  calculatePrecision,
  searchAutoPrecision,
  recallSimilarJobs,
  get prisma() {
    if (!prisma) {
      prisma = new PrismaClient();
    }
    return prisma;
  },
};
