#!/usr/bin/env node

/**
 * AI Copilot Setup Verification Script
 * Tests that all Copilot components are properly installed and configured
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 AI Copilot Setup Verification\n");
console.log("=".repeat(50));

const checks = [];

// Check 1: Files exist
console.log("\n📁 Checking Files...");
const requiredFiles = [
  "src/ai/copilot/CopilotService.ts",
  "src/ai/copilot/RAGEngine.ts",
  "src/ai/copilot/TaskGenerator.ts",
  "src/ai/copilot/FeedbackLearner.ts",
  "src/agents/CopilotAgent.ts",
  "src/routes/copilot.ts",
];

for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? "✅" : "❌"} ${file}`);
  checks.push({ name: file, passed: exists });
}

// Check 2: NPM packages
console.log("\n📦 Checking NPM Packages...");
const packageJson = require("./package.json");
const requiredPackages = [
  "openai",
  "@anthropic-ai/sdk",
  "@pinecone-database/pinecone",
  "chromadb",
  "uuid",
];

for (const pkg of requiredPackages) {
  const installed = packageJson.dependencies[pkg] !== undefined;
  console.log(`  ${installed ? "✅" : "❌"} ${pkg}`);
  checks.push({ name: `npm:${pkg}`, passed: installed });
}

// Check 3: Environment variables
console.log("\n⚙️  Checking Environment Variables...");
require("dotenv").config();
const requiredEnvVars = [
  "COPILOT_LLM_PROVIDER",
  "COPILOT_MODEL",
  "COPILOT_ENABLE_RAG",
  "COPILOT_VECTOR_DB",
];

for (const envVar of requiredEnvVars) {
  const exists = process.env[envVar] !== undefined;
  console.log(
    `  ${exists ? "✅" : "❌"} ${envVar} = ${
      process.env[envVar] || "(not set)"
    }`
  );
  checks.push({ name: `env:${envVar}`, passed: exists });
}

// Check 4: Integration points
console.log("\n🔗 Checking Integration Points...");

// Check scheduler.ts
const schedulerContent = fs.readFileSync("src/agents/scheduler.ts", "utf8");
const schedulerHasCopilot = schedulerContent.includes("CopilotAgent");
console.log(
  `  ${
    schedulerHasCopilot ? "✅" : "❌"
  } CopilotAgent registered in scheduler.ts`
);
checks.push({ name: "scheduler:CopilotAgent", passed: schedulerHasCopilot });

// Check index.ts
const indexContent = fs.readFileSync("src/index.ts", "utf8");
const indexHasRoute = indexContent.includes("app.use('/api/copilot'");
const indexHasImport = indexContent.includes("copilotRouter");
const indexHasInit = indexContent.includes("copilotService.initialize");
console.log(
  `  ${indexHasRoute ? "✅" : "❌"} Copilot routes registered in index.ts`
);
console.log(`  ${indexHasImport ? "✅" : "❌"} Copilot imports in index.ts`);
console.log(
  `  ${indexHasInit ? "✅" : "❌"} Copilot initialization in index.ts`
);
checks.push({ name: "index:route", passed: indexHasRoute });
checks.push({ name: "index:import", passed: indexHasImport });
checks.push({ name: "index:init", passed: indexHasInit });

// Check schema.prisma
const schemaContent = fs.readFileSync("prisma/schema.prisma", "utf8");
const schemaHasModels =
  schemaContent.includes("model CopilotTask") &&
  schemaContent.includes("model CopilotInteraction") &&
  schemaContent.includes("model CopilotFeedback") &&
  schemaContent.includes("model CodebaseIndex");
console.log(
  `  ${schemaHasModels ? "✅" : "❌"} Copilot models in schema.prisma`
);
checks.push({ name: "schema:models", passed: schemaHasModels });

// Summary
console.log("\n" + "=".repeat(50));
const passed = checks.filter((c) => c.passed).length;
const total = checks.length;
const percentage = ((passed / total) * 100).toFixed(1);

console.log(
  `\n📊 Results: ${passed}/${total} checks passed (${percentage}%)\n`
);

if (passed === total) {
  console.log("✅ AI Copilot setup is COMPLETE!\n");
  console.log("Next steps:");
  console.log("1. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to Vault");
  console.log("2. Start backend: npm run dev");
  console.log("3. Test endpoint: POST /api/copilot/chat");
  process.exit(0);
} else {
  console.log("❌ AI Copilot setup is INCOMPLETE!\n");
  console.log("Failed checks:");
  checks
    .filter((c) => !c.passed)
    .forEach((c) => {
      console.log(`  - ${c.name}`);
    });
  process.exit(1);
}
