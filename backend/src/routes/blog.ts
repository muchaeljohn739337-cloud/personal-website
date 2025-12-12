/**
 * Blog & CMS Routes
 * Handles blog posts, categories, comments, and AI content generation
 */

import express, { Request, Response } from "express";
import { z } from "zod";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import * as blogService from "../services/blogService";

const router = express.Router();

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(500),
  excerpt: z.string().max(500).optional(),
  contentMarkdown: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  tags: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).optional(),
  scheduledFor: z.string().datetime().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().optional(),
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  excerpt: z.string().max(500).optional(),
  contentMarkdown: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.string().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  authorName: z.string().min(1).max(100).optional(),
  authorEmail: z.string().email().optional(),
  parentId: z.string().uuid().optional(),
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * GET /api/blog/posts
 * List published blog posts (public)
 */
router.get("/posts", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId as string;
    const tags = req.query.tags as string;
    const search = req.query.search as string;
    const featured = req.query.featured === "true";

    const result = await blogService.listBlogPosts(
      {
        status: "PUBLISHED",
        categoryId,
        tags,
        search,
        featured: featured || undefined,
      },
      page,
      limit
    );

    res.json(result);
  } catch (error: any) {
    console.error("[Blog] Error listing posts:", error);
    res.status(500).json({
      error: "Failed to fetch blog posts",
      message: error.message,
    });
  }
});

/**
 * GET /api/blog/posts/:slugOrId
 * Get a single blog post by slug or ID (public)
 */
router.get("/posts/:slugOrId", async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const post = await blogService.getBlogPost(slugOrId, true); // Increment view count

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    // Only show published posts to public
    if (post.status !== "PUBLISHED") {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    res.json(post);
  } catch (error: any) {
    console.error("[Blog] Error fetching post:", error);
    res.status(500).json({
      error: "Failed to fetch blog post",
      message: error.message,
    });
  }
});

/**
 * GET /api/blog/categories
 * List all blog categories (public)
 */
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await blogService.listBlogCategories();
    res.json(categories);
  } catch (error: any) {
    console.error("[Blog] Error listing categories:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
      message: error.message,
    });
  }
});

/**
 * POST /api/blog/posts/:postId/comments
 * Create a comment on a blog post
 */
router.post("/posts/:postId/comments", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const validation = createCommentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.errors,
      });
    }

    const { content, authorName, authorEmail, parentId } = validation.data;

    // Get authenticated user if available
    const authHeader = req.headers["authorization"];
    let authorId: string | undefined;

    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = require("jsonwebtoken");
        const config = require("../config").config;
        const payload = jwt.verify(token, config.jwtSecret) as any;
        authorId = payload.userId;
      } catch (error) {
        // Not authenticated, use guest comment
      }
    }

    const comment = await blogService.createBlogComment(
      postId,
      content,
      authorId,
      authorName,
      authorEmail,
      parentId,
      req.ip,
      req.headers["user-agent"]
    );

    res.status(201).json(comment);
  } catch (error: any) {
    console.error("[Blog] Error creating comment:", error);
    res.status(500).json({
      error: "Failed to create comment",
      message: error.message,
    });
  }
});

// ============================================================================
// ADMIN ROUTES (requires authentication + admin role)
// ============================================================================

/**
 * POST /api/blog/admin/posts
 * Create a new blog post (admin)
 */
router.post("/admin/posts", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const validation = createPostSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const post = await blogService.createBlogPost({
      ...data,
      authorId: req.user.userId,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
    });

    res.status(201).json(post);
  } catch (error: any) {
    console.error("[Blog] Error creating post:", error);
    res.status(500).json({
      error: "Failed to create blog post",
      message: error.message,
    });
  }
});

/**
 * PUT /api/blog/admin/posts/:id
 * Update a blog post (admin)
 */
router.put("/admin/posts/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = updatePostSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.errors,
      });
    }

    const data = validation.data;
    const post = await blogService.updateBlogPost(id, {
      ...data,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
    });

    res.json(post);
  } catch (error: any) {
    console.error("[Blog] Error updating post:", error);
    res.status(500).json({
      error: "Failed to update blog post",
      message: error.message,
    });
  }
});

/**
 * POST /api/blog/admin/posts/:id/publish
 * Publish a blog post (admin)
 */
