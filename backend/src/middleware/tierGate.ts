/**
 * Tier Gate Middleware
 *
 * Controls access to AI features based on user subscription tier.
 * Enforces usage limits, feature flags, and rate limiting per tier.
 */

import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const prisma = new PrismaClient();

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

// Default tier limits (overridden by PricingPlan.features in DB)
const DEFAULT_TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    dailyAIRequests: 10,
    maxTokensPerRequest: 1000,
    maxAgents: 1,
    maxWorkflows: 2,
    features: ["basic_chat", "basic_analytics"],
    rateLimitPerMinute: 5,
  },
  starter: {
    dailyAIRequests: 100,
    maxTokensPerRequest: 4000,
    maxAgents: 5,
    maxWorkflows: 10,
    features: ["basic_chat", "basic_analytics", "advanced_agents", "custom_workflows"],
    rateLimitPerMinute: 30,
  },
  pro: {
    dailyAIRequests: 1000,
    maxTokensPerRequest: 16000,
    maxAgents: 25,
    maxWorkflows: 50,
    features: [
      "basic_chat",
      "basic_analytics",
      "advanced_agents",
      "custom_workflows",
      "priority_support",
      "api_access",
      "team_collaboration",
      "advanced_analytics",
    ],
    rateLimitPerMinute: 120,
  },
  enterprise: {
    dailyAIRequests: -1, // unlimited
    maxTokensPerRequest: 128000,
    maxAgents: -1, // unlimited
    maxWorkflows: -1, // unlimited
    features: [
      "basic_chat",
      "basic_analytics",
      "advanced_agents",
      "custom_workflows",
      "priority_support",
      "api_access",
      "team_collaboration",
      "advanced_analytics",
      "dedicated_support",
      "sla_guarantee",
      "custom_models",
      "on_premise",
    ],
    rateLimitPerMinute: -1, // unlimited
  },
};

interface TierLimits {
  dailyAIRequests: number;
  maxTokensPerRequest: number;
  maxAgents: number;
  maxWorkflows: number;
  features: string[];
  rateLimitPerMinute: number;
}

interface TierUser {
  id: string;
  email: string;
  tier?: string;
}

interface AuthenticatedRequest extends Omit<Request, "user"> {
  user?: TierUser;
  tierLimits?: TierLimits;
  subscription?: {
    id: string;
    planName: string;
    status: string;
  };
}

// In-memory rate limit tracking (use Redis in production)
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

/**
 * Get user's current subscription tier
 */
async function getUserTier(userId: string): Promise<{ tier: string; limits: TierLimits; subscription?: any }> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["active", "trialing"] },
        currentPeriodEnd: { gte: new Date() },
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return { tier: "free", limits: DEFAULT_TIER_LIMITS.free };
    }

    const planName = subscription.plan.name.toLowerCase();
    const tierKey = Object.keys(TIER_HIERARCHY).find((k) => planName.includes(k)) || "free";

    // Parse features from JSON string
    let dbFeatures: Record<string, any> = {};
    try {
      dbFeatures =
        typeof subscription.plan.features === "string"
          ? JSON.parse(subscription.plan.features)
          : (subscription.plan.features as Record<string, any>) || {};
    } catch {
      dbFeatures = {};
    }

    const limits: TierLimits = {
      ...DEFAULT_TIER_LIMITS[tierKey],
      dailyAIRequests: subscription.plan.aiRequestsPerDay || DEFAULT_TIER_LIMITS[tierKey].dailyAIRequests,
      ...dbFeatures,
    };

    return {
      tier: tierKey,
      limits,
      subscription: {
        id: subscription.id,
        planName: subscription.plan.name,
        status: subscription.status,
      },
    };
  } catch (error) {
    console.error("Error fetching user tier:", error);
    return { tier: "free", limits: DEFAULT_TIER_LIMITS.free };
  }
}

/**
 * Get user's daily AI usage count
 */
