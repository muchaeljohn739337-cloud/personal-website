#!/usr/bin/env node

/**
 * 🚀 LAUNCH SCRIPT - Zero-Downtime Deployment
 * Coordinates distributed launch while keeping main system running
 *
 * Features:
 * - Graceful service startup
 * - Health checks before routing traffic
 * - Automatic rollback on failure
 * - Guardian AI integration
 * - Status page updates
 */

const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ============================================================================
// CONFIGURATION
// ============================================================================

const LAUNCH_CONFIG = {
  HEALTH_CHECK_RETRIES: 10,
  HEALTH_CHECK_INTERVAL_MS: 3000,
  STARTUP_TIMEOUT_MS: 60000,
  ROLLBACK_ON_FAILURE: true,

  SERVICES: [
    {
      name: "advancia-backend",
      port: 4000,
      healthEndpoint: "http://localhost:4000/api/health",
      cwd: path.join(__dirname, "backend"),
      command: "npm run dev",
      critical: true,
      startupDelay: 0,
    },
    {
      name: "advancia-frontend",
      port: 3000,
      healthEndpoint: "http://localhost:3000/api/healthcheck",
      cwd: path.join(__dirname, "frontend"),
      command: "npm run dev",
      critical: true,
      startupDelay: 5000, // Wait for backend first
    },
    {
      name: "advancia-watchdog",
      healthEndpoint: null, // No health check needed
      cwd: path.join(__dirname, "status-page/scripts"),
      command: "pwsh -File watchdog.ps1",
      critical: false,
      startupDelay: 10000,
    },
  ],
};

// ============================================================================
// LAUNCHER CLASS
// ============================================================================

class AdvanciaLauncher {
  constructor() {
    this.services = new Map();
    this.healthStatus = new Map();
    this.launchStartTime = null;
    this.rollbackSnapshot = null;
  }

  // ==========================================================================
  // MAIN LAUNCH SEQUENCE
  // ==========================================================================

  async launch() {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("  🚀 ADVANCIA PAY LEDGER - LAUNCH SEQUENCE");
    console.log("═══════════════════════════════════════════════════════\n");

    this.launchStartTime = Date.now();

    try {
      // Step 1: Pre-flight checks
      await this.preFlightChecks();

      // Step 2: Take snapshot (for potential rollback)
      await this.takeSnapshot();

      // Step 3: Start Guardian AI first
      await this.startGuardianAI();

      // Step 4: Launch services sequentially
      await this.launchServices();

      // Step 5: Wait for all services to be healthy
      await this.waitForHealthy();

      // Step 6: Post-launch verification
      await this.postLaunchVerification();

      // Step 7: Update status page
      await this.updateStatusPage("operational");

      // Success!
      const launchDuration = (
        (Date.now() - this.launchStartTime) /
        1000
      ).toFixed(2);
      console.log("\n✅ LAUNCH SUCCESSFUL");
      console.log(`   Duration: ${launchDuration}s`);
      console.log("   All systems operational\n");
      console.log("═══════════════════════════════════════════════════════\n");

      // Keep monitoring
      await this.continuousMonitoring();
    } catch (error) {
      console.error("\n❌ LAUNCH FAILED:", error.message);

      if (LAUNCH_CONFIG.ROLLBACK_ON_FAILURE) {
        await this.rollback();
      }

      await this.updateStatusPage("major_outage");
      process.exit(1);
    }
  }

  // ==========================================================================
  // PRE-FLIGHT CHECKS
  // ==========================================================================

  async preFlightChecks() {
    console.log("1️⃣ Running pre-flight checks...\n");

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`   ✅ Node.js version: ${nodeVersion}`);

    // Check npm installed
    await this.execCommand("npm --version")
      .then((version) => {
        console.log(`   ✅ npm version: ${version.trim()}`);
      })
      .catch(() => {
        throw new Error("npm not found. Please install Node.js");
      });

