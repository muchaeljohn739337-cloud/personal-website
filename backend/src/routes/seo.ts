/**
 * SEO Routes
 * Handles SEO automation, sitemap generation, and audits
 */

import express, { Request, Response } from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import * as seoService from "../services/seoService";

const router = express.Router();

/**
 * GET /api/seo/sitemap.xml
 * Public sitemap endpoint
 */
router.get("/sitemap.xml", async (req: Request, res: Response) => {
  try {
    const sitemap = await seoService.getLatestSitemap();

    if (!sitemap) {
      // Generate new sitemap if none exists
      const baseUrl = process.env.PUBLIC_URL || "https://advanciapay.com";
      const result = await seoService.generateSitemap(baseUrl);
      const xml = seoService.generateSitemapXML(result.urls);
      return res.type("application/xml").send(xml);
    }

    const xml = seoService.generateSitemapXML(sitemap.urls);
    res.type("application/xml").send(xml);
  } catch (error: any) {
    console.error("[SEO] Error generating sitemap:", error);
    res.status(500).json({
      error: "Failed to generate sitemap",
      message: error.message,
    });
  }
});

/**
 * POST /api/seo/admin/generate-sitemap
 * Manually generate sitemap (admin)
 */
router.post("/admin/generate-sitemap", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const baseUrl = req.body.baseUrl || process.env.PUBLIC_URL || "https://advanciapay.com";
    const result = await seoService.generateSitemap(baseUrl);

    res.json({
      success: true,
      totalUrls: result.urls.length,
      sitemap: result.sitemap,
    });
  } catch (error: any) {
    console.error("[SEO] Error generating sitemap:", error);
    res.status(500).json({
      error: "Failed to generate sitemap",
      message: error.message,
    });
  }
});

/**
 * POST /api/seo/admin/audit/:postId
 * Run SEO audit on a blog post (admin)
 */
router.post("/admin/audit/:postId", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const audit = await seoService.auditBlogPost(postId);

    res.json(audit);
  } catch (error: any) {
    console.error("[SEO] Error auditing post:", error);
    res.status(500).json({
      error: "Failed to audit post",
      message: error.message,
    });
  }
});

/**
 * GET /api/seo/admin/audit-history/:postId
 * Get SEO audit history for a post (admin)
 */
router.get("/admin/audit-history/:postId", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const audits = await seoService.getPostAuditHistory(postId);

    res.json(audits);
  } catch (error: any) {
    console.error("[SEO] Error fetching audit history:", error);
    res.status(500).json({
      error: "Failed to fetch audit history",
      message: error.message,
    });
  }
});

/**
 * POST /api/seo/admin/optimize/:postId
 * Auto-optimize SEO fields using AI (admin)
 */
router.post("/admin/optimize/:postId", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { model } = req.body;

    const suggestions = await seoService.autoOptimizeSEO(postId, model);

    res.json(suggestions);
  } catch (error: any) {
    console.error("[SEO] Error optimizing post:", error);
    res.status(500).json({
      error: "Failed to optimize post",
      message: error.message,
    });
  }
});

/**
 * GET /api/seo/admin/structured-data/:postId
 * Generate structured data (JSON-LD) for a post (admin)
 */
router.get("/admin/structured-data/:postId", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const prisma = require("../prismaClient").default;

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        media: true,
      },
    });

    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }

    const baseUrl = process.env.PUBLIC_URL || "https://advanciapay.com";
    const structuredData = seoService.generateStructuredData(post, baseUrl);

    res.json(structuredData);
  } catch (error: any) {
    console.error("[SEO] Error generating structured data:", error);
    res.status(500).json({
      error: "Failed to generate structured data",
      message: error.message,
    });
  }
});

export default router;
