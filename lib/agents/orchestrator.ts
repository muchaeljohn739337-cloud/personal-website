// Orchestrator Agent - The Central Brain

import { getAgentConfig, getWorkerAgents } from './config';
import type {
  AgentEnvelope,
  AgentResponse,
  AgentType,
  JobResult,
  PlanStep,
  TaskContext,
  TaskPlan,
} from './types';

// Simple in-memory job queue (in production, use Redis or database)
const jobQueue: Map<string, TaskContext> = new Map();
const jobResults: Map<string, JobResult> = new Map();

/**
 * Orchestrator - Main entry point for task execution
 */
export class Orchestrator {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  /**
   * Submit a new task for processing
   */
  async submitTask(
    task: string,
    context: Record<string, unknown> = {},
    userId?: string,
    priority: number = 5
  ): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const taskContext: TaskContext = {
      taskId,
      task,
      context,
      tools: [],
      memory: [],
      previousAttempts: [],
      maxAttempts: 3,
      currentAttempt: 0,
      userId,
      priority,
    };

    jobQueue.set(taskId, taskContext);

    // Start processing asynchronously
    this.processTask(taskContext).catch(console.error);

    return taskId;
  }

  /**
   * Get task status and result
   */
  getTaskStatus(taskId: string): JobResult | { status: 'PENDING' | 'RUNNING'; taskId: string } {
    const result = jobResults.get(taskId);
    if (result) return result;

    const task = jobQueue.get(taskId);
    if (task) {
      return { status: task.currentAttempt > 0 ? 'RUNNING' : 'PENDING', taskId };
    }

    return { status: 'PENDING', taskId };
  }

  /**
   * Main task processing pipeline
   */
  private async processTask(context: TaskContext): Promise<void> {
    const startTime = Date.now();
    let totalTokens = 0;

    try {
      // Step 1: Analyze and plan the task
      console.log(`[Orchestrator] Planning task: ${context.taskId}`);
      const plan = await this.createPlan(context);

      // Step 2: Execute each step
      for (const step of plan.steps) {
        if (step.status === 'skipped') continue;

        step.status = 'running';
        step.startedAt = new Date();

        try {
          const response = await this.executeStep(step, context);
          totalTokens += response.tokensUsed;

          if (response.success) {
            step.status = 'completed';
            step.result = response.result;
          } else {
            step.status = 'failed';
            step.result = response.error;

            // Handle failure based on next action
            if (
              response.nextAction?.type === 'retry' &&
              context.currentAttempt < context.maxAttempts
            ) {
              context.currentAttempt++;
              await this.executeStep(step, context);
            }
          }
        } catch (error) {
          step.status = 'failed';
          step.result = error instanceof Error ? error.message : 'Unknown error';
        }

        step.completedAt = new Date();
      }

      // Step 3: Aggregate results
      const finalResult = await this.aggregateResults(plan, context);
      totalTokens += finalResult.tokensUsed;

      // Store result
      const jobResult: JobResult = {
        jobId: context.taskId,
        status: plan.steps.every((s) => s.status === 'completed') ? 'COMPLETED' : 'FAILED',
        result: finalResult.result,
        data: finalResult.data,
        steps: plan.steps,
        totalTokens,
        totalCost: this.estimateCost(totalTokens),
        totalDuration: Date.now() - startTime,
        completedAt: new Date(),
      };

      jobResults.set(context.taskId, jobResult);
      jobQueue.delete(context.taskId);

      console.log(`[Orchestrator] Task completed: ${context.taskId}`);
    } catch (error) {
      console.error(`[Orchestrator] Task failed: ${context.taskId}`, error);

      const jobResult: JobResult = {
        jobId: context.taskId,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        steps: [],
        totalTokens,
        totalCost: this.estimateCost(totalTokens),
        totalDuration: Date.now() - startTime,
        completedAt: new Date(),
      };

      jobResults.set(context.taskId, jobResult);
      jobQueue.delete(context.taskId);
    }
  }

  /**
   * Create execution plan for the task
   */
  private async createPlan(context: TaskContext): Promise<TaskPlan> {
    const config = getAgentConfig('PLANNER');

    const prompt = `Analyze this task and create an execution plan:

Task: ${context.task}
Context: ${JSON.stringify(context.context)}

Available worker agents: ${getWorkerAgents().join(', ')}

Create a step-by-step plan. For each step, specify:
1. Description of what needs to be done
2. Which agent should handle it
3. Dependencies (which steps must complete first)

Respond in JSON format:
{
  "steps": [
    {
      "stepNumber": 1,
      "description": "...",
      "assignedAgent": "CODE|RESEARCH|SEO|BLOG|BUSINESS|RPA|SECURITY",
      "dependencies": []
    }
  ],
  "estimatedDuration": <minutes>,
  "estimatedCost": <dollars>
}`;

    const response = await this.callModel(
      config.modelName,
      config.systemPrompt,
      prompt,
      config.maxTokens
    );

    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const planData = JSON.parse(jsonMatch[0]);
        return {
          taskId: context.taskId,
          originalTask: context.task,
          steps: planData.steps.map((s: PlanStep) => ({
            ...s,
            status: 'pending' as const,
          })),
          estimatedDuration: planData.estimatedDuration || 5,
          estimatedCost: planData.estimatedCost || 0.01,
          createdAt: new Date(),
        };
      }
    } catch (e) {
      console.error('Failed to parse plan:', e);
    }

    // Default single-step plan if parsing fails
    return {
      taskId: context.taskId,
      originalTask: context.task,
      steps: [
        {
          stepNumber: 1,
          description: context.task,
          assignedAgent: this.selectBestAgent(context.task),
          dependencies: [],
          status: 'pending',
        },
      ],
      estimatedDuration: 5,
      estimatedCost: 0.01,
      createdAt: new Date(),
    };
  }

  /**
   * Execute a single step using the assigned agent
   */
  private async executeStep(step: PlanStep, context: TaskContext): Promise<AgentResponse> {
    const startTime = Date.now();
    const config = getAgentConfig(step.assignedAgent);

    const prompt = `Execute this task step:

Original Task: ${context.task}
Current Step: ${step.description}
Step Number: ${step.stepNumber}
Context: ${JSON.stringify(context.context)}

${context.previousAttempts.length > 0 ? `Previous attempts:\n${context.previousAttempts.map((a) => `- ${a.action}: ${a.result}`).join('\n')}` : ''}

Provide a complete and detailed response for this step.`;

    try {
      const response = await this.callModel(
        config.modelName,
        config.systemPrompt,
        prompt,
        config.maxTokens,
        config.temperature
      );

      return {
        success: true,
        result: response.content,
        tokensUsed: response.inputTokens + response.outputTokens,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
        nextAction: {
          type: 'retry',
          reason: 'Execution failed',
        },
      };
    }
  }

  /**
   * Aggregate results from all steps
   */
  private async aggregateResults(plan: TaskPlan, context: TaskContext): Promise<AgentResponse> {
    const startTime = Date.now();
    const config = getAgentConfig('ORCHESTRATOR');

    const completedSteps = plan.steps.filter((s) => s.status === 'completed');

    if (completedSteps.length === 0) {
      return {
        success: false,
        error: 'No steps completed successfully',
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // If only one step, return its result directly
    if (completedSteps.length === 1) {
      return {
        success: true,
        result: completedSteps[0].result,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // Aggregate multiple step results
    const prompt = `Aggregate these step results into a final coherent response:

Original Task: ${context.task}

Step Results:
${completedSteps.map((s) => `Step ${s.stepNumber} (${s.description}):\n${s.result}`).join('\n\n---\n\n')}

Provide a comprehensive final response that combines all the step results.`;

    try {
      const response = await this.callModel(
        config.modelName,
        config.systemPrompt,
        prompt,
        config.maxTokens
      );

      return {
        success: true,
        result: response.content,
        tokensUsed: response.inputTokens + response.outputTokens,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      // Return concatenated results if aggregation fails
      return {
        success: true,
        result: completedSteps.map((s) => s.result).join('\n\n'),
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Select the best agent for a task based on keywords
   */
  private selectBestAgent(task: string): AgentType {
    const taskLower = task.toLowerCase();

    if (
      taskLower.includes('code') ||
      taskLower.includes('program') ||
      taskLower.includes('function') ||
      taskLower.includes('api')
    ) {
      return 'CODE';
    }
    if (
      taskLower.includes('research') ||
      taskLower.includes('find') ||
      taskLower.includes('search')
    ) {
      return 'RESEARCH';
    }
    if (taskLower.includes('seo') || taskLower.includes('keyword') || taskLower.includes('meta')) {
      return 'SEO';
    }
    if (
      taskLower.includes('blog') ||
      taskLower.includes('article') ||
      taskLower.includes('write') ||
      taskLower.includes('content')
    ) {
      return 'BLOG';
    }
    if (
      taskLower.includes('business') ||
      taskLower.includes('strategy') ||
      taskLower.includes('market')
    ) {
      return 'BUSINESS';
    }
    if (
      taskLower.includes('automate') ||
      taskLower.includes('scrape') ||
      taskLower.includes('workflow')
    ) {
      return 'RPA';
    }
    if (
      taskLower.includes('security') ||
      taskLower.includes('audit') ||
      taskLower.includes('vulnerability')
    ) {
      return 'SECURITY';
    }

    // Default to research for general tasks
    return 'RESEARCH';
  }

  /**
   * Call the AI model
   */
  private async callModel(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 4096,
    temperature: number = 0.3
  ): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
    if (!this.apiKey) {
      // Return mock response if no API key
      return {
        content: `[Mock Response] Task received: ${userPrompt.substring(0, 100)}...`,
        inputTokens: 100,
        outputTokens: 50,
      };
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || '',
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    };
  }

  /**
   * Estimate cost based on tokens
   */
  private estimateCost(tokens: number): number {
    // Approximate cost: $3 per 1M input tokens, $15 per 1M output tokens
    // Simplified: ~$0.01 per 1000 tokens average
    return (tokens / 1000) * 0.01;
  }

  /**
   * Create message envelope for agent communication
   */
  createEnvelope(
    from: AgentType | 'user' | 'system',
    to: AgentType,
    task: string,
    context: TaskContext
  ): AgentEnvelope {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from,
      to,
      task,
      context,
      timestamp: new Date(),
      priority: context.priority,
    };
  }
}

// Singleton instance
let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}
