# Auto-Correction System — Complete Documentation

## 🎯 Overview

The **Auto-Correction System** is an AI-powered development pipeline that automatically detects and fixes issues in your codebase. It combines 5 major AI components into a unified 9-step pipeline:

1. **Auto-Lint Engine** — Markdown quality automation (MD036 + 5 other rules)
2. **Stack Solver** — Dependency detection and auto-install
3. **AI Visioning Engine** — Workflow simulation before execution
4. **Debugging AI** — Runtime error detection and auto-fixing
5. **Auto-Compilation** — Docker CI/CD with test automation

## 📦 Components

### 1. Auto-Lint Engine

**Purpose:** Auto-fix markdown lint violations across entire codebase

**Rules:**

- **MD036**: No bare URLs — converts `https://example.com` to `[example.com](https://example.com)`
- **MD001**: Heading increment — ensures heading levels increment by 1
- **MD009**: No trailing spaces
- **MD012**: No multiple blank lines
- **MD022**: Blank lines around headings
- **MD030**: List marker spacing

**Features:**

- Recursive directory scanning (skips node_modules, .git)
- Smart link text generation (github.com → "user/repo", docs. → "Documentation")
- Dry-run mode for safe testing
- Event emission for real-time monitoring
- Statistics tracking (files scanned, violations found/fixed)

**Usage:**

```javascript
const { AutoLintEngine } = require("./backend/src/ai/auto_lint_engine");

const linter = new AutoLintEngine();
await linter.scanDirectory("/path/to/project", {
  recursive: true,
  dryRun: false,
});

const stats = linter.getStatistics();
console.log(
  `Fixed ${stats.violationsFixed} violations in ${stats.filesScanned} files`
);
```

### 2. Stack Solver

**Purpose:** Detect and fix missing dependencies, runtime errors, misconfigurations

**Checks:**

- Missing dependencies (express, prisma, socket.io, etc.)
- Invalid TypeScript configuration
- Missing environment variables
- Docker configuration
- Database connection issues

**Features:**

- Auto-install NPM packages
- Version conflict resolution
- Environment variable validation
- Prisma client generation
- Docker daemon monitoring

**Usage:**

```javascript
const { StackSolver } = require("./backend/src/ai/stack_solver");

const solver = new StackSolver();
const issues = await solver.analyzeProject("/path/to/project");

if (issues.length > 0) {
  await solver.autoFix(issues, { dryRun: false });
}

const stats = solver.getStatistics();
console.log(
  `Fixed ${stats.errorsFixed} errors, installed ${stats.packagesInstalled} packages`
);
```

### 3. AI Visioning Engine

**Purpose:** Analyze AI workflow plans, simulate execution, detect errors before running

**Capabilities:**

- Step-by-step workflow simulation
- 5 business rules validation (funds balance, reward limits, concurrency, rate limits, data consistency)
- Risk detection (SQL injection, unsafe operations, compliance)
- Auto-generates corrected plans
- Estimates duration and resource usage

**Supported Step Types:**

- `database` — SQL operations, injection detection, WHERE clause validation
- `api_call` — Rate limit checks, error handling validation
- `payment` — Funds validation, idempotency checks, compliance
- `reward` — Tier limit validation
- `notification` — Type validation

**Usage:**

```javascript
const { VisioningEngine } = require("./backend/src/ai/visioning_engine");

const vision = new VisioningEngine();
const analysis = await vision.analyzePlan(
  {
    id: "payment_workflow",
    name: "Process Payment",
    steps: [{ id: "step1", type: "payment", amount: 100, jurisdiction: "USA" }],
  },
  {
    userBalance: 500,
    userTier: "gold",
  }
);

if (!analysis.valid) {
  const correctedPlan = await vision.generateCorrectedPlan(analysis);
}
```

### 4. Debugging AI

**Purpose:** Monitor runtime errors, auto-fix code/config issues, learn from patterns

**Error Patterns:**

- **Syntax errors** — Missing parentheses, braces, semicolons
- **Import errors** — Missing modules, incorrect paths
- **Type errors** — Invalid function calls, undefined values
- **Reference errors** — Undefined variables, missing imports
- **Database errors** — Connection issues, migration errors
- **Port conflicts** — EADDRINUSE errors
- **Environment variables** — Missing env vars
- **CORS errors** — Missing CORS middleware

**Features:**

- Log parsing and error extraction
- Auto-fix code and config issues
- Unit test generation post-fix
- Vector DB storage for learning (JSON for now)
- Event emission for monitoring

**Usage:**

