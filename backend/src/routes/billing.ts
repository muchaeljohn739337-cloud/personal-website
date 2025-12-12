/**
 * Billing Routes - Subscription Management & Payment Processing
 *
 * Endpoints for:
 * - Subscription management (create, cancel, upgrade, downgrade)
 * - Invoice retrieval
 * - Usage tracking
 * - Stripe webhook handling
 */

import { PrismaClient } from "@prisma/client";
import { Request, Response, Router } from "express";
import Stripe from "stripe";
import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { authenticateToken } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = Router();
const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

// ============================================
// PRICING PLANS
// ============================================

/**
 * GET /api/billing/plans
 * Get all available pricing plans
 */
router.get("/plans", async (req: Request, res: Response) => {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    // Parse JSON features
    const parsedPlans = plans.map((plan) => ({
      ...plan,
      features: JSON.parse(plan.features || "{}"),
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
    }));

    res.json({ success: true, plans: parsedPlans });
  } catch (error) {
    logger.error("Failed to fetch pricing plans:", error);
    res.status(500).json({ success: false, error: "Failed to fetch plans" });
  }
});

/**
 * GET /api/billing/plans/:slug
 * Get a specific pricing plan by slug
 */
router.get("/plans/:slug", async (req: Request, res: Response) => {
  try {
    const plan = await prisma.pricingPlan.findUnique({
      where: { slug: req.params.slug },
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    res.json({
      success: true,
      plan: {
        ...plan,
        features: JSON.parse(plan.features || "{}"),
        priceMonthly: Number(plan.priceMonthly),
        priceYearly: Number(plan.priceYearly),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch plan:", error);
    res.status(500).json({ success: false, error: "Failed to fetch plan" });
  }
});

// ============================================
// SUBSCRIPTIONS
// ============================================

/**
 * GET /api/billing/subscription
 * Get current user's subscription
 */
router.get("/subscription", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["active", "trialing", "past_due"] },
      },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
        message: "No active subscription",
      });
    }

    res.json({
      success: true,
      subscription: {
        ...subscription,
        plan: {
          ...subscription.plan,
          features: JSON.parse(subscription.plan.features || "{}"),
          priceMonthly: Number(subscription.plan.priceMonthly),
          priceYearly: Number(subscription.plan.priceYearly),
        },
      },
    });
  } catch (error) {
    logger.error("Failed to fetch subscription:", error);
    res.status(500).json({ success: false, error: "Failed to fetch subscription" });
  }
});

/**
 * POST /api/billing/subscribe
 * Create a new subscription
 */
router.post("/subscribe", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { planSlug, billingCycle = "monthly" } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Get the plan
    const plan = await prisma.pricingPlan.findUnique({
      where: { slug: planSlug },
    });

    if (!plan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    // Check for existing subscription
    const existing = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Already has an active subscription",
        subscriptionId: existing.id,
      });
    }

    // Get user for Stripe
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Free plan - no Stripe needed
    if (Number(plan.priceMonthly) === 0) {
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Initialize usage quota
      await prisma.aIUsageQuota.upsert({
        where: { userId },
        create: {
          userId,
          dailyLimit: plan.aiRequestsPerDay,
          monthlyLimit: plan.aiRequestsPerMonth,
        },
        update: {
          dailyLimit: plan.aiRequestsPerDay,
          monthlyLimit: plan.aiRequestsPerMonth,
        },
      });

      // Audit log
      await SafePrisma.create("audit_logs", {
        userId,
        action: "SUBSCRIPTION_CREATED",
        resourceType: "subscription",
        resourceId: subscription.id,
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "billing-api",
        metadata: { planSlug, planName: plan.name },
      });

      return res.json({
        success: true,
        subscription,
        message: "Free plan activated",
      });
    }

    // Paid plan - create Stripe checkout session
    const priceId = billingCycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: "Stripe price not configured for this plan",
      });
    }

    // Create or get Stripe customer
    let customerId: string;
    const existingSub = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
      metadata: {
        userId,
        planId: plan.id,
        planSlug,
      },
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    logger.error("Failed to create subscription:", error);
    res.status(500).json({ success: false, error: "Failed to create subscription" });
  }
});

/**
 * POST /api/billing/cancel
 * Cancel subscription (at period end)
 */