async function getDailyUsage(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    // Try to get from AIUsageQuota if exists
    const quota = await prisma.aIUsageQuota.findUnique({
      where: { userId },
    });

    if (quota) {
      // Check if reset is needed
      const lastReset = new Date(quota.lastDailyReset);
      if (lastReset < startOfDay) {
        // Reset counter
        await prisma.aIUsageQuota.update({
          where: { userId },
          data: { aiRequestsToday: 0, lastDailyReset: startOfDay },
        });
        return 0;
      }
      return quota.aiRequestsToday;
    }
    return 0;
  } catch {
    // Fallback: count from UsageRecord
    try {
      const usage = await prisma.usageRecord.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfDay },
          resourceType: "ai_request",
        },
        _sum: { quantity: true },
      });
      return usage._sum.quantity || 0;
    } catch {
      return 0;
    }
  }
}

/**
 * Record AI usage for a user
 */
export async function recordAIUsage(userId: string, tokens: number = 1, metadata?: Record<string, any>): Promise<void> {
  try {
    // Update the quota counter
    await prisma.aIUsageQuota.upsert({
      where: { userId },
      update: {
        aiRequestsToday: { increment: 1 },
        aiRequestsThisMonth: { increment: 1 },
      },
      create: {
        userId,
        aiRequestsToday: 1,
        aiRequestsThisMonth: 1,
        dailyLimit: 50,
        monthlyLimit: 1500,
      },
    });

    // Also create a usage record for detailed tracking if there's an active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing"] } },
    });

    if (subscription) {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      await prisma.usageRecord.create({
        data: {
          subscriptionId: subscription.id,
          userId,
          resourceType: "ai_request",
          quantity: 1,
          periodStart: startOfDay,
          periodEnd: endOfDay,
          metadata: JSON.stringify({ tokens, ...metadata }),
        },
      });
    }
  } catch (error) {
    console.error("Failed to record AI usage:", error);
  }
}

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string, limitPerMinute: number): { allowed: boolean; retryAfter?: number } {
  if (limitPerMinute === -1) return { allowed: true };

  const now = Date.now();
  const key = `rate:${userId}`;
  const record = rateLimitStore.get(key);

  if (!record || now >= record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60000 });
    return { allowed: true };
  }

  if (record.count >= limitPerMinute) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Middleware: Require minimum tier
 *
 * Usage: router.get('/advanced-feature', requireTier('pro'), handler)
 */
export function requireTier(minimumTier: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tier, limits, subscription } = await getUserTier(req.user.id);
    const userTierLevel = TIER_HIERARCHY[tier] ?? 0;
    const requiredTierLevel = TIER_HIERARCHY[minimumTier] ?? 0;

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({
        error: "Upgrade required",
        message: `This feature requires ${minimumTier} tier or higher`,
        currentTier: tier,
        requiredTier: minimumTier,
        upgradeUrl: "/billing/upgrade",
      });
    }

    // Attach tier info to request for downstream use
    req.user.tier = tier;
    req.tierLimits = limits;
    req.subscription = subscription;
    next();
  };
}

/**
 * Middleware: Require specific feature flag
 *
 * Usage: router.get('/custom-models', requireFeature('custom_models'), handler)
 */
export function requireFeature(featureName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tier, limits, subscription } = await getUserTier(req.user.id);

    if (!limits.features.includes(featureName)) {
      return res.status(403).json({
        error: "Feature not available",
        message: `Your current plan does not include "${featureName}"`,
        currentTier: tier,
        upgradeUrl: "/billing/upgrade",
      });
    }

    req.user.tier = tier;
    req.tierLimits = limits;
    req.subscription = subscription;
    next();
  };
}

/**
 * Middleware: Check and enforce daily AI request limit
 *
 * Usage: router.post('/ai/chat', checkAILimit, handler)
 */
export async function checkAILimit(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { tier, limits, subscription } = await getUserTier(req.user.id);

  // Check rate limit first
  const rateCheck = checkRateLimit(req.user.id, limits.rateLimitPerMinute);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests. Please slow down.",
      retryAfter: rateCheck.retryAfter,
      tier,
    });
  }

  // Check daily limit (skip for unlimited)
  if (limits.dailyAIRequests !== -1) {
    const dailyUsage = await getDailyUsage(req.user.id);

    if (dailyUsage >= limits.dailyAIRequests) {
      return res.status(429).json({
        error: "Daily limit exceeded",
        message: `You've reached your daily limit of ${limits.dailyAIRequests} AI requests`,
        currentUsage: dailyUsage,
        limit: limits.dailyAIRequests,
        tier,
        resetsAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
        upgradeUrl: "/billing/upgrade",
      });
    }
  }

  req.user.tier = tier;
  req.tierLimits = limits;
  req.subscription = subscription;
  next();
}

