#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// AUTO-CORRECTION CLI - Command-Line Interface
// ═══════════════════════════════════════════════════════════════

const {
  AutoCorrectionOrchestrator,
} = require("./auto_correction_orchestrator");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);

// Default options
const options = {
  projectPath: process.cwd(),
  dryRun: false,
  skipLint: false,
  skipStack: false,
  skipVision: false,
  skipDebug: false,
  skipCompilation: false,
  autoDeploy: false,
  environment: "development",
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case "--help":
    case "-h":
      printHelp();
      process.exit(0);
      break;

    case "--dry-run":
      options.dryRun = true;
      break;

    case "--skip-lint":
      options.skipLint = true;
      break;

    case "--skip-stack":
      options.skipStack = true;
      break;

    case "--skip-vision":
      options.skipVision = true;
      break;

    case "--skip-debug":
      options.skipDebug = true;
      break;

    case "--skip-compilation":
      options.skipCompilation = true;
      break;

    case "--auto-deploy":
      options.autoDeploy = true;
      break;

    case "--environment":
    case "-e":
      options.environment = args[++i];
      break;

    case "--project":
    case "-p":
      options.projectPath = path.resolve(args[++i]);
      break;

    default:
      if (arg.startsWith("-")) {
        console.error(`Unknown option: ${arg}`);
        console.error("Use --help for usage information");
        process.exit(1);
      }
  }
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     AUTO-CORRECTION CLI - AI-Powered Development Pipeline     ║
╚═══════════════════════════════════════════════════════════════╝

USAGE:
  node auto_correction_cli.js [OPTIONS]

OPTIONS:
  -h, --help              Show this help message
  -p, --project <path>    Project path (default: current directory)
  -e, --environment <env> Environment (development|production)
  
  --dry-run              Test mode - no actual changes
  --auto-deploy          Auto-deploy after successful build
  
  --skip-lint            Skip Auto-Lint Engine step
  --skip-stack           Skip Stack Solver step
  --skip-vision          Skip AI Visioning step
  --skip-debug           Skip Debugging AI step
  --skip-compilation     Skip Auto-Compilation step

EXAMPLES:
  # Run complete pipeline in current directory
  node auto_correction_cli.js
  
  # Dry-run mode (test only)
  node auto_correction_cli.js --dry-run
  
  # Skip linting and stack solving
  node auto_correction_cli.js --skip-lint --skip-stack
  
  # Run with auto-deploy in production
  node auto_correction_cli.js --auto-deploy -e production
  
  # Run on specific project
  node auto_correction_cli.js -p /path/to/project

PIPELINE STEPS:
  1. Auto-Lint      - Fix markdown violations (MD036, etc.)
  2. Stack Solver   - Fix dependencies and configs
  3. AI Visioning   - Simulate workflow execution
  4. Debugging AI   - Fix runtime errors
  5. Compilation    - Build Docker container
  6. Execution      - Run application
  7. Remember       - Store results
  8. Learn          - AI training

For more information, see: AUTO_CORRECTION_README.md
`);
}

/**
 * Main execution
 */
async function main() {
  console.log("");
  console.log(
    "╔═══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║     AUTO-CORRECTION CLI - AI-Powered Development Pipeline     ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝"
  );
  console.log("");

  try {
    const orchestrator = new AutoCorrectionOrchestrator();

    // Run pipeline
    const result = await orchestrator.runPipeline(options.projectPath, options);

    // Print global statistics
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║  GLOBAL STATISTICS                                            ║"
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝"
    );
    console.log("");

    const stats = orchestrator.getStatistics();
    console.log(`   Pipelines Run: ${stats.orchestrator.pipelinesRun}`);
    console.log(
      `   Pipelines Succeeded: ${stats.orchestrator.pipelinesSucceeded}`
    );
    console.log(`   Pipelines Failed: ${stats.orchestrator.pipelinesFailed}`);
    console.log(
      `   Total Issues Fixed: ${stats.orchestrator.totalIssuesFixed}`
    );
    console.log(
      `   Total Time: ${(stats.orchestrator.totalTime / 1000).toFixed(2)}s`
    );
    console.log("");

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("");
    console.error(
      "╔═══════════════════════════════════════════════════════════════╗"
    );
    console.error(
      "║  ❌ FATAL ERROR                                               ║"
    );
    console.error(
      "╚═══════════════════════════════════════════════════════════════╝"
    );
    console.error("");
    console.error(`   ${error.message}`);
    console.error("");
    console.error("   Stack trace:");
    console.error(error.stack);
    console.error("");
    process.exit(1);
  }
}

// Run CLI
main();
