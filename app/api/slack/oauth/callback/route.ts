/**
 * Slack OAuth Callback Route
 * Handles the callback from Slack OAuth flow
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/integrations/slack?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/integrations/slack?error=missing_params', request.url)
    );
  }

  try {
    // Call the POST endpoint to complete OAuth
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/slack/oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations/slack?error=${encodeURIComponent(errorData.error || 'oauth_failed')}`,
          request.url
        )
      );
    }

    return NextResponse.redirect(
      new URL('/dashboard/integrations/slack?success=true', request.url)
    );
  } catch (error) {
    console.error('[Slack OAuth Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/integrations/slack?error=internal_error', request.url)
    );
  }
}