/**
 * Middleware: Check token limit for request
 *
 * Usage: router.post('/ai/generate', checkTokenLimit, handler)
 */
export function checkTokenLimit(requestedTokens?: number) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tier, limits, subscription } = await getUserTier(req.user.id);
    const tokens = requestedTokens || req.body?.maxTokens || req.body?.max_tokens || 1000;

    if (tokens > limits.maxTokensPerRequest) {
      return res.status(400).json({
        error: "Token limit exceeded",
        message: `Your plan allows up to ${limits.maxTokensPerRequest} tokens per request`,
        requested: tokens,
        limit: limits.maxTokensPerRequest,
        tier,
        upgradeUrl: "/billing/upgrade",
      });
    }

    req.user.tier = tier;
    req.tierLimits = limits;
    req.subscription = subscription;
    next();
  };
}

/**
 * Middleware: Check agent/workflow creation limits
 *
 * Usage: router.post('/agents', checkResourceLimit('agents'), handler)
 */
export function checkResourceLimit(resourceType: "agents" | "workflows") {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tier, limits, subscription } = await getUserTier(req.user.id);
    const limitKey = resourceType === "agents" ? "maxAgents" : "maxWorkflows";
    const limit = limits[limitKey];

    // Skip for unlimited
    if (limit === -1) {
      req.user.tier = tier;
      req.tierLimits = limits;
      req.subscription = subscription;
      return next();
    }

    // Count existing resources
    let currentCount = 0;
    try {
      if (resourceType === "agents") {
        // Count RPA workflows as "agents" since there's no separate AIAgent model
        currentCount = await prisma.rPAWorkflow.count({
          where: { createdById: req.user.id, enabled: true },
        });
      } else {
        // Count AI workflows
        currentCount = await prisma.aIWorkflow.count({
          where: { enabled: true },
        });
      }
    } catch {
      currentCount = 0;
    }

    if (currentCount >= limit) {
      return res.status(403).json({
        error: "Resource limit reached",
        message: `Your plan allows up to ${limit} ${resourceType}`,
        current: currentCount,
        limit,
        tier,
        upgradeUrl: "/billing/upgrade",
      });
    }

    req.user.tier = tier;
    req.tierLimits = limits;
    req.subscription = subscription;
    next();
  };
}

/**
 * Express middleware: Attach tier info to all authenticated requests
 *
 * Usage: app.use(attachTierInfo)
 */
export async function attachTierInfo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.id) {
    const { tier, limits, subscription } = await getUserTier(req.user.id);
    req.user.tier = tier;
    req.tierLimits = limits;
    req.subscription = subscription;
  }
  next();
}

/**
 * Get tier comparison data for pricing page
 */
export async function getTierComparison(): Promise<
  Array<{
    name: string;
    price: { monthly: number; yearly: number };
    limits: TierLimits;
    popular?: boolean;
  }>
> {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    return plans.map(
      (plan: { name: string; priceMonthly: any; priceYearly: any; aiRequestsPerDay: number; features: any }) => {
        const tierKey = Object.keys(TIER_HIERARCHY).find((k) => plan.name.toLowerCase().includes(k)) || "free";

        return {
          name: plan.name,
          price: {
            monthly: Number(plan.priceMonthly),
            yearly: Number(plan.priceYearly),
          },
          limits: {
            ...DEFAULT_TIER_LIMITS[tierKey],
            dailyAIRequests: plan.aiRequestsPerDay,
            ...((typeof plan.features === "string" ? JSON.parse(plan.features) : plan.features) || {}),
          },
          popular: plan.name.toLowerCase().includes("pro"),
        };
      }
    );
  } catch {
    // Fallback to defaults
    return Object.entries(DEFAULT_TIER_LIMITS).map(([name, limits]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      price: { monthly: 0, yearly: 0 },
      limits,
      popular: name === "pro",
    }));
  }
}

export default {
  requireTier,
  requireFeature,
  checkAILimit,
  checkTokenLimit,
  checkResourceLimit,
  attachTierInfo,
  recordAIUsage,
  getTierComparison,
  TIER_HIERARCHY,
  DEFAULT_TIER_LIMITS,
};