```javascript
const { DebuggingAI } = require('./backend/src/ai/debugging_ai');

const debugger = new DebuggingAI();
const errors = await debugger.parseLogs('/path/to/error.log');

if (errors.length > 0) {
  await debugger.autoFix(errors, '/path/to/project', {
    dryRun: false,
    generateTests: true
  });
}

const stats = debugger.getStatistics();
console.log(`Fixed ${stats.errorsFixed} errors, generated ${stats.testsGenerated} tests`);
```

### 5. Auto-Compilation

**Purpose:** Build Docker containers, run AI-powered linting/debugging, execute tests, auto-deploy

**Pipeline Steps:**

1. Pre-build validation (check project structure, dependencies)
2. Build Docker image
3. Run AI-powered linting
4. Run test suite (unit + integration)
5. Auto-precision checks (type safety, code style, security)
6. Deploy to environment (with health checks)
7. Rollback on failure

**Features:**

- Docker integration
- AI validation (integrates Auto-Lint Engine)
- Test automation (npm test, Playwright)
- Health checks (wait for container to be ready)
- Auto-rollback on deployment failure

**Usage:**

```javascript
const { AutoCompilation } = require("./backend/src/ai/auto_compilation");

const compiler = new AutoCompilation();
const result = await compiler.buildAndDeploy("/path/to/project", {
  dryRun: false,
  autoDeploy: true,
  environment: "production",
  dockerTag: "latest",
  runTests: true,
});

if (result.success) {
  console.log(
    `Deployed to ${
      result.steps.find((s) => s.name === "deployment").deploymentUrl
    }`
  );
}
```

## 🚀 Orchestrator

The **Auto-Correction Orchestrator** combines all 5 components into a unified 9-step pipeline:

### Pipeline Flow

```
1. AUTO-LINT
   ↓ Fix markdown violations
2. STACK SOLVER
   ↓ Fix dependencies & configs
3. AI VISIONING
   ↓ Simulate workflow execution
4. DEBUGGING AI
   ↓ Fix runtime errors
5. AUTO-COMPILATION
   ↓ Build Docker + run tests
6. EXECUTION
   ↓ Run application
7. REMEMBER
   ↓ Store results
8. LEARN
   ↓ AI training
9. SUMMARY
   ↓ Report generation
```

### Usage

**Command Line:**

```bash
# Run complete pipeline
node backend/src/ai/auto_correction_cli.js

# Dry-run mode
node backend/src/ai/auto_correction_cli.js --dry-run

# Skip specific steps
node backend/src/ai/auto_correction_cli.js --skip-lint --skip-vision

# Auto-deploy to production
node backend/src/ai/auto_correction_cli.js --auto-deploy -e production

# Run on specific project
node backend/src/ai/auto_correction_cli.js -p /path/to/project
```

**Programmatic:**

```javascript
const {
  AutoCorrectionOrchestrator,
} = require("./backend/src/ai/auto_correction_orchestrator");

const orchestrator = new AutoCorrectionOrchestrator();
const result = await orchestrator.runPipeline("/path/to/project", {
  dryRun: false,
  skipLint: false,
  skipStack: false,
  skipVision: false,
  skipDebug: false,
  skipCompilation: false,
  autoDeploy: true,
  environment: "production",
});

if (result.success) {
  console.log(`Pipeline complete: ${result.issuesFixed} issues fixed`);

  // Get global statistics
  const stats = orchestrator.getStatistics();
  console.log(`Total pipelines run: ${stats.orchestrator.pipelinesRun}`);
}
```

## 📊 Event System

All components emit real-time events for monitoring:

```javascript
const orchestrator = new AutoCorrectionOrchestrator();

// Listen to component events
orchestrator.on("lint_event", (data) => {
  console.log(
    `Linted file: ${data.file}, fixed ${data.fixes.length} violations`
  );
});

orchestrator.on("stack_event", (data) => {
  console.log(`Installed package: ${data.package}@${data.version}`);
});

orchestrator.on("vision_event", (data) => {
  console.log(`Analyzed plan: ${data.planId}, valid: ${data.valid}`);
});

orchestrator.on("debug_event", (data) => {
  console.log(`Generated test: ${data.testPath}`);
});

orchestrator.on("compilation_event", (data) => {
  console.log(`Build completed: ${data.buildId}, success: ${data.success}`);
});

orchestrator.on("pipeline_completed", (result) => {
  console.log(
    `Pipeline ${result.pipelineId}: ${result.success ? "SUCCESS" : "FAILED"}`
  );
});
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in project root:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key-change-this"
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Optional
DEBUG=app:*
LOG_LEVEL=info
```

