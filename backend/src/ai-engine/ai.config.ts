/**
 * AI Generator Configuration
 * Defines supported models, rate limits, and pricing
 */

export type SupportedModel =
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "claude-3-sonnet"
  | "claude-3-opus"
  | "dall-e-3";
export type GenerationType = "text" | "code" | "image";
export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";

export interface ModelConfig {
  name: SupportedModel;
  provider: "openai" | "anthropic";
  type: GenerationType[];
  maxTokens: number;
  costPerToken: number; // in USD per 1k tokens
  temperature: number;
}

export interface RateLimitConfig {
  free: {
    requestsPerHour: number;
    tokensPerDay: number;
  };
  admin: {
    requestsPerHour: number;
    tokensPerDay: number;
  };
}

export const MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
  "gpt-4": {
    name: "gpt-4",
    provider: "openai",
    type: ["text", "code"],
    maxTokens: 8000,
    costPerToken: 0.03 / 1000, // $0.03 per 1k tokens
    temperature: 0.7,
  },
  "gpt-3.5-turbo": {
    name: "gpt-3.5-turbo",
    provider: "openai",
    type: ["text", "code"],
    maxTokens: 4000,
    costPerToken: 0.002 / 1000, // $0.002 per 1k tokens
    temperature: 0.7,
  },
  "claude-3-sonnet": {
    name: "claude-3-sonnet",
    provider: "anthropic",
    type: ["text", "code"],
    maxTokens: 4000,
    costPerToken: 0.003 / 1000, // $0.003 per 1k tokens
    temperature: 0.7,
  },
  "claude-3-opus": {
    name: "claude-3-opus",
    provider: "anthropic",
    type: ["text", "code"],
    maxTokens: 4000,
    costPerToken: 0.015 / 1000, // $0.015 per 1k tokens
    temperature: 0.7,
  },
  "dall-e-3": {
    name: "dall-e-3",
    provider: "openai",
    type: ["image"],
    maxTokens: 0,
    costPerToken: 0.04, // $0.04 per image
    temperature: 0,
  },
};

export const RATE_LIMITS: RateLimitConfig = {
  free: {
    requestsPerHour: 10,
    tokensPerDay: 100000,
  },
  admin: {
    requestsPerHour: 999999, // Unlimited
    tokensPerDay: 999999999, // Unlimited
  },
};
