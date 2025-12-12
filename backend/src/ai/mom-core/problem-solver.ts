/**
 * Problem Solver Agent - Generates fixes with confidence scoring
 *
 * Responsibilities:
 * - Generate code fixes based on diagnosis
 * - Create configuration changes
 * - Propose database migrations
 * - Calculate confidence scores
 * - Provide rollback steps
 */

import * as fs from "fs";
import OpenAI from "openai";
import * as path from "path";
import { vaultService } from "../../services/VaultService";
import { Diagnosis, ProposedSolution } from "./types";

export class ProblemSolverAgent {
  private openai: OpenAI | null = null;
  private initialized: boolean = false;
  private systemPrompt: string = "";

  constructor() {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("[ProblemSolverAgent] Initializing...");

    // Load OpenAI API key
    const openaiKey = (await vaultService.getSecret("OPENAI_API_KEY").catch(() => null)) || process.env.OPENAI_API_KEY;

    if (!openaiKey) {
      console.warn("[ProblemSolverAgent] OpenAI API key not found, limited functionality");
    } else {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    // Load system prompt from config
    await this.loadSystemPrompt();

    this.initialized = true;
    console.log("[ProblemSolverAgent] Ready");
  }

  /**
   * Load system prompt from configuration
   */
  private async loadSystemPrompt(): Promise<void> {
    const promptPath = path.join(process.cwd(), "config", "ai-policies", "system_prompt.txt");

    try {
      this.systemPrompt = fs.readFileSync(promptPath, "utf-8");
      console.log("[ProblemSolverAgent] System prompt loaded");
    } catch (error) {
      console.warn("[ProblemSolverAgent] Could not load system prompt, using default");
      this.systemPrompt = `You are MomAI, a professional assistant. Follow safety-first rules:
1. No illegal acts or security bypasses
2. No secrets leakage
3. Refuse attack code, provide safe alternatives
4. Cite sources
5. Require approval for medium+ risk
6. Include confidence score (0.0-1.0)
7. Keep responses concise (1-3 lines)`;
    }
  }

  /**
   * Generate solution based on diagnosis
   */
  async generateSolution(diagnosis: Diagnosis): Promise<ProposedSolution> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log("[ProblemSolverAgent] Generating solution...");

    // Generate code fixes if applicable
    const codeChanges = await this.generateCodeFixes(diagnosis);

    // Generate config changes if needed
    const configChanges = this.generateConfigChanges(diagnosis);

    // Generate database migration if needed
    const databaseMigration = this.generateDatabaseMigration(diagnosis);

    // Create rollback steps
    const rollbackSteps = this.createRollbackSteps(codeChanges, configChanges, databaseMigration);

    // Create test plan
    const testPlan = this.createTestPlan(diagnosis, codeChanges);

    // Calculate confidence
    const confidence = this.calculateConfidence(diagnosis, codeChanges);

    // Estimate impact
    const estimatedImpact = this.estimateImpact(diagnosis, codeChanges);

    // Calculate required approvals
    const requiredApprovals = this.calculateRequiredApprovals(confidence, estimatedImpact);

    const solution: ProposedSolution = {
      description: this.createSolutionDescription(diagnosis, codeChanges),
      codeChanges,
      configChanges,
      databaseMigration,
      rollbackSteps,
      testPlan,
      confidence,
      estimatedImpact,
      requiredApprovals,
    };

    console.log(`[ProblemSolverAgent] Solution generated. Confidence: ${confidence.toFixed(2)}`);

    return solution;
  }

  /**
   * Generate code fixes using AI
   */
  private async generateCodeFixes(
    diagnosis: Diagnosis
  ): Promise<Array<{ file: string; changes: string; type: "create" | "update" | "delete" }>> {
    const fixes: Array<{ file: string; changes: string; type: "create" | "update" | "delete" }> = [];

    // If no OpenAI, provide template-based fixes
    if (!this.openai) {
      return this.generateTemplateFixes(diagnosis);
    }

    // Use AI to generate fixes based on diagnosis
    try {
      const prompt = this.buildFixPrompt(diagnosis);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.3, // Lower temperature for more deterministic code
        max_tokens: 2000,
      });