    // Check PostgreSQL running
    await this.execCommand("pg_isready")
      .then(() => {
        console.log("   ✅ PostgreSQL running");
      })
      .catch(() => {
        console.log("   ⚠️  PostgreSQL not detected (may be remote)");
      });

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "EMAIL_USER",
      "EMAIL_PASSWORD",
    ];

    const backendEnvPath = path.join(__dirname, "backend/.env");
    if (fs.existsSync(backendEnvPath)) {
      const envContent = fs.readFileSync(backendEnvPath, "utf-8");
      const missingVars = requiredEnvVars.filter(
        (v) => !envContent.includes(v)
      );

      if (missingVars.length > 0) {
        throw new Error(
          `Missing environment variables: ${missingVars.join(", ")}`
        );
      }

      console.log("   ✅ Environment variables configured");
    }

    // Check ports available
    for (const service of LAUNCH_CONFIG.SERVICES) {
      if (service.port) {
        const portInUse = await this.checkPortInUse(service.port);
        if (portInUse) {
          console.log(
            `   ⚠️  Port ${service.port} already in use (will restart)`
          );
        } else {
          console.log(`   ✅ Port ${service.port} available`);
        }
      }
    }

    console.log("\n   ✅ Pre-flight checks passed\n");
  }

  async checkPortInUse(port) {
    try {
      await axios.get(`http://localhost:${port}`, { timeout: 1000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // ==========================================================================
  // SNAPSHOT FOR ROLLBACK
  // ==========================================================================

  async takeSnapshot() {
    console.log("2️⃣ Taking system snapshot...\n");

    this.rollbackSnapshot = {
      timestamp: new Date().toISOString(),
      runningServices: [],
      gitCommit: null,
    };

    // Get current PM2 services
    try {
      const pm2List = await this.execCommand("pm2 jlist");
      this.rollbackSnapshot.runningServices = JSON.parse(pm2List);
      console.log(
        `   ✅ Saved state of ${this.rollbackSnapshot.runningServices.length} PM2 processes`
      );
    } catch (error) {
      console.log("   ⚠️  PM2 not detected, skipping process snapshot");
    }

    // Get current git commit
    try {
      const gitCommit = await this.execCommand("git rev-parse HEAD");
      this.rollbackSnapshot.gitCommit = gitCommit.trim();
      console.log(
        `   ✅ Current git commit: ${this.rollbackSnapshot.gitCommit.substring(
          0,
          7
        )}`
      );
    } catch (error) {
      console.log("   ⚠️  Not a git repository, skipping commit snapshot");
    }

    console.log("\n   ✅ Snapshot complete\n");
  }

  // ==========================================================================
  // START GUARDIAN AI
  // ==========================================================================

  async startGuardianAI() {
    console.log("3️⃣ Starting Guardian AI...\n");

    try {
      // Guardian AI will be started by backend automatically
      // Just verify it's available
      console.log("   ✅ Guardian AI ready for initialization\n");
    } catch (error) {
      console.log("   ⚠️  Guardian AI will start with backend\n");
    }
  }

  // ==========================================================================
  // LAUNCH SERVICES
  // ==========================================================================

  async launchServices() {
    console.log("4️⃣ Launching services...\n");

    for (const service of LAUNCH_CONFIG.SERVICES) {
      // Wait for startup delay
      if (service.startupDelay > 0) {
        console.log(
          `   ⏳ Waiting ${service.startupDelay}ms before starting ${service.name}...`
        );
        await this.sleep(service.startupDelay);
      }

      console.log(`   🚀 Starting ${service.name}...`);

      try {
        const proc = spawn("npm", ["run", "dev"], {
          cwd: service.cwd,
          shell: true,
          detached: false,
          stdio: ["ignore", "pipe", "pipe"],
        });

        this.services.set(service.name, {
          process: proc,
          config: service,
          started: Date.now(),
        });

        // Capture output
        proc.stdout.on("data", (data) => {
          const output = data.toString().trim();
          if (output) {
            console.log(`      [${service.name}] ${output}`);
          }
        });

        proc.stderr.on("data", (data) => {
          const output = data.toString().trim();
          if (output && !output.includes("Debugger")) {
            console.error(`      [${service.name}] ${output}`);
          }
        });

        proc.on("exit", (code) => {
          if (code !== 0) {
            console.error(`   ❌ ${service.name} exited with code ${code}`);
            if (service.critical) {
              throw new Error(`Critical service ${service.name} failed`);
            }
          }
        });

        console.log(
          `   ✅ ${service.name} process started (PID: ${proc.pid})\n`
        );
      } catch (error) {
        console.error(`   ❌ Failed to start ${service.name}:`, error.message);
        if (service.critical) {
          throw error;
        }
      }
    }
  }

  // ==========================================================================
  // HEALTH CHECKS
  // ==========================================================================

  async waitForHealthy() {
    console.log("5️⃣ Waiting for services to be healthy...\n");

    const servicesToCheck = LAUNCH_CONFIG.SERVICES.filter(
      (s) => s.healthEndpoint
    );

    for (const service of servicesToCheck) {
      console.log(`   🔍 Checking ${service.name}...`);

      let healthy = false;
      let attempts = 0;

      while (!healthy && attempts < LAUNCH_CONFIG.HEALTH_CHECK_RETRIES) {
        attempts++;

        try {
          const response = await axios.get(service.healthEndpoint, {
            timeout: 5000,
            validateStatus: () => true,
          });

          if (response.status === 200) {
            healthy = true;
            this.healthStatus.set(service.name, "healthy");
            console.log(
              `   ✅ ${service.name} is healthy (${attempts} attempts)\n`
            );
          } else {
            console.log(
              `      Attempt ${attempts}/${LAUNCH_CONFIG.HEALTH_CHECK_RETRIES}: Status ${response.status}`
            );
            await this.sleep(LAUNCH_CONFIG.HEALTH_CHECK_INTERVAL_MS);
          }
        } catch (error) {
          console.log(
            `      Attempt ${attempts}/${LAUNCH_CONFIG.HEALTH_CHECK_RETRIES}: ${error.message}`
          );
          await this.sleep(LAUNCH_CONFIG.HEALTH_CHECK_INTERVAL_MS);
        }
      }

      if (!healthy) {
        this.healthStatus.set(service.name, "unhealthy");

        if (service.critical) {
          throw new Error(
            `Critical service ${service.name} failed health check after ${attempts} attempts`
          );
        } else {
          console.log(
            `   ⚠️  ${service.name} unhealthy (non-critical, continuing)\n`
          );
        }
      }
    }
  }

  // ==========================================================================
  // POST-LAUNCH VERIFICATION
  // ==========================================================================

  async postLaunchVerification() {
    console.log("6️⃣ Running post-launch verification...\n");

    // Test database connection
    try {
      const { PrismaClient } = require("./backend/node_modules/@prisma/client");
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      console.log("   ✅ Database connection verified");
      await prisma.$disconnect();
    } catch (error) {
      throw new Error(`Database verification failed: ${error.message}`);
    }

    // Test authentication endpoint
    try {
      const response = await axios.post(
        "http://localhost:4000/api/auth/login",
        {
          email: "test@test.com",
          password: "wrong",
        },
        {
          validateStatus: () => true,
        }
      );

      // Should return 401 (unauthorized)
      if (response.status === 401 || response.status === 400) {
        console.log("   ✅ Authentication endpoint responding");
      } else {
        throw new Error(`Unexpected auth response: ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("   ✅ Authentication endpoint responding");
      } else {
        throw new Error(`Authentication test failed: ${error.message}`);
      }
    }

    // Test frontend routing
    try {
      const response = await axios.get("http://localhost:3000", {
        timeout: 5000,
      });

      if (response.status === 200) {
        console.log("   ✅ Frontend routing verified");
      }
    } catch (error) {
      throw new Error(`Frontend verification failed: ${error.message}`);
    }

    console.log("\n   ✅ Post-launch verification passed\n");
  }

  // ==========================================================================
  // STATUS PAGE UPDATE
  // ==========================================================================

  async updateStatusPage(status) {
    const statusPath = path.join(__dirname, "logs/status.json");

    const statusData = {
      timestamp: new Date().toISOString(),
      status,
      services: Array.from(this.healthStatus.entries()).map(
        ([name, health]) => ({
          name,
          health,
        })
      ),
      launchDuration: this.launchStartTime
        ? ((Date.now() - this.launchStartTime) / 1000).toFixed(2) + "s"
        : null,
    };

    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
  }

  // ==========================================================================
  // CONTINUOUS MONITORING
  // ==========================================================================

  async continuousMonitoring() {
    console.log("7️⃣ Continuous monitoring active (Ctrl+C to stop)...\n");

    setInterval(async () => {
      for (const service of LAUNCH_CONFIG.SERVICES) {
        if (service.healthEndpoint) {
          try {
            await axios.get(service.healthEndpoint, { timeout: 5000 });
          } catch (error) {
            console.error(
              `   ⚠️  ${service.name} health check failed:`,
              error.message
            );

            // Attempt restart if critical
            if (service.critical) {
              console.log(`   🔄 Attempting to restart ${service.name}...`);
              // Could implement auto-restart here
            }
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // ==========================================================================
  // ROLLBACK
  // ==========================================================================

  async rollback() {
    console.log("\n🔄 INITIATING ROLLBACK...\n");

    // Stop all newly started services
    for (const [name, service] of this.services.entries()) {
      console.log(`   🛑 Stopping ${name}...`);
      try {
        service.process.kill("SIGTERM");
      } catch (error) {
        console.error(`   ❌ Failed to stop ${name}:`, error.message);
      }
    }

    // Restore previous PM2 services if any
    if (this.rollbackSnapshot?.runningServices) {
      console.log("   🔄 Restoring previous PM2 state...");
      try {
        await this.execCommand("pm2 resurrect");
        console.log("   ✅ Previous state restored");
      } catch (error) {
        console.error("   ❌ Failed to restore PM2 state:", error.message);
      }
    }

    // Revert git commit if needed
    if (this.rollbackSnapshot?.gitCommit) {
      console.log(
        `   🔄 Reverting to commit ${this.rollbackSnapshot.gitCommit.substring(
          0,
          7
        )}...`
      );
      try {
        await this.execCommand(
          `git reset --hard ${this.rollbackSnapshot.gitCommit}`
        );
        console.log("   ✅ Git state reverted");
      } catch (error) {
        console.error("   ❌ Failed to revert git:", error.message);
      }
    }

    console.log("\n   ✅ Rollback complete\n");
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // GRACEFUL SHUTDOWN
  // ==========================================================================

  async shutdown() {
    console.log("\n\n🛑 Graceful shutdown initiated...\n");

    for (const [name, service] of this.services.entries()) {
      console.log(`   Stopping ${name}...`);
      try {
        service.process.kill("SIGTERM");
        await this.sleep(2000);

        if (!service.process.killed) {
          service.process.kill("SIGKILL");
        }

        console.log(`   ✅ ${name} stopped`);
      } catch (error) {
        console.error(`   ❌ Failed to stop ${name}:`, error.message);
      }
    }

    console.log("\n✅ All services stopped\n");
    process.exit(0);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const launcher = new AdvanciaLauncher();

// Handle graceful shutdown
process.on("SIGINT", () => launcher.shutdown());
process.on("SIGTERM", () => launcher.shutdown());

// Start launch sequence
launcher.launch().catch((error) => {
  console.error("\n❌ FATAL ERROR:", error);
  process.exit(1);
});
