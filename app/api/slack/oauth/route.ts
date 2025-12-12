/**
 * Slack OAuth Installation Route
 * Handles OAuth flow for installing Slack app to workspace
 */

import { prisma } from '@/lib/prismaClient';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/slack/oauth/callback`;

/**
 * GET /api/slack/oauth
 * Initiates Slack OAuth flow
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SLACK_CLIENT_ID) {
      return NextResponse.json({ error: 'Slack not configured' }, { status: 500 });
    }

    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');

    const scopes = [
      'channels:read',
      'channels:write',
      'chat:write',
      'chat:write.public',
      'users:read',
      'users:read.email',
      'im:write',
      'im:read',
      'groups:read',
      'groups:write',
    ].join(',');

    const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${state}`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('[Slack OAuth] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/slack/oauth
 * Stores Slack installation after OAuth callback
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // Verify state
    let userId: string;
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = decodedState.userId;

      if (userId !== session.user.id) {
        return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID || '',
        client_secret: SLACK_CLIENT_SECRET || '',
        code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok || !tokenData.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token', details: tokenData.error },
        { status: 400 }
      );
    }

    // Store integration in database
    await prisma.integration.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'slack',
        },
      },
      create: {
        userId,
        provider: 'slack',
        name: 'Slack',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        config: {
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
          botUserId: tokenData.bot_user_id,
          authedUser: tokenData.authed_user?.id,
        },
        scopes: tokenData.scope?.split(',') || [],
        isActive: true,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        config: {
          teamId: tokenData.team?.id,
          teamName: tokenData.team?.name,
          botUserId: tokenData.bot_user_id,
          authedUser: tokenData.authed_user?.id,
        },
        scopes: tokenData.scope?.split(',') || [],
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, team: tokenData.team });
  } catch (error) {
    console.error('[Slack OAuth] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
