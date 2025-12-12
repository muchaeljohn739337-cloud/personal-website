/**
 * CopilotService.ts
 *
 * Main orchestrator for AI Copilot system.
 * Integrates LLM (OpenAI/Anthropic), RAG engine, and feedback learner.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import prisma from "../../prismaClient";
import { vaultService } from "../../services/VaultService";
import { feedbackLearner } from "./FeedbackLearner";
import { ragEngine } from "./RAGEngine";
import { taskGenerator } from "./TaskGenerator";

interface CopilotMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface CopilotContext {
  files: string[];
  models: string[];
  routes: string[];
  agents: string[];
  recentErrors: string[];
}

interface CopilotTask {
  id: string;
  type: string;
  description: string;
  context?: any;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface CopilotConfig {
  llmProvider: "openai" | "anthropic";
  model: string;
  temperature: number;
  maxTokens: number;
  enableRAG: boolean;
  enableLearning: boolean;
  autoApprove: boolean;
  maxRetries: number;
}

export class CopilotService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private config: CopilotConfig;
  private conversationHistory: Map<string, CopilotMessage[]> = new Map();
  private initialized = false;

  constructor() {
    this.config = {
      llmProvider: (process.env.COPILOT_LLM_PROVIDER as "openai" | "anthropic") || "openai",
      model: process.env.COPILOT_MODEL || "gpt-4-turbo-preview",
      temperature: parseFloat(process.env.COPILOT_TEMPERATURE || "0.7"),
      maxTokens: parseInt(process.env.COPILOT_MAX_TOKENS || "4000"),
      enableRAG: process.env.COPILOT_ENABLE_RAG === "true",
      enableLearning: process.env.COPILOT_ENABLE_LEARNING === "true",
      autoApprove: process.env.COPILOT_AUTO_APPROVE === "true",
      maxRetries: parseInt(process.env.COPILOT_MAX_RETRIES || "3"),
    };
  }

  /**
   * Initialize LLM clients from Vault or environment
   */
  private async initializeLLMClients(): Promise<void> {
    console.log("[CopilotService] Initializing LLM clients...");

    // Get API keys from Vault (fallback to env)
    const openaiKey = (await vaultService.getSecret("OPENAI_API_KEY").catch(() => null)) || process.env.OPENAI_API_KEY;
    const anthropicKey =
      (await vaultService.getSecret("ANTHROPIC_API_KEY").catch(() => null)) || process.env.ANTHROPIC_API_KEY;

    if (this.config.llmProvider === "openai" && openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      console.log("[CopilotService] OpenAI initialized");
    } else if (this.config.llmProvider === "anthropic" && anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
      console.log("[CopilotService] Anthropic initialized");
    } else {
      console.warn("[CopilotService] No LLM provider configured or API key missing");
    }
  }

  /**
   * Initialize the Copilot service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("[CopilotService] Already initialized");
      return;
    }

    console.log("[CopilotService] Starting initialization...");

    try {
      await this.initializeLLMClients();

      if (this.config.enableRAG) {
        await ragEngine.initialize();
        console.log("[CopilotService] RAG engine initialized");
      }

      await taskGenerator.initialize();
      console.log("[CopilotService] Task generator initialized");

      this.initialized = true;
      console.log("[CopilotService] ✅ Initialization complete");
    } catch (error) {
      console.error("[CopilotService] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Chat with Copilot (conversational interface)
   */
  async chat(userId: number, message: string, sessionId?: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const sid = sessionId || "default";

    // Get or create conversation history
    if (!this.conversationHistory.has(sid)) {
      this.conversationHistory.set(sid, []);
    }

    const history = this.conversationHistory.get(sid)!;

    // Add user message
    history.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Gather context from codebase (if RAG enabled)
    let context: CopilotContext | undefined;
    if (this.config.enableRAG) {
      context = await this.gatherContext(message);
    }

    // Generate response
    const response = await this.generateResponse(history, context);

    // Add assistant response
    history.push({
      role: "assistant",
      content: response,
      timestamp: new Date(),
    });

    // Keep only last 20 messages
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Log interaction (if learning enabled)
    if (this.config.enableLearning) {
      await feedbackLearner.logInteraction(userId, sid, message, response);
    }

    return response;
  }

  /**
   * Generate response using LLM
   */
  private async generateResponse(history: CopilotMessage[], context?: CopilotContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    try {
      if (this.config.llmProvider === "openai" && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        });
        return response.choices[0].message.content || "No response generated";
      } else if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          system: systemPrompt,
          messages: messages.slice(1), // Skip system message for Anthropic
        });
        return response.content[0].type === "text" ? response.content[0].text : "No response generated";
      }

      return "LLM provider not configured";
    } catch (error: any) {
      console.error("[CopilotService] LLM generation error:", error);
      return `Error generating response: ${error.message}`;
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context?: CopilotContext): string {
    let prompt = `You are an expert AI assistant for the Advancia Pay Ledger platform, a modular SaaS ledger system with cryptocurrency integration.

Your capabilities:
- Generate deployment scripts (Docker Compose, Terraform, WireGuard VPN)
- Fix bugs and optimize code (TypeScript, React, Prisma)
- Provide architectural guidance
- Analyze security vulnerabilities
- Suggest performance improvements

Platform Stack:
- Backend: Node.js + Express + TypeScript, Prisma ORM, Socket.IO
- Frontend: Next.js 14 (App Router)
- Database: PostgreSQL
- Realtime: Socket.IO
- Payments: Stripe
- Blockchain: Ethereum/Polygon integration

Guidelines:
- Provide code examples when relevant
- Explain trade-offs and risks
- Follow existing patterns (BaseAgent, Vault for secrets, Socket.IO injection)
- Use admin-only routes with authenticateToken + requireAdmin
- Serialize Prisma Decimal fields as strings
- Keep CORS config in backend/src/config/index.ts`;

    if (context) {
      prompt += `\n\nCurrent Codebase Context:`;
      if (context.files.length > 0) {
        prompt += `\nRecent Files: ${context.files.slice(0, 5).join(", ")}`;
      }
      if (context.models.length > 0) {
        prompt += `\nDatabase Models: ${context.models.join(", ")}`;
      }
      if (context.routes.length > 0) {
        prompt += `\nAPI Routes: ${context.routes.join(", ")}`;
      }
      if (context.agents.length > 0) {
        prompt += `\nActive Agents: ${context.agents.join(", ")}`;
      }
      if (context.recentErrors.length > 0) {
        prompt += `\nRecent Errors: ${context.recentErrors[0]}`;
      }
    }

    return prompt;
  }

  /**
   * Generate and execute a task
   */
  async generateTask(type: string, description: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const taskId = uuidv4();
    const startTime = Date.now();

    try {
      // Store task in database
      await this.storeTask({
        id: taskId,
        type,
        description,
        status: "pending",
        createdAt: new Date(),
      });

      // Update to running
      await this.updateTask(taskId, { status: "running" });

      // Generate task content
      const context = await this.gatherContext(description);
      const result = await taskGenerator.generate(type, description, JSON.stringify(context));

      // Mark as completed
      const executionTime = Date.now() - startTime;
      await this.updateTask(taskId, {
        status: "completed",
        result,
        completedAt: new Date(),
      });

      if (this.config.enableLearning) {
        await feedbackLearner.logTaskSuccess(taskId, executionTime);
      }

      return taskId;
    } catch (error: any) {
      console.error("[CopilotService] Task generation failed:", error);
      await this.updateTask(taskId, {
        status: "failed",
        error: error.message,
        completedAt: new Date(),
      });

      if (this.config.enableLearning) {
        await feedbackLearner.logTaskFailure(taskId, error.message);
      }

      throw error;
    }
  }

  /**
   * Gather context from codebase
   */
  private async gatherContext(query: string): Promise<CopilotContext> {
    const context: CopilotContext = {
      files: [],
      models: [],
      routes: [],
      agents: [],
      recentErrors: [],
    };

    // RAG search for relevant code
    if (this.config.enableRAG) {
      try {
        const results = await ragEngine.searchSimilar(query, 5);
        context.files = results.map((r) => r.filePath);
      } catch (error) {
        console.error("[CopilotService] RAG search failed:", error);
      }
    }

    // Get database models
    try {
      // This would ideally parse schema.prisma dynamically
      context.models = ["User", "Transaction", "TokenWallet", "Reward", "AuditLog"];
    } catch (error) {
      console.error("[CopilotService] Failed to load models:", error);
    }

    return context;
  }

  /**
   * Store task in database
   */
  private async storeTask(task: CopilotTask): Promise<void> {
    await prisma.copilot_tasks.create({
      data: {
        id: task.id,
        type: task.type,
        description: task.description,
        context: task.context || {},
        status: task.status,
        result: task.result || {},
        error: task.error,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      },
    });
  }

  /**
   * Update task in database
   */
  private async updateTask(taskId: string, updates: Partial<CopilotTask>): Promise<void> {
    await prisma.copilot_tasks.update({
      where: { id: taskId },
      data: updates,
    });
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<CopilotTask | null> {
    const task = await prisma.copilot_tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) return null;

    return {
      id: task.id,
      type: task.type,
      description: task.description,
      context: task.context as any,
      status: task.status as any,
      result: task.result as any,
      error: task.error || undefined,
      createdAt: task.createdAt,
      completedAt: task.completedAt || undefined,
    };
  }

  /**
   * Clear conversation history
   */
  clearHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const taskStats = await prisma.copilot_tasks.groupBy({
      by: ["status"],
      _count: true,
    });

    const learningStats = this.config.enableLearning ? await feedbackLearner.getStatistics() : null;

    const ragStats = this.config.enableRAG ? ragEngine.getStatistics() : null;

    return {
      config: this.config,
      tasks: taskStats,
      learning: learningStats,
      rag: ragStats,
    };
  }
}

export const copilotService = new CopilotService();
