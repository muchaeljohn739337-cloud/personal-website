/**
 * AI Generator REST API Routes
 * Provides endpoints for text, code, and image generation
 */

import { Request, Response, Router } from "express";
import { Server as SocketIOServer } from "socket.io";
import { z } from "zod";
import { GenerationType, ImageSize, RATE_LIMITS } from "../ai-engine/ai.config";
import { aiGenerate, getGeneration, getUserGenerations, getUserMetrics } from "../ai-engine/generator";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();
let io: SocketIOServer | undefined;

export const setAIGeneratorSocketIO = (socketIO: SocketIOServer) => {
  io = socketIO;
};

// Validation schemas
const TextGenerationSchema = z.object({
  prompt: z.string().min(1).max(5000),
  model: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet", "claude-3-opus"]),
  captchaToken: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const CodeGenerationSchema = z.object({
  prompt: z.string().min(1).max(5000),
  model: z.enum(["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet", "claude-3-opus"]),
  language: z.string().optional(),
  framework: z.string().optional(),
  captchaToken: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const ImageGenerationSchema = z.object({
  prompt: z.string().min(1).max(4000),
  size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).optional(),
  captchaToken: z.string().min(1),
});

const BuildProjectSchema = z.object({
  projectName: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  technologies: z.array(z.string()).min(1),
  features: z.array(z.string()).optional(),
  mfaToken: z.string().min(6).max(6),
});

/**
 * CAPTCHA validation (placeholder - integrate with Google reCAPTCHA or Cloudflare Turnstile)
 */
async function validateCaptcha(token: string): Promise<boolean> {
  // TODO: Implement actual CAPTCHA validation
  // Example with Google reCAPTCHA v3:
  // const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     secret: process.env.CAPTCHA_SECRET_KEY,
  //     response: token,
  //   }),
  // });
  // const data = await response.json();
  // return data.success && data.score >= 0.5;

  return true; // Temporary bypass for development
}

/**
 * Check rate limits for user
 */
async function checkRateLimit(userId: string, isAdmin: boolean): Promise<{ allowed: boolean; reason?: string }> {
  const limits = isAdmin ? RATE_LIMITS.admin : RATE_LIMITS.free;

  // Check hourly request limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentGenerations = await prisma.ai_generations.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentGenerations >= limits.requestsPerHour) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${limits.requestsPerHour} requests per hour`,
    };
  }

  // Check daily token limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMetrics = await prisma.ai_usage_metrics.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (todayMetrics && todayMetrics.tokensUsed >= limits.tokensPerDay) {
    return {
      allowed: false,
      reason: `Daily token limit exceeded: ${limits.tokensPerDay} tokens`,
    };
  }

  return { allowed: true };
}

/**
 * Create audit log entry
 */
async function createAuditLog(userId: string, action: string, metadata: any, req: Request) {
  try {
    await prisma.audit_logs.create({
      data: {
        userId,
        action,
        resourceType: "AI_GENERATION",
        resourceId: details.generationId || null,
        changes: JSON.stringify(details),
        ipAddress: req.ip || "unknown",
        userAgent: req.get("user-agent") || "unknown",
      },
    });
  } catch (error) {
    console.error("[AI Generator] Failed to create audit log:", error);
  }
}

/**
 * POST /api/ai-generator/text
 * Generate text using AI models
 */
router.post("/text", authenticateToken, async (req: any, res: Response) => {
  try {
    const validation = TextGenerationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        metadata: validation.error.errors,
      });
    }

    const { prompt, model, captchaToken, metadata } = validation.data;
    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    // Validate CAPTCHA
    const captchaValid = await validateCaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(403).json({
        success: false,
        error: "CAPTCHA validation failed",
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, isAdmin);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.reason,
      });
    }

    // Emit Socket.IO event
    if (io) {
      io.to(`user-${userId}`).emit("ai-generation:started", {
        type: "text",
        model,
        timestamp: new Date(),
      });
    }

    // Generate text
    const generationId = await aiGenerate({
      userId,
      type: "text",
      model,
      prompt,
      metadata,
    });

    const generation = await getGeneration(generationId);

    // Emit completion event
    if (io) {
      io.to(`user-${userId}`).emit("ai-generation:completed", {
        generationId,
        type: "text",
        timestamp: new Date(),
      });
    }

    // Create audit log
    await createAuditLog(userId, "AI_TEXT_GENERATION", { generationId, model, promptLength: prompt.length }, req);

    res.status(200).json({
      success: true,
      data: {
        id: generation?.id,
        output: generation?.output,
        model,
        createdAt: generation?.createdAt,
      },
    });
  } catch (error) {
    console.error("[AI Generator] Text generation error:", error);

    if (io && req.user) {
      io.to(`user-${req.user.id}`).emit("ai-generation:failed", {
        type: "text",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Text generation failed",
    });
  }
});

