/**
 * Prometheus Metrics API
 * HTTP endpoint that returns Prometheus metrics
 */

import { NextRequest, NextResponse } from 'next/server';

import { getPrometheusMetrics } from '@/lib/monitoring/prometheus-exporter';

/**
 * GET /api/metrics - Returns Prometheus metrics
 *
 * This endpoint can be scraped by Prometheus server.
 * In production, you may want to add authentication.
 */
export async function GET(_req: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.METRICS_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const metrics = await getPrometheusMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (error) {
    console.error('[API] Error generating metrics:', error);
    return NextResponse.json({ error: 'Failed to generate metrics' }, { status: 500 });
  }
}
