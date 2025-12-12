/**
 * AI Model Configurations
 * 
 * Centralized configuration for all AI models across providers
 * with capabilities, limits, and pricing information
 */

export type AIProvider = 
  | 'openai' 
  | 'anthropic' 
  | 'deepseek' 
  | 'gemini' 
  | 'ollama' 
  | 'cohere'
  | 'cloudflare';

export type ModelCapability = 
  | 'text' 
  | 'vision' 
  | 'function-calling' 
  | 'streaming' 
  | 'json-mode'
  | 'embeddings'
  | 'code';

export interface ModelConfig {
  id: string;
  provider: AIProvider;
  displayName: string;
  description?: string;
  capabilities: ModelCapability[];
  maxTokens: number;
  contextWindow: number;
  temperature: number;
  topP?: number;
  costPer1kInputTokens?: number; // USD
  costPer1kOutputTokens?: number; // USD
  latencyTier: 'fast' | 'medium' | 'slow';
  qualityTier: 'high' | 'medium' | 'low';
  deprecated?: boolean;
  aliases?: string[];
}

// OpenAI Models
const OPENAI_MODELS: ModelConfig[] = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    displayName: 'GPT-4o',
    description: 'Most capable GPT-4 model with vision',
    capabilities: ['text', 'vision', 'function-calling', 'streaming', 'json-mode', 'code'],
    maxTokens: 4096,
    contextWindow: 128000,
    temperature: 0.7,
    topP: 1,
    costPer1kInputTokens: 0.005,
    costPer1kOutputTokens: 0.015,
    latencyTier: 'fast',
    qualityTier: 'high',
    aliases: ['gpt4o', 'gpt-4-omni'],
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    displayName: 'GPT-4o Mini',
    description: 'Affordable and fast GPT-4 model',
    capabilities: ['text', 'vision', 'function-calling', 'streaming', 'json-mode', 'code'],
    maxTokens: 16384,
    contextWindow: 128000,
    temperature: 0.7,
    topP: 1,
    costPer1kInputTokens: 0.00015,
    costPer1kOutputTokens: 0.0006,
    latencyTier: 'fast',
    qualityTier: 'medium',
    aliases: ['gpt4o-mini', 'gpt-4-mini'],
  },
  {
    id: 'gpt-4-turbo',
    provider: 'openai',
    displayName: 'GPT-4 Turbo',
    description: 'Enhanced GPT-4 with vision',
    capabilities: ['text', 'vision', 'function-calling', 'streaming', 'json-mode', 'code'],
    maxTokens: 4096,
    contextWindow: 128000,
    temperature: 0.7,
    costPer1kInputTokens: 0.01,
    costPer1kOutputTokens: 0.03,
    latencyTier: 'medium',
    qualityTier: 'high',
    aliases: ['gpt4-turbo'],
  },
  {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    displayName: 'GPT-3.5 Turbo',
    description: 'Fast and affordable model',
    capabilities: ['text', 'function-calling', 'streaming', 'json-mode'],
    maxTokens: 4096,
    contextWindow: 16385,
    temperature: 0.7,
    costPer1kInputTokens: 0.0005,
    costPer1kOutputTokens: 0.0015,
    latencyTier: 'fast',
    qualityTier: 'medium',
    aliases: ['gpt35', 'gpt-3.5'],
  },
];

// Anthropic Models
const ANTHROPIC_MODELS: ModelConfig[] = [
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Most intelligent Claude model',
    capabilities: ['text', 'vision', 'function-calling', 'streaming', 'code'],
    maxTokens: 8192,
    contextWindow: 200000,
    temperature: 0.7,
    topP: 1,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    latencyTier: 'medium',
    qualityTier: 'high',
    aliases: ['claude-3.5-sonnet', 'claude-sonnet', 'claude'],
  },
  {
    id: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    displayName: 'Claude 3 Haiku',
    description: 'Fastest and most compact Claude model',
    capabilities: ['text', 'vision', 'streaming'],
    maxTokens: 4096,
    contextWindow: 200000,
    temperature: 0.7,
    costPer1kInputTokens: 0.00025,
    costPer1kOutputTokens: 0.00125,
    latencyTier: 'fast',
    qualityTier: 'medium',
    aliases: ['claude-haiku', 'claude-3-haiku'],
  },
  {
    id: 'claude-3-opus-20240229',
    provider: 'anthropic',
    displayName: 'Claude 3 Opus',
    description: 'Most capable Claude 3 model',
    capabilities: ['text', 'vision', 'function-calling', 'streaming', 'code'],
    maxTokens: 4096,
    contextWindow: 200000,
    temperature: 0.7,
    costPer1kInputTokens: 0.015,
    costPer1kOutputTokens: 0.075,
    latencyTier: 'slow',
    qualityTier: 'high',
    aliases: ['claude-opus', 'claude-3-opus'],
  },
];

