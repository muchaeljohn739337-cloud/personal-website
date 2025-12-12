import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Local LLM Fallback for Privacy-Sensitive Tasks
 * Integrates Ollama for local model inference when privacy is required
 */

export interface LocalLLMConfig {
  ollamaUrl?: string;
  defaultModel?: string;
  enableFallback?: boolean;
  privacyKeywords?: string[];
}

export interface LLMRequest {
  prompt: string;
  model?: "gpt-4" | "claude" | "local";
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, any>;
  requirePrivacy?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: "openai" | "anthropic" | "ollama";
  tokensUsed?: number;
  duration: number;
  cached: boolean;
}

export class LocalLLMFallback {
  private config: Required<LocalLLMConfig>;
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private cache: Map<string, LLMResponse> = new Map();

  constructor(config: LocalLLMConfig) {
    this.config = {
      ollamaUrl: config.ollamaUrl || "http://localhost:11434",
      defaultModel: config.defaultModel || "llama2",
      enableFallback: config.enableFallback ?? true,
      privacyKeywords: config.privacyKeywords || [
        "password",
        "ssn",
        "credit card",
        "private key",
        "secret",
        "confidential",
        "personal data",
      ],
    };
  }

  /**
   * Initialize cloud LLM providers
   */
  initializeProviders(openaiKey?: string, anthropicKey?: string): void {
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
  }

  /**
   * Process an LLM request with automatic privacy detection
   */
  async process(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    // Detect if privacy-sensitive
    const requiresPrivacy = request.requirePrivacy || this.detectPrivacySensitivity(request.prompt);

    if (requiresPrivacy) {
      console.log("[LocalLLM] Privacy-sensitive request detected, using local model");
      const response = await this.processWithLocal(request);
      this.cacheResponse(cacheKey, response);
      return response;
    }

    // Try cloud providers with fallback
    try {
      let response: LLMResponse;

      if (request.model === "claude" && this.anthropic) {
        response = await this.processWithClaude(request);
      } else if (request.model === "local") {
        response = await this.processWithLocal(request);
      } else if (this.openai) {
        response = await this.processWithGPT4(request);
      } else {
        // No cloud provider available, use local
        response = await this.processWithLocal(request);
      }

      this.cacheResponse(cacheKey, response);
      return response;
    } catch (error) {
      console.error("[LocalLLM] Cloud provider error, falling back to local:", error);

      if (this.config.enableFallback) {
        const response = await this.processWithLocal(request);
        this.cacheResponse(cacheKey, response);
        return response;
      }

      throw error;
    }
  }

  /**
   * Detect if prompt contains privacy-sensitive information
   */
  private detectPrivacySensitivity(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase();
    return this.config.privacyKeywords.some((keyword) => lowerPrompt.includes(keyword));
  }

  /**
   * Process with OpenAI GPT-4
   */
  private async processWithGPT4(request: LLMRequest): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error("OpenAI not initialized");
    }

    const startTime = Date.now();

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: request.prompt }],
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 1000,
    });

    const content = response.choices[0].message.content || "";

    return {
      content,
      model: "gpt-4",
      provider: "openai",
      tokensUsed: response.usage?.total_tokens,
      duration: Date.now() - startTime,
      cached: false,
    };
  }

  /**
   * Process with Anthropic Claude
   */
  private async processWithClaude(request: LLMRequest): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error("Anthropic not initialized");
    }

    const startTime = Date.now();

    const response = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
      messages: [{ role: "user", content: request.prompt }],
    });

    const content = response.content[0].type === "text" ? response.content[0].text : "";

    return {
      content,
      model: "claude-3-opus",
      provider: "anthropic",
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      duration: Date.now() - startTime,
      cached: false,
    };
  }

  /**
   * Process with local Ollama model
   */
  private async processWithLocal(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.defaultModel,
          prompt: request.prompt,
          stream: false,
          options: {
            temperature: request.temperature || 0.7,
            num_predict: request.maxTokens || 1000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.response || "",
        model: this.config.defaultModel,
        provider: "ollama",
        duration: Date.now() - startTime,
        cached: false,
      };
    } catch (error) {
      console.error("[LocalLLM] Ollama error:", error);
      throw new Error("Local LLM unavailable. Please ensure Ollama is running.");
    }
  }

  /**
   * Check if Ollama is available
   */
  async checkOllamaHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      console.error("[LocalLLM] Ollama health check failed:", error);
      return false;
    }
  }

  /**
   * List available local models
   */
  async listLocalModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }

      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error("[LocalLLM] Error listing models:", error);
      return [];
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: LLMRequest): string {
    return `${request.model || "auto"}:${request.prompt.substring(0, 100)}:${request.temperature || 0.7}`;
  }

  /**
   * Cache response
   */
  private cacheResponse(key: string, response: LLMResponse): void {
    this.cache.set(key, response);

    // Keep cache size under 1000 entries
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
  } {
    // Note: This is a simplified version. In production, track hits/misses
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track actual hit rate
    };
  }
}

// Global instance
let globalLocalLLM: LocalLLMFallback | null = null;

export function initializeLocalLLM(config: LocalLLMConfig): LocalLLMFallback {
  globalLocalLLM = new LocalLLMFallback(config);
  return globalLocalLLM;
}

export function getLocalLLM(): LocalLLMFallback {
  if (!globalLocalLLM) {
    throw new Error("LocalLLM not initialized. Call initializeLocalLLM() first.");
  }
  return globalLocalLLM;
}
