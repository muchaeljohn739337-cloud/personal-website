import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getEmailWorkerSystem } from '@/lib/email/workers';

// GET /api/email/workers - Get email workers status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workerSystem = getEmailWorkerSystem();
    const workers = workerSystem.getWorkersStatus();
    const queueStatus = workerSystem.getQueueStatus();

    return NextResponse.json({
      success: true,
      workers,
      queue: queueStatus,
      summary: {
        totalWorkers: workers.length,
        activeWorkers: workers.filter((w) => w.status === 'active' || w.status === 'processing')
          .length,
        idleWorkers: workers.filter((w) => w.status === 'idle').length,
        totalProcessed: workers.reduce((sum, w) => sum + w.processedCount, 0),
        totalErrors: workers.reduce((sum, w) => sum + w.errorCount, 0),
      },
    });
  } catch (error) {
    console.error('Email workers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
