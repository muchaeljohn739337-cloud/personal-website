/**
 * Blog & Content Management System
 * Handles posts, categories, search, and preview functionality
 */

import { prisma } from '@/lib/prismaClient';

// =============================================================================
// TYPES
// =============================================================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';
  publishedAt?: Date;
  scheduledAt?: Date;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  category?: Category;
  tags: { id: string; name: string; slug: string }[];
  readTime: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
}

export interface BlogSearchParams {
  query?: string;
  category?: string;
  tag?: string;
  status?: BlogPost['status'];
  authorId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'title';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// =============================================================================
// BLOG POST FUNCTIONS
// =============================================================================

/**
 * Get all published blog posts with pagination
 */
export async function getPublishedPosts(
  params: BlogSearchParams = {}
): Promise<PaginatedResult<BlogPost>> {
  const { query, category, tag, page = 1, limit = 10, sortBy = 'newest' } = params;

  const where: Record<string, unknown> = {
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() },
  };

  // Search query
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { excerpt: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Category filter
  if (category) {
    where.category = { slug: category };
  }

  // Tag filter
  if (tag) {
    where.tags = { some: { tag: { slug: tag } } };
  }

  // Sorting
  const orderBy: Record<string, string> = {};
  switch (sortBy) {
    case 'oldest':
      orderBy.publishedAt = 'asc';
      break;
    case 'popular':
      orderBy.viewCount = 'desc';
      break;
    case 'title':
      orderBy.title = 'asc';
      break;
    default:
      orderBy.publishedAt = 'desc';
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: posts.map(formatPost),
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Get single post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  if (!post) return null;

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return formatPost(post);
}

/**
 * Get post preview (for drafts)
 */
export async function getPostPreview(id: string, userId: string): Promise<BlogPost | null> {
  const post = await prisma.blogPost.findFirst({
    where: {
      id,
      authorId: userId,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  return post ? formatPost(post) : null;
}

/**
 * Create new blog post
 */
export async function createPost(
  data: {
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    categoryIds?: string[];
    tags?: string[];
    status?: BlogPost['status'];
    scheduledAt?: Date;
  },
  authorId: string
): Promise<BlogPost> {
  const slug = generateSlug(data.title);
  const readTime = calculateReadTime(data.content);
  const excerpt = data.excerpt || generateExcerpt(data.content);

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt,
      featuredImage: data.featuredImage,
      status: data.status || 'DRAFT',
      readingTime: readTime,
      authorId,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined,
      scheduledAt: data.scheduledAt,
      categoryId: data.categoryIds?.[0],
      tags: data.tags ? { create: data.tags.map((tagId) => ({ tagId })) } : undefined,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  return formatPost(post);
}

/**
 * Update blog post
 */
export async function updatePost(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    categoryIds: string[];
    tags: string[];
    status: BlogPost['status'];
    scheduledAt: Date;
  }>,
  userId: string
): Promise<BlogPost | null> {
  // Verify ownership
  const existing = await prisma.blogPost.findFirst({
    where: { id, authorId: userId },
  });

  if (!existing) return null;

  const updateData: Record<string, unknown> = { ...data };

  if (data.title) {
    updateData.slug = generateSlug(data.title);
  }

  if (data.content) {
    updateData.readTime = calculateReadTime(data.content);
    if (!data.excerpt) {
      updateData.excerpt = generateExcerpt(data.content);
    }
  }

  if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
  }

  if (data.categoryIds) {
    updateData.categoryId = data.categoryIds[0];
    delete updateData.categoryIds;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: updateData,
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  return formatPost(post);
}

/**
 * Delete blog post
 */
export async function deletePost(id: string, userId: string): Promise<boolean> {
  const post = await prisma.blogPost.findFirst({
    where: { id, authorId: userId },
  });

  if (!post) return false;

  await prisma.blogPost.delete({ where: { id } });
  return true;
}

/**
 * Get related posts
 */
export async function getRelatedPosts(postId: string, limit = 4): Promise<BlogPost[]> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: { category: true, tags: { include: { tag: true } } },
  });

  if (!post) return [];

  const tagIds = post.tags.map((t) => t.tagId);

  const related = await prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      OR: [
        ...(post.categoryId ? [{ categoryId: post.categoryId }] : []),
        ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    orderBy: { viewCount: 'desc' },
    take: limit,
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  return related.map(formatPost);
}

// =============================================================================
// CATEGORY FUNCTIONS
// =============================================================================

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  const categories = await prisma.blogCategory.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { name: 'asc' },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || undefined,
    color: c.color || undefined,
    postCount: c._count.posts,
  }));
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const category = await prisma.blogCategory.findUnique({
    where: { slug },
    include: {
      _count: { select: { posts: true } },
    },
  });

  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    color: category.color || undefined,
    postCount: category._count.posts,
  };
}

