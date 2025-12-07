import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPublishedPosts, searchPosts } from '@/lib/content/blog';

/**
 * GET /api/blog
 * Get published blog posts with pagination, filtering, and search
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy =
      (searchParams.get('sort') as 'newest' | 'oldest' | 'popular' | 'title') || 'newest';

    // If search query, use search function
    if (query && query.length >= 2) {
      const posts = await searchPosts(query, { limit });
      return NextResponse.json({ data: posts, total: posts.length });
    }

    // Otherwise, get paginated posts
    const result = await getPublishedPosts({
      query,
      category,
      tag,
      page,
      limit,
      sortBy,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

/**
 * POST /api/blog
 * Create new blog post (requires authentication)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, excerpt, featuredImage, categoryIds, tags, status, scheduledAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Import dynamically to avoid circular deps
    const { createPost } = await import('@/lib/content/blog');

    const post = await createPost(
      {
        title,
        content,
        excerpt,
        featuredImage,
        categoryIds,
        tags,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
      session.user.id
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
