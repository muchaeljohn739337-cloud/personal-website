/**
 * Slack Webhook Route
 * Handles incoming webhooks from Slack
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

/**
 * Verify Slack request signature
 */
function verifySlackSignature(timestamp: string, body: string, signature: string): boolean {
  if (!SLACK_SIGNING_SECRET) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET);
  const [version, hash] = signature.split('=');

  if (version !== 'v0') {
    return false;
  }

  hmac.update(`${version}:${timestamp}:${body}`);
  const expectedSignature = hmac.digest('hex');

  // Prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedSignature));
}

/**
 * POST /api/slack/webhook
 * Handles Slack webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    const signature = request.headers.get('x-slack-signature') || '';

    // Verify timestamp is not too old (5 minutes)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
      return NextResponse.json({ error: 'Request timestamp too old' }, { status: 401 });
    }

    const body = await request.text();

    // Verify signature
    if (!verifySlackSignature(timestamp, body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Handle events
    if (payload.type === 'event_callback') {
      const event = payload.event;

      // Handle different event types
      switch (event.type) {
        case 'message':
          // Handle message events
          console.log('[Slack Webhook] Message event:', event);
          // Add your message handling logic here
          break;

        case 'app_mention':
          // Handle app mentions
          console.log('[Slack Webhook] App mention:', event);
          // Add your mention handling logic here
          break;

        default:
          console.log('[Slack Webhook] Unhandled event type:', event.type);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Slack Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