/**
 * Create category
 */
export async function createCategory(data: {
  name: string;
  description?: string;
  color?: string;
}): Promise<Category> {
  const slug = generateSlug(data.name);

  const category = await prisma.blogCategory.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      color: data.color,
    },
    include: {
      _count: { select: { posts: true } },
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    color: category.color || undefined,
    postCount: category._count.posts,
  };
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  data: Partial<{ name: string; description: string; color: string }>
): Promise<Category | null> {
  const updateData: Record<string, unknown> = { ...data };

  if (data.name) {
    updateData.slug = generateSlug(data.name);
  }

  const category = await prisma.blogCategory.update({
    where: { id },
    data: updateData,
    include: {
      _count: { select: { posts: true } },
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    color: category.color || undefined,
    postCount: category._count.posts,
  };
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  await prisma.blogCategory.delete({ where: { id } });
  return true;
}

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

/**
 * Full-text search across posts
 */
export async function searchPosts(
  query: string,
  options: { limit?: number; includeContent?: boolean } = {}
): Promise<BlogPost[]> {
  const { limit = 10, includeContent = false } = options;

  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { excerpt: { contains: query, mode: 'insensitive' as const } },
        ...(includeContent ? [{ content: { contains: query, mode: 'insensitive' as const } }] : []),
        { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' as const } } } } },
      ],
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: true,
      tags: { include: { tag: true } },
    },
  });

  return posts.map(formatPost);
}

/**
 * Get popular tags
 */
export async function getPopularTags(limit = 20): Promise<{ tag: string; count: number }[]> {
  const tags = await prisma.blogTag.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: {
      posts: { _count: 'desc' },
    },
    take: limit,
  });

  return tags.map((t) => ({
    tag: t.name,
    count: t._count.posts,
  }));
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate URL-friendly slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

/**
 * Calculate read time in minutes
 */
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Generate excerpt from content
 */
function generateExcerpt(content: string, maxLength = 160): string {
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '');
  // Truncate
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format post from database
 */
function formatPost(post: Record<string, unknown>): BlogPost {
  const tagsData = post.tags as
    | Array<{ tag: { id: string; name: string; slug: string } }>
    | undefined;
  const categoryData = post.category as Category | null | undefined;

  return {
    id: post.id as string,
    title: post.title as string,
    slug: post.slug as string,
    excerpt: (post.excerpt as string) || '',
    content: post.content as string,
    featuredImage: post.featuredImage as string | undefined,
    status: post.status as BlogPost['status'],
    publishedAt: post.publishedAt as Date | undefined,
    scheduledAt: post.scheduledAt as Date | undefined,
    author: post.author as BlogPost['author'],
    category: categoryData || undefined,
    tags: tagsData?.map((t) => t.tag) || [],
    readTime: (post.readingTime as number) || 0,
    viewCount: (post.viewCount as number) || 0,
    createdAt: post.createdAt as Date,
    updatedAt: post.updatedAt as Date,
  };
}
