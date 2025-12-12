/**
 * Social Media Routes
 * Handles social media account management and auto-posting
 */

import express, { Request, Response } from "express";
import { z } from "zod";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import * as socialMediaService from "../services/socialMediaService";

const router = express.Router();

// Validation schemas
const createAccountSchema = z.object({
  platform: z.enum(["twitter", "linkedin", "facebook", "instagram"]),
  accountName: z.string().min(1),
  accountId: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
});

const createPostSchema = z.object({
  blogPostId: z.string().uuid().optional(),
  accountId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  aiGenerated: z.boolean().optional(),
  aiModel: z.string().optional(),
});

/**
 * GET /api/social-media/accounts
 * List social media accounts (admin)
 */
router.get("/accounts", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const accounts = await socialMediaService.listSocialMediaAccounts(req.user.userId);
    res.json(accounts);
  } catch (error: any) {
    console.error("[Social Media] Error listing accounts:", error);
    res.status(500).json({
      error: "Failed to list accounts",
      message: error.message,
    });
  }
});

/**
 * POST /api/social-media/accounts
 * Connect a new social media account (admin)
 */
router.post("/accounts", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const validation = createAccountSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.errors,
      });
    }

    const { platform, accountName, accountId, accessToken, refreshToken } = validation.data;

    const account = await socialMediaService.createSocialMediaAccount(
      req.user.userId,
      platform,
      accountName,
      accountId,
      {
        accessToken,
        refreshToken,
      }
    );

    res.status(201).json(account);
  } catch (error: any) {
    console.error("[Social Media] Error creating account:", error);
    res.status(500).json({
      error: "Failed to create account",
      message: error.message,
    });
  }
});

/**
 * POST /api/social-media/posts
 * Create a social media post (admin)
 */
router.post("/posts", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const validation = createPostSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const post = await socialMediaService.createSocialMediaPost({
      ...data,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
    });

    res.status(201).json(post);
  } catch (error: any) {
    console.error("[Social Media] Error creating post:", error);
    res.status(500).json({
      error: "Failed to create post",
      message: error.message,
    });
  }
});

/**
 * POST /api/social-media/posts/:id/publish
 * Publish a social media post immediately (admin)
 */
router.post("/posts/:id/publish", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await socialMediaService.postToSocialMedia(id);

    res.json(post);
  } catch (error: any) {
    console.error("[Social Media] Error publishing post:", error);
    res.status(500).json({
      error: "Failed to publish post",
      message: error.message,
    });
  }
});

/**
 * POST /api/social-media/auto-post/:blogPostId
 * Auto-post a blog post to all connected accounts (admin)
 */
router.post("/auto-post/:blogPostId", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { blogPostId } = req.params;
    const posts = await socialMediaService.autoPostBlogToSocial(blogPostId, req.user.userId);

    res.json({
      success: true,
      postsCreated: posts.length,
      posts,
    });
  } catch (error: any) {
    console.error("[Social Media] Error auto-posting:", error);
    res.status(500).json({
      error: "Failed to auto-post",
      message: error.message,
    });
  }
});

/**
 * GET /api/social-media/analytics/:blogPostId
 * Get social media analytics for a blog post (admin)
 */
router.get("/analytics/:blogPostId", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { blogPostId } = req.params;
    const analytics = await socialMediaService.getSocialAnalytics(blogPostId);

    res.json(analytics);
  } catch (error: any) {
    console.error("[Social Media] Error fetching analytics:", error);
    res.status(500).json({
      error: "Failed to fetch analytics",
      message: error.message,
    });
  }
});

export default router;