      const aiResponse = response.choices[0].message.content || "";

      // Parse AI response into structured code changes
      const parsedFixes = this.parseAIResponse(aiResponse);
      fixes.push(...parsedFixes);
    } catch (error) {
      console.error("[ProblemSolverAgent] AI generation failed:", error);
      // Fallback to template-based fixes
      return this.generateTemplateFixes(diagnosis);
    }

    return fixes;
  }

  /**
   * Build prompt for AI code generation
   */
  private buildFixPrompt(diagnosis: Diagnosis): string {
    return `Analyze this issue and propose a code fix:

**Root Cause:** ${diagnosis.rootCause}

**Affected Components:** ${diagnosis.affectedComponents.join(", ")}

**Impact:** ${diagnosis.impactAssessment}

**Relevant Code Context:**
${diagnosis.context.relevantCode.slice(0, 2).join("\n---\n")}

**Similar Issues:**
${diagnosis.context.similarIssues.map((issue, idx) => `${idx + 1}. ${issue.issue}\n   Solution: ${issue.solution}`).join("\n")}

Provide:
1. File path to modify
2. Specific code changes (include only changed lines with context)
3. Type of change (create/update/delete)
4. Brief explanation (1-2 lines)

Format your response as:
FILE: <path>
TYPE: <create|update|delete>
CHANGES:
\`\`\`typescript
<code>
\`\`\`
EXPLANATION: <brief explanation>

Include confidence score (0.0-1.0) and rollback steps.`;
  }

  /**
   * Parse AI response into structured changes
   */
  private parseAIResponse(
    aiResponse: string
  ): Array<{ file: string; changes: string; type: "create" | "update" | "delete" }> {
    const fixes: Array<{ file: string; changes: string; type: "create" | "update" | "delete" }> = [];

    // Match FILE: ... TYPE: ... CHANGES: ... patterns
    const fileMatches = aiResponse.matchAll(
      /FILE:\s*(.+)\s*TYPE:\s*(create|update|delete)\s*CHANGES:\s*```[\w]*\n([\s\S]+?)```/gi
    );

    for (const match of fileMatches) {
      fixes.push({
        file: match[1].trim(),
        type: match[2].toLowerCase() as "create" | "update" | "delete",
        changes: match[3].trim(),
      });
    }

    return fixes;
  }

  /**
   * Generate template-based fixes (fallback when AI unavailable)
   */
  private generateTemplateFixes(
    diagnosis: Diagnosis
  ): Array<{ file: string; changes: string; type: "create" | "update" | "delete" }> {
    const fixes: Array<{ file: string; changes: string; type: "create" | "update" | "delete" }> = [];

    // Template fix based on root cause
    if (diagnosis.rootCause.includes("null") || diagnosis.rootCause.includes("undefined")) {
      fixes.push({
        file: diagnosis.affectedComponents[0] || "src/affected-file.ts",
        type: "update",
        changes: `// Add null/undefined check
if (!variable) {
  throw new Error("Variable is null or undefined");
}

// Or provide default value
const safeValue = variable ?? defaultValue;`,
      });
    }

    if (diagnosis.rootCause.includes("validation")) {
      fixes.push({
        file: diagnosis.affectedComponents[0] || "src/validation.ts",
        type: "update",
        changes: `// Add input validation
import { z } from "zod";

const schema = z.object({
  field: z.string().min(1, "Field is required"),
  // Add other fields
});

const validated = schema.parse(input);`,
      });
    }

    return fixes;
  }

  /**
   * Generate configuration changes if needed
   */
  private generateConfigChanges(diagnosis: Diagnosis): Record<string, any> | undefined {
    const configChanges: Record<string, any> = {};

    if (diagnosis.rootCause.includes("timeout")) {
      configChanges.REQUEST_TIMEOUT = 30000; // 30 seconds
      configChanges.CONNECTION_TIMEOUT = 10000; // 10 seconds
    }

    if (diagnosis.rootCause.includes("rate limit")) {
      configChanges.RATE_LIMIT_WINDOW = 60000; // 1 minute
      configChanges.RATE_LIMIT_MAX_REQUESTS = 100;
    }

    return Object.keys(configChanges).length > 0 ? configChanges : undefined;
  }

  /**
   * Generate database migration if needed
   */
  private generateDatabaseMigration(diagnosis: Diagnosis): string | undefined {
    if (diagnosis.affectedComponents.includes("database")) {
      return `-- Add missing index or column
-- Review Prisma schema and generate migration:
-- npx prisma migrate dev --name fix_${diagnosis.affectedComponents.join("_")}`;
    }

    return undefined;
  }

  /**
   * Create rollback steps
   */
  private createRollbackSteps(
    codeChanges?: Array<any>,
    configChanges?: Record<string, any>,
    databaseMigration?: string
  ): string[] {
    const steps: string[] = [];

    if (codeChanges && codeChanges.length > 0) {
      steps.push("1. Revert code changes: git revert HEAD");
      steps.push("2. Restart application: npm run restart");
    }

    if (configChanges) {
      steps.push("3. Restore previous .env configuration from backup");
    }

    if (databaseMigration) {
      steps.push("4. Rollback database migration: npx prisma migrate resolve --rolled-back <migration>");
    }

    if (steps.length === 0) {
      steps.push("No rollback needed - changes are non-destructive");
    }

    return steps;
  }

  /**
   * Create test plan
   */
  private createTestPlan(diagnosis: Diagnosis, codeChanges?: Array<any>): string[] {
    const tests: string[] = [];

    tests.push("1. Run unit tests: npm test");
    tests.push("2. Run integration tests for affected components");

    if (diagnosis.affectedComponents.includes("api")) {
      tests.push("3. Test API endpoints with curl or Postman");
    }

    if (diagnosis.affectedComponents.includes("database")) {
      tests.push("4. Verify database integrity and queries");
    }

    tests.push("5. Monitor error logs for 10 minutes post-deployment");

    return tests;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(diagnosis: Diagnosis, codeChanges?: Array<any>): number {
    let confidence = diagnosis.confidence; // Start with diagnosis confidence

    // Adjust based on solution quality
    if (codeChanges && codeChanges.length > 0) {
      confidence *= 0.95; // Slight reduction for code changes
    }

    // Boost if we have strong similar issues
    if (diagnosis.context.similarIssues.some((issue) => issue.confidence > 0.9)) {
      confidence += 0.05;
    }

    // Cap at 0.95 for code generation (never 100% certain)
    return Math.min(confidence, 0.95);
  }

  /**
   * Estimate impact of changes
   */
  private estimateImpact(diagnosis: Diagnosis, codeChanges?: Array<any>): string {
    const componentCount = diagnosis.affectedComponents.length;
    const changeCount = codeChanges?.length || 0;

    if (changeCount === 0 && !diagnosis.rootCause.includes("CRITICAL")) {
      return "Minimal - configuration change only";
    }

    if (changeCount <= 2 && componentCount === 1) {
      return "Low - isolated fix in single component";
    }

    if (changeCount <= 5 && componentCount <= 2) {
      return "Medium - multiple files or components affected";
    }

    return "High - significant changes across multiple components";
  }

  /**
   * Calculate required approvals based on confidence and impact
   */
  private calculateRequiredApprovals(confidence: number, impact: string): number {
    if (confidence >= 0.85 && impact.startsWith("Minimal")) {
      return 0; // Auto-apply
    }

    if (confidence >= 0.75 && (impact.startsWith("Low") || impact.startsWith("Medium"))) {
      return 1; // One approval
    }

    return 2; // Two approvals for high impact or low confidence
  }

  /**
   * Create solution description
   */
  private createSolutionDescription(diagnosis: Diagnosis, codeChanges?: Array<any>): string {
    const changeCount = codeChanges?.length || 0;
    const components = diagnosis.affectedComponents.join(", ");

    return `Fix for ${diagnosis.rootCause}. Proposed ${changeCount} code change(s) in ${components || "system components"}. ${diagnosis.impactAssessment}`;
  }
}

// Singleton export
export const problemSolverAgent = new ProblemSolverAgent();