/**
 * POST /api/ai-generator/code
 * Generate code using AI models
 */
router.post("/code", authenticateToken, async (req: any, res: Response) => {
  try {
    const validation = CodeGenerationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        metadata: validation.error.errors,
      });
    }

    const { prompt, model, language, framework, captchaToken, metadata } = validation.data;
    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    // Validate CAPTCHA
    const captchaValid = await validateCaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(403).json({
        success: false,
        error: "CAPTCHA validation failed",
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, isAdmin);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.reason,
      });
    }

    // Emit Socket.IO event
    if (io) {
      io.to(`user-${userId}`).emit("ai-generation:started", {
        type: "code",
        model,
        language,
        framework,
        timestamp: new Date(),
      });
    }

    // Generate code
    const generationId = await aiGenerate({
      userId,
      type: "code",
      model,
      prompt,
      language,
      framework,
      metadata,
    });

    const generation = await getGeneration(generationId);

    // Emit completion event
    if (io) {
      io.to(`user-${userId}`).emit("ai-generation:completed", {
        generationId,
        type: "code",
        timestamp: new Date(),
      });
    }

    // Create audit log
    await createAuditLog(userId, "AI_CODE_GENERATION", { generationId, model, language, framework }, req);

    res.status(200).json({
      success: true,
      data: {
        id: generation?.id,
        output: generation?.output,
        model,
        language,
        framework,
        createdAt: generation?.createdAt,
      },
    });
  } catch (error) {
    console.error("[AI Generator] Code generation error:", error);

    if (io && req.user) {
      io.to(`user-${req.user.id}`).emit("ai-generation:failed", {
        type: "code",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Code generation failed",
    });
  }
});

/**
 * POST /api/ai-generator/image
 * Generate image using DALL-E 3
 */
router.post("/image", authenticateToken, async (req: any, res: Response) => {
  try {
    const validation = ImageGenerationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        metadata: validation.error.errors,
      });
    }

    const { prompt, size, captchaToken } = validation.data;
    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    // Validate CAPTCHA
    const captchaValid = await validateCaptcha(captchaToken);
    if (!captchaValid) {
      return res.status(403).json({
        success: false,
        error: "CAPTCHA validation failed",
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, isAdmin);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimitCheck.reason,
      });
    }

    // Emit Socket.IO event
    if (io) {
      io.to(`user-${userId}`).emit("ai-generation:started", {
        type: "image",
        model: "dall-e-3",
        size,
        timestamp: new Date(),
      });
    }

    // Generate image
    const generationId = await aiGenerate({
      userId,
      type: "image",
      model: "dall-e-3",
      prompt,
      imageSize: size as ImageSize,
    });

    const generation = await getGeneration(generationId);

    // Emit completion event
    if (io) {
      io.to(`user-${userId}`).emit("ai-generation:completed", {
        generationId,
        type: "image",
        timestamp: new Date(),
      });
    }

    // Create audit log
    await createAuditLog(userId, "AI_IMAGE_GENERATION", { generationId, size }, req);

    res.status(200).json({
      success: true,
      data: {
        id: generation?.id,
        imageUrl: generation?.imageUrl,
        size,
        createdAt: generation?.createdAt,
      },
    });
  } catch (error) {
    console.error("[AI Generator] Image generation error:", error);

    if (io && req.user) {
      io.to(`user-${req.user.id}`).emit("ai-generation:failed", {
        type: "image",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      });
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Image generation failed",
    });
  }
});

