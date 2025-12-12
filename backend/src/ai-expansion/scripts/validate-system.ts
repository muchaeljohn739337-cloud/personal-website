#!/usr/bin/env tsx
/**
 * AI System Pre-Expansion Validation
 *
 * Checks system health before AI expansion to prevent errors
 */

import { config } from "dotenv";
config(); // Load .env file

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

class AISystemValidator {
  private results: ValidationResult[] = [];

  /**
   * Run all validation checks
   */
  async validate(): Promise<void> {
    console.log("🔍 AI System Pre-Expansion Validation\n");
    console.log("=".repeat(60));

    await this.checkTypeScriptErrors();
    await this.checkPrismaSchema();
    await this.checkRequiredDependencies();
    await this.checkEnvironmentVariables();
    await this.checkAICoreIntegrity();
    await this.checkAgentStatus();
    await this.checkDatabaseConnection();

    this.printResults();
  }

  /**
   * Check for TypeScript errors
   */
  private async checkTypeScriptErrors(): Promise<void> {
    console.log("\n📝 Checking TypeScript compilation...");

    try {
      const output = execSync("npx tsc --skipLibCheck --noEmit", {
        encoding: "utf-8",
        stdio: "pipe",
      });

      this.results.push({
        passed: true,
        message: "✅ TypeScript: 0 errors",
      });
    } catch (error: any) {
      const errorCount = (error.stdout.match(/error TS/g) || []).length;
      this.results.push({
        passed: false,
        message: `❌ TypeScript: ${errorCount} errors found`,
        details: "Run: npx tsc --skipLibCheck to see errors",
      });
    }
  }

  /**
   * Check Prisma schema validity
   */
  private async checkPrismaSchema(): Promise<void> {
    console.log("\n📊 Checking Prisma schema...");

    try {
      execSync("npx prisma validate", { stdio: "pipe" });

      // Check for duplicate schemas
      const mainSchema = path.join(process.cwd(), "prisma", "schema.prisma");
      const aiCoreSchema = path.join(process.cwd(), "prisma", "ai-core-schema.prisma");

      if (fs.existsSync(mainSchema) && fs.existsSync(aiCoreSchema)) {
        this.results.push({
          passed: false,
          message: "⚠️  Prisma: Multiple schemas detected",
          details: "Merge ai-core-schema.prisma into schema.prisma to prevent conflicts",
        });
      } else {
        this.results.push({
          passed: true,
          message: "✅ Prisma: Schema valid",
        });
      }
    } catch (error) {
      this.results.push({
        passed: false,
        message: "❌ Prisma: Schema validation failed",
      });
    }
  }

  /**
   * Check required npm dependencies
   */
  private async checkRequiredDependencies(): Promise<void> {
    console.log("\n📦 Checking dependencies...");

    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));

    const required = ["@anthropic-ai/sdk", "openai", "bullmq", "ioredis", "zod"];

    const recommended = ["langchain", "@langchain/openai", "@langchain/anthropic", "n8n", "ajv", "ts-morph"];

    const missing = required.filter((dep) => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]);

    const missingRecommended = recommended.filter(
      (dep) => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );

    if (missing.length === 0) {
      this.results.push({
        passed: true,
        message: "✅ Dependencies: All required packages installed",
      });
    } else {
      this.results.push({
        passed: false,
        message: `❌ Dependencies: Missing ${missing.length} required packages`,
        details: `Missing: ${missing.join(", ")}`,
      });
    }

    if (missingRecommended.length > 0) {
      this.results.push({
        passed: true,
        message: `ℹ️  Recommended: ${missingRecommended.length} packages for AI expansion`,
        details: `Install: npm install ${missingRecommended.join(" ")}`,
      });
    }
  }

  /**
   * Check environment variables
   */
  private async checkEnvironmentVariables(): Promise<void> {
    console.log("\n🔑 Checking environment variables...");

    const required = ["DATABASE_URL", "JWT_SECRET", "NODE_ENV"];

    const aiOptional = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "REDIS_URL", "N8N_URL", "N8N_API_KEY"];

    const missing = required.filter((key) => !process.env[key]);
    const missingAI = aiOptional.filter((key) => !process.env[key]);

    if (missing.length === 0) {
      this.results.push({
        passed: true,
        message: "✅ Environment: All required variables set",
      });
    } else {
      this.results.push({
        passed: false,
        message: `❌ Environment: Missing ${missing.length} required variables`,
        details: `Missing: ${missing.join(", ")}`,
      });
    }

    if (missingAI.length > 0) {
      this.results.push({
        passed: true,
        message: `ℹ️  AI Keys: ${missingAI.length} optional keys not set`,
        details: `For full AI functionality: ${missingAI.join(", ")}`,
      });
    }
  }

  /**
   * Check AI core integrity
   */
  private async checkAICoreIntegrity(): Promise<void> {
    console.log("\n🧠 Checking AI core files...");

    const coreFiles = [
      "src/ai-core/brain.ts",
      "src/ai-core/index.ts",
      "src/ai-core/monitoring.ts",
      "src/ai-core/queue.ts",
      "src/ai-core/scheduler.ts",
      "src/ai-core/workflow-engine.ts",
    ];

    const missing = coreFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

    if (missing.length === 0) {
      this.results.push({
        passed: true,
        message: "✅ AI Core: All core files present",
      });
    } else {
      this.results.push({
        passed: false,
        message: `❌ AI Core: Missing ${missing.length} core files`,
        details: `Missing: ${missing.join(", ")}`,
      });
    }
  }

  /**
   * Check agent system
   */
  private async checkAgentStatus(): Promise<void> {
    console.log("\n🤖 Checking agent system...");

    try {
      const agentDir = path.join(process.cwd(), "src", "agents");
      const agentFiles = fs.readdirSync(agentDir).filter((f) => f.endsWith("Agent.ts"));

      this.results.push({
        passed: true,
        message: `✅ Agents: ${agentFiles.length} agents registered`,
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: "❌ Agents: Unable to read agent directory",
      });
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<void> {
    console.log("\n🗄️  Checking database connection...");

    try {
      // Try to import and connect
      const prisma = (await import("../../prismaClient.js")).default;
      await (prisma as any).$connect();
      await (prisma as any).$disconnect();

      this.results.push({
        passed: true,
        message: "✅ Database: Connection successful",
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: "❌ Database: Connection failed",
        details: "Check DATABASE_URL in .env",
      });
    }
  }

  /**
   * Print validation results
   */
  private printResults(): void {
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Validation Results:\n");

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;

    this.results.forEach((result) => {
      console.log(result.message);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log(`\n✨ Summary: ${passed} passed, ${failed} failed\n`);

    if (failed === 0) {
      console.log("🎉 System ready for AI expansion!");
      console.log("\nNext steps:");
      console.log("1. Install recommended packages: npm install langchain @langchain/openai @langchain/anthropic n8n");
      console.log("2. Review AI_EXPANSION_BLUEPRINT.md");
      console.log("3. Start with Phase 2: Create validation layer");
    } else {
      console.log("⚠️  Fix failed checks before proceeding with AI expansion");
      process.exit(1);
    }
  }
}

// Run validation
const validator = new AISystemValidator();
validator.validate().catch(console.error);
