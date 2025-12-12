/**
 * Blog Service
 * Handles all blog/CMS operations including CRUD, publishing workflow, and AI integration
 */

import crypto from "crypto";
import prisma from "../prismaClient";

export interface CreateBlogPostInput {
  title: string;
  excerpt?: string;
  contentMarkdown: string;
  authorId: string;
  categoryId?: string;
  tags?: string;
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledFor?: Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  aiGenerated?: boolean;
  aiModel?: string;
  aiPrompt?: string;
  aiJobId?: string;
}

export interface UpdateBlogPostInput {
  title?: string;
  excerpt?: string;
  contentMarkdown?: string;
  categoryId?: string;
  tags?: string;
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledFor?: Date;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface BlogPostFilters {
  status?: string;
  categoryId?: string;
  authorId?: string;
  featured?: boolean;
  search?: string;
  tags?: string;
}

/**
 * Generate URL-safe slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/**
 * Ensure unique slug by appending random suffix if needed
 */
async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < 10) {
    const existing = await prisma.blogPost.findFirst({
      where: {
        slug,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (!existing) {
      return slug;
    }

    // Append random suffix
    const suffix = crypto.randomBytes(3).toString("hex");
    slug = `${baseSlug}-${suffix}`;
    attempt++;
  }

  // Fallback: use UUID
  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Convert Markdown to HTML (basic implementation)
 * In production, use a library like marked or remark
 */
function markdownToHtml(markdown: string): string {
  // Basic conversion - in production use marked or remark
  let html = markdown;

  // Headers
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*(.*?)\*/gim, "<em>$1</em>");

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');

  // Paragraphs
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;

  return html;
}

/**
 * Calculate estimated read time in minutes
 */
function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Create a new blog post
 */
export async function createBlogPost(input: CreateBlogPostInput) {
  const slug = await ensureUniqueSlug(generateSlug(input.title));
  const contentHtml = markdownToHtml(input.contentMarkdown);
  const readTimeMinutes = calculateReadTime(input.contentMarkdown);

  const post = await prisma.blogPost.create({
    data: {
      id: crypto.randomUUID(),
      title: input.title,
      slug,
      excerpt: input.excerpt,
      contentMarkdown: input.contentMarkdown,
      contentHtml,
      authorId: input.authorId,
      categoryId: input.categoryId,
      tags: input.tags,
      status: input.status || "DRAFT",
      scheduledFor: input.scheduledFor,
      seoTitle: input.seoTitle || input.title,
      seoDescription: input.seoDescription || input.excerpt,
      seoKeywords: input.seoKeywords,
      readTimeMinutes,
      aiGenerated: input.aiGenerated || false,
      aiModel: input.aiModel,
      aiPrompt: input.aiPrompt,
      aiJobId: input.aiJobId,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      category: true,
    },
  });

  return post;
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
  const updateData: any = { ...input };

  if (input.title) {
    const slug = await ensureUniqueSlug(generateSlug(input.title), id);
    updateData.slug = slug;
  }

  if (input.contentMarkdown) {
    updateData.contentHtml = markdownToHtml(input.contentMarkdown);
    updateData.readTimeMinutes = calculateReadTime(input.contentMarkdown);
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      category: true,
    },
  });

  return post;
}

/**
 * Publish a blog post
 */
export async function publishBlogPost(id: string, userId: string) {
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      category: true,
      media: true,
    },
  });

  // Emit Socket.IO event for real-time notification
  // This will be called from the route handler

  return post;
}

/**
 * Get a single blog post by ID or slug
 */
export async function getBlogPost(idOrSlug: string, incrementView: boolean = false) {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const post = await prisma.blogPost.findFirst({
    where: isUUID ? { id: idOrSlug } : { slug: idOrSlug },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      category: true,
      media: true,
      comments: {
        where: { status: "APPROVED" },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post) {
    return null;
  }

  // Increment view count
  if (incrementView) {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return post;
}

/**
 * List blog posts with filters and pagination
 */
export async function listBlogPosts(filters: BlogPostFilters = {}, page: number = 1, limit: number = 20) {
  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { excerpt: { contains: filters.search, mode: "insensitive" } },
      { contentMarkdown: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.tags) {
    where.tags = { contains: filters.tags };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string) {
  await prisma.blogPost.delete({
    where: { id },
  });
}

/**
 * Create a blog category
 */
export async function createBlogCategory(
  name: string,
  description?: string,
  parentId?: string,
  seoTitle?: string,
  seoDescription?: string
) {
  const slug = generateSlug(name);

  const category = await prisma.blogCategory.create({
    data: {
      id: crypto.randomUUID(),
      name,
      slug,
      description,
      parentId,
      seoTitle,
      seoDescription,
    },
  });

  return category;
}

/**
 * List blog categories
 */
export async function listBlogCategories() {
  const categories = await prisma.blogCategory.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories;
}

/**
 * Create a blog comment
 */
export async function createBlogComment(
  postId: string,
  content: string,
  authorId?: string,
  authorName?: string,
  authorEmail?: string,
  parentId?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const comment = await prisma.blogComment.create({
    data: {
      id: crypto.randomUUID(),
      postId,
      content,
      authorId,
      authorName: authorName || "Anonymous",
      authorEmail,
      parentId,
      ipAddress,
      userAgent,
      status: "PENDING", // Require approval
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return comment;
}

/**
 * Approve a blog comment
 */
export async function approveBlogComment(commentId: string, approvedBy: string) {
  const comment = await prisma.blogComment.update({
    where: { id: commentId },
    data: {
      status: "APPROVED",
      approved: true,
      approvedBy,
      approvedAt: new Date(),
    },
  });

  return comment;
}

/**
 * List comments for a post (admin view)
 */
export async function listBlogComments(postId?: string, status?: string, page: number = 1, limit: number = 50) {
  const where: any = {};

  if (postId) {
    where.postId = postId;
  }

  if (status) {
    where.status = status;
  }

  const [comments, total] = await Promise.all([
    prisma.blogComment.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogComment.count({ where }),
  ]);

  return {
    comments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export default {
  createBlogPost,
  updateBlogPost,
  publishBlogPost,
  getBlogPost,
  listBlogPosts,
  deleteBlogPost,
  createBlogCategory,
  listBlogCategories,
  createBlogComment,
  approveBlogComment,
  listBlogComments,
};