### Docker Configuration

Ensure `Dockerfile` exists in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
```

## 📈 Statistics & Analytics

Each component tracks detailed statistics:

```javascript
const stats = orchestrator.getStatistics();

console.log(stats);
// {
//   orchestrator: {
//     pipelinesRun: 5,
//     pipelinesSucceeded: 4,
//     pipelinesFailed: 1,
//     totalIssuesFixed: 127,
//     totalTime: 45000
//   },
//   lintEngine: {
//     filesScanned: 42,
//     violationsFound: 87,
//     violationsFixed: 87,
//     filesModified: 35
//   },
//   stackSolver: {
//     errorsDetected: 12,
//     errorsFixed: 12,
//     packagesInstalled: 5,
//     configsFixed: 3
//   },
//   visioningEngine: {
//     plansAnalyzed: 8,
//     errorsDetected: 3,
//     risksPrevented: 5,
//     correctionsApplied: 3
//   },
//   debuggingAI: {
//     errorsDetected: 15,
//     errorsFixed: 15,
//     testsGenerated: 8,
//     learningEntries: 15
//   },
//   autoCompilation: {
//     buildsAttempted: 5,
//     buildsSucceeded: 4,
//     buildsFailed: 1,
//     testsRun: 127,
//     deploymentsSucceeded: 3,
//     rollbacksPerformed: 1
//   }
// }
```

## 🎓 Learning System

The system learns from every pipeline run:

### Learning Data Structure

```json
{
  "pipelineId": "pipeline_1234567890_abc123",
  "success": true,
  "issuesFixed": 42,
  "duration": 12500,
  "steps": [
    { "name": "auto_lint", "status": "success", "duration": 2000 },
    { "name": "stack_solver", "status": "success", "duration": 3500 }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Storage Locations

- **Pipeline Results**: `backend/data/pipeline_results/{pipelineId}.json`
- **Learning Data**: `backend/data/pipeline_learning.jsonl`
- **AI Learning**: `backend/data/ai_learning.jsonl`

## 🚨 Troubleshooting

### Common Issues

**1. Docker not running**

```
Error: Docker daemon is not running
Solution: Start Docker Desktop or run `sudo systemctl start docker`
```

**2. Missing dependencies**

```
Error: Cannot find module 'express'
Solution: Run --skip-compilation to fix dependencies first, then retry
```

**3. Port conflict**

```
Error: EADDRINUSE :4000
Solution: Debugging AI will auto-fix by changing port in .env
```

**4. Build failures**

```
Error: Docker build failed
Solution: Check Dockerfile syntax, run with --dry-run to test
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=app:* node backend/src/ai/auto_correction_cli.js
```

## 📚 CLI Reference

```
OPTIONS:
  -h, --help              Show help message
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
  # Run complete pipeline
  node auto_correction_cli.js

  # Dry-run mode
  node auto_correction_cli.js --dry-run

  # Skip linting and visioning
  node auto_correction_cli.js --skip-lint --skip-vision

  # Production deploy
  node auto_correction_cli.js --auto-deploy -e production
```

## 🔐 Security

The system includes security checks:

- **SQL Injection Detection** — Scans queries for dangerous patterns
- **Unsafe Operations** — Validates WHERE clauses in DELETE/UPDATE
- **CORS Validation** — Ensures proper CORS configuration
- **Rate Limit Checks** — Prevents API abuse
- **Type Safety** — TypeScript validation

## 🎯 Next Steps

1. **Run your first pipeline:**

   ```bash
   cd backend
   node src/ai/auto_correction_cli.js --dry-run
   ```

2. **Review the results:**

   ```bash
   cat data/pipeline_results/pipeline_*.json
   ```

3. **Check statistics:**

   ```javascript
   const stats = orchestrator.getStatistics();
   console.log(stats);
   ```

4. **Integrate with CI/CD:**
   Add to `.github/workflows/main.yml`:
   ```yaml
   - name: Run Auto-Correction Pipeline
     run: node backend/src/ai/auto_correction_cli.js --auto-deploy -e production
   ```

## 📖 Additional Resources

- **Governance AI** — See `GOVERNANCE_AI_README.md` for payment compliance
- **Architecture** — See `.github/copilot-instructions.md` for system overview
- **API Documentation** — See `backend/README.md` for API routes

## 🤝 Support

For issues or questions:

- Create an issue in the repository
- Check troubleshooting section above
- Review pipeline logs in `backend/data/pipeline_results/`

---

**Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**Components:** 5 AI engines, 1 orchestrator, 1 CLI, 9-step pipeline
