/**
 * AI Generator Core Logic
 * Handles text, code, and image generation with retry mechanism and database tracking
 */

import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../prismaClient";
import { GenerationType, ImageSize, MODEL_CONFIGS, SupportedModel } from "./ai.config";
import { anthropicClient, openaiClient } from "./models";

interface GenerateOptions {
  userId: string;
  type: GenerationType;
  model: SupportedModel;
  prompt: string;
  metadata?: Record<string, any>;
  imageSize?: ImageSize;
  language?: string;
  framework?: string;
}

interface GenerateResult {
  output?: string;
  imageUrl?: string;
  tokensUsed: number;
  cost: number;
  error?: string;
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[AI Generator] Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Generate text/code using OpenAI models
 */
async function generateWithOpenAI(
  model: SupportedModel,
  prompt: string,
  type: GenerationType,
  metadata?: Record<string, any>
): Promise<{ output: string; tokensUsed: number }> {
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized");
  }

  const config = MODEL_CONFIGS[model];
  const systemPrompt =
    type === "code"
      ? `You are an expert software engineer. Generate production-ready ${metadata?.language || "code"} code${
          metadata?.framework ? ` using ${metadata.framework}` : ""
        }. Include comments and follow best practices.`
      : "You are a helpful AI assistant. Provide clear, accurate, and well-structured responses.";

  const response = await openaiClient.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  });

  return {
    output: response.choices[0].message.content || "",
    tokensUsed: response.usage?.total_tokens || 0,
  };
}

/**
 * Generate text/code using Anthropic models
 */
async function generateWithAnthropic(
  model: SupportedModel,
  prompt: string,
  type: GenerationType,
  metadata?: Record<string, any>
): Promise<{ output: string; tokensUsed: number }> {
  if (!anthropicClient) {
    throw new Error("Anthropic client not initialized");
  }

  const config = MODEL_CONFIGS[model];
  const systemPrompt =
    type === "code"
      ? `You are an expert software engineer. Generate production-ready ${metadata?.language || "code"} code${
          metadata?.framework ? ` using ${metadata.framework}` : ""
        }. Include comments and follow best practices.`
      : "You are a helpful AI assistant. Provide clear, accurate, and well-structured responses.";

  const anthropicModel = model === "claude-3-opus" ? "claude-3-opus-20240229" : "claude-3-sonnet-20240229";

  const response = await anthropicClient.messages.create({
    model: anthropicModel,
    max_tokens: config.maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  return {
    output: textContent && "text" in textContent ? textContent.text : "",
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

/**
 * Generate image using DALL-E 3
 */
async function generateImage(
  prompt: string,
  size: ImageSize = "1024x1024"
): Promise<{ imageUrl: string; tokensUsed: number }> {
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized");
  }

  const response = await openaiClient.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: size,
    quality: "standard",
  });

  return {
    imageUrl: response.data?.[0]?.url || "",
    tokensUsed: 0, // DALL-E pricing is per image, not per token
  };
}

/**
 * Main AI generation function with database tracking
 */
export async function aiGenerate(options: GenerateOptions): Promise<string> {
  const { userId, type, model, prompt, metadata, imageSize, language, framework } = options;

  // Create generation record
  const generation = await prisma.ai_generations.create({
    data: {
      id: (await import("crypto")).randomUUID(),
      userId,
      type,
      model,
      prompt,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: "pending",
    },
  });

  try {
    let result: GenerateResult;

    if (type === "image") {
      // Image generation
      const { imageUrl, tokensUsed } = await retryWithBackoff(() => generateImage(prompt, imageSize));
      result = {
        imageUrl,
        tokensUsed,
        cost: MODEL_CONFIGS[model].costPerToken,
      };
    } else {
      // Text/Code generation
      const config = MODEL_CONFIGS[model];
      const generateFn =
        config.provider === "openai"
          ? () =>
              generateWithOpenAI(model, prompt, type, {
                language,
                framework,
                ...metadata,
              })
          : () =>
              generateWithAnthropic(model, prompt, type, {
                language,
                framework,
                ...metadata,
              });

      const { output, tokensUsed } = await retryWithBackoff(generateFn);
      result = {
        output,
        tokensUsed,
        cost: tokensUsed * config.costPerToken,
      };
    }

    // Update generation record
    await prisma.ai_generations.update({
      where: { id: generation.id },
      data: {
        output: result.output,
        imageUrl: result.imageUrl,
        status: "completed",
      },
    });

    // Update usage metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.ai_usage_metrics.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        id: (await import("crypto")).randomUUID(),
        userId,
        date: today,
        textGenerations: type === "text" ? 1 : 0,
        codeGenerations: type === "code" ? 1 : 0,
        imageGenerations: type === "image" ? 1 : 0,
        tokensUsed: result.tokensUsed,
        costUSD: new Decimal(result.cost),
        updatedAt: new Date(),
      },
      update: {
        textGenerations: type === "text" ? { increment: 1 } : undefined,
        codeGenerations: type === "code" ? { increment: 1 } : undefined,
        imageGenerations: type === "image" ? { increment: 1 } : undefined,
        tokensUsed: { increment: result.tokensUsed },
        costUSD: { increment: result.cost },
      },
    });

    return generation.id;
  } catch (error) {
    // Update generation record with error
    await prisma.ai_generations.update({
      where: { id: generation.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}

/**
 * Get generation by ID
 */
export async function getGeneration(generationId: string) {
  return await prisma.ai_generations.findUnique({
    where: { id: generationId },
  });
}

/**
 * Get user's generation history
 */
export async function getUserGenerations(userId: string, limit = 50, offset = 0, type?: GenerationType) {
  return await prisma.ai_generations.findMany({
    where: {
      userId,
      type: type || undefined,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

/**
 * Get user's usage metrics
 */
export async function getUserMetrics(userId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await prisma.ai_usage_metrics.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: "desc" },
  });
}
