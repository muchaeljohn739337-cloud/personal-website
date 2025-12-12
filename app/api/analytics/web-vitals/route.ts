import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics/web-vitals - Collect Web Vitals metrics
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { metric, value, id, timestamp } = body;

    // Log metrics (in production, send to analytics service)
    console.log('[Web Vitals]', {
      metric,
      value: Math.round(value),
      id,
      timestamp: new Date(timestamp).toISOString(),
      userAgent: req.headers.get('user-agent'),
      url: req.headers.get('referer'),
    });

    // In production, send to analytics service
    // await sendToAnalytics({ metric, value, id, timestamp });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording web vitals:', error);
    return NextResponse.json({ error: 'Failed to record metrics' }, { status: 500 });
  }
}
