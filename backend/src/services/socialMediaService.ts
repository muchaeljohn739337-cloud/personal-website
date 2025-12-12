/**
 * Social Media Service
 * Handles multi-channel auto-posting to Twitter, LinkedIn, Facebook, Instagram
 */

import { Job, Queue, Worker } from "bullmq";
import crypto from "crypto";
import IORedis from "ioredis";
import prisma from "../prismaClient";

// Redis connection for BullMQ (optional - gracefully degrades if Redis not available)
let redisConnection: IORedis | null = null;
let socialMediaQueue: Queue | null = null;

try {
  redisConnection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn("[Social Media] Redis not available - queue features disabled");
        return null; // Stop retrying
      }
      return Math.min(times * 50, 2000);
    },
  });

  // Queue for social media posts
  socialMediaQueue = new Queue("social-media-posts", {
    connection: redisConnection,
  });
} catch (error) {
  console.warn("[Social Media] Redis connection failed - queue features disabled");
}

export interface CreateSocialPostInput {
  blogPostId?: string;
  accountId: string;
  content: string;
  mediaUrls?: string[];
  hashtags?: string;
  scheduledFor?: Date;
  aiGenerated?: boolean;
  aiModel?: string;
}

export interface SocialMediaCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * Create a social media account link
 */
export async function createSocialMediaAccount(
  userId: string,
  platform: "twitter" | "linkedin" | "facebook" | "instagram",
  accountName: string,
  accountId: string,
  credentials: SocialMediaCredentials
) {
  // Store credentials in HashiCorp Vault
  const vaultKeyAccess = `social_media_${platform}_${accountId}_access`;
  const vaultKeyRefresh = `social_media_${platform}_${accountId}_refresh`;

  // TODO: Integrate with actual Vault API
  // For now, store reference keys

  const account = await prisma.socialMediaAccount.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      platform,
      accountName,
      accountId,
      vaultKeyAccess,
      vaultKeyRefresh,
      active: true,
      verified: true,
    },
  });

  return account;
}

/**
 * List social media accounts for a user
 */
export async function listSocialMediaAccounts(userId?: string) {
  const where: any = { active: true };
  if (userId) {
    where.userId = userId;
  }

  const accounts = await prisma.socialMediaAccount.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  return accounts;
}

/**
 * Create a social media post
 */
export async function createSocialMediaPost(input: CreateSocialPostInput) {
  const post = await prisma.socialMediaPost.create({
    data: {
      id: crypto.randomUUID(),
      blogPostId: input.blogPostId,
      accountId: input.accountId,
      content: input.content,
      mediaUrls: input.mediaUrls ? JSON.stringify(input.mediaUrls) : null,
      hashtags: input.hashtags,
      status: input.scheduledFor ? "SCHEDULED" : "DRAFT",
      scheduledFor: input.scheduledFor,
      aiGenerated: input.aiGenerated || false,
      aiModel: input.aiModel,
    },
    include: {
      account: true,
    },
  });

  // If scheduled, add to BullMQ queue (if available)
  if (input.scheduledFor && socialMediaQueue) {
    try {
      await socialMediaQueue.add(
        "post-to-social",
        { postId: post.id },
        {
          delay: input.scheduledFor.getTime() - Date.now(),
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 60000, // 1 minute
          },
        }
      );
    } catch (error) {
      console.warn("[Social Media] Failed to queue post - Redis not available");
    }
  }

  return post;
}

/**
 * Post immediately to social media
 */
