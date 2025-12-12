/**
 * SEO Service
 * Handles SEO automation including sitemap generation, meta optimization, audits
 */

import crypto from "crypto";
import prisma from "../prismaClient";

export interface SEOAuditResult {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  mobileFriendly: boolean;
  pageSpeed?: number;
  missingMetaTags: string[];
  brokenLinks: string[];
  missingAltText: string[];
  keywordIssues: string[];
  suggestions: string[];
}

/**
 * Generate sitemap entries from published blog posts
 */
export async function generateSitemap(baseUrl: string = "https://advanciapay.com") {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  const categories = await prisma.blogCategory.findMany({
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const urls = [
    {
      loc: `${baseUrl}/`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: "1.0",
    },
    {
      loc: `${baseUrl}/blog`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: "0.9",
    },
  ];

  // Add blog posts
  for (const post of posts) {
    urls.push({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.updatedAt.toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    });
  }

  // Add categories
  for (const category of categories) {
    urls.push({
      loc: `${baseUrl}/blog/category/${category.slug}`,
      lastmod: category.updatedAt.toISOString(),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  // Save sitemap to database
  const sitemap = await prisma.sitemap.create({
    data: {
      id: crypto.randomUUID(),
      urls: JSON.stringify(urls),
      totalUrls: urls.length,
      generated: true,
      generatedAt: new Date(),
    },
  });

  return {
    sitemap,
    urls,
  };
}

/**
 * Generate XML sitemap string
 */
export function generateSitemapXML(urls: any[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const url of urls) {
    xml += "  <url>\n";
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += "  </url>\n";
  }

  xml += "</urlset>";
  return xml;
}

/**
 * Audit a blog post for SEO issues
 */
export async function auditBlogPost(postId: string): Promise<SEOAuditResult> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: {
      media: true,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const missingMetaTags: string[] = [];
  const missingAltText: string[] = [];
  const keywordIssues: string[] = [];
  const suggestions: string[] = [];

  // Check meta tags
  if (!post.seoTitle || post.seoTitle.length < 30) {
    missingMetaTags.push("SEO Title too short (min 30 chars)");
    suggestions.push("Add a descriptive SEO title (50-60 characters)");
  }

  if (post.seoTitle && post.seoTitle.length > 60) {
    missingMetaTags.push("SEO Title too long (max 60 chars)");
    suggestions.push("Shorten SEO title to 50-60 characters");
  }

  if (!post.seoDescription || post.seoDescription.length < 120) {
    missingMetaTags.push("SEO Description too short (min 120 chars)");
    suggestions.push("Add a compelling SEO description (150-160 characters)");
  }

  if (post.seoDescription && post.seoDescription.length > 160) {
    missingMetaTags.push("SEO Description too long (max 160 chars)");
    suggestions.push("Shorten SEO description to 150-160 characters");
  }

  if (!post.seoKeywords) {
    missingMetaTags.push("SEO Keywords missing");
    suggestions.push("Add 3-5 relevant keywords for SEO");
  }

  if (!post.canonicalUrl) {
    missingMetaTags.push("Canonical URL not set");
    suggestions.push("Set canonical URL to prevent duplicate content");
  }

  // Check images alt text
  for (const media of post.media) {
    if (media.type === "image" && !media.altText) {
      missingAltText.push(media.filename);
    }
  }

  if (missingAltText.length > 0) {
    suggestions.push(`Add alt text to ${missingAltText.length} image(s)`);
  }

  // Check content length
  const wordCount = post.contentMarkdown.trim().split(/\s+/).length;
  if (wordCount < 300) {
    keywordIssues.push("Content too short for SEO (min 300 words)");
    suggestions.push("Expand content to at least 300 words");
  }

  // Check keyword in title
  if (post.seoKeywords) {
    const keywords = post.seoKeywords.split(",").map((k) => k.trim().toLowerCase());
    const titleLower = post.title.toLowerCase();
    const hasKeywordInTitle = keywords.some((kw) => titleLower.includes(kw));

    if (!hasKeywordInTitle) {
      keywordIssues.push("Primary keyword not in title");
      suggestions.push("Include primary keyword in title");
    }
  }

  // Calculate scores
  let technicalScore = 100;
  technicalScore -= missingMetaTags.length * 10;
  technicalScore -= missingAltText.length * 5;
  technicalScore = Math.max(0, technicalScore);

  let contentScore = 100;
  contentScore -= keywordIssues.length * 15;
  contentScore = Math.max(0, contentScore);

  const overallScore = Math.round((technicalScore + contentScore) / 2);

  const result: SEOAuditResult = {
    overallScore,
    technicalScore,
    contentScore,
    mobileFriendly: true, // Assume responsive design
    missingMetaTags,
    brokenLinks: [], // Would need link checker
    missingAltText,
    keywordIssues,
    suggestions,
  };

  // Save audit to database
  await prisma.sEOAudit.create({
    data: {
      id: crypto.randomUUID(),
      postId,
      url: `/blog/${post.slug}`,
      overallScore,
      technicalScore,
      contentScore,
      mobileFriendly: true,
      missingMetaTags: JSON.stringify(missingMetaTags),
      brokenLinks: JSON.stringify([]),
      missingAltText: JSON.stringify(missingAltText),
      keywordIssues: JSON.stringify(keywordIssues),
      suggestions: JSON.stringify(suggestions),
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  return result;
}

/**
 * Generate structured data (JSON-LD) for a blog post
 */
export function generateStructuredData(post: any, baseUrl: string = "https://advanciapay.com") {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.seoDescription,
    image: post.media?.[0]?.cdnUrl || post.media?.[0]?.url,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() || post.author.email,
    },
    publisher: {
      "@type": "Organization",
      name: "Advancia Platform",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`,
    },
  };

  return structuredData;
}

/**
 * Auto-optimize SEO fields for a blog post using AI
 * This would integrate with your existing AI generator
 */
export async function autoOptimizeSEO(postId: string, aiModel: string = "gpt-4") {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Extract first 500 chars for AI context
  const contentPreview = post.contentMarkdown.substring(0, 500);

  // Generate SEO suggestions using AI
  // This would call your existing /api/ai/generate endpoint
  const suggestions = {
    seoTitle: post.title, // Would be AI-generated
    seoDescription: post.excerpt || contentPreview.substring(0, 160),
    seoKeywords: "", // Would be AI-generated
    structuredData: generateStructuredData(post),
  };

  return suggestions;
}

/**
 * Get latest sitemap
 */
export async function getLatestSitemap() {
  const sitemap = await prisma.sitemap.findFirst({
    where: { generated: true },
    orderBy: { generatedAt: "desc" },
  });

  if (!sitemap) {
    return null;
  }

  return {
    ...sitemap,
    urls: JSON.parse(sitemap.urls),
  };
}

/**
 * Get SEO audit history for a post
 */
export async function getPostAuditHistory(postId: string) {
  const audits = await prisma.sEOAudit.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return audits.map((audit) => ({
    ...audit,
    missingMetaTags: JSON.parse(audit.missingMetaTags || "[]"),
    brokenLinks: JSON.parse(audit.brokenLinks || "[]"),
    missingAltText: JSON.parse(audit.missingAltText || "[]"),
    keywordIssues: JSON.parse(audit.keywordIssues || "[]"),
    suggestions: JSON.parse(audit.suggestions || "[]"),
  }));
}

export default {
  generateSitemap,
  generateSitemapXML,
  auditBlogPost,
  generateStructuredData,
  autoOptimizeSEO,
  getLatestSitemap,
  getPostAuditHistory,
};
