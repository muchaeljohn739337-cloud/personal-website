/**
 * SEO Optimization Agent
 * Automatically audits blog posts and generates SEO optimizations
 */

import * as seoService from "../services/seoService";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class SEOOptimizationAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "SEO Optimization Agent",
      enabled: true,
      schedule: "0 2 * * *", // Daily at 2 AM
      retryAttempts: 3,
      timeout: 300000, // 5 minutes
      priority: "medium",
      description: "Automatically audits published blog posts and generates sitemap",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let errors = 0;

    try {
      this.context.logger.info("[SEO Agent] Starting SEO optimization run");

      // 1. Generate sitemap
      try {
        const baseUrl = process.env.PUBLIC_URL || "https://advanciapay.com";
        const sitemapResult = await seoService.generateSitemap(baseUrl);
        this.context.logger.info(`[SEO Agent] Sitemap generated with ${sitemapResult.urls.length} URLs`);
        itemsProcessed += sitemapResult.urls.length;
      } catch (error: any) {
        this.context.logger.error("[SEO Agent] Sitemap generation failed:", error);
        errors++;
      }

      // 2. Audit published posts that haven't been audited recently
      const recentPublishedPosts = await this.context.prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      });

      this.context.logger.info(`[SEO Agent] Found ${recentPublishedPosts.length} recent posts to audit`);

      for (const post of recentPublishedPosts) {
        try {
          // Check if already audited in last 24 hours
          const recentAudit = await this.context.prisma.sEOAudit.findFirst({
            where: {
              postId: post.id,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          });

          if (!recentAudit) {
            const audit = await seoService.auditBlogPost(post.id);
            this.context.logger.info(`[SEO Agent] Audited "${post.title}" - Score: ${audit.overallScore}/100`);
            itemsProcessed++;

            // Send notification if score is low
            if (audit.overallScore < 70 && this.context.io) {
              this.context.io.to("admin").emit("seo:low-score", {
                postId: post.id,
                title: post.title,
                slug: post.slug,
                score: audit.overallScore,
                suggestions: audit.suggestions,
              });
            }
          }
        } catch (error: any) {
          this.context.logger.error(`[SEO Agent] Failed to audit post ${post.id}:`, error);
          errors++;
        }
      }

      // 3. Check for posts with missing structured data
      const postsWithoutStructuredData = await this.context.prisma.blogPost.count({
        where: {
          status: "PUBLISHED",
          structuredData: null,
        },
      });

      if (postsWithoutStructuredData > 0) {
        this.context.logger.warn(`[SEO Agent] ${postsWithoutStructuredData} published posts missing structured data`);

        // Emit notification to admin
        if (this.context.io) {
          this.context.io.to("admin").emit("seo:missing-structured-data", {
            count: postsWithoutStructuredData,
            message: "Some posts are missing JSON-LD structured data",
          });
        }
      }

      const duration = Date.now() - startTime;
      const message = `SEO optimization completed: ${itemsProcessed} items processed, ${errors} errors`;

      this.context.logger.info(`[SEO Agent] ${message} in ${duration}ms`);

      return {
        success: errors === 0,
        message,
        data: {
          itemsProcessed,
          errors,
          postsAudited: recentPublishedPosts.length,
          postsWithoutStructuredData,
        },
        metrics: {
          duration,
          itemsProcessed,
          errors,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.context.logger.error("[SEO Agent] Critical error:", error);

      return {
        success: false,
        message: `SEO optimization failed: ${error.message}`,
        metrics: {
          duration,
          itemsProcessed,
          errors: errors + 1,
        },
      };
    }
  }
}
