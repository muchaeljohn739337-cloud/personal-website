/**
 * AI Model Clients Initialization
 * Manages OpenAI and Anthropic SDK clients
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { vaultService } from "../services/VaultService";

// Initialize OpenAI client
const getOpenAIKey = async (): Promise<string | undefined> => {
  try {
    return (
      (await vaultService.getSecret("OPENAI_API_KEY").catch(() => null)) ||
      process.env.OPENAI_API_KEY
    );
  } catch {
    return process.env.OPENAI_API_KEY;
  }
};

// Initialize Anthropic client
const getAnthropicKey = async (): Promise<string | undefined> => {
  try {
    return (
      (await vaultService.getSecret("ANTHROPIC_API_KEY").catch(() => null)) ||
      process.env.ANTHROPIC_API_KEY
    );
  } catch {
    return process.env.ANTHROPIC_API_KEY;
  }
};

export let openaiClient: OpenAI | null = null;
export let anthropicClient: Anthropic | null = null;

export const initializeClients = async (): Promise<void> => {
  const openaiKey = await getOpenAIKey();
  const anthropicKey = await getAnthropicKey();

  if (openaiKey) {
    openaiClient = new OpenAI({ apiKey: openaiKey });
  }

  if (anthropicKey) {
    anthropicClient = new Anthropic({ apiKey: anthropicKey });
  }

  console.log("[AI Generator] Initialized clients:", {
    openai: !!openaiClient,
    anthropic: !!anthropicClient,
  });
};

export const verifyAPIKeys = async (): Promise<{
  openai: boolean;
  anthropic: boolean;
}> => {
  const openaiKey = await getOpenAIKey();
  const anthropicKey = await getAnthropicKey();

  return {
    openai: !!openaiKey,
    anthropic: !!anthropicKey,
  };
};
