/**
 * AI Generator Service
 * Handles all API calls to the AI Generator backend
 */

import { api } from "@/utils/api";

export interface AIGenerationRequest {
  prompt: string;
  model: "gpt-4" | "gpt-3.5-turbo" | "claude-3-sonnet" | "claude-3-opus";
  captchaToken: string;
  metadata?: Record<string, unknown>;
}

export interface CodeGenerationRequest extends AIGenerationRequest {
  language: string;
  framework?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  size: "1024x1024" | "1792x1024" | "1024x1792";
  captchaToken: string;
}

export interface AIGeneration {
  id: string;
  userId: string;
  type: "text" | "code" | "image";
  model: string;
  prompt: string;
  output?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  error?: string;
  createdAt: string;
}

export interface AIUsageMetrics {
  id: string;
  userId: string;
  date: string;
  textGenerations: number;
  codeGenerations: number;
  imageGenerations: number;
  tokensUsed: number;
  costUSD: number;
}

export interface GenerationHistoryResponse {
  success: boolean;
  data: {
    generations: AIGeneration[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface MetricsResponse {
  success: boolean;
  data: {
    metrics: AIUsageMetrics[];
    summary: {
      totalGenerations: number;
      totalTokens: number;
      totalCost: number;
    };
    period: string;
  };
}

export interface BuildProjectRequest {
  projectName: string;
  description: string;
  technologies: string[];
  features: string[];
  mfaToken: string;
}

/**
 * Generate text using AI
 */
export async function generateText(
  request: AIGenerationRequest,
): Promise<{ success: boolean; data: AIGeneration }> {
  return api.post("/api/ai-generator/text", request);
}

/**
 * Generate code using AI
 */
export async function generateCode(
  request: CodeGenerationRequest,
): Promise<{ success: boolean; data: AIGeneration }> {
  return api.post("/api/ai-generator/code", request);
}

/**
 * Generate image using DALL-E 3
 */
export async function generateImage(
  request: ImageGenerationRequest,
): Promise<{ success: boolean; data: AIGeneration }> {
  return api.post("/api/ai-generator/image", request);
}

/**
 * Get generation history
 */
export async function getHistory(
  limit = 50,
  offset = 0,
  type?: "text" | "code" | "image",
): Promise<GenerationHistoryResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  if (type) params.append("type", type);

  return api.get(`/api/ai-generator/history?${params}`);
}

/**
 * Get usage metrics (Admin only)
 */
export async function getMetrics(
  mfaToken: string,
  days = 30,
  userId?: string,
): Promise<MetricsResponse> {
  const params = new URLSearchParams({
    mfaToken,
    days: days.toString(),
  });
  if (userId) params.append("userId", userId);

  return api.get(`/api/ai-generator/metrics?${params}`);
}

/**
 * Delete a generation (Admin only)
 */
export async function deleteGeneration(
  id: string,
  mfaToken: string,
): Promise<{ success: boolean; message: string }> {
  return api.delete(`/api/ai-generator/${id}?mfaToken=${mfaToken}`);
}

/**
 * Build a complete project using AI Builder Agent (Admin only)
 */
export async function buildProject(
  request: BuildProjectRequest,
): Promise<{ success: boolean; message: string; buildId?: string }> {
  return api.post("/api/ai-generator/build-project", request);
}

/**
 * Get available AI models
 */
export function getAvailableModels() {
  return [
    { value: "gpt-4", label: "GPT-4 (Most Capable)", cost: "$0.03/1K tokens" },
    {
      value: "gpt-3.5-turbo",
      label: "GPT-3.5 Turbo (Fast & Affordable)",
      cost: "$0.002/1K tokens",
    },
    {
      value: "claude-3-sonnet",
      label: "Claude 3 Sonnet (Balanced)",
      cost: "$0.003/1K tokens",
    },
    {
      value: "claude-3-opus",
      label: "Claude 3 Opus (Most Powerful)",
      cost: "$0.015/1K tokens",
    },
  ];
}

/**
 * Get available image sizes
 */
export function getAvailableImageSizes() {
  return [
    { value: "1024x1024", label: "Square (1024×1024)" },
    { value: "1792x1024", label: "Landscape (1792×1024)" },
    { value: "1024x1792", label: "Portrait (1024×1792)" },
  ];
}

/**
 * Get programming languages
 */
export function getProgrammingLanguages() {
  return [
    "TypeScript",
    "JavaScript",
    "Python",
    "Java",
    "Go",
    "Rust",
    "C#",
    "C++",
    "Ruby",
    "PHP",
    "Swift",
    "Kotlin",
    "Scala",
    "SQL",
  ];
}

/**
 * Get frameworks
 */
export function getFrameworks(language: string) {
  const frameworkMap: Record<string, string[]> = {
    TypeScript: ["Next.js", "React", "Node.js", "Express", "NestJS", "Vue"],
    JavaScript: ["React", "Next.js", "Vue", "Angular", "Express", "Node.js"],
    Python: ["Django", "Flask", "FastAPI", "Pandas", "TensorFlow", "PyTorch"],
    Java: ["Spring Boot", "Hibernate", "JavaFX", "Android"],
    Go: ["Gin", "Echo", "Fiber", "GORM"],
    Rust: ["Actix", "Rocket", "Tokio", "Axum"],
    "C#": [".NET Core", "ASP.NET", "Entity Framework", "Blazor"],
    Ruby: ["Rails", "Sinatra"],
    PHP: ["Laravel", "Symfony", "CodeIgniter"],
    Swift: ["SwiftUI", "UIKit", "Vapor"],
    Kotlin: ["Spring Boot", "Ktor", "Android"],
  };

  return frameworkMap[language] || [];
}
