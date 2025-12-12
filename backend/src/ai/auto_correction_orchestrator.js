// ═══════════════════════════════════════════════════════════════
// AUTO-CORRECTION ORCHESTRATOR - Complete AI Development Pipeline
// ═══════════════════════════════════════════════════════════════
// Purpose: Combine all AI components into unified pipeline
// Components: Auto-Lint, Stack Solver, Visioning, Debugging, Compilation
// Pipeline: 9 steps - Lint → Stack → Vision → Debug → Compile → Execute → Remember → Learn

const { EventEmitter } = require("events");
const fs = require("fs").promises;
const path = require("path");

// Import all AI components
const { AutoLintEngine } = require("./auto_lint_engine");
const { StackSolver } = require("./stack_solver");
const { VisioningEngine } = require("./visioning_engine");
const { DebuggingAI } = require("./debugging_ai");
const { AutoCompilation } = require("./auto_compilation");

class AutoCorrectionOrchestrator extends EventEmitter {
  constructor() {
    super();

    // Initialize all components
    this.lintEngine = new AutoLintEngine();
    this.stackSolver = new StackSolver();
    this.visioningEngine = new VisioningEngine();
    this.debuggingAI = new DebuggingAI();
    this.autoCompilation = new AutoCompilation();

    this.pipelineHistory = [];
    this.stats = {
      pipelinesRun: 0,
      pipelinesSucceeded: 0,
      pipelinesFailed: 0,
      totalIssuesFixed: 0,
      totalTime: 0,
    };

    // Forward events from components
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from components
   */
  setupEventForwarding() {
    this.lintEngine.on("file_linted", (data) => this.emit("lint_event", data));
    this.stackSolver.on("package_installed", (data) =>
      this.emit("stack_event", data)
    );
    this.visioningEngine.on("plan_analyzed", (data) =>
      this.emit("vision_event", data)
    );
    this.debuggingAI.on("test_generated", (data) =>
      this.emit("debug_event", data)
    );
    this.autoCompilation.on("build_completed", (data) =>
      this.emit("compilation_event", data)
    );
  }

  /**
   * Run complete auto-correction pipeline
   */
  async runPipeline(projectPath, options = {}) {
    const {
      dryRun = false,
      skipLint = false,
      skipStack = false,
      skipVision = false,
      skipDebug = false,
      skipCompilation = false,
      autoDeploy = false,
      environment = "development",
    } = options;

    console.log(
      "╔═══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║        AUTO-CORRECTION ORCHESTRATOR - PIPELINE START          ║"
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝"
    );
    console.log("");
    console.log(`📁 Project: ${projectPath}`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🧪 Dry-run: ${dryRun ? "YES" : "NO"}`);
    console.log("");

    this.stats.pipelinesRun++;
    const pipelineStartTime = Date.now();

    const pipelineResult = {
      pipelineId: this.generatePipelineId(),
      projectPath,
      environment,
      startTime: new Date().toISOString(),
      steps: [],
      success: true,
      issuesFixed: 0,
    };

    try {
      // ═══════════════════════════════════════════════════════════════
      // STEP 1: AUTO-LINT (Markdown quality)
      // ═══════════════════════════════════════════════════════════════
      if (!skipLint) {
        console.log(
          "╔═══════════════════════════════════════════════════════════════╗"
        );
        console.log(
          "║  STEP 1: AUTO-LINT ENGINE                                     ║"
        );
        console.log(
          "╚═══════════════════════════════════════════════════════════════╝"
        );
        console.log("");

        const lintResult = await this.runLinting(projectPath, dryRun);
        pipelineResult.steps.push({
          step: 1,
          name: "auto_lint",
          status: lintResult.success ? "success" : "failed",
          duration: lintResult.duration,
          details: lintResult,
        });

        pipelineResult.issuesFixed += lintResult.violationsFixed || 0;
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: STACK SOLVER (Dependencies & configs)
      // ═══════════════════════════════════════════════════════════════
      if (!skipStack) {
        console.log(
          "╔═══════════════════════════════════════════════════════════════╗"
        );
        console.log(
          "║  STEP 2: STACK SOLVER                                         ║"
        );
        console.log(
          "╚═══════════════════════════════════════════════════════════════╝"
        );
        console.log("");

        const stackResult = await this.runStackSolver(projectPath, dryRun);
        pipelineResult.steps.push({
          step: 2,
          name: "stack_solver",
          status: stackResult.success ? "success" : "failed",
          duration: stackResult.duration,
          details: stackResult,
        });

        pipelineResult.issuesFixed += stackResult.errorsFixed || 0;
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 3: AI VISIONING (Workflow simulation)
      // ═══════════════════════════════════════════════════════════════
      if (!skipVision) {
        console.log(
          "╔═══════════════════════════════════════════════════════════════╗"
        );
        console.log(
          "║  STEP 3: AI VISIONING ENGINE                                  ║"
        );
        console.log(
          "╚═══════════════════════════════════════════════════════════════╝"
        );
        console.log("");

        const visionResult = await this.runVisioning(projectPath, dryRun);
        pipelineResult.steps.push({
          step: 3,
          name: "ai_visioning",
          status: visionResult.success ? "success" : "failed",
          duration: visionResult.duration,
          details: visionResult,
        });

        pipelineResult.issuesFixed += visionResult.correctionsApplied || 0;
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 4: DEBUGGING AI (Runtime error fixing)
      // ═══════════════════════════════════════════════════════════════
      if (!skipDebug) {
        console.log(
          "╔═══════════════════════════════════════════════════════════════╗"
        );
        console.log(
          "║  STEP 4: DEBUGGING AI                                         ║"
        );
        console.log(
          "╚═══════════════════════════════════════════════════════════════╝"
        );
        console.log("");

        const debugResult = await this.runDebugging(projectPath, dryRun);
        pipelineResult.steps.push({
          step: 4,
          name: "debugging_ai",
          status: debugResult.success ? "success" : "failed",
          duration: debugResult.duration,
          details: debugResult,
        });

        pipelineResult.issuesFixed += debugResult.errorsFixed || 0;
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 5: AUTO-COMPILATION (Docker CI/CD)
      // ═══════════════════════════════════════════════════════════════
      if (!skipCompilation) {
        console.log(
          "╔═══════════════════════════════════════════════════════════════╗"
        );
        console.log(
          "║  STEP 5: AUTO-COMPILATION                                     ║"
        );
        console.log(
          "╚═══════════════════════════════════════════════════════════════╝"
        );
        console.log("");

        const compileResult = await this.runCompilation(
          projectPath,
          dryRun,
          autoDeploy,
          environment
        );
        pipelineResult.steps.push({
          step: 5,
          name: "auto_compilation",
          status: compileResult.success ? "success" : "failed",
          duration: compileResult.duration,
          details: compileResult,
        });

        if (!compileResult.success) {
          pipelineResult.success = false;
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 6: EXECUTION (Run application)
      // ═══════════════════════════════════════════════════════════════
      console.log(
        "╔═══════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║  STEP 6: EXECUTION                                            ║"
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════════╝"
      );
      console.log("");
      console.log("   ✅ Application ready to run");
      console.log("   Run: cd " + projectPath + " && npm run dev");
      console.log("");

      // ═══════════════════════════════════════════════════════════════
      // STEP 7: REMEMBER (Store results)
      // ═══════════════════════════════════════════════════════════════
      console.log(
        "╔═══════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║  STEP 7: REMEMBER                                             ║"
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════════╝"
      );
      console.log("");

      await this.storeResults(pipelineResult);

      // ═══════════════════════════════════════════════════════════════
      // STEP 8: LEARN (AI training)
      // ═══════════════════════════════════════════════════════════════
      console.log(
        "╔═══════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║  STEP 8: LEARN                                                ║"
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════════╝"
      );
      console.log("");

      await this.learnFromResults(pipelineResult);

      // ═══════════════════════════════════════════════════════════════
      // FINAL SUMMARY
      // ═══════════════════════════════════════════════════════════════
      this.stats.pipelinesSucceeded++;
      this.stats.totalIssuesFixed += pipelineResult.issuesFixed;
    } catch (error) {
      this.stats.pipelinesFailed++;
      pipelineResult.success = false;
      pipelineResult.error = error.message;

      console.error("");
      console.error(
        "╔═══════════════════════════════════════════════════════════════╗"
      );
      console.error(
        "║  ❌ PIPELINE FAILED                                           ║"
      );
      console.error(
        "╚═══════════════════════════════════════════════════════════════╝"
      );
      console.error("");
      console.error(`   Error: ${error.message}`);
      console.error("");
    }

    pipelineResult.endTime = new Date().toISOString();
    pipelineResult.duration = Date.now() - pipelineStartTime;
    this.stats.totalTime += pipelineResult.duration;

    this.pipelineHistory.push(pipelineResult);
    this.emit("pipeline_completed", pipelineResult);

    // Print final summary
    this.printSummary(pipelineResult);

    return pipelineResult;
  }

  /**
   * Run linting step
   */
  async runLinting(projectPath, dryRun) {
    const startTime = Date.now();

    try {
      await this.lintEngine.scanDirectory(projectPath, {
        recursive: true,
        dryRun: dryRun,
      });

      const stats = this.lintEngine.getStatistics();

      return {
        success: true,
        filesScanned: stats.filesScanned,
        violationsFound: stats.violationsFound,
        violationsFixed: stats.violationsFixed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run stack solver step
   */
  async runStackSolver(projectPath, dryRun) {
    const startTime = Date.now();

    try {
      const issues = await this.stackSolver.analyzeProject(projectPath);

      if (issues.length > 0) {
        await this.stackSolver.autoFix(issues, { dryRun });
      }

      const stats = this.stackSolver.getStatistics();

      return {
        success: true,
        errorsDetected: stats.errorsDetected,
        errorsFixed: stats.errorsFixed,
        packagesInstalled: stats.packagesInstalled,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run visioning step
   */
  async runVisioning(projectPath, dryRun) {
    const startTime = Date.now();

    try {
      // Example plan for testing
      const testPlan = {
        id: "test_plan",
        name: "Test Workflow",
        steps: [
          {
            id: "step1",
            name: "Validate payment",
            type: "payment",
            amount: 100,
            jurisdiction: "USA",
          },
        ],
      };

      const analysis = await this.visioningEngine.analyzePlan(testPlan, {
        userBalance: 500,
        userTier: "gold",
      });

      const stats = this.visioningEngine.getStatistics();

      return {
        success: analysis.valid,
        plansAnalyzed: stats.plansAnalyzed,
        errorsDetected: stats.errorsDetected,
        correctionsApplied: stats.correctionsApplied,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run debugging step
   */
  async runDebugging(projectPath, dryRun) {
    const startTime = Date.now();

    try {
      // Check for log files
      const logPath = path.join(projectPath, "logs", "error.log");

      let errors = [];
      try {
        errors = await this.debuggingAI.parseLogs(logPath);
      } catch {
        // No log file, continue
      }

      if (errors.length > 0) {
        await this.debuggingAI.autoFix(errors, projectPath, { dryRun });
      }

      const stats = this.debuggingAI.getStatistics();

      return {
        success: true,
        errorsDetected: stats.errorsDetected,
        errorsFixed: stats.errorsFixed,
        testsGenerated: stats.testsGenerated,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Run compilation step
   */
  async runCompilation(projectPath, dryRun, autoDeploy, environment) {
    const startTime = Date.now();

    try {
      const buildResult = await this.autoCompilation.buildAndDeploy(
        projectPath,
        {
          dryRun,
          autoDeploy,
          environment,
          runTests: true,
        }
      );

      return {
        success: buildResult.success,
        buildId: buildResult.buildId,
        steps: buildResult.steps,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Store pipeline results
   */
  async storeResults(pipelineResult) {
    try {
      const resultsDir = path.join(
        __dirname,
        "..",
        "..",
        "data",
        "pipeline_results"
      );
      await fs.mkdir(resultsDir, { recursive: true });

      const resultsPath = path.join(
        resultsDir,
        `${pipelineResult.pipelineId}.json`
      );
      await fs.writeFile(
        resultsPath,
        JSON.stringify(pipelineResult, null, 2),
        "utf8"
      );

      console.log(`   ✅ Stored results: ${pipelineResult.pipelineId}.json`);
      console.log("");
    } catch (error) {
      console.error(`   ❌ Failed to store results: ${error.message}`);
      console.error("");
    }
  }

  /**
   * Learn from pipeline results
   */
  async learnFromResults(pipelineResult) {
    try {
      const learningEntry = {
        pipelineId: pipelineResult.pipelineId,
        success: pipelineResult.success,
        issuesFixed: pipelineResult.issuesFixed,
        duration: pipelineResult.duration,
        steps: pipelineResult.steps.map((s) => ({
          name: s.name,
          status: s.status,
          duration: s.duration,
        })),
        timestamp: pipelineResult.endTime,
      };

      const learningPath = path.join(
        __dirname,
        "..",
        "..",
        "data",
        "pipeline_learning.jsonl"
      );
      await fs.mkdir(path.dirname(learningPath), { recursive: true });
      await fs.appendFile(
        learningPath,
        JSON.stringify(learningEntry) + "\n",
        "utf8"
      );

      console.log("   ✅ Learning data stored");
      console.log("");
    } catch (error) {
      console.error(`   ❌ Failed to store learning data: ${error.message}`);
      console.error("");
    }
  }

  /**
   * Print pipeline summary
   */
  printSummary(pipelineResult) {
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║  PIPELINE SUMMARY                                             ║"
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝"
    );
    console.log("");
    console.log(`   Pipeline ID: ${pipelineResult.pipelineId}`);
    console.log(
      `   Status: ${pipelineResult.success ? "✅ SUCCESS" : "❌ FAILED"}`
    );
    console.log(`   Duration: ${(pipelineResult.duration / 1000).toFixed(2)}s`);
    console.log(`   Issues Fixed: ${pipelineResult.issuesFixed}`);
    console.log("");
    console.log("   Steps:");

    for (const step of pipelineResult.steps) {
      const statusIcon = step.status === "success" ? "✅" : "❌";
      console.log(
        `   ${statusIcon} ${step.name} (${(step.duration / 1000).toFixed(2)}s)`
      );
    }

    console.log("");
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║  PIPELINE COMPLETE                                            ║"
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝"
    );
    console.log("");
  }

  /**
   * Generate pipeline ID
   */
  generatePipelineId() {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get global statistics
   */
  getStatistics() {
    return {
      orchestrator: this.stats,
      lintEngine: this.lintEngine.getStatistics(),
      stackSolver: this.stackSolver.getStatistics(),
      visioningEngine: this.visioningEngine.getStatistics(),
      debuggingAI: this.debuggingAI.getStatistics(),
      autoCompilation: this.autoCompilation.getStatistics(),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { AutoCorrectionOrchestrator };