// DeepSeek Models
const DEEPSEEK_MODELS: ModelConfig[] = [
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    displayName: 'DeepSeek Chat',
    description: 'DeepSeek conversational model',
    capabilities: ['text', 'streaming', 'code'],
    maxTokens: 4096,
    contextWindow: 32768,
    temperature: 0.7,
    costPer1kInputTokens: 0.0001,
    costPer1kOutputTokens: 0.0002,
    latencyTier: 'medium',
    qualityTier: 'medium',
    aliases: ['deepseek'],
  },
  {
    id: 'deepseek-coder',
    provider: 'deepseek',
    displayName: 'DeepSeek Coder',
    description: 'Specialized coding model',
    capabilities: ['text', 'code', 'streaming'],
    maxTokens: 4096,
    contextWindow: 32768,
    temperature: 0.5,
    costPer1kInputTokens: 0.0001,
    costPer1kOutputTokens: 0.0002,
    latencyTier: 'medium',
    qualityTier: 'high',
    aliases: ['deepseek-code'],
  },
];

// Google Gemini Models
const GEMINI_MODELS: ModelConfig[] = [
  {
    id: 'gemini-1.5-pro',
    provider: 'gemini',
    displayName: 'Gemini 1.5 Pro',
    description: 'Google\'s most capable model (FREE)',
    capabilities: ['text', 'vision', 'function-calling', 'streaming', 'code'],
    maxTokens: 8192,
    contextWindow: 2000000, // 2M tokens!
    temperature: 0.7,
    costPer1kInputTokens: 0, // FREE tier
    costPer1kOutputTokens: 0,
    latencyTier: 'medium',
    qualityTier: 'high',
    aliases: ['gemini-pro', 'gemini'],
  },
  {
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient Gemini (FREE)',
    capabilities: ['text', 'vision', 'streaming', 'code'],
    maxTokens: 8192,
    contextWindow: 1000000,
    temperature: 0.7,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    latencyTier: 'fast',
    qualityTier: 'medium',
    aliases: ['gemini-flash'],
  },
];

// Ollama Local Models
const OLLAMA_MODELS: ModelConfig[] = [
  {
    id: 'llama3.1:8b',
    provider: 'ollama',
    displayName: 'Llama 3.1 8B',
    description: 'Meta\'s Llama 3.1 - 8B parameters (FREE, local)',
    capabilities: ['text', 'streaming', 'code'],
    maxTokens: 4096,
    contextWindow: 8192,
    temperature: 0.7,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    latencyTier: 'fast',
    qualityTier: 'medium',
    aliases: ['llama3.1', 'llama'],
  },
  {
    id: 'codellama:13b',
    provider: 'ollama',
    displayName: 'Code Llama 13B',
    description: 'Specialized coding model (FREE, local)',
    capabilities: ['text', 'code', 'streaming'],
    maxTokens: 4096,
    contextWindow: 8192,
    temperature: 0.5,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    latencyTier: 'medium',
    qualityTier: 'high',
    aliases: ['codellama'],
  },
];

// Cloudflare Workers AI Models
const CLOUDFLARE_MODELS: ModelConfig[] = [
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    provider: 'cloudflare',
    displayName: 'Llama 3.1 8B (Cloudflare)',
    description: 'Meta Llama 3.1 on Cloudflare Workers AI (FREE)',
    capabilities: ['text', 'streaming', 'code'],
    maxTokens: 2048,
    contextWindow: 8192,
    temperature: 0.7,
    costPer1kInputTokens: 0,
    costPer1kOutputTokens: 0,
    latencyTier: 'fast',
    qualityTier: 'medium',
    aliases: ['cf-llama', 'cloudflare-llama'],
  },
];

// Cohere Models
const COHERE_MODELS: ModelConfig[] = [
  {
    id: 'command-r-plus',
    provider: 'cohere',
    displayName: 'Command R+',
    description: 'Cohere\'s most capable model',
    capabilities: ['text', 'streaming', 'code'],
    maxTokens: 4096,
    contextWindow: 128000,
    temperature: 0.7,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    latencyTier: 'medium',
    qualityTier: 'high',
    aliases: ['command-r+', 'cohere'],
  },
];

// All models combined
export const ALL_MODELS: ModelConfig[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...DEEPSEEK_MODELS,
  ...GEMINI_MODELS,
  ...OLLAMA_MODELS,
  ...CLOUDFLARE_MODELS,
  ...COHERE_MODELS,
];

// Default models per provider
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  deepseek: 'deepseek-chat',
  gemini: 'gemini-1.5-flash',
  ollama: 'llama3.1:8b',
  cloudflare: '@cf/meta/llama-3.1-8b-instruct',
  cohere: 'command-r-plus',
};

// Model aliases map
export const MODEL_ALIASES: Record<string, string> = ALL_MODELS
  .filter(m => m.aliases)
  .flatMap(m => m.aliases!.map(alias => ({ alias, id: m.id })))
  .reduce((acc, { alias, id }) => ({ ...acc, [alias]: id }), {});

