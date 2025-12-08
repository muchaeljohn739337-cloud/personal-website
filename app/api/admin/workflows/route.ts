/**
 * Workflow Management API
 * Admin endpoint for managing automated workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';
import {
  executeWorkflow,
  getAllWorkflows,
  getWorkflow,
  getWorkflowRun,
  triggerWorkflowByEvent,
} from '@/lib/automation/workflows';

async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { error: 'Admin access required', status: 403 };
  }

  return { userId: session.user.id };
}

// GET - List workflows or get specific workflow/run
export async function GET(req: NextRequest) {
  const auth = await checkAdminAccess();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get('id');
  const runId = searchParams.get('runId');

  try {
    // Get specific run
    if (runId) {
      const run = getWorkflowRun(runId);
      if (!run) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }
      return NextResponse.json({ run });
    }

    // Get specific workflow
    if (workflowId) {
      const workflow = getWorkflow(workflowId);
      if (!workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      return NextResponse.json({ workflow });
    }

    // List all workflows
    const workflows = getAllWorkflows();
    return NextResponse.json({
      workflows,
      summary: {
        total: workflows.length,
        enabled: workflows.filter((w) => w.enabled).length,
        totalRuns: workflows.reduce((sum, w) => sum + w.runCount, 0),
        successRate: calculateSuccessRate(workflows),
      },
    });
  } catch (error) {
    console.error('[Workflows API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

// POST - Execute workflow or trigger event
export async function POST(req: NextRequest) {
  const auth = await checkAdminAccess();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, workflowId, event, data } = body;

    switch (action) {
      case 'execute': {
        if (!workflowId) {
          return NextResponse.json({ error: 'workflowId required' }, { status: 400 });
        }
        const runId = await executeWorkflow(workflowId, data || {});
        return NextResponse.json({
          success: true,
          message: 'Workflow started',
          runId,
        });
      }

      case 'trigger': {
        if (!event) {
          return NextResponse.json({ error: 'event required' }, { status: 400 });
        }
        triggerWorkflowByEvent(event, data || {});
        return NextResponse.json({
          success: true,
          message: `Event triggered: ${event}`,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Workflows API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Execution failed' },
      { status: 500 }
    );
  }
}

function calculateSuccessRate(workflows: ReturnType<typeof getAllWorkflows>): string {
  const totalRuns = workflows.reduce((sum, w) => sum + w.runCount, 0);
  const successRuns = workflows.reduce((sum, w) => sum + w.successCount, 0);
  if (totalRuns === 0) return '0%';
  return `${((successRuns / totalRuns) * 100).toFixed(1)}%`;
}
