import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// GET - List user's automations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const automations = await prisma.$queryRaw`
      SELECT * FROM automations
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ automations });
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

// POST - Create a new automation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, triggerType, triggerConfig, actions } = body;

    if (!name || !triggerType || !triggerConfig || !actions) {
      return NextResponse.json(
        { error: 'Name, trigger type, trigger config, and actions are required' },
        { status: 400 }
      );
    }

    const id = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.$executeRaw`
      INSERT INTO automations (id, name, description, trigger_type, trigger_config, actions, user_id, is_active, run_count, created_at, updated_at)
      VALUES (
        ${id},
        ${name},
        ${description || ''},
        ${triggerType},
        ${JSON.stringify(triggerConfig)}::jsonb,
        ${JSON.stringify(actions)}::jsonb,
        ${session.user.id},
        true,
        0,
        NOW(),
        NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      automation: { id, name, triggerType, isActive: true },
    });
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 });
  }
}

// PUT - Update automation
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, triggerConfig, actions, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.$executeRaw`
      UPDATE automations
      SET 
        name = COALESCE(${name}, name),
        description = COALESCE(${description}, description),
        trigger_config = COALESCE(${triggerConfig ? JSON.stringify(triggerConfig) : null}::jsonb, trigger_config),
        actions = COALESCE(${actions ? JSON.stringify(actions) : null}::jsonb, actions),
        is_active = COALESCE(${isActive}, is_active),
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
  }
}

// DELETE - Delete automation
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM automations WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'Failed to delete automation' }, { status: 500 });
  }
}