router.post("/admin/posts/:id/publish", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const post = await blogService.publishBlogPost(id, req.user.userId);

    // Emit Socket.IO event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("blog:new-post", {
        postId: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        author: post.author,
        publishedAt: post.publishedAt,
      });
    }

    res.json(post);
  } catch (error: any) {
    console.error("[Blog] Error publishing post:", error);
    res.status(500).json({
      error: "Failed to publish blog post",
      message: error.message,
    });
  }
});

/**
 * GET /api/blog/admin/posts
 * List all blog posts including drafts (admin)
 */
router.get("/admin/posts", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const categoryId = req.query.categoryId as string;
    const authorId = req.query.authorId as string;
    const search = req.query.search as string;

    const result = await blogService.listBlogPosts(
      {
        status,
        categoryId,
        authorId,
        search,
      },
      page,
      limit
    );

    res.json(result);
  } catch (error: any) {
    console.error("[Blog] Error listing admin posts:", error);
    res.status(500).json({
      error: "Failed to fetch blog posts",
      message: error.message,
    });
  }
});

/**
 * GET /api/blog/admin/posts/:id
 * Get a single blog post including drafts (admin)
 */
router.get("/admin/posts/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await blogService.getBlogPost(id, false); // Don't increment view count

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    res.json(post);
  } catch (error: any) {
    console.error("[Blog] Error fetching admin post:", error);
    res.status(500).json({
      error: "Failed to fetch blog post",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/blog/admin/posts/:id
 * Delete a blog post (admin)
 */
router.delete("/admin/posts/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await blogService.deleteBlogPost(id);

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error: any) {
    console.error("[Blog] Error deleting post:", error);
    res.status(500).json({
      error: "Failed to delete blog post",
      message: error.message,
    });
  }
});

/**
 * POST /api/blog/admin/categories
 * Create a blog category (admin)
 */
router.post("/admin/categories", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const validation = createCategorySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Validation error",
        details: validation.error.errors,
      });
    }

    const { name, description, parentId, seoTitle, seoDescription } = validation.data;
    const category = await blogService.createBlogCategory(name, description, parentId, seoTitle, seoDescription);

    res.status(201).json(category);
  } catch (error: any) {
    console.error("[Blog] Error creating category:", error);
    res.status(500).json({
      error: "Failed to create category",
      message: error.message,
    });
  }
});

/**
 * GET /api/blog/admin/comments
 * List all comments with filters (admin)
 */
router.get("/admin/comments", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const postId = req.query.postId as string;
    const status = req.query.status as string;

    const result = await blogService.listBlogComments(postId, status, page, limit);

    res.json(result);
  } catch (error: any) {
    console.error("[Blog] Error listing comments:", error);
    res.status(500).json({
      error: "Failed to fetch comments",
      message: error.message,
    });
  }
});

/**
 * POST /api/blog/admin/comments/:id/approve
 * Approve a comment (admin)
 */
router.post("/admin/comments/:id/approve", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const comment = await blogService.approveBlogComment(id, req.user.userId);

    res.json(comment);
  } catch (error: any) {
    console.error("[Blog] Error approving comment:", error);
    res.status(500).json({
      error: "Failed to approve comment",
      message: error.message,
    });
  }
});

/**
 * POST /api/blog/admin/generate
 * Generate blog content using AI (admin)
 */
router.post("/admin/generate", authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { prompt, keywords, tone, length, model } = req.body;

    if (!prompt && !keywords) {
      return res.status(400).json({
        error: "Either prompt or keywords must be provided",
      });
    }

    // Call AI generator service
    // This integrates with your existing ai-generator route
    const aiGeneratorRoute = req.app._router.stack.find(
      (layer: any) => layer.name === "router" && layer.regexp.test("/api/ai/generate")
    );

    // For now, return a placeholder that the frontend can use to call /api/ai/generate
    res.json({
      message: "AI generation initiated",
      suggestion: "Call POST /api/ai/generate with type: 'blog_post', prompt, keywords, tone, length",
      example: {
        type: "blog_post",
        prompt: prompt || `Write a blog post about ${keywords}`,
        keywords,
        tone: tone || "professional",
        length: length || 1500,
        model: model || "gpt-4",
      },
    });
  } catch (error: any) {
    console.error("[Blog] Error generating content:", error);
    res.status(500).json({
      error: "Failed to generate content",
      message: error.message,
    });
  }
});

export default router;
