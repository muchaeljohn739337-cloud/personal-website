/**
 * Unified AI Gateway API Routes
 * 
 * Endpoints to access all AI providers from one place
 */

import { Request, Response, Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { aiGateway } from "../services/UnifiedAIGateway";

const router = Router();

/**
 * POST /api/ai-gateway/chat
 * Send a chat request to any AI provider
 */
router.post("/chat", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { prompt, systemPrompt, provider, model, maxTokens, temperature, stream, cache } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await aiGateway.chat({
      prompt,
      systemPrompt,
      provider,
      model,
      maxTokens,
      temperature,
      stream,
      cache,
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("AI Gateway error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-gateway/providers
 * List all available AI providers
 */
router.get("/providers", authenticateToken, (req: Request, res: Response) => {
  try {
    const providers = aiGateway.getAvailableProviders();
    
    res.json({
      success: true,
      data: {
        providers,
        count: providers.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-gateway/models/:provider
 * List all available models for a specific provider
 */
router.get("/models/:provider", authenticateToken, (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const models = aiGateway.getAvailableModels(provider as any);
    
    res.json({
      success: true,
      data: {
        provider,
        models,
        count: models.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/ai-gateway/stats
 * Get usage statistics for all providers
 */
router.get("/stats", authenticateToken, (req: Request, res: Response) => {
  try {
    const stats = aiGateway.getUsageStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-gateway/cache/clear
 * Clear the response cache
 */
router.post("/cache/clear", authenticateToken, (req: Request, res: Response) => {
  try {
    aiGateway.clearCache();
    
    res.json({
      success: true,
      message: "Cache cleared successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-gateway/compare
 * Compare responses from multiple providers
 */
router.post("/compare", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { prompt, systemPrompt, providers, maxTokens, temperature } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!providers || !Array.isArray(providers)) {
      return res.status(400).json({ error: "Providers array is required" });
    }

    // Run requests in parallel
    const results = await Promise.allSettled(
      providers.map(provider =>
        aiGateway.chat({
          prompt,
          systemPrompt,
          provider,
          maxTokens,
          temperature,
        })
      )
    );

    const comparison = results.map((result, index) => ({
      provider: providers[index],
      status: result.status,
      data: result.status === "fulfilled" ? result.value : null,
      error: result.status === "rejected" ? result.reason.message : null,
    }));

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/ai-gateway/best
 * Automatically select the best provider based on cost/performance
 */
router.post("/best", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { prompt, systemPrompt, maxTokens, temperature, cache, criteria } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // criteria: "cost" | "speed" | "quality"
    const selectedCriteria = criteria || "cost";

    // Let the gateway select the best provider
    const response = await aiGateway.chat({
      prompt,
      systemPrompt,
      maxTokens,
      temperature,
      cache,
      // Provider will be auto-selected based on priority
    });

    res.json({
      success: true,
      data: response,
      criteria: selectedCriteria,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