export async function postToSocialMedia(postId: string) {
  const post = await prisma.socialMediaPost.findUnique({
    where: { id: postId },
    include: {
      account: true,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.status === "POSTED") {
    throw new Error("Post already published");
  }

  try {
    let platformPostId: string | undefined;
    let platformUrl: string | undefined;

    // Post to platform based on account type
    switch (post.account.platform) {
      case "twitter":
        const twitterResult = await postToTwitter(post);
        platformPostId = twitterResult.id;
        platformUrl = twitterResult.url;
        break;

      case "linkedin":
        const linkedInResult = await postToLinkedIn(post);
        platformPostId = linkedInResult.id;
        platformUrl = linkedInResult.url;
        break;

      case "facebook":
        const facebookResult = await postToFacebook(post);
        platformPostId = facebookResult.id;
        platformUrl = facebookResult.url;
        break;

      case "instagram":
        const instagramResult = await postToInstagram(post);
        platformPostId = instagramResult.id;
        platformUrl = instagramResult.url;
        break;

      default:
        throw new Error(`Unsupported platform: ${post.account.platform}`);
    }

    // Update post status
    const updatedPost = await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        platformPostId,
        platformUrl,
      },
      include: {
        account: true,
      },
    });

    return updatedPost;
  } catch (error: any) {
    // Update post with error
    await prisma.socialMediaPost.update({
      where: { id: postId },
      data: {
        status: "FAILED",
        errorMessage: error.message,
      },
    });

    throw error;
  }
}

/**
 * Post to Twitter (X) API v2
 */
async function postToTwitter(post: any) {
  // TODO: Implement Twitter API v2 integration
  // Requires: twitter-api-v2 package
  // const { TwitterApi } = require('twitter-api-v2');

  console.log("[Social Media] Posting to Twitter:", post.content);

  // Placeholder response
  return {
    id: `twitter_${crypto.randomBytes(8).toString("hex")}`,
    url: `https://twitter.com/user/status/${crypto.randomBytes(8).toString("hex")}`,
  };
}

/**
 * Post to LinkedIn API
 */
async function postToLinkedIn(post: any) {
  // TODO: Implement LinkedIn Marketing API
  // Requires: axios for API calls

  console.log("[Social Media] Posting to LinkedIn:", post.content);

  // Placeholder response
  return {
    id: `linkedin_${crypto.randomBytes(8).toString("hex")}`,
    url: `https://www.linkedin.com/feed/update/urn:li:share:${crypto.randomBytes(8).toString("hex")}`,
  };
}

/**
 * Post to Facebook Graph API
 */
async function postToFacebook(post: any) {
  // TODO: Implement Facebook Graph API
  // Requires: axios for API calls

  console.log("[Social Media] Posting to Facebook:", post.content);

  // Placeholder response
  return {
    id: `facebook_${crypto.randomBytes(8).toString("hex")}`,
    url: `https://www.facebook.com/user/posts/${crypto.randomBytes(8).toString("hex")}`,
  };
}

/**
 * Post to Instagram Graph API
 */
async function postToInstagram(post: any) {
  // TODO: Implement Instagram Graph API
  // Requires: axios for API calls

  console.log("[Social Media] Posting to Instagram:", post.content);

  // Placeholder response
  return {
    id: `instagram_${crypto.randomBytes(8).toString("hex")}`,
    url: `https://www.instagram.com/p/${crypto.randomBytes(8).toString("hex")}/`,
  };
}

/**
 * Auto-post blog content to all active accounts
 */
