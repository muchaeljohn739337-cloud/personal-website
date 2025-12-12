import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { logger } from "../utils/logger";

// Lazy-load AI clients to avoid startup errors
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set. Please configure it in .env file.");
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

function getAnthropic(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set. Please configure it in .env file.");
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

export type AIModel =
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "claude-3-haiku";

export interface AIRequest {
  model: AIModel;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  context?: any;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  finishReason: string;
  metadata?: any;
}

/**
 * Half Brain Cell - AI reasoning and suggestion system
 */
export class AIBrainCell {
  /**
   * Get AI suggestion/analysis
   */
  async analyze(request: AIRequest): Promise<AIResponse> {
    const isOpenAI = request.model.startsWith("gpt");

    try {
      if (isOpenAI) {
        return await this.analyzeWithOpenAI(request);
      } else {
        return await this.analyzeWithClaude(request);
      }
    } catch (error) {
      logger.error(`AI analysis failed with ${request.model}:`, error);
      throw error;
    }
  }

  /**
   * OpenAI GPT analysis
   */
  private async analyzeWithOpenAI(request: AIRequest): Promise<AIResponse> {
    const response = await getOpenAI().chat.completions.create({
      model: request.model as "gpt-4" | "gpt-3.5-turbo",
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2000,
    });

    const choice = response.choices[0];

    return {
      content: choice.message.content || "",
      model: response.model,
      tokensUsed: response.usage?.total_tokens || 0,
      finishReason: choice.finish_reason || "unknown",
      metadata: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
      },
    };
  }

  /**
   * Claude analysis
   */
  private async analyzeWithClaude(request: AIRequest): Promise<AIResponse> {
    const response = await getAnthropic().messages.create({
      model: request.model.replace("claude-3-", "claude-3-") as any,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.userPrompt }],
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2000,
    });

    const content = response.content[0];
    const textContent = content.type === "text" ? content.text : "";

    return {
      content: textContent,
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      finishReason: response.stop_reason || "unknown",
      metadata: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Code analysis and suggestions
   */
  async analyzeCode(params: {
    filePath: string;
    code: string;
    issue?: string;
    context?: string;
  }): Promise<{
    analysis: string;
    suggestions: Array<{
      title: string;
      description: string;
      suggestedCode: string;
      reasoning: string;
      confidence: number;
    }>;
  }> {
    const systemPrompt = `You are an expert code analyzer for a SaaS platform. 
Analyze code for bugs, performance issues, security vulnerabilities, and best practices.
Provide specific, actionable suggestions with high confidence scores.`;

    const userPrompt = `
File: ${params.filePath}

${params.issue ? `Issue: ${params.issue}\n` : ""}
${params.context ? `Context: ${params.context}\n` : ""}

Code:
\`\`\`
${params.code}
\`\`\`

Please provide:
1. Overall analysis
2. Specific suggestions (max 5) in JSON format:
{
  "analysis": "overall analysis",
  "suggestions": [
    {
      "title": "brief title",
      "description": "what to fix",
      "suggestedCode": "corrected code snippet",
      "reasoning": "why this is better",
      "confidence": 0.95
    }
  ]
}
`;

    const response = await this.analyze({
      model: "gpt-4",
      systemPrompt,
      userPrompt,
      temperature: 0.3, // Lower for more consistent technical output
    });

    try {
      // Try to parse JSON response
      const parsed = JSON.parse(response.content);
      return parsed;
    } catch {
      // Fallback: extract from markdown if JSON parsing fails
      return {
        analysis: response.content,
        suggestions: [],
      };
    }
  }

  /**
   * Error diagnosis and fix suggestions
   */
  async diagnoseError(params: {
    error: string;
    stackTrace?: string;
    context?: string;
    recentLogs?: string[];
  }): Promise<{
    diagnosis: string;
    possibleCauses: string[];
    suggestedFixes: Array<{
      fix: string;
      steps: string[];
      confidence: number;
    }>;
    preventionTips: string[];
  }> {
    const systemPrompt = `You are an expert debugging assistant for a Node.js/TypeScript SaaS platform.
Diagnose errors, identify root causes, and provide clear fix instructions.`;

    const userPrompt = `
Error: ${params.error}

${params.stackTrace ? `Stack Trace:\n${params.stackTrace}\n` : ""}
${params.context ? `Context: ${params.context}\n` : ""}
${params.recentLogs ? `Recent Logs:\n${params.recentLogs.join("\n")}\n` : ""}

Provide diagnosis in JSON format:
{
  "diagnosis": "what went wrong",
  "possibleCauses": ["cause 1", "cause 2"],
  "suggestedFixes": [
    {
      "fix": "description",
      "steps": ["step 1", "step 2"],
      "confidence": 0.9
    }
  ],
  "preventionTips": ["tip 1", "tip 2"]
}
`;

    const response = await this.analyze({
      model: "gpt-4",
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        diagnosis: response.content,
        possibleCauses: [],
        suggestedFixes: [],
        preventionTips: [],
      };
    }
  }

  /**
   * Generate workflow task suggestions
   */
  async suggestWorkflowTasks(params: {
    workflowType: string;
    goal: string;
    context: any;
  }): Promise<
    Array<{
      taskType: string;
      description: string;
      input: any;
      priority: number;
      reasoning: string;
    }>
  > {
    const systemPrompt = `You are an AI workflow planner for a SaaS platform.
Suggest optimal task sequences to achieve goals efficiently.`;

    const userPrompt = `
Workflow Type: ${params.workflowType}
Goal: ${params.goal}
Context: ${JSON.stringify(params.context, null, 2)}

Suggest tasks in JSON format:
[
  {
    "taskType": "send_email",
    "description": "Send welcome email to new user",
    "input": { "to": "user@example.com", "template": "welcome" },
    "priority": 5,
    "reasoning": "Essential first step for user onboarding"
  }
]
`;

    const response = await this.analyze({
      model: "gpt-4",
      systemPrompt,
      userPrompt,
      temperature: 0.5,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return [];
    }
  }

  /**
   * Analyze monitoring data and detect anomalies
   */
  async analyzeMonitoringData(params: {
    metrics: any;
    historicalData?: any;
    alertThreshold?: number;
  }): Promise<{
    isAnomalous: boolean;
    severity: "info" | "warning" | "error" | "critical";
    analysis: string;
    suggestedActions: string[];
    confidence: number;
  }> {
    const systemPrompt = `You are an AI monitoring system for a SaaS platform.
Detect anomalies, performance issues, and potential problems before they impact users.`;

    const userPrompt = `
Current Metrics: ${JSON.stringify(params.metrics, null, 2)}
${
  params.historicalData
    ? `Historical Data: ${JSON.stringify(params.historicalData, null, 2)}`
    : ""
}

Analyze for anomalies and provide response in JSON format:
{
  "isAnomalous": true/false,
  "severity": "info|warning|error|critical",
  "analysis": "detailed analysis",
  "suggestedActions": ["action 1", "action 2"],
  "confidence": 0.85
}
`;

    const response = await this.analyze({
      model: "gpt-4",
      systemPrompt,
      userPrompt,
      temperature: 0.2, // Very low for consistent monitoring
      maxTokens: 1000,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        isAnomalous: false,
        severity: "info",
        analysis: response.content,
        suggestedActions: [],
        confidence: 0.5,
      };
    }
  }

  /**
   * Generate report content
   */
  async generateReport(params: {
    reportType: string;
    data: any;
    period: { from: Date; to: Date };
    format: "markdown" | "json";
  }): Promise<{
    title: string;
    summary: string;
    content: string;
    insights: string[];
    recommendations: string[];
  }> {
    const systemPrompt = `You are an AI report generator for a SaaS platform.
Create comprehensive, insightful reports with actionable recommendations.`;

    const userPrompt = `
Report Type: ${params.reportType}
Period: ${params.period.from.toISOString()} to ${params.period.to.toISOString()}
Format: ${params.format}

Data:
${JSON.stringify(params.data, null, 2)}

Generate report in JSON format:
{
  "title": "Report Title",
  "summary": "Executive summary (2-3 sentences)",
  "content": "${
    params.format === "markdown"
      ? "Full markdown content"
      : "Structured JSON content"
  }",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}
`;

    const response = await this.analyze({
      model: "claude-3-sonnet", // Claude is better at long-form content
      systemPrompt,
      userPrompt,
      temperature: 0.6,
      maxTokens: 4000,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        title: `${params.reportType} Report`,
        summary: "Report generated",
        content: response.content,
        insights: [],
        recommendations: [],
      };
    }
  }

  /**
   * Smart task prioritization
   */
  async prioritizeTasks(
    tasks: Array<{
      id: string;
      type: string;
      description: string;
      currentPriority: number;
      context: any;
    }>
  ): Promise<
    Array<{
      taskId: string;
      suggestedPriority: number;
      reasoning: string;
    }>
  > {
    const systemPrompt = `You are an AI task prioritization system.
Analyze tasks and suggest optimal priority levels (1-10, lower = more urgent).`;

    const userPrompt = `
Tasks to prioritize:
${JSON.stringify(tasks, null, 2)}

Suggest priorities in JSON format:
[
  {
    "taskId": "task-uuid",
    "suggestedPriority": 3,
    "reasoning": "High impact, time-sensitive"
  }
]
`;

    const response = await this.analyze({
      model: "gpt-4",
      systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 2000,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return tasks.map((t) => ({
        taskId: t.id,
        suggestedPriority: t.currentPriority,
        reasoning: "Unable to analyze",
      }));
    }
  }

  /**
   * Learn from human feedback
   */
  async incorporateFeedback(params: {
    originalSuggestion: string;
    humanDecision: "approved" | "rejected" | "modified";
    humanModification?: string;
    feedback?: string;
    context: any;
  }): Promise<{
    learningPoint: string;
    adjustedApproach: string;
    confidence: number;
  }> {
    const systemPrompt = `You are an AI learning system that improves from human feedback.
Analyze feedback and adjust future behavior accordingly.`;

    const userPrompt = `
Original AI Suggestion: ${params.originalSuggestion}
Human Decision: ${params.humanDecision}
${
  params.humanModification
    ? `Human Modification: ${params.humanModification}`
    : ""
}
${params.feedback ? `Feedback: ${params.feedback}` : ""}
Context: ${JSON.stringify(params.context, null, 2)}

Analyze this feedback and provide learning in JSON format:
{
  "learningPoint": "what to learn from this",
  "adjustedApproach": "how to improve next time",
  "confidence": 0.8
}
`;

    const response = await this.analyze({
      model: "gpt-4",
      systemPrompt,
      userPrompt,
      temperature: 0.5,
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        learningPoint: "Feedback recorded",
        adjustedApproach: "Will adjust future suggestions",
        confidence: 0.5,
      };
    }
  }
}

// Export singleton instance
export const aiBrain = new AIBrainCell();

// Alias for compatibility
export const AIBrain = AIBrainCell;
