import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getOrchestrator } from '@/lib/agents/orchestrator';
import { getAllAgentTypes, getAgentConfig, getWorkerAgents } from '@/lib/agents/config';

// POST - Submit a new task
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task, context = {}, priority = 5 } = body;

    if (!task) {
      return NextResponse.json({ error: 'Task is required' }, { status: 400 });
    }

    const orchestrator = getOrchestrator();
    const taskId = await orchestrator.submitTask(task, context, session.user.id, priority);

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Task submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({ error: 'Failed to submit task' }, { status: 500 });
  }
}

// GET - Get task status or list agents
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const taskId = searchParams.get('taskId');

    // Get task status
    if (action === 'status' && taskId) {
      const orchestrator = getOrchestrator();
      const status = orchestrator.getTaskStatus(taskId);
      return NextResponse.json(status);
    }

    // List all agents
    if (action === 'agents') {
      const agents = getAllAgentTypes().map((type) => {
        const config = getAgentConfig(type);
        return {
          type,
          name: config.name,
          description: config.description,
          capabilities: config.capabilities,
        };
      });
      return NextResponse.json({ agents });
    }

    // List worker agents only
    if (action === 'workers') {
      const workers = getWorkerAgents().map((type) => {
        const config = getAgentConfig(type);
        return {
          type,
          name: config.name,
          description: config.description,
          capabilities: config.capabilities,
        };
      });
      return NextResponse.json({ workers });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in agents API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
