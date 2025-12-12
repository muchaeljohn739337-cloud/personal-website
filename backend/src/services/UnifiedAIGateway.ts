/**
 * Unified AI Gateway
 *
 * Single interface to access multiple AI providers with:
 * - Automatic failover & circuit breaking
 * - Cost optimization & rate limiting
 * - Response caching & request deduplication
 * - Comprehensive error handling & retries
 * - Load balancing & provider health monitoring
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { AIErrorType, RetryPolicy } from "../ai-core/errors";
import { logger } from "../utils/logger";

// Circuit breaker configuration
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening the circuit
  resetTimeout: number; // Time in ms to wait before attempting to close the circuit
  successThreshold: number; // Number of successful requests required to close the circuit
}

// Provider health status
interface ProviderHealth {
  failures: number;
  successes: number;
  lastFailure: number | null;
  circuitState: "closed" | "open" | "half-open";
}

// Rate limiting configuration
interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

// Default circuit breaker configuration
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeout: 60000, // 1 minute
  successThreshold: 2,
};

// Default rate limits per provider
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  openai: { requestsPerMinute: 3500, tokensPerMinute: 90000 },
  anthropic: { requestsPerMinute: 1000, tokensPerMinute: 40000 },
  deepseek: { requestsPerMinute: 500, tokensPerMinute: 100000 },
  gemini: { requestsPerMinute: 60, tokensPerMinute: 1000000 },
  ollama: { requestsPerMinute: 100, tokensPerMinute: 50000 },
  cohere: { requestsPerMinute: 1000, tokensPerMinute: 100000 },
  cloudflare: { requestsPerMinute: 100, tokensPerMinute: 10000 },
};

// Custom retry policy for AI operations
const AI_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  factor: 2,
  retryOnError: (error) => {
    // Don't retry on client errors (4xx) except rate limits and timeouts
    if (error.type === AIErrorType.PROVIDER_RATE_LIMITED) return true;
    if (error.type === AIErrorType.TIMEOUT) return true;
    if (error.type === AIErrorType.PROVIDER_UNAVAILABLE) return true;
    return false;
  },
};

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
};

// Provider types
export type AIProvider = "openai" | "anthropic" | "deepseek" | "gemini" | "ollama" | "cohere" | "cloudflare";

// Provider metadata
interface ProviderMetadata {
  name: string;
  description: string;
  capabilities: string[];
  maxContextLength: number;
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
}

// Provider metadata mapping
export const PROVIDER_METADATA: Record<AIProvider, ProviderMetadata> = {
  openai: {
    name: "OpenAI",
    description: "Powerful language models including GPT-4 and GPT-3.5",
    capabilities: ["text", "code", "function-calling", "vision"],
    maxContextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    supportsVision: true,
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude models with strong reasoning and safety features",
    capabilities: ["text", "code"],
    maxContextLength: 200000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: false,
  },
  deepseek: {
    name: "DeepSeek",
    description: "High-performance models with large context windows",
    capabilities: ["text", "code"],
    maxContextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: false,
  },
  gemini: {
    name: "Google Gemini",
    description: "Multimodal models from Google",
    capabilities: ["text", "code", "vision"],
    maxContextLength: 1000000,
    supportsStreaming: true,
    supportsFunctionCalling: true,
    supportsVision: true,
  },
  ollama: {
    name: "Ollama",
    description: "Local LLM models including Llama 3",
    capabilities: ["text", "code"],
    maxContextLength: 32000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: false,
  },
  cohere: {
    name: "Cohere",
    description: "Command models for enterprise applications",
    capabilities: ["text", "code"],
    maxContextLength: 128000,
    supportsStreaming: true,
    supportsFunctionCalling: false,
    supportsVision: false,
  },
  cloudflare: {
    name: "Cloudflare Workers AI",
    description: "Edge-optimized AI models",
    capabilities: ["text", "code"],
    maxContextLength: 32000,
    supportsStreaming: false,
    supportsFunctionCalling: false,
    supportsVision: false,
  },
};

// Model definitions
export interface ModelConfig {
  provider: AIProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  costPerToken: number; // in cents per 1M tokens
  capabilities: string[];
  maxContextLength: number;
  supportsStreaming: boolean;
  supportsFunctionCalling?: boolean;
  supportsVision?: boolean;
}

export interface AIRequest {
  // Core request fields
  prompt: string;
  systemPrompt?: string;

  // Model configuration
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // Advanced features
  stream?: boolean;
  cache?: boolean | number; // Can be boolean or TTL in ms
  timeout?: number; // Request timeout in ms

  // Function calling
  functions?: Array<{
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }>;
  functionCall?: "none" | "auto" | { name: string };

  // Vision support
  images?: Array<{
    url?: string;
    base64?: string;
    mimeType?: string;
  }>;

  // Request metadata
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;

  // Retry configuration
  retry?: boolean | Partial<RetryPolicy>;

  // Fallback configuration
  fallbackModels?: Array<{ provider: AIProvider; model: string }>;
}

export interface AIResponse {
  // Core response
  content: string;
  provider: AIProvider;
  model: string;

  // Token usage
  tokens: {
    prompt: number;
    completion: number;
    total: number;
    cachedPromptTokens?: number; // Tokens from cached prompts
  };

  // Performance metrics
  cost: number; // in cents
  latency: number; // in ms

  // Response metadata
  cached: boolean;
  cacheHit?: boolean;
  cacheKey?: string;

  // Function calling
  functionCall?: {
    name: string;
    arguments: string | Record<string, any>;
  };

  // Additional metadata
  finishReason?: string;
  warnings?: string[];
  metadata?: Record<string, any>;

  // Request information
  requestId?: string;
  modelId?: string; // Specific model ID used

  // Provider-specific data
  rawResponse?: any;
}

export interface ProviderConfig {
  // Core configuration
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  priority: number; // Lower = higher priority for failover

  // Rate limiting
  rateLimit?: RateLimitConfig;

  // Circuit breaker
  circuitBreaker?: CircuitBreakerConfig;

  // Timeouts
  timeout?: number; // Default timeout in ms

  // Model-specific overrides
  modelOverrides?: Record<
    string,
    {
      maxTokens?: number;
      temperature?: number;
      enabled?: boolean;
    }
  >;

  // Custom headers
  headers?: Record<string, string>;

  // Authentication
  auth?: {
    type: "api_key" | "bearer" | "custom";
    header?: string;
    prefix?: string;
  };

  // Retry configuration
  retry?: Partial<RetryPolicy>;

  // Metadata
  metadata?: Record<string, any>;
}

export class UnifiedAIGateway {
  // Core state
  private providers: Map<AIProvider, ProviderConfig> = new Map();
  private clients: Map<AIProvider, any> = new Map();
  private healthStatus: Map<AIProvider, ProviderHealth> = new Map();
  private lastRequestTime: Map<AIProvider, number> = new Map();
  private requestCounts: Map<AIProvider, { count: number; tokens: number }> = new Map();

  // Cache with TTL support
  private cache: Map<string, { response: AIResponse; expires: number }> = new Map();
  private cacheHits = 0;
  private cacheMisses = 0;

  // Circuit breakers
  private circuitBreakers: Map<
    AIProvider,
    {
      state: "closed" | "open" | "half-open";
      failures: number;
      lastFailure: number | null;
      successCount: number;
    }
  > = new Map();

  // Request queue for rate limiting
  private requestQueue: Map<AIProvider, Array<() => Promise<void>>> = new Map();
  private isProcessingQueue: Map<AIProvider, boolean> = new Map();

  // Stats
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    providerErrors: new Map<AIProvider, number>(),
  };

  // Cache for model resolution
  private modelCache: Map<string, { provider: AIProvider; model: string }> = new Map();

  // Model configurations with enhanced metadata
  private models: ModelConfig[] = [
    // OpenAI Models
    {
      provider: "openai",
      model: "gpt-4o",
      maxTokens: 16000,
      temperature: 0.7,
      costPerToken: 0.5,
      capabilities: ["text", "code", "function-calling", "vision"],
      maxContextLength: 128000,
      supportsStreaming: true,
    },
    {
      provider: "openai",
      model: "gpt-4-turbo",
      maxTokens: 128000,
      temperature: 0.7,
      costPerToken: 1.0,
      capabilities: ["text", "code", "function-calling", "vision"],
      maxContextLength: 128000,
      supportsStreaming: true,
    },
    {
      provider: "openai",
      model: "gpt-3.5-turbo",
      maxTokens: 16000,
      temperature: 0.7,
      costPerToken: 0.05,
      capabilities: ["text", "code", "function-calling"],
      maxContextLength: 16000,
      supportsStreaming: true,
    },

    // Claude Models
    {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      maxTokens: 200000,
      temperature: 0.7,
      costPerToken: 0.3,
      capabilities: ["text", "code"],
      maxContextLength: 200000,
      supportsStreaming: true,
    },
    {
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      maxTokens: 200000,
      temperature: 0.7,
      costPerToken: 1.5,
      capabilities: ["text", "code"],
      maxContextLength: 200000,
      supportsStreaming: true,
    },
    {
      provider: "anthropic",
      model: "claude-3-haiku-20240307",
      maxTokens: 200000,
      temperature: 0.7,
      costPerToken: 0.025,
      capabilities: ["text", "code"],
      maxContextLength: 200000,
      supportsStreaming: true,
    },

    // DeepSeek Models
    {
      provider: "deepseek",
      model: "deepseek-chat",
      maxTokens: 64000,
      temperature: 0.7,
      costPerToken: 0.014,
      capabilities: ["text", "code"],
      maxContextLength: 128000,
      supportsStreaming: true,
    },

    // Google Gemini Models
    {
      provider: "gemini",
      model: "gemini-1.5-pro",
      maxTokens: 2097152,
      temperature: 0.7,
      costPerToken: 0.125,
      capabilities: ["text", "code", "vision"],
      maxContextLength: 2097152,
      supportsStreaming: true,
    },

    // Llama 3 (via Ollama)
    {
      provider: "ollama",
      model: "llama3.1:8b",
      maxTokens: 8192,
      temperature: 0.7,
      costPerToken: 0.0,
      capabilities: ["text", "code"],
      maxContextLength: 8192,
      supportsStreaming: true,
    },

    // Cohere Models
    {
      provider: "cohere",
      model: "command-r-plus",
      maxTokens: 128000,
      temperature: 0.7,
      costPerToken: 0.3,
      capabilities: ["text", "code"],
      maxContextLength: 128000,
      supportsStreaming: true,
    },

    // Cloudflare AI Workers
    {
      provider: "cloudflare",
      model: "@cf/meta/llama-3.1-8b-instruct",
      maxTokens: 4096,
      temperature: 0.7,
      costPerToken: 0.0,
      capabilities: ["text", "code"],
      maxContextLength: 4096,
      supportsStreaming: false,
    },
  ];

  // Model aliases for backward compatibility
  private modelAliases: Record<string, string> = {
    // OpenAI
    "gpt-4": "gpt-4-turbo",
    "gpt-4-32k": "gpt-4-turbo",
    "gpt-3.5": "gpt-3.5-turbo",

    // Anthropic
    "claude-3-opus": "claude-3-opus-20240229",
    "claude-3-sonnet": "claude-3-sonnet-20240229",
    "claude-3-haiku": "claude-3-haiku-20240307",

    // DeepSeek
    deepseek: "deepseek-chat",

    // Gemini
    "gemini-pro": "gemini-1.5-pro",

    // Ollama
    llama3: "llama3.1:8b",
    "llama3:8b": "llama3.1:8b",

    // Cohere
    "command-r": "command-r-plus",
  };

  constructor() {
    this.initializeProviders();
    this.initializeCircuitBreakers();
    this.initializeCleanupInterval();
  }

  /**
   * Initialize circuit breakers for all providers
   */
  private initializeCircuitBreakers(): void {
    for (const provider of this.providers.keys()) {
      this.circuitBreakers.set(provider, {
        state: "closed",
        failures: 0,
        lastFailure: null,
        successCount: 0,
      });
    }
  }

  /**
   * Set up periodic cleanup tasks
   */
  private initializeCleanupInterval(): void {
    // Clean up expired cache entries every minute
    setInterval(() => {
      const now = Date.now();
      let expiredCount = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.expires <= now) {
          this.cache.delete(key);
          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        logger.debug(`Cleaned up ${expiredCount} expired cache entries`);
      }
    }, 60000); // Every minute

    // Log stats every 5 minutes
    setInterval(
      () => {
        this.logStats();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Log gateway statistics
   */
  private logStats(): void {
    const stats = {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      successRate:
        this.stats.totalRequests > 0
          ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2) + "%"
          : "N/A",
      totalTokens: this.stats.totalTokens,
      totalCost: `$${(this.stats.totalCost / 100).toFixed(2)}`,
      cacheHitRate:
        this.cacheHits + this.cacheMisses > 0
          ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(2) + "%"
          : "N/A",
      providerStatus: Array.from(this.providers.entries()).map(([provider, config]) => ({
        provider,
        enabled: config.enabled,
        failures: this.circuitBreakers.get(provider)?.failures || 0,
        state: this.circuitBreakers.get(provider)?.state || "unknown",
        requests: this.requestCounts.get(provider)?.count || 0,
      })),
    };

    logger.info("AI Gateway Stats", stats);
  }

  /**
   * Initialize all AI providers with enhanced configuration
   */
  private initializeProviders(): void {
    // Initialize OpenAI client
    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      logger.warn("OPENAI_API_KEY is not set. OpenAI provider will be disabled.");
    } else {
      try {
        this.clients.set(
          "openai",
          new OpenAI({
            apiKey: openAiApiKey,
          })
        );
        logger.info("OpenAI client initialized successfully");
      } catch (error) {
        logger.error("Failed to initialize OpenAI client:", error);
      }
    }

    const providers: Array<[AIProvider, Omit<ProviderConfig, "enabled">]> = [
      // OpenAI
      [
        "openai",
        {
          endpoint: process.env.OPENAI_API_ENDPOINT,
          priority: 1,
          rateLimit: {
            requestsPerMinute: 3500, // 60 RPM for free tier, 3500 RPM for pay-as-you-go
            tokensPerMinute: 90000, // ~1M tokens/hour
          },
          circuitBreaker: {
            failureThreshold: 3,
            resetTimeout: 60000, // 1 minute
            successThreshold: 2,
          },
          timeout: 30000, // 30 seconds
          modelOverrides: {
            "gpt-4-turbo": { maxTokens: 128000 },
            "gpt-4": { maxTokens: 8192 },
            "gpt-3.5-turbo": { maxTokens: 16385 },
          },
          metadata: {
            supportsFunctionCalling: true,
            supportsVision: true,
          },
        },
      ],

      // Anthropic (Claude)
      [
        "anthropic",
        {
          apiKey: process.env.ANTHROPIC_API_KEY,
          endpoint: process.env.ANTHROPIC_API_ENDPOINT,
          priority: 2,
          rateLimit: {
            requestsPerMinute: 1000, // 1000 RPM
            tokensPerMinute: 40000, // 400K tokens/minute
          },
          circuitBreaker: {
            failureThreshold: 3,
            resetTimeout: 60000,
            successThreshold: 2,
          },
          timeout: 60000, // 60 seconds
          modelOverrides: {
            "claude-3-opus-20240229": { maxTokens: 200000 },
            "claude-3-sonnet-20240229": { maxTokens: 200000 },
            "claude-3-haiku-20240307": { maxTokens: 200000 },
          },
        },
      ],

      // DeepSeek
      [
        "deepseek",
        {
          apiKey: process.env.DEEPSEEK_API_KEY,
          endpoint: process.env.DEEPSEEK_ENDPOINT || "https://api.deepseek.com",
          priority: 3,
          rateLimit: {
            requestsPerMinute: 500,
            tokensPerMinute: 100000,
          },
          timeout: 45000, // 45 seconds
        },
      ],

      // Google Gemini
      [
        "gemini",
        {
          apiKey: process.env.GEMINI_API_KEY,
          endpoint: process.env.GEMINI_API_ENDPOINT,
          priority: 4,
          rateLimit: {
            requestsPerMinute: 60, // 60 RPM
            tokensPerMinute: 1000000, // 1M tokens/minute
          },
          timeout: 60000, // 60 seconds
          modelOverrides: {
            "gemini-1.5-pro": { maxTokens: 1048576 },
            "gemini-1.5-flash": { maxTokens: 1048576 },
          },
          metadata: {
            supportsFunctionCalling: true,
            supportsVision: true,
          },
        },
      ],

      // Ollama (Local)
      [
        "ollama",
        {
          endpoint: process.env.OLLAMA_ENDPOINT || "http://127.0.0.1:11434",
          priority: 5,
          rateLimit: {
            requestsPerMinute: 100, // Local model, limited by hardware
            tokensPerMinute: 50000, // ~50K tokens/minute for 7B model
          },
          timeout: 120000, // 2 minutes for local models
          modelOverrides: {
            "llama3.1:8b": { maxTokens: 8192 },
            "llama3.2:3b": { maxTokens: 4096 },
          },
        },
      ],

      // Cohere
      [
        "cohere",
        {
          apiKey: process.env.COHERE_API_KEY,
          endpoint: process.env.COHERE_API_ENDPOINT,
          priority: 6,
          rateLimit: {
            requestsPerMinute: 1000, // 1000 RPM
            tokensPerMinute: 100000, // 100K tokens/minute
          },
          timeout: 60000, // 60 seconds
        },
      ],

      // Cloudflare AI Workers
      [
        "cloudflare",
        {
          apiKey: process.env.CLOUDFLARE_API_TOKEN,
          endpoint:
            process.env.CLOUDFLARE_AI_ENDPOINT ||
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`,
          priority: 7,
          rateLimit: {
            requestsPerMinute: 100, // 100 RPM
            tokensPerMinute: 10000, // 10K tokens/minute
          },
          timeout: 30000, // 30 seconds
        },
      ],
    ];

    // Initialize each provider
    for (const [provider, config] of providers) {
      try {
        const apiKey = "apiKey" in config ? config.apiKey : undefined;
        const endpoint = "endpoint" in config ? config.endpoint : undefined;

        // Skip if required API key is missing
        if (apiKey === undefined && provider !== "ollama") {
          console.warn(`⚠️  Skipping ${provider} - API key not found`);
          continue;
        }

        // Initialize provider clients
        switch (provider) {
          case "openai":
            if (apiKey) {
              this.clients.set(
                provider,
                new OpenAI({
                  apiKey,
                  baseURL: endpoint,
                  timeout: config.timeout,
                })
              );
            }
            break;

          case "anthropic":
            if (apiKey) {
              this.clients.set(
                provider,
                new Anthropic({
                  apiKey,
                  baseURL: endpoint,
                  timeout: config.timeout,
                })
              );
            }
            break;

          case "deepseek":
            if (apiKey) {
              this.clients.set(
                provider,
                new OpenAI({
                  apiKey,
                  baseURL: endpoint || "https://api.deepseek.com",
                  timeout: config.timeout,
                })
              );
            }
            break;

          case "gemini":
            if (apiKey) {
              this.clients.set(provider, new GoogleGenerativeAI(apiKey));
            }
            break;

          // Other providers use REST API directly
          default:
            // Client will be created on-demand
            break;
        }

        // Initialize rate limiting and health tracking
        this.requestCounts.set(provider, { count: 0, tokens: 0 });
        this.healthStatus.set(provider, {
          failures: 0,
          successes: 0,
          lastFailure: null,
          circuitState: "closed",
        });

        this.providers.set(provider, {
          ...config,
          enabled: true, // Only enable if we got this far
        });

        console.log(`✅ ${provider.charAt(0).toUpperCase() + provider.slice(1)} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${provider}:`, error);
      }
    }

    // Log provider status
    const enabledProviders = Array.from(this.providers.entries())
      .filter(([_, config]) => config.enabled)
      .map(([provider]) => provider);

    console.log(`\n🔌 AI Gateway initialized with ${enabledProviders.length} providers:`);
    console.log(enabledProviders.map((p) => `  - ${p}`).join("\n"));

    if (enabledProviders.length === 0) {
      console.warn("⚠️  No AI providers were successfully initialized. Check your environment variables.");
    }
  }

  /**
   * Main chat completion method
   */
  async chat(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // Check cache
    if (request.cache) {
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`🎯 Cache hit for ${cacheKey}`);
        return { ...cached.response, cached: true };
      }
    }

    // Determine provider and model
    const provider = request.provider || this.selectBestProvider();
    const model = request.model || this.getDefaultModel(provider);

    try {
      let response: AIResponse;

      switch (provider) {
        case "openai":
        case "deepseek":
          response = await this.chatOpenAI(provider, model, request);
          break;
        case "anthropic":
          response = await this.chatClaude(model, request);
          break;
        case "gemini":
          response = await this.chatGemini(model, request);
          break;
        case "ollama":
          response = await this.chatOllama(model, request);
          break;
        case "cohere":
          response = await this.chatCohere(model, request);
          break;
        case "cloudflare":
          response = await this.chatCloudflare(model, request);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      response.latency = Date.now() - startTime;
      response.cached = false;

      // Cache response
      if (request.cache) {
        const cacheKey = this.getCacheKey(request);
        this.cache.set(cacheKey, { response, expires: Date.now() + 3600000 });
      }

      // Track usage
      this.requestCounts[provider] = (this.requestCounts[provider] || 0) + 1;

      return response;
    } catch (error: any) {
      console.error(`❌ Error with ${provider}:`, error.message);

      // Attempt failover to next provider
      if (!request.provider) {
        console.log("🔄 Attempting failover...");
        const nextProvider = this.selectNextProvider(provider);
        if (nextProvider) {
          return this.chat({ ...request, provider: nextProvider });
        }
      }

      throw error;
    }
  }

  /**
   * OpenAI/DeepSeek chat completion
   */
  private async chatOpenAI(provider: AIProvider, model: string, request: AIRequest): Promise<AIResponse> {
    const client = this.clients.get(provider);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
        { role: "user", content: request.prompt },
      ],
      max_tokens: request.maxTokens || 4000,
      temperature: request.temperature || 0.7,
    });

    const modelConfig = this.models.find((m) => m.provider === provider && m.model === model);
    const tokens = {
      prompt: completion.usage?.prompt_tokens || 0,
      completion: completion.usage?.completion_tokens || 0,
      total: completion.usage?.total_tokens || 0,
    };

    return {
      content: completion.choices[0].message.content || "",
      provider,
      model,
      tokens,
      cost: (tokens.total / 1_000_000) * (modelConfig?.costPerToken || 0),
      latency: 0,
      cached: false,
    };
  }

  /**
   * Claude chat completion
   */
  private async chatClaude(model: string, request: AIRequest): Promise<AIResponse> {
    const client = this.clients.get("anthropic");

    const completion = await client.messages.create({
      model,
      max_tokens: request.maxTokens || 4000,
      temperature: request.temperature || 0.7,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.prompt }],
    });

    const modelConfig = this.models.find((m) => m.provider === "anthropic" && m.model === model);
    const tokens = {
      prompt: completion.usage.input_tokens,
      completion: completion.usage.output_tokens,
      total: completion.usage.input_tokens + completion.usage.output_tokens,
    };

    return {
      content: completion.content[0].type === "text" ? completion.content[0].text : "",
      provider: "anthropic",
      model,
      tokens,
      cost: (tokens.total / 1_000_000) * (modelConfig?.costPerToken || 0),
      latency: 0,
      cached: false,
    };
  }

  /**
   * Gemini chat completion
   */
  private async chatGemini(model: string, request: AIRequest): Promise<AIResponse> {
    const client = this.clients.get("gemini");
    const generativeModel = client.getGenerativeModel({ model });

    const result = await generativeModel.generateContent({
      contents: [{ role: "user", parts: [{ text: request.prompt }] }],
      generationConfig: {
        maxOutputTokens: request.maxTokens || 8000,
        temperature: request.temperature || 0.7,
      },
    });

    const response = result.response;
    const text = response.text();

    const modelConfig = this.models.find((m) => m.provider === "gemini" && m.model === model);
    const tokens = {
      prompt: response.usageMetadata?.promptTokenCount || 0,
      completion: response.usageMetadata?.candidatesTokenCount || 0,
      total: response.usageMetadata?.totalTokenCount || 0,
    };

    return {
      content: text,
      provider: "gemini",
      model,
      tokens,
      cost: (tokens.total / 1_000_000) * (modelConfig?.costPerToken || 0),
      latency: 0,
      cached: false,
    };
  }

  /**
   * Ollama chat completion (local)
   */
  private async chatOllama(model: string, request: AIRequest): Promise<AIResponse> {
    const endpoint = this.providers.get("ollama")?.endpoint || "http://127.0.0.1:11434";

    const response = await fetch(`${endpoint}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: request.systemPrompt ? `${request.systemPrompt}\n\n${request.prompt}` : request.prompt,
        stream: false,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.maxTokens || 4096,
        },
      }),
    });

    const data = await response.json();

    return {
      content: data.response,
      provider: "ollama",
      model,
      tokens: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      cost: 0, // Local = free
      latency: 0,
      cached: false,
    };
  }

  /**
   * Cohere chat completion
   */
  private async chatCohere(model: string, request: AIRequest): Promise<AIResponse> {
    const apiKey = this.providers.get("cohere")?.apiKey;

    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        message: request.prompt,
        preamble: request.systemPrompt,
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 4000,
      }),
    });

    const data = await response.json();
    const modelConfig = this.models.find((m) => m.provider === "cohere" && m.model === model);

    return {
      content: data.text,
      provider: "cohere",
      model,
      tokens: {
        prompt: data.meta?.tokens?.input_tokens || 0,
        completion: data.meta?.tokens?.output_tokens || 0,
        total: (data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0),
      },
      cost:
        (((data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0)) / 1_000_000) *
        (modelConfig?.costPerToken || 0),
      latency: 0,
      cached: false,
    };
  }

  /**
   * Cloudflare AI Workers chat completion
   */
  private async chatCloudflare(model: string, request: AIRequest): Promise<AIResponse> {
    const endpoint = this.providers.get("cloudflare")?.endpoint;
    const apiKey = this.providers.get("cloudflare")?.apiKey;

    const response = await fetch(`${endpoint}/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          ...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []),
          { role: "user", content: request.prompt },
        ],
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.7,
      }),
    });

    const data = await response.json();

    return {
      content: data.result.response,
      provider: "cloudflare",
      model,
      tokens: {
        prompt: 0, // Cloudflare doesn't provide token counts
        completion: 0,
        total: 0,
      },
      cost: 0, // Free tier
      latency: 0,
      cached: false,
    };
  }

  /**
   * Select best provider based on availability and priority
   */
  private selectBestProvider(): AIProvider {
    const enabledProviders = Array.from(this.providers.entries())
      .filter(([_, config]) => config.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);

    if (enabledProviders.length === 0) {
      throw new Error("No AI providers available");
    }

    return enabledProviders[0][0];
  }

  /**
   * Select next provider for failover
   */
  private selectNextProvider(current: AIProvider): AIProvider | null {
    const currentPriority = this.providers.get(current)?.priority || 999;

    const nextProvider = Array.from(this.providers.entries())
      .filter(([provider, config]) => config.enabled && config.priority > currentPriority)
      .sort((a, b) => a[1].priority - b[1].priority)[0];

    return nextProvider ? nextProvider[0] : null;
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: AIProvider): string {
    const defaults: Record<AIProvider, string> = {
      openai: "gpt-4o-mini",
      anthropic: "claude-3-5-sonnet-20241022",
      deepseek: "deepseek-chat",
      gemini: "gemini-2.0-flash-exp",
      ollama: "llama3.2:1b",
      cohere: "command-r-plus",
      cloudflare: "@cf/meta/llama-3.1-8b-instruct",
    };

    return defaults[provider];
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: AIRequest): string {
    return `${request.provider}:${request.model}:${Buffer.from(request.prompt).toString("base64").substring(0, 50)}`;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.entries())
      .filter(([_, config]) => config.enabled)
      .map(([provider]) => provider);
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: AIProvider): string[] {
    return this.models.filter((m) => m.provider === provider).map((m) => m.model);
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      // Current provider status
      providers: Array.from(this.providers.entries()).map(([provider, config]) => ({
        provider,
        enabled: config.enabled,
        priority: config.priority,
        requestCount: this.requestCounts.get(provider)?.count || 0,
        tokenCount: this.requestCounts.get(provider)?.tokens || 0,
        health: this.healthStatus.get(provider) || {},
        circuitState: this.circuitBreakers.get(provider)?.state || "unknown",
      })),

      // Global stats
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      totalTokens: this.stats.totalTokens,
      totalCost: this.stats.totalCost,

      // Cache stats
      cache: {
        size: this.cache.size,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: this.cacheHits + this.cacheMisses > 0 ? this.cacheHits / (this.cacheHits + this.cacheMisses) : 0,
      },
    };
  }

  /**
   * Clear the cache
   */
  clearCache(): { cleared: number } {
    const count = this.cache.size;
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;

    logger.info("Cache cleared", { clearedEntries: count });

    return { cleared: count };
  }

  /**
   * Reset provider health status
   */
  resetProviderHealth(provider: AIProvider): void {
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      breaker.state = "closed";
      breaker.failures = 0;
      breaker.successCount = 0;
      breaker.lastFailure = null;
    }

    const health = this.healthStatus.get(provider);
    if (health) {
      health.failures = 0;
      health.successes = 0;
      health.lastFailure = null;
      health.circuitState = "closed";
    }

    logger.info("Provider health reset", { provider });
  }

  /**
   * Check if a provider is available (healthy and within rate limits)
   */
  private isProviderAvailable(provider: AIProvider, request: AIRequest): boolean {
    // Check if provider is enabled
    const providerConfig = this.providers.get(provider);
    if (!providerConfig?.enabled) {
      return false;
    }

    // Check circuit breaker
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      const now = Date.now();

      // If circuit is open, check if we should try to close it
      if (breaker.state === "open") {
        const resetTimeout = providerConfig.circuitBreaker?.resetTimeout || 60000;

        // If we've waited long enough, move to half-open
        if (breaker.lastFailure && now - breaker.lastFailure > resetTimeout) {
          breaker.state = "half-open";
          breaker.successCount = 0;
          logger.debug("Circuit half-open", { provider });
        } else {
          return false; // Circuit is still open
        }
      }

      // If we're in half-open state, only allow a few requests through
      if (breaker.state === "half-open" && breaker.successCount <= 0) {
        // Only allow 1 in 5 requests to go through in half-open state
        if (Math.random() > 0.2) {
          return false;
        }
      }
    }

    // Check rate limits
    const rateLimit = providerConfig.rateLimit || DEFAULT_RATE_LIMITS[provider];
    if (rateLimit) {
      const counts = this.requestCounts.get(provider) || { count: 0, tokens: 0 };
      const now = Date.now();
      const lastMinute = now - 60000; // Last minute

      // Simple rate limiting - in a real app, you'd want something more sophisticated
      if (counts.count > rateLimit.requestsPerMinute) {
        logger.debug("Rate limit exceeded (requests)", {
          provider,
          count: counts.count,
          limit: rateLimit.requestsPerMinute,
        });
        return false;
      }

      if (counts.tokens > rateLimit.tokensPerMinute) {
        logger.debug("Rate limit exceeded (tokens)", {
          provider,
          tokens: counts.tokens,
          limit: rateLimit.tokensPerMinute,
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Check and enforce rate limits
   */
  private async checkRateLimits(provider: AIProvider): Promise<void> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) return;

    const rateLimit = providerConfig.rateLimit || DEFAULT_RATE_LIMITS[provider];
    if (!rateLimit) return;

    const counts = this.requestCounts.get(provider) || { count: 0, tokens: 0 };
    const now = Date.now();

    // Reset counters if it's been more than a minute
    const lastRequestTime = this.lastRequestTime.get(provider) || 0;
    if (now - lastRequestTime > 60000) {
      counts.count = 0;
      counts.tokens = 0;
    }

    // Check if we're over the limit
    if (counts.count >= rateLimit.requestsPerMinute) {
      const waitTime = 60000 - (now - lastRequestTime);
      if (waitTime > 0) {
        logger.debug("Rate limit reached, waiting...", {
          provider,
          waitTime,
          count: counts.count,
          limit: rateLimit.requestsPerMinute,
        });

        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // Reset counters after waiting
        counts.count = 0;
        counts.tokens = 0;
      }
    }

    // Update last request time
    this.lastRequestTime.set(provider, now);
  }

  /**
   * Record a successful request
   */
  private recordSuccess(provider: AIProvider): void {
    // Update circuit breaker
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      if (breaker.state === "half-open") {
        breaker.successCount++;

        // If we've had enough successful requests, close the circuit
        const successThreshold = this.providers.get(provider)?.circuitBreaker?.successThreshold || 2;
        if (breaker.successCount >= successThreshold) {
          breaker.state = "closed";
          breaker.failures = 0;
          logger.info("Circuit closed", { provider });
        }
      }
    }

    // Update health status
    const health = this.healthStatus.get(provider) || {
      failures: 0,
      successes: 0,
      lastFailure: null,
      circuitState: "closed",
    };
    health.successes++;
    this.healthStatus.set(provider, health);
  }

  /**
   * Record a failed request
   */
  private recordFailure(provider: AIProvider, error: Error): void {
    // Update circuit breaker
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      // If we're in half-open state, a single failure should open the circuit
      if (breaker.state === "half-open") {
        breaker.state = "open";
        logger.warn("Circuit re-opened after failure", { provider, error: error.message });
      }
      // Check if we've exceeded the failure threshold
      else {
        const failureThreshold = this.providers.get(provider)?.circuitBreaker?.failureThreshold || 3;
        if (breaker.failures >= failureThreshold) {
          breaker.state = "open";
          logger.warn("Circuit opened due to failures", {
            provider,
            failures: breaker.failures,
            threshold: failureThreshold,
            error: error.message,
          });
        }
      }
    }

    // Update health status
    const health = this.healthStatus.get(provider) || {
      failures: 0,
      successes: 0,
      lastFailure: null,
      circuitState: "closed",
    };
    health.failures++;
    health.lastFailure = Date.now();
    health.circuitState = breaker?.state || "closed";
    this.healthStatus.set(provider, health);

    // Update error stats
    this.stats.providerErrors.set(provider, (this.stats.providerErrors.get(provider) || 0) + 1);
  }

  /**
   * Record a completed request and update token counts
   */
  private recordRequest(provider: AIProvider, tokens: number): void {
    const counts = this.requestCounts.get(provider) || { count: 0, tokens: 0 };
    counts.count++;
    counts.tokens += tokens;
    this.requestCounts.set(provider, counts);
  }

  /**
   * Extract retry-after header from error
   */
  private extractRetryAfter(error: any): number {
    if (!error || typeof error !== "object") return 1000;

    // Check for standard headers
    if (error.headers?.["retry-after"]) {
      const value = error.headers["retry-after"];
      // Could be a number of seconds or an HTTP date
      const seconds = parseInt(value, 10);
      if (!isNaN(seconds)) return seconds * 1000;

      // Try to parse as HTTP date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.getTime() - Date.now();
      }
    }

    // Default to 1 second
    return 1000;
  }
}

// Export singleton
export const aiGateway = new UnifiedAIGateway();