router.post("/cancel", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { immediate = false, reason } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: "No active subscription" });
    }

    // Cancel in Stripe if exists
    if (subscription.stripeSubscriptionId) {
      if (immediate) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }
    }

    // Update local subscription
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: immediate ? "cancelled" : "active",
        cancelAtPeriodEnd: !immediate,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    // Audit log
    await SafePrisma.create("audit_logs", {
      userId,
      action: immediate ? "SUBSCRIPTION_CANCELLED" : "SUBSCRIPTION_CANCEL_SCHEDULED",
      resourceType: "subscription",
      resourceId: subscription.id,
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "billing-api",
      metadata: { reason, immediate },
    });

    res.json({
      success: true,
      subscription: updated,
      message: immediate ? "Subscription cancelled immediately" : "Subscription will cancel at end of billing period",
    });
  } catch (error) {
    logger.error("Failed to cancel subscription:", error);
    res.status(500).json({ success: false, error: "Failed to cancel subscription" });
  }
});

/**
 * POST /api/billing/upgrade
 * Upgrade to a higher tier plan
 */
router.post("/upgrade", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { planSlug, billingCycle = "monthly" } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const currentSub = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
      include: { plan: true },
    });

    if (!currentSub) {
      return res.status(404).json({ success: false, error: "No active subscription to upgrade" });
    }

    const newPlan = await prisma.pricingPlan.findUnique({
      where: { slug: planSlug },
    });

    if (!newPlan) {
      return res.status(404).json({ success: false, error: "Target plan not found" });
    }

    // Validate it's an upgrade
    if (Number(newPlan.priceMonthly) <= Number(currentSub.plan.priceMonthly)) {
      return res.status(400).json({
        success: false,
        error: "Use /downgrade for lower tier plans",
      });
    }

    // Handle Stripe subscription update
    if (currentSub.stripeSubscriptionId) {
      const priceId = billingCycle === "yearly" ? newPlan.stripePriceIdYearly : newPlan.stripePriceIdMonthly;

      if (!priceId) {
        return res.status(400).json({
          success: false,
          error: "Stripe price not configured for target plan",
        });
      }

      // Get current Stripe subscription
      const stripeSub = await stripe.subscriptions.retrieve(currentSub.stripeSubscriptionId);

      // Update to new plan (prorated)
      await stripe.subscriptions.update(currentSub.stripeSubscriptionId, {
        items: [{ id: stripeSub.items.data[0].id, price: priceId }],
        proration_behavior: "create_prorations",
      });
    }

    // Update local subscription
    const updated = await prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        planId: newPlan.id,
        cancelAtPeriodEnd: false, // Reset cancellation if any
        cancelledAt: null,
        cancellationReason: null,
      },
    });

    // Update usage quotas
    await prisma.aIUsageQuota.update({
      where: { userId },
      data: {
        dailyLimit: newPlan.aiRequestsPerDay,
        monthlyLimit: newPlan.aiRequestsPerMonth,
      },
    });

    // Audit log
    await SafePrisma.create("audit_logs", {
      userId,
      action: "SUBSCRIPTION_UPGRADED",
      resourceType: "subscription",
      resourceId: currentSub.id,
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "billing-api",
      metadata: {
        fromPlan: currentSub.plan.slug,
        toPlan: newPlan.slug,
      },
    });

    res.json({
      success: true,
      subscription: updated,
      message: `Upgraded to ${newPlan.name}`,
    });
  } catch (error) {
    logger.error("Failed to upgrade subscription:", error);
    res.status(500).json({ success: false, error: "Failed to upgrade subscription" });
  }
});

// ============================================
// INVOICES
// ============================================

/**
 * GET /api/billing/invoices
 * Get user's invoices
 */
router.get("/invoices", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 10, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.invoice.count({ where: { userId } });

    res.json({
      success: true,
      invoices: invoices.map((inv) => ({
        ...inv,
        amountDue: Number(inv.amountDue),
        amountPaid: Number(inv.amountPaid),
        lineItems: JSON.parse(inv.lineItems || "[]"),
      })),
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch invoices:", error);
    res.status(500).json({ success: false, error: "Failed to fetch invoices" });
  }
});

/**
 * GET /api/billing/invoices/:id
 * Get specific invoice details
 */
router.get("/invoices/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, userId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    res.json({
      success: true,
      invoice: {
        ...invoice,
        amountDue: Number(invoice.amountDue),
        amountPaid: Number(invoice.amountPaid),
        lineItems: JSON.parse(invoice.lineItems || "[]"),
      },
    });
  } catch (error) {
    logger.error("Failed to fetch invoice:", error);
    res.status(500).json({ success: false, error: "Failed to fetch invoice" });
  }
});

