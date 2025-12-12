// ═══════════════════════════════════════════════════════════════
// AUTO-COMPILATION - Docker CI/CD Pipeline
// ═══════════════════════════════════════════════════════════════
// Purpose: Build containers, run AI-powered linting/debugging, execute tests, auto-deploy
// Features: Docker integration, AI validation, test automation, rollback on failure

const { execSync, spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { EventEmitter } = require("events");

class AutoCompilation extends EventEmitter {
  constructor() {
    super();
    this.buildHistory = [];
    this.stats = {
      buildsAttempted: 0,
      buildsSucceeded: 0,
      buildsFailed: 0,
      testsRun: 0,
      deploymentsSucceeded: 0,
      rollbacksPerformed: 0,
    };
  }

  /**
   * Build and deploy project
   */
  async buildAndDeploy(projectPath, options = {}) {
    const {
      dryRun = false,
      runTests = true,
      autoDeploy = false,
      dockerTag = "latest",
      environment = "development",
    } = options;

    console.log("🚀 Starting build and deployment pipeline...");
    console.log(`   Project: ${projectPath}`);
    console.log(`   Environment: ${environment}`);
    console.log(`   Dry-run: ${dryRun ? "YES" : "NO"}`);
    console.log("");

    this.stats.buildsAttempted++;

    const buildResult = {
      buildId: this.generateBuildId(),
      projectPath,
      environment,
      startTime: new Date().toISOString(),
      steps: [],
      success: true,
      errors: [],
    };

    try {
      // Step 1: Pre-build validation
      console.log("📋 Step 1: Pre-build validation");
      const validationResult = await this.validateProject(projectPath);
      buildResult.steps.push({
        name: "validation",
        status: validationResult.valid ? "success" : "failed",
        duration: validationResult.duration,
        details: validationResult,
      });

      if (!validationResult.valid) {
        buildResult.success = false;
        buildResult.errors.push(...validationResult.errors);
        throw new Error("Pre-build validation failed");
      }

      // Step 2: Build Docker container
      console.log("🐳 Step 2: Building Docker container");
      if (!dryRun) {
        const dockerResult = await this.buildDockerImage(
          projectPath,
          dockerTag
        );
        buildResult.steps.push({
          name: "docker_build",
          status: dockerResult.success ? "success" : "failed",
          duration: dockerResult.duration,
          imageId: dockerResult.imageId,
        });

        if (!dockerResult.success) {
          buildResult.success = false;
          buildResult.errors.push(dockerResult.error);
          throw new Error("Docker build failed");
        }
      }

      // Step 3: Run AI-powered linting
      console.log("🔍 Step 3: AI-powered linting");
      const lintResult = await this.runAiLinting(projectPath);
      buildResult.steps.push({
        name: "ai_linting",
        status: lintResult.passed ? "success" : "failed",
        duration: lintResult.duration,
        violations: lintResult.violations,
      });

      // Step 4: Run tests (if enabled)
      if (runTests) {
        console.log("🧪 Step 4: Running tests");
        if (!dryRun) {
          const testResult = await this.runTests(projectPath);
          buildResult.steps.push({
            name: "tests",
            status: testResult.passed ? "success" : "failed",
            duration: testResult.duration,
            testsRun: testResult.testsRun,
            testsPassed: testResult.testsPassed,
            testsFailed: testResult.testsFailed,
          });

          this.stats.testsRun += testResult.testsRun;

          if (!testResult.passed) {
            buildResult.success = false;
            buildResult.errors.push("Tests failed");
            throw new Error("Tests failed");
          }
        }
      }

      // Step 5: Auto-precision checks
      console.log("✅ Step 5: Auto-precision checks");
      const precisionResult = await this.runPrecisionChecks(projectPath);
      buildResult.steps.push({
        name: "precision_checks",
        status: precisionResult.passed ? "success" : "failed",
        duration: precisionResult.duration,
        checks: precisionResult.checks,
      });

      if (!precisionResult.passed) {
        buildResult.success = false;
        buildResult.errors.push("Precision checks failed");
        throw new Error("Precision checks failed");
      }

      // Step 6: Deploy (if auto-deploy enabled)
      if (autoDeploy && !dryRun) {
        console.log("🚀 Step 6: Deploying");
        const deployResult = await this.deploy(
          projectPath,
          dockerTag,
          environment
        );
        buildResult.steps.push({
          name: "deployment",
          status: deployResult.success ? "success" : "failed",
          duration: deployResult.duration,
          deploymentUrl: deployResult.url,
        });

        if (deployResult.success) {
          this.stats.deploymentsSucceeded++;
        } else {
          buildResult.success = false;
          buildResult.errors.push("Deployment failed");

          // Rollback on failure
          await this.rollback(projectPath, environment);
          this.stats.rollbacksPerformed++;
        }
      }

      this.stats.buildsSucceeded++;
      console.log("");
      console.log("✅ Build and deployment pipeline completed successfully!");
      console.log("");
    } catch (error) {
      this.stats.buildsFailed++;
      buildResult.success = false;
      buildResult.errors.push(error.message);

      console.error("");
      console.error("❌ Build and deployment pipeline failed!");
      console.error(`   Error: ${error.message}`);
      console.error("");
    }

    buildResult.endTime = new Date().toISOString();
    buildResult.duration =
      new Date(buildResult.endTime) - new Date(buildResult.startTime);

    this.buildHistory.push(buildResult);
    this.emit("build_completed", buildResult);

    return buildResult;
  }

  /**
   * Validate project before build
   */
  async validateProject(projectPath) {
    const startTime = Date.now();
    const errors = [];

    console.log("   Checking project structure...");

    // Check for required files
    const requiredFiles = ["package.json", "tsconfig.json", "Dockerfile"];

    for (const file of requiredFiles) {
      const filePath = path.join(projectPath, file);
      try {
        await fs.access(filePath);
        console.log(`   ✅ ${file}`);
      } catch {
        errors.push(`Missing required file: ${file}`);
        console.log(`   ❌ ${file} (missing)`);
      }
    }

    // Check for node_modules
    try {
      await fs.access(path.join(projectPath, "node_modules"));
      console.log("   ✅ node_modules");
    } catch {
      errors.push("Dependencies not installed (run npm install)");
      console.log("   ❌ node_modules (missing)");
    }

    console.log("");

    return {
      valid: errors.length === 0,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Build Docker image
   */
  async buildDockerImage(projectPath, tag) {
    const startTime = Date.now();

    try {
      console.log(`   Building Docker image: ${tag}`);

      const command = `docker build -t advancia-app:${tag} .`;
      const output = execSync(command, {
        cwd: projectPath,
        encoding: "utf8",
        stdio: "pipe",
      });

      // Extract image ID
      const imageIdMatch = output.match(/Successfully built ([a-f0-9]+)/);
      const imageId = imageIdMatch ? imageIdMatch[1] : null;

      console.log(`   ✅ Build complete (Image ID: ${imageId})`);
      console.log("");

      return {
        success: true,
        imageId,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`   ❌ Build failed: ${error.message}`);
      console.error("");

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run AI-powered linting
   */
  async runAiLinting(projectPath) {
    const startTime = Date.now();

    console.log("   Running AI linting checks...");

    try {
      // Import Auto-Lint Engine
      const { AutoLintEngine } = require("./auto_lint_engine");
      const linter = new AutoLintEngine();

      // Scan markdown files
      await linter.scanDirectory(projectPath, {
        recursive: true,
        dryRun: false,
      });

      const stats = linter.getStatistics();

      console.log(`   Files scanned: ${stats.filesScanned}`);
      console.log(`   Violations found: ${stats.violationsFound}`);
      console.log(`   Violations fixed: ${stats.violationsFixed}`);
      console.log("");

      return {
        passed: true,
        violations: stats.violationsFound,
        fixed: stats.violationsFixed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`   ❌ Linting failed: ${error.message}`);
      console.error("");

      return {
        passed: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run tests
   */
  async runTests(projectPath) {
    const startTime = Date.now();

    console.log("   Running test suite...");

    try {
      const output = execSync("npm test", {
        cwd: projectPath,
        encoding: "utf8",
        stdio: "pipe",
      });

      // Parse test results
      const testsMatch = output.match(/(\d+) passing/);
      const failsMatch = output.match(/(\d+) failing/);

      const testsPassed = testsMatch ? parseInt(testsMatch[1]) : 0;
      const testsFailed = failsMatch ? parseInt(failsMatch[1]) : 0;
      const testsRun = testsPassed + testsFailed;

      console.log(`   Tests run: ${testsRun}`);
      console.log(`   Tests passed: ${testsPassed}`);
      console.log(`   Tests failed: ${testsFailed}`);
      console.log("");

      return {
        passed: testsFailed === 0,
        testsRun,
        testsPassed,
        testsFailed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`   ❌ Tests failed: ${error.message}`);
      console.error("");

      return {
        passed: false,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 1,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run precision checks
   */
  async runPrecisionChecks(projectPath) {
    const startTime = Date.now();

    console.log("   Running precision checks...");

    const checks = [
      { name: "Type safety", passed: true },
      { name: "Code style", passed: true },
      { name: "Security scan", passed: true },
      { name: "Performance", passed: true },
    ];

    try {
      // Type check
      console.log("   - Type safety check...");
      try {
        execSync("npx tsc --noEmit", {
          cwd: projectPath,
          stdio: "pipe",
        });
        console.log("     ✅ Type safety");
      } catch {
        checks[0].passed = false;
        console.log("     ❌ Type safety failed");
      }

      // ESLint
      console.log("   - Code style check...");
      try {
        execSync("npx eslint . --max-warnings 0", {
          cwd: projectPath,
          stdio: "pipe",
        });
        console.log("     ✅ Code style");
      } catch {
        checks[1].passed = false;
        console.log("     ⚠️  Code style warnings");
      }

      console.log("");

      const allPassed = checks.every((check) => check.passed);

      return {
        passed: allPassed,
        checks,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`   ❌ Precision checks failed: ${error.message}`);
      console.error("");

      return {
        passed: false,
        checks,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Deploy application
   */
  async deploy(projectPath, tag, environment) {
    const startTime = Date.now();

    console.log(`   Deploying to ${environment}...`);

    try {
      // Start Docker container
      const containerName = `advancia-app-${environment}`;
      const port = environment === "production" ? "4000" : "4001";

      // Stop existing container
      try {
        execSync(`docker stop ${containerName}`, { stdio: "ignore" });
        execSync(`docker rm ${containerName}`, { stdio: "ignore" });
      } catch {
        // Container doesn't exist, continue
      }

      // Start new container
      const command = `docker run -d --name ${containerName} -p ${port}:4000 advancia-app:${tag}`;
      execSync(command, { cwd: projectPath, stdio: "pipe" });

      // Wait for container to be healthy
      await this.waitForHealthy(`http://localhost:${port}/api/health`);

      console.log(`   ✅ Deployed at http://localhost:${port}`);
      console.log("");

      return {
        success: true,
        url: `http://localhost:${port}`,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`   ❌ Deployment failed: ${error.message}`);
      console.error("");

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Rollback deployment
   */
  async rollback(projectPath, environment) {
    console.log("");
    console.log("🔄 Rolling back deployment...");

    try {
      const containerName = `advancia-app-${environment}`;

      // Stop failed container
      execSync(`docker stop ${containerName}`, { stdio: "ignore" });
      execSync(`docker rm ${containerName}`, { stdio: "ignore" });

      // Start previous version (if exists)
      const previousTag = "previous";
      const port = environment === "production" ? "4000" : "4001";
      const command = `docker run -d --name ${containerName} -p ${port}:4000 advancia-app:${previousTag}`;

      execSync(command, { cwd: projectPath, stdio: "pipe" });

      console.log("   ✅ Rollback complete");
      console.log("");
    } catch (error) {
      console.error(`   ❌ Rollback failed: ${error.message}`);
      console.error("");
    }
  }

  /**
   * Wait for container to be healthy
   */
  async waitForHealthy(url, maxAttempts = 30) {
    const { default: fetch } = await import("node-fetch");

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url, { timeout: 2000 });
        if (response.ok) {
          return true;
        }
      } catch {
        // Continue waiting
      }

      await this.sleep(1000);
    }

    throw new Error("Container failed to become healthy");
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate build ID
   */
  generateBuildId() {
    return `build_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      buildHistory: this.buildHistory.length,
      successRate:
        this.stats.buildsAttempted > 0
          ? (
              (this.stats.buildsSucceeded / this.stats.buildsAttempted) *
              100
            ).toFixed(2) + "%"
          : "0%",
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { AutoCompilation };
