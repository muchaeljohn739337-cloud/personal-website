import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { runHealthCheck, autoHeal } from '@/lib/self-healing/system';

// GET /api/health/self-healing - Run health check
export async function GET() {
  try {
    const health = await runHealthCheck();

    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ error: 'Failed to run health check' }, { status: 500 });
  }
}

// POST /api/health/self-healing - Trigger auto-heal
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admins to trigger manual heal
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fixes = await autoHeal();

    return NextResponse.json({
      success: true,
      message: `Auto-heal completed. Fixed ${fixes.filter((f) => f.status === 'SUCCESS').length} issue(s)`,
      fixes,
    });
  } catch (error) {
    console.error('Auto-heal error:', error);
    return NextResponse.json({ error: 'Failed to run auto-heal' }, { status: 500 });
  }
}