// ============================================
// USAGE
// ============================================

/**
 * GET /api/billing/usage
 * Get current usage statistics
 */
router.get("/usage", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const quota = await prisma.aIUsageQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      return res.json({
        success: true,
        usage: {
          aiRequestsToday: 0,
          aiRequestsThisMonth: 0,
          dailyLimit: 50, // Default free tier
          monthlyLimit: 1500,
          dailyPercentUsed: 0,
          monthlyPercentUsed: 0,
        },
      });
    }

    res.json({
      success: true,
      usage: {
        aiRequestsToday: quota.aiRequestsToday,
        aiRequestsThisMonth: quota.aiRequestsThisMonth,
        dailyLimit: quota.dailyLimit,
        monthlyLimit: quota.monthlyLimit,
        dailyPercentUsed: (quota.aiRequestsToday / quota.dailyLimit) * 100,
        monthlyPercentUsed: (quota.aiRequestsThisMonth / quota.monthlyLimit) * 100,
        overageAllowed: quota.overageAllowed,
        overageRate: quota.overageRate ? Number(quota.overageRate) : null,
        lastDailyReset: quota.lastDailyReset,
        lastMonthlyReset: quota.lastMonthlyReset,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch usage:", error);
    res.status(500).json({ success: false, error: "Failed to fetch usage" });
  }
});

// ============================================
// STRIPE PORTAL
// ============================================

/**
 * POST /api/billing/portal
 * Create Stripe billing portal session
 */
router.post("/portal", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId, stripeCustomerId: { not: null } },
    });

    if (!subscription?.stripeCustomerId) {
      return res.status(404).json({
        success: false,
        error: "No Stripe customer found",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({
      success: true,
      portalUrl: session.url,
    });
  } catch (error) {
    logger.error("Failed to create billing portal session:", error);
    res.status(500).json({ success: false, error: "Failed to create portal session" });
  }
});

// ============================================
// INTERNAL - Usage Tracking
// ============================================

/**
 * Track AI usage (called internally by AI services)
 */
export async function trackAIUsage(
  userId: string,
  resourceType: string = "ai_request",
  metadata?: Record<string, any>
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  try {
    // Get or create quota
    let quota = await prisma.aIUsageQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      quota = await prisma.aIUsageQuota.create({
        data: { userId },
      });
    }

    // Check for daily reset
    const now = new Date();
    const lastDailyReset = new Date(quota.lastDailyReset);
    if (now.toDateString() !== lastDailyReset.toDateString()) {
      await prisma.aIUsageQuota.update({
        where: { userId },
        data: {
          aiRequestsToday: 0,
          lastDailyReset: now,
        },
      });
      quota.aiRequestsToday = 0;
    }

    // Check for monthly reset
    if (now.getMonth() !== lastDailyReset.getMonth() || now.getFullYear() !== lastDailyReset.getFullYear()) {
      await prisma.aIUsageQuota.update({
        where: { userId },
        data: {
          aiRequestsThisMonth: 0,
          lastMonthlyReset: now,
        },
      });
      quota.aiRequestsThisMonth = 0;
    }

    // Check limits
    if (quota.aiRequestsToday >= quota.dailyLimit) {
      if (!quota.overageAllowed) {
        return {
          allowed: false,
          remaining: 0,
          message: "Daily AI request limit reached. Upgrade your plan for more.",
        };
      }
    }

    if (quota.aiRequestsThisMonth >= quota.monthlyLimit) {
      if (!quota.overageAllowed) {
        return {
          allowed: false,
          remaining: 0,
          message: "Monthly AI request limit reached. Upgrade your plan for more.",
        };
      }
    }

    // Increment usage
    await prisma.aIUsageQuota.update({
      where: { userId },
      data: {
        aiRequestsToday: { increment: 1 },
        aiRequestsThisMonth: { increment: 1 },
      },
    });

    // Record usage for billing
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: "active" },
    });

    if (subscription) {
      await prisma.usageRecord.create({
        data: {
          subscriptionId: subscription.id,
          userId,
          resourceType,
          quantity: 1,
          periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
          periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    }

    return {
      allowed: true,
      remaining: quota.dailyLimit - quota.aiRequestsToday - 1,
    };
  } catch (error) {
    logger.error("Failed to track AI usage:", error);
    // Allow on error to not block operations
    return { allowed: true, remaining: -1 };
  }
}

export default router;
