// Agent System Types

export type AgentType =
  | 'ORCHESTRATOR'
  | 'PLANNER'
  | 'SUPERVISOR'
  | 'CODE'
  | 'RESEARCH'
  | 'SEO'
  | 'BLOG'
  | 'BUSINESS'
  | 'RPA'
  | 'SECURITY'
  | 'REVIEWER'
  | 'RISK'
  | 'COMPLIANCE';

export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETRY';

export type ModelProvider = 'anthropic' | 'openai' | 'cloudflare' | 'local';

export interface AgentConfig {
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  modelProvider: ModelProvider;
  modelName: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  tools: string[];
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface TaskContext {
  taskId: string;
  task: string;
  context: Record<string, unknown>;
  tools: string[];
  memory: MemoryMatch[];
  previousAttempts: AttemptLog[];
  maxAttempts: number;
  currentAttempt: number;
  userId?: string;
  priority: number;
}

export interface MemoryMatch {
  id: string;
  content: string;
  summary?: string;
  similarity: number;
  memoryType: string;
  tags: string[];
  createdAt: Date;
}

export interface AttemptLog {
  attempt: number;
  agentName: string;
  action: string;
  result: string;
  success: boolean;
  durationMs: number;
  tokensUsed: number;
  timestamp: Date;
}

export interface AgentResponse {
  success: boolean;
  result?: string;
  data?: Record<string, unknown>;
  error?: string;
  tokensUsed: number;
  durationMs: number;
  nextAction?: NextAction;
}

export interface NextAction {
  type: 'delegate' | 'retry' | 'complete' | 'fail' | 'human_review';
  targetAgent?: AgentType;
  reason: string;
  data?: Record<string, unknown>;
}

export interface TaskPlan {
  taskId: string;
  originalTask: string;
  steps: PlanStep[];
  estimatedDuration: number;
  estimatedCost: number;
  createdAt: Date;
}

export interface PlanStep {
  stepNumber: number;
  description: string;
  assignedAgent: AgentType;
  dependencies: number[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface JobResult {
  jobId: string;
  status: JobStatus;
  result?: string;
  data?: Record<string, unknown>;
  error?: string;
  steps: PlanStep[];
  totalTokens: number;
  totalCost: number;
  totalDuration: number;
  completedAt: Date;
}

// Tool definitions
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Agent registry
export interface AgentRegistry {
  agents: Map<AgentType, AgentConfig>;
  getAgent: (type: AgentType) => AgentConfig | undefined;
  registerAgent: (config: AgentConfig) => void;
}

// Message envelope for agent communication
export interface AgentEnvelope {
  id: string;
  from: AgentType | 'user' | 'system';
  to: AgentType;
  task: string;
  context: TaskContext;
  timestamp: Date;
  priority: number;
  metadata?: Record<string, unknown>;
}
