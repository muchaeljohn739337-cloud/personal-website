import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getVectorMemory, searchMemory, storeMemory } from '@/lib/agents/memory';

// POST - Store a new memory
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, memoryType, tags, importance, expiresInDays } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const id = await storeMemory(content, {
      memoryType,
      tags,
      userId: session.user.id,
      importance,
      expiresInDays,
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error storing memory:', error);
    return NextResponse.json({ error: 'Failed to store memory' }, { status: 500 });
  }
}

// GET - Search memories
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const action = searchParams.get('action');

    // Get stats
    if (action === 'stats') {
      const memory = getVectorMemory();
      const stats = memory.getStats();
      return NextResponse.json(stats);
    }

    // Search memories
    if (query) {
      const memoryType = searchParams.get('type') as
        | 'conversation'
        | 'task'
        | 'knowledge'
        | 'preference'
        | 'context'
        | undefined;
      const limit = parseInt(searchParams.get('limit') || '10');

      const results = await searchMemory(query, {
        memoryType,
        userId: session.user.id,
        limit,
      });

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  } catch (error) {
    console.error('Error searching memory:', error);
    return NextResponse.json({ error: 'Failed to search memory' }, { status: 500 });
  }
}

// DELETE - Delete a memory
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll');

    const memory = getVectorMemory();

    if (clearAll === 'true') {
      const count = await memory.clearUserMemories(session.user.id);
      return NextResponse.json({ success: true, deleted: count });
    }

    if (id) {
      const deleted = await memory.delete(id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
