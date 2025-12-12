/**
 * TaskGenerator.ts
 *
 * LLM-powered task generation for deployment scripts, code fixes, and automations.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { vaultService } from "../../services/VaultService";

interface TaskTemplate {
  type: string;
  systemPrompt: string;
  outputFormat: "code" | "script" | "config" | "markdown";
  validationRules?: string[];
}

interface GeneratedTask {
  content: string;
  language: string;
  filename?: string;
  warnings?: string[];
  estimatedRisk: "low" | "medium" | "high";
}

export class TaskGenerator {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private llmProvider: "openai" | "anthropic";
  private templates: Map<string, TaskTemplate> = new Map();

  constructor() {
    this.llmProvider =
      (process.env.COPILOT_LLM_PROVIDER as "openai" | "anthropic") || "openai";
    this.initializeTemplates();
  }

  async initialize(): Promise<void> {
    const openaiKey =
      (await vaultService.getSecret("OPENAI_API_KEY").catch(() => null)) ||
      process.env.OPENAI_API_KEY;
    const anthropicKey =
      (await vaultService.getSecret("ANTHROPIC_API_KEY").catch(() => null)) ||
      process.env.ANTHROPIC_API_KEY;

    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey });
    if (anthropicKey) this.anthropic = new Anthropic({ apiKey: anthropicKey });

    console.log("[TaskGenerator] Initialized");
  }

  private initializeTemplates(): void {
    this.templates.set("docker_compose", {
      type: "deployment",
      systemPrompt: `Generate a production-ready Docker Compose file for Advancia Pay Ledger.
Include: Backend (Node.js:4000), Frontend (Next.js:3000), PostgreSQL, Redis, Nginx with SSL.
Output ONLY the docker-compose.yml content.`,
      outputFormat: "config",
      validationRules: ["version", "services", "volumes"],
    });

    this.templates.set("bug_fix", {
      type: "code_generation",
      systemPrompt: `Analyze the error and generate a TypeScript/Node.js code fix.
Provide minimal, surgical fix with error handling and comments.`,
      outputFormat: "code",
    });
  }

  async generate(
    taskType: string,
    description: string,
    context?: string
  ): Promise<GeneratedTask> {
    const template = this.templates.get(taskType);
    if (!template) {
      throw new Error(`Unknown task type: ${taskType}`);
    }

    const prompt = `Task: ${description}\n\n${
      context ? `Context:\n${context}\n\n` : ""
    }Generate the solution.`;
    const content = await this.callLLM(prompt, template.systemPrompt);

    return {
      content,
      language: this.getLanguage(template.outputFormat, taskType),
      filename: this.suggestFilename(taskType),
      warnings: this.validateOutput(content, template.validationRules),
      estimatedRisk: this.assessRisk(content),
    };
  }

  private async callLLM(prompt: string, systemPrompt: string): Promise<string> {
    if (this.llmProvider === "openai" && this.openai) {
      const response = await this.openai.chat.completions.create({
        model: process.env.COPILOT_MODEL || "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });
      return response.choices[0].message.content || "";
    } else if (this.anthropic) {
      const response = await this.anthropic.messages.create({
        model: process.env.COPILOT_MODEL || "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });
      return response.content[0].type === "text"
        ? response.content[0].text
        : "";
    }

    throw new Error("No LLM provider available");
  }

  private getLanguage(format: string, taskType: string): string {
    if (format === "code") return "typescript";
    if (format === "config") return "yaml";
    return "markdown";
  }

  private suggestFilename(taskType: string): string {
    const nameMap: Record<string, string> = {
      docker_compose: "docker-compose.yml",
      bug_fix: "fix.patch",
    };
    return nameMap[taskType] || "output.txt";
  }

  private validateOutput(content: string, rules?: string[]): string[] {
    const warnings: string[] = [];
    if (rules) {
      for (const rule of rules) {
        if (!content.includes(rule)) {
          warnings.push(`Missing: ${rule}`);
        }
      }
    }
    return warnings;
  }

  private assessRisk(content: string): "low" | "medium" | "high" {
    const highRiskPatterns = ["DROP TABLE", "DELETE FROM", "rm -rf", "sudo"];
    for (const pattern of highRiskPatterns) {
      if (content.includes(pattern)) return "high";
    }
    return "low";
  }
}

export const taskGenerator = new TaskGenerator();
