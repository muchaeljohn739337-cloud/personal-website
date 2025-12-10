import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getAdminAIAssistant } from '@/lib/admin/ai-assistant';

// GET /api/admin/ai-assistant - Get AI assistant status and tasks
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assistant = getAdminAIAssistant();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'tasks') {
      const tasks = assistant.getAdminTasks(session.user.id);
      return NextResponse.json({ success: true, tasks });
    }

    if (action === 'capabilities') {
      const capabilities = assistant.getCapabilities();
      return NextResponse.json({ success: true, capabilities });
    }

    if (action === 'status') {
      const taskId = searchParams.get('taskId');
      if (taskId) {
        const task = assistant.getTaskStatus(taskId);
        return NextResponse.json({ success: true, task });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin AI Assistant is ready',
      capabilities: assistant.getCapabilities(),
    });
  } catch (error) {
    console.error('Admin AI Assistant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/ai-assistant - Execute admin instruction
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { instruction, priority = 5, context, action } = body;

    const assistant = getAdminAIAssistant();

    if (action === 'execute') {
      if (!instruction) {
        return NextResponse.json({ error: 'Instruction is required' }, { status: 400 });
      }

      const result = await assistant.executeAdminInstruction(
        session.user.id,
        instruction,
        priority,
        context
      );

      return NextResponse.json(result);
    }

    if (action === 'cancel') {
      const { taskId } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
      }

      const cancelled = await assistant.cancelTask(taskId, session.user.id);
      return NextResponse.json({
        success: cancelled,
        message: cancelled ? 'Task cancelled' : 'Failed to cancel task',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin AI Assistant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
