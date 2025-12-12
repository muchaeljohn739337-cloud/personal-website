/**
 * Multi-Agent Orchestrator
 *
 * Coordinates multiple AI agents for complex task execution.
 * Implements agent selection, task decomposition, and result aggregation.
 */

import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

// Agent capability definitions
interface AgentCapability {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  specializations: string[];
}

interface Task {
  id: string;
  type: string;
  description: string;
  input: Record<string, any>;
  priority: number;
  deadline?: Date;
  dependencies?: string[];
}

interface TaskResult {
  taskId: string;
  agentId: string;
  status: "success" | "failed" | "partial";
  output: any;
  tokens: { prompt: number; completion: number };
  duration: number;
  error?: string;
}

interface OrchestratorConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  maxConcurrentAgents: number;
  taskTimeout: number;
  retryAttempts: number;
  defaultModel: string;
}

export class MultiAgentOrchestrator {
  private config: OrchestratorConfig;
  private openai: OpenAI;
  private agents: Map<string, AgentCapability> = new Map();
  private runningTasks: Map<string, AbortController> = new Map();

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      openaiApiKey: config?.openaiApiKey || process.env.OPENAI_API_KEY || "",
      anthropicApiKey: config?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "",
      maxConcurrentAgents: config?.maxConcurrentAgents || 5,
      taskTimeout: config?.taskTimeout || 60000, // 60 seconds
      retryAttempts: config?.retryAttempts || 2,
      defaultModel: config?.defaultModel || "gpt-4",
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });

    // Register default agents
    this.registerDefaultAgents();
  }

  // ============================================
  // AGENT MANAGEMENT
  // ============================================

  /**
   * Register a new agent with capabilities
   */
  registerAgent(agent: AgentCapability): void {
    this.agents.set(agent.id, agent);
    console.log(`Agent registered: ${agent.name} (${agent.id})`);
  }

  /**
   * Remove an agent
   */
  unregisterAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  /**
   * Get all registered agents
   */
  getAgents(): AgentCapability[] {
    return Array.from(this.agents.values());
  }

  /**
   * Find agents by capability
   */
  findAgentsByCapability(capability: string): AgentCapability[] {
    return this.getAgents().filter((agent) =>
      agent.capabilities.some((cap) => cap.toLowerCase().includes(capability.toLowerCase()))
    );
  }

  /**
   * Register default AI agents
   */
  private registerDefaultAgents(): void {
    const defaultAgents: AgentCapability[] = [
      {
        id: "analyst",
        name: "Data Analyst",
        description: "Analyzes data, generates insights, and creates reports",
        capabilities: ["data_analysis", "reporting", "visualization", "statistics"],
        model: "gpt-4",
        systemPrompt: `You are an expert data analyst. Analyze data thoroughly, identify patterns, 
          and provide actionable insights. Use statistical methods when appropriate. 
          Always explain your methodology and reasoning.`,
        maxTokens: 4000,
        temperature: 0.3,
        specializations: ["sql", "python", "charts"],
      },
      {
        id: "coder",
        name: "Code Assistant",
        description: "Writes, reviews, and debugs code across multiple languages",
        capabilities: ["code_generation", "code_review", "debugging", "refactoring"],
        model: "gpt-4",
        systemPrompt: `You are an expert software developer. Write clean, efficient, 
          and well-documented code. Follow best practices and design patterns. 
          Consider edge cases and error handling.`,
        maxTokens: 8000,
        temperature: 0.1,
        specializations: ["typescript", "python", "sql", "api"],
      },
      {
        id: "writer",
        name: "Content Writer",
        description: "Creates compelling content, documentation, and communications",
        capabilities: ["content_writing", "documentation", "copywriting", "editing"],
        model: "gpt-4",
        systemPrompt: `You are an expert content writer. Create engaging, clear, 
          and well-structured content. Adapt your tone to the target audience. 
          Ensure accuracy and proper formatting.`,
        maxTokens: 4000,
        temperature: 0.7,
        specializations: ["marketing", "technical", "email"],
      },
      {
        id: "researcher",
        name: "Research Agent",
        description: "Gathers information, synthesizes knowledge, and provides summaries",
        capabilities: ["research", "summarization", "fact_checking", "synthesis"],
        model: "gpt-4",
        systemPrompt: `You are an expert researcher. Gather comprehensive information, 
          verify facts, and synthesize findings into clear summaries. 
          Cite sources when possible and highlight uncertainty.`,
        maxTokens: 6000,
        temperature: 0.4,
        specializations: ["web", "academic", "market"],
      },
      {
        id: "planner",
        name: "Strategic Planner",
        description: "Creates plans, breaks down tasks, and coordinates strategies",
        capabilities: ["planning", "task_decomposition", "scheduling", "prioritization"],
        model: "gpt-4",
        systemPrompt: `You are a strategic planner. Break down complex goals into 
          actionable steps. Consider dependencies, risks, and resource constraints. 
          Create clear timelines and milestones.`,
        maxTokens: 4000,
        temperature: 0.5,
        specializations: ["project", "business", "technical"],
      },
      {
        id: "reviewer",
        name: "Quality Reviewer",
        description: "Reviews work, provides feedback, and ensures quality standards",
        capabilities: ["review", "quality_assurance", "feedback", "validation"],
        model: "gpt-4",
        systemPrompt: `You are a quality reviewer. Evaluate work against standards, 
          identify issues, and provide constructive feedback. Be thorough but fair. 
          Suggest specific improvements.`,
        maxTokens: 3000,
        temperature: 0.2,
        specializations: ["code", "content", "design"],
      },
    ];

    defaultAgents.forEach((agent) => this.registerAgent(agent));
  }

  // ============================================
  // TASK ORCHESTRATION
  // ============================================

  /**
   * Execute a single task with the best matching agent
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const agent = await this.selectAgentForTask(task);

    if (!agent) {
      return {
        taskId: task.id,
        agentId: "none",
        status: "failed",
        output: null,
        tokens: { prompt: 0, completion: 0 },
        duration: Date.now() - startTime,
        error: "No suitable agent found for task",
      };
    }

    try {
      const result = await this.runAgentTask(agent, task);

      // Log execution to database
      await this.logTaskExecution(task, agent, result);

      return result;
    } catch (error: any) {
      const result: TaskResult = {
        taskId: task.id,
        agentId: agent.id,
        status: "failed",
        output: null,
        tokens: { prompt: 0, completion: 0 },
        duration: Date.now() - startTime,
        error: error.message,
      };

      await this.logTaskExecution(task, agent, result);
      return result;
    }
  }

  /**
   * Execute multiple tasks with parallel agent coordination
   */
  async executeWorkflow(tasks: Task[], options?: { parallel?: boolean; stopOnError?: boolean }): Promise<TaskResult[]> {
    const parallel = options?.parallel ?? true;
    const stopOnError = options?.stopOnError ?? false;

    if (parallel) {
      // Execute independent tasks in parallel, respecting dependencies
      return this.executeParallel(tasks, stopOnError);
    } else {
      // Execute sequentially
      return this.executeSequential(tasks, stopOnError);
    }
  }

  /**
   * Decompose a complex goal into subtasks
   */
  async decomposeGoal(goal: string, context?: Record<string, any>): Promise<Task[]> {
    const planner = this.agents.get("planner");
    if (!planner) {
      throw new Error("Planner agent not available");
    }

    const prompt = `
      Decompose the following goal into specific, actionable tasks:
      
      GOAL: ${goal}
      
      CONTEXT: ${context ? JSON.stringify(context) : "None provided"}
      
      Return a JSON array of tasks with the following structure:
      [
        {
          "id": "unique_id",
          "type": "task_type",
          "description": "clear description",
          "input": { "key": "value" },
          "priority": 1-10,
          "dependencies": ["other_task_ids"]
        }
      ]
      
      Order tasks by priority and include appropriate dependencies.
    `;

    const response = await this.openai.chat.completions.create({
      model: planner.model,
      messages: [
        { role: "system", content: planner.systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: planner.maxTokens,
      temperature: planner.temperature,
    });

    const content = response.choices[0]?.message?.content || "[]";

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch {
      console.error("Failed to parse decomposed tasks:", content);
      return [];
    }
  }

  /**
   * Aggregate results from multiple agents
   */
  async aggregateResults(results: TaskResult[], aggregationType: "merge" | "summarize" | "vote"): Promise<any> {
    const successfulResults = results.filter((r) => r.status === "success");

    if (successfulResults.length === 0) {
      return { error: "No successful results to aggregate" };
    }

    switch (aggregationType) {
      case "merge":
        return this.mergeResults(successfulResults);

      case "summarize":
        return this.summarizeResults(successfulResults);

      case "vote":
        return this.voteResults(successfulResults);

      default:
        return successfulResults.map((r) => r.output);
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Select the best agent for a task
   */
  private async selectAgentForTask(task: Task): Promise<AgentCapability | null> {
    // First try direct capability match
    const matchingAgents = this.findAgentsByCapability(task.type);
    if (matchingAgents.length > 0) {
      return matchingAgents[0];
    }

    // Use AI to select best agent
    const agents = this.getAgents();
    const prompt = `
      Select the best agent for this task:
      
      TASK: ${task.description}
      TYPE: ${task.type}
      
      AVAILABLE AGENTS:
      ${agents.map((a) => `- ${a.id}: ${a.description} (capabilities: ${a.capabilities.join(", ")})`).join("\n")}
      
      Return only the agent ID that best matches this task.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50,
        temperature: 0,
      });

      const selectedId = response.choices[0]?.message?.content?.trim().toLowerCase();
      return agents.find((a) => a.id.toLowerCase() === selectedId) || agents[0];
    } catch {
      // Fallback to first available agent
      return agents[0] || null;
    }
  }

  /**
   * Run a task with a specific agent
   */
  private async runAgentTask(agent: AgentCapability, task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    const abortController = new AbortController();
    this.runningTasks.set(task.id, abortController);

    try {
      // Set timeout
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, this.config.taskTimeout);

      const userPrompt = `
        TASK: ${task.description}
        
        INPUT DATA:
        ${JSON.stringify(task.input, null, 2)}
        
        Provide a comprehensive response to complete this task.
      `;

      const response = await this.openai.chat.completions.create({
        model: agent.model,
        messages: [
          { role: "system", content: agent.systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: agent.maxTokens,
        temperature: agent.temperature,
      });

      clearTimeout(timeoutId);

      return {
        taskId: task.id,
        agentId: agent.id,
        status: "success",
        output: response.choices[0]?.message?.content,
        tokens: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
        },
        duration: Date.now() - startTime,
      };
    } finally {
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * Execute tasks in parallel respecting dependencies
   */
  private async executeParallel(tasks: Task[], stopOnError: boolean): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    const completed = new Set<string>();
    const remaining = [...tasks];

    while (remaining.length > 0) {
      // Find tasks with all dependencies satisfied
      const executable = remaining.filter(
        (task) => !task.dependencies?.length || task.dependencies.every((dep) => completed.has(dep))
      );

      if (executable.length === 0 && remaining.length > 0) {
        // Circular dependency or missing dependency
        console.error("Unable to resolve task dependencies");
        break;
      }

      // Execute batch in parallel (up to max concurrent)
      const batch = executable.slice(0, this.config.maxConcurrentAgents);
      const batchResults = await Promise.all(batch.map((task) => this.executeTask(task)));

      results.push(...batchResults);

      // Check for errors
      if (stopOnError && batchResults.some((r) => r.status === "failed")) {
        break;
      }

      // Mark completed and remove from remaining
      batch.forEach((task) => {
        completed.add(task.id);
        const idx = remaining.findIndex((t) => t.id === task.id);
        if (idx >= 0) remaining.splice(idx, 1);
      });
    }

    return results;
  }

  /**
   * Execute tasks sequentially
   */
  private async executeSequential(tasks: Task[], stopOnError: boolean): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);

      if (stopOnError && result.status === "failed") {
        break;
      }
    }

    return results;
  }

  /**
   * Merge results from multiple tasks
   */
  private mergeResults(results: TaskResult[]): Record<string, any> {
    return results.reduce(
      (merged, result) => {
        merged[result.taskId] = result.output;
        return merged;
      },
      {} as Record<string, any>
    );
  }

  /**
   * Summarize results using AI
   */
  private async summarizeResults(results: TaskResult[]): Promise<string> {
    const prompt = `
      Summarize the following task results into a cohesive response:
      
      ${results.map((r) => `TASK ${r.taskId}:\n${r.output}`).join("\n\n---\n\n")}
      
      Provide a clear, well-organized summary that captures the key points from all results.
    `;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content || "";
  }

  /**
   * Vote on results (for consensus-based decisions)
   */
  private voteResults(results: TaskResult[]): { winner: any; votes: Record<string, number> } {
    const votes: Record<string, number> = {};

    results.forEach((result) => {
      const key = JSON.stringify(result.output);
      votes[key] = (votes[key] || 0) + 1;
    });

    const winner = Object.entries(votes)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => {
        try {
          return JSON.parse(key);
        } catch {
          return key;
        }
      })[0];

    return { winner, votes };
  }

  /**
   * Log task execution to database
   */
  private async logTaskExecution(task: Task, agent: AgentCapability, result: TaskResult): Promise<void> {
    try {
      // Find or create a workflow for orchestrated tasks
      let workflow = await prisma.aIWorkflow.findFirst({
        where: { name: "multi-agent-orchestrator" },
      });

      if (!workflow) {
        workflow = await prisma.aIWorkflow.create({
          data: {
            name: "multi-agent-orchestrator",
            description: "Multi-agent task orchestration",
            category: "orchestration",
            triggerType: "manual",
            enabled: true,
            requiresApproval: false,
            riskLevel: "medium",
            aiModel: this.config.defaultModel,
            config: JSON.stringify({ agents: Array.from(this.agents.keys()) }),
          },
        });
      }

      // Create execution record
      await prisma.aIWorkflowExecution.create({
        data: {
          workflowId: workflow.id,
          status: result.status === "success" ? "completed" : "failed",
          triggeredBy: `agent:${agent.id}`,
          triggerData: JSON.stringify({
            taskId: task.id,
            taskType: task.type,
            agentId: agent.id,
            agentName: agent.name,
            output: result.output ? JSON.stringify(result.output).slice(0, 5000) : null,
            tokensUsed: result.tokens.prompt + result.tokens.completion,
          }),
          startedAt: new Date(Date.now() - result.duration),
          completedAt: new Date(),
          duration: result.duration,
          error: result.error,
        },
      });
    } catch (error) {
      console.error("Failed to log task execution:", error);
    }
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string): boolean {
    const controller = this.runningTasks.get(taskId);
    if (controller) {
      controller.abort();
      this.runningTasks.delete(taskId);
      return true;
    }
    return false;
  }

  /**
   * Get orchestrator statistics
   */
  async getStats(): Promise<{
    totalAgents: number;
    runningTasks: number;
    executionsToday: number;
    successRate: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [total, successful] = await Promise.all([
      prisma.aIWorkflowExecution.count({
        where: {
          workflow: { name: "multi-agent-orchestrator" },
          startedAt: { gte: startOfDay },
        },
      }),
      prisma.aIWorkflowExecution.count({
        where: {
          workflow: { name: "multi-agent-orchestrator" },
          status: "completed",
          startedAt: { gte: startOfDay },
        },
      }),
    ]);

    return {
      totalAgents: this.agents.size,
      runningTasks: this.runningTasks.size,
      executionsToday: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  }
}

// Export singleton instance
export const orchestrator = new MultiAgentOrchestrator();

export default MultiAgentOrchestrator;