/**
 * GET /api/ai-generator/history
 * Get user's generation history with pagination
 */
router.get("/history", authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const type = req.query.type as GenerationType | undefined;

    const generations = await getUserGenerations(userId, limit, offset, type);
    const total = await prisma.ai_generations.count({
      where: {
        userId,
        type: type || undefined,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        generations: generations.map((g) => ({
          id: g.id,
          type: g.type,
          model: g.model,
          prompt: g.prompt.substring(0, 100) + (g.prompt.length > 100 ? "..." : ""),
          status: g.status,
          createdAt: g.createdAt,
          hasOutput: !!g.output || !!g.imageUrl,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error("[AI Generator] History fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch history",
    });
  }
});

/**
 * GET /api/ai-generator/metrics
 * Get usage metrics (admin only with MFA)
 */
router.get("/metrics", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const mfaToken = req.query.mfaToken as string;

    // TODO: Verify MFA token with VaultService or TOTP validation
    if (!mfaToken || mfaToken.length !== 6) {
      return res.status(403).json({
        success: false,
        error: "MFA token required",
      });
    }

    const days = parseInt(req.query.days as string) || 30;
    const userId = (req.query.userId as string) || req.user.id;

    const metrics = await getUserMetrics(userId, days);

    const summary = metrics.reduce(
      (acc, m) => ({
        totalGenerations: acc.totalGenerations + m.textGenerations + m.codeGenerations + m.imageGenerations,
        totalTokens: acc.totalTokens + m.tokensUsed,
        totalCost: acc.totalCost + parseFloat(m.costUSD.toString()),
      }),
      { totalGenerations: 0, totalTokens: 0, totalCost: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        metrics,
        summary,
        period: `${days} days`,
      },
    });
  } catch (error) {
    console.error("[AI Generator] Metrics fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch metrics",
    });
  }
});

/**
 * DELETE /api/ai-generator/:id
 * Delete a generation (admin only with MFA)
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const mfaToken = req.query.mfaToken as string;

    // TODO: Verify MFA token
    if (!mfaToken || mfaToken.length !== 6) {
      return res.status(403).json({
        success: false,
        error: "MFA token required",
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const generation = await prisma.ai_generations.findUnique({
      where: { id },
    });

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: "Generation not found",
      });
    }

    await prisma.ai_generations.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog(userId, "AI_GENERATION_DELETED", { generationId: id }, req);

    res.status(200).json({
      success: true,
      message: "Generation deleted successfully",
    });
  } catch (error) {
    console.error("[AI Generator] Delete error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete generation",
    });
  }
});

/**
 * POST /api/ai-generator/build-project
 * Trigger AI Builder Agent (admin only with MFA)
 */
router.post("/build-project", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const validation = BuildProjectSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input",
        metadata: validation.error.errors,
      });
    }

    const { projectName, description, technologies, features, mfaToken } = validation.data;
    const userId = req.user.id;

    // TODO: Verify MFA token
    if (!mfaToken || mfaToken.length !== 6) {
      return res.status(403).json({
        success: false,
        error: "MFA token required",
      });
    }

    // Import scheduler to access AIBuilderAgent
    const { getAgentScheduler } = await import("../agents/scheduler");
    const scheduler = getAgentScheduler(prisma);
    const agents = scheduler.getAgents();
    const builderAgent = agents.find((a) => a.constructor.name === "AIBuilderAgent");

    if (!builderAgent) {
      return res.status(503).json({
        success: false,
        error: "AI Builder Agent not available",
      });
    }

    // Trigger build (AIBuilderAgent must have triggerBuild method)
    const buildResult = await (builderAgent as any).triggerBuild({
      projectName,
      description,
      technologies,
      features: features || [],
      userId,
    });

    // Create audit log
    await createAuditLog(userId, "AI_PROJECT_BUILD", { projectName, technologies }, req);

    res.status(200).json({
      success: true,
      message: "Project build started",
      data: buildResult,
    });
  } catch (error) {
    console.error("[AI Generator] Build project error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to start project build",
    });
  }
});

export default router;