/**
 * Get model configuration by ID or alias
 */
export function getModelConfig(modelIdOrAlias: string): ModelConfig | undefined {
  // Try direct ID match first
  let model = ALL_MODELS.find(m => m.id === modelIdOrAlias);
  
  // Try alias match if not found
  if (!model) {
    const realId = MODEL_ALIASES[modelIdOrAlias];
    if (realId) {
      model = ALL_MODELS.find(m => m.id === realId);
    }
  }
  
  return model;
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: AIProvider): ModelConfig | undefined {
  const defaultModelId = DEFAULT_MODELS[provider];
  return getModelConfig(defaultModelId);
}

/**
 * Check if a model supports a specific capability
 */
export function modelSupports(modelIdOrAlias: string, capability: ModelCapability): boolean {
  const model = getModelConfig(modelIdOrAlias);
  return model?.capabilities.includes(capability) ?? false;
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: AIProvider): ModelConfig[] {
  return ALL_MODELS.filter(m => m.provider === provider);
}

/**
 * Get models by capability
 */
export function getModelsByCapability(capability: ModelCapability): ModelConfig[] {
  return ALL_MODELS.filter(m => m.capabilities.includes(capability));
}

/**
 * Get free models (no cost)
 */
export function getFreeModels(): ModelConfig[] {
  return ALL_MODELS.filter(m => 
    m.costPer1kInputTokens === 0 && m.costPer1kOutputTokens === 0
  );
}

/**
 * Get fastest models
 */
export function getFastestModels(): ModelConfig[] {
  return ALL_MODELS.filter(m => m.latencyTier === 'fast');
}

/**
 * Get highest quality models
 */
export function getBestQualityModels(): ModelConfig[] {
  return ALL_MODELS.filter(m => m.qualityTier === 'high');
}

/**
 * Calculate cost for a request
 */
export function calculateCost(
  modelIdOrAlias: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelConfig(modelIdOrAlias);
  if (!model) return 0;
  
  const inputCost = (model.costPer1kInputTokens ?? 0) * (inputTokens / 1000);
  const outputCost = (model.costPer1kOutputTokens ?? 0) * (outputTokens / 1000);
  
  return inputCost + outputCost;
}

/**
 * Find cheapest model with required capabilities
 */
export function findCheapestModel(capabilities: ModelCapability[]): ModelConfig | undefined {
  const eligibleModels = ALL_MODELS.filter(m =>
    capabilities.every(cap => m.capabilities.includes(cap))
  );
  
  if (eligibleModels.length === 0) return undefined;
  
  return eligibleModels.sort((a, b) => {
    const costA = (a.costPer1kInputTokens ?? 0) + (a.costPer1kOutputTokens ?? 0);
    const costB = (b.costPer1kInputTokens ?? 0) + (b.costPer1kOutputTokens ?? 0);
    return costA - costB;
  })[0];
}

/**
 * Recommend a model based on requirements
 */
export interface ModelRequirements {
  capabilities?: ModelCapability[];
  maxCostPer1kTokens?: number;
  minContextWindow?: number;
  preferredLatency?: 'fast' | 'medium' | 'slow';
  preferredQuality?: 'high' | 'medium' | 'low';
  freeOnly?: boolean;
}

export function recommendModel(requirements: ModelRequirements): ModelConfig | undefined {
  let candidates = ALL_MODELS;
  
  // Filter by capabilities
  if (requirements.capabilities) {
    candidates = candidates.filter(m =>
      requirements.capabilities!.every(cap => m.capabilities.includes(cap))
    );
  }
  
  // Filter by cost
  if (requirements.maxCostPer1kTokens !== undefined) {
    candidates = candidates.filter(m => {
      const totalCost = (m.costPer1kInputTokens ?? 0) + (m.costPer1kOutputTokens ?? 0);
      return totalCost <= requirements.maxCostPer1kTokens!;
    });
  }
  
  // Filter by context window
  if (requirements.minContextWindow) {
    candidates = candidates.filter(m => m.contextWindow >= requirements.minContextWindow!);
  }
  
  // Filter by free only
  if (requirements.freeOnly) {
    candidates = candidates.filter(m =>
      m.costPer1kInputTokens === 0 && m.costPer1kOutputTokens === 0
    );
  }
  
  // Prefer specific latency tier
  if (requirements.preferredLatency) {
    const preferred = candidates.filter(m => m.latencyTier === requirements.preferredLatency);
    if (preferred.length > 0) candidates = preferred;
  }
  
  // Prefer specific quality tier
  if (requirements.preferredQuality) {
    const preferred = candidates.filter(m => m.qualityTier === requirements.preferredQuality);
    if (preferred.length > 0) candidates = preferred;
  }
  
  // Return first match (could add more sophisticated ranking)
  return candidates[0];
}
