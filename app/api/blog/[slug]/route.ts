import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/blog/[slug]
 * Get single blog post by slug
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { getPostBySlug } = await import('@/lib/content/blog');
    const post = await getPostBySlug(params.slug);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

/**
 * PUT /api/blog/[slug]
 * Update blog post (requires authentication)
 */
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Get post ID from slug first
    const { getPostBySlug, updatePost } = await import('@/lib/content/blog');
    const existingPost = await getPostBySlug(params.slug);

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = await updatePost(existingPost.id, body, session.user.id);

    if (!post) {
      return NextResponse.json({ error: 'Unauthorized or post not found' }, { status: 403 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

/**
 * DELETE /api/blog/[slug]
 * Delete blog post (requires authentication)
 */
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { getPostBySlug, deletePost } = await import('@/lib/content/blog');
    const existingPost = await getPostBySlug(params.slug);

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const deleted = await deletePost(existingPost.id, session.user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Unauthorized or post not found' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