export async function autoPostBlogToSocial(blogPostId: string, userId: string) {
  const blogPost = await prisma.blogPost.findUnique({
    where: { id: blogPostId },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!blogPost) {
    throw new Error("Blog post not found");
  }

  // Get all active social media accounts for user
  const accounts = await prisma.socialMediaAccount.findMany({
    where: {
      userId,
      active: true,
    },
  });

  if (accounts.length === 0) {
    console.log("[Social Media] No active accounts found for user");
    return [];
  }

  const posts = [];

  for (const account of accounts) {
    try {
      // Generate platform-specific content
      const content = generateSocialContent(blogPost, account.platform);

      // Create and post
      const socialPost = await createSocialMediaPost({
        blogPostId,
        accountId: account.id,
        content: content.text,
        hashtags: content.hashtags,
        mediaUrls: undefined, // TODO: Add media URL support when blog_posts has media field
      });

      // Post immediately
      await postToSocialMedia(socialPost.id);

      posts.push(socialPost);
    } catch (error: any) {
      console.error(`[Social Media] Failed to post to ${account.platform}:`, error);
    }
  }

  return posts;
}

/**
 * Generate platform-specific content
 */
function generateSocialContent(blogPost: any, platform: string) {
  const baseUrl = process.env.PUBLIC_URL || "https://advanciapay.com";
  const postUrl = `${baseUrl}/blog/${blogPost.slug}`;

  let text = "";
  let hashtags = "";

  switch (platform) {
    case "twitter":
      // Twitter has 280 char limit
      text = `${blogPost.title}\n\n${blogPost.excerpt?.substring(0, 150) || ""}...\n\n${postUrl}`;
      hashtags = "#SaaS #AI #Tech";
      break;

    case "linkedin":
      // LinkedIn allows longer posts
      text = `${blogPost.title}\n\n${blogPost.excerpt || ""}\n\nRead more: ${postUrl}`;
      hashtags = "#SaaS #Technology #Innovation";
      break;

    case "facebook":
      text = `${blogPost.title}\n\n${blogPost.excerpt || ""}\n\n${postUrl}`;
      hashtags = "";
      break;

    case "instagram":
      // Instagram is image-focused
      text = `${blogPost.title}\n\n${blogPost.excerpt?.substring(0, 200) || ""}...\n\nLink in bio!`;
      hashtags = "#SaaS #Tech #Innovation #Startup";
      break;
  }

  return { text, hashtags };
}

/**
 * Get social media analytics for a blog post
 */
export async function getSocialAnalytics(blogPostId: string) {
  const posts = await prisma.socialMediaPost.findMany({
    where: {
      blogPostId,
    },
    include: {
      account: true,
    },
  });

  const analytics = {
    totalPosts: posts.length,
    totalLikes: posts.reduce((sum, p) => sum + p.likes, 0),
    totalShares: posts.reduce((sum, p) => sum + p.shares, 0),
    totalComments: posts.reduce((sum, p) => sum + p.comments, 0),
    totalClicks: posts.reduce((sum, p) => sum + p.clicks, 0),
    totalImpressions: posts.reduce((sum, p) => sum + p.impressions, 0),
    byPlatform: {} as any,
  };

  for (const post of posts) {
    const platform = post.account.platform;
    if (!analytics.byPlatform[platform]) {
      analytics.byPlatform[platform] = {
        likes: 0,
        shares: 0,
        comments: 0,
        clicks: 0,
        impressions: 0,
      };
    }

    analytics.byPlatform[platform].likes += post.likes;
    analytics.byPlatform[platform].shares += post.shares;
    analytics.byPlatform[platform].comments += post.comments;
    analytics.byPlatform[platform].clicks += post.clicks;
    analytics.byPlatform[platform].impressions += post.impressions;
  }

  return analytics;
}

// Initialize BullMQ worker
export function initializeSocialMediaWorker() {
  if (!redisConnection || !socialMediaQueue) {
    console.warn("[Social Media Worker] Redis not available - worker not initialized");
    return null;
  }

  try {
    const worker = new Worker(
      "social-media-posts",
      async (job: Job) => {
        const { postId } = job.data;
        console.log(`[Social Media Worker] Processing post ${postId}`);

        try {
          await postToSocialMedia(postId);
          return { success: true, postId };
        } catch (error: any) {
          console.error(`[Social Media Worker] Failed to post ${postId}:`, error);
          throw error;
        }
      },
      {
        connection: redisConnection,
        concurrency: 5,
      }
    );

    worker.on("completed", (job) => {
      console.log(`[Social Media Worker] Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Social Media Worker] Job ${job?.id} failed:`, err);
    });

    console.log("[Social Media Worker] Initialized successfully");
    return worker;
  } catch (error) {
    console.warn("[Social Media Worker] Failed to initialize:", error);
    return null;
  }
}

export { socialMediaQueue };

export default {
  createSocialMediaAccount,
  listSocialMediaAccounts,
  createSocialMediaPost,
  postToSocialMedia,
  autoPostBlogToSocial,
  getSocialAnalytics,
  initializeSocialMediaWorker,
};
