/**
 * Social Media Agent
 * Automatically posts blog content to social media platforms
 */

import * as socialMediaService from "../services/socialMediaService";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class SocialMediaAgent extends BaseAgent {
  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "Social Media Agent",
      enabled: true,
      schedule: "*/30 * * * *", // Every 30 minutes
      retryAttempts: 3,
      timeout: 180000, // 3 minutes
      priority: "medium",
      description: "Automatically posts scheduled content to social media platforms",
    };
    super(config, context);
  }

  async execute(): Promise<AgentResult> {
    const startTime = Date.now();
    let itemsProcessed = 0;
    let errors = 0;

    try {
      this.context.logger.info("[Social Media Agent] Starting social media posting run");

      // 1. Check for scheduled posts that are ready to publish
      const now = new Date();
      const scheduledPosts = await this.context.prisma.socialMediaPost.findMany({
        where: {
          status: "SCHEDULED",
          scheduledFor: {
            lte: now,
          },
        },
        include: {
          account: true,
        },
        take: 50, // Process max 50 posts per run
      });

      this.context.logger.info(`[Social Media Agent] Found ${scheduledPosts.length} scheduled posts`);

      for (const post of scheduledPosts) {
        try {
          await socialMediaService.postToSocialMedia(post.id);
          this.context.logger.info(
            `[Social Media Agent] Posted to ${post.account.platform}: "${post.content.substring(0, 50)}..."`
          );
          itemsProcessed++;

          // Emit Socket.IO event for real-time notification
          if (this.context.io) {
            this.context.io.to("admin").emit("social:post-published", {
              postId: post.id,
              platform: post.account.platform,
              content: post.content.substring(0, 100),
            });
          }
        } catch (error: any) {
          this.context.logger.error(`[Social Media Agent] Failed to post ${post.id}:`, error);
          errors++;
        }
      }

      // 2. Check for newly published blog posts that haven't been auto-posted yet
      const recentBlogPosts = await this.context.prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        select: {
          id: true,
          title: true,
          authorId: true,
        },
      });

      for (const blogPost of recentBlogPosts) {
        // Check if already auto-posted
        const existingSocialPosts = await this.context.prisma.socialMediaPost.count({
          where: {
            blogPostId: blogPost.id,
          },
        });

        if (existingSocialPosts === 0) {
          // Auto-post to all connected accounts
          try {
            const posts = await socialMediaService.autoPostBlogToSocial(blogPost.id, blogPost.authorId);

            if (posts.length > 0) {
              this.context.logger.info(
                `[Social Media Agent] Auto-posted blog "${blogPost.title}" to ${posts.length} platforms`
              );
              itemsProcessed += posts.length;
            }
          } catch (error: any) {
            this.context.logger.error(`[Social Media Agent] Failed to auto-post blog ${blogPost.id}:`, error);
            errors++;
          }
        }
      }

      const duration = Date.now() - startTime;
      const message = `Social media posting completed: ${itemsProcessed} posts published, ${errors} errors`;

      this.context.logger.info(`[Social Media Agent] ${message} in ${duration}ms`);

      return {
        success: errors === 0,
        message,
        data: {
          scheduledPostsProcessed: scheduledPosts.length,
          blogPostsAutoPosted: recentBlogPosts.length,
        },
        metrics: {
          duration,
          itemsProcessed,
          errors,
        },
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.context.logger.error("[Social Media Agent] Critical error:", error);

      return {
        success: false,
        message: `Social media posting failed: ${error.message}`,
        metrics: {
          duration,
          itemsProcessed,
          errors: errors + 1,
        },
      };
    }
  }
}
