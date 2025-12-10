import { NextResponse } from 'next/server';

import {
  getGlobalAIEnabled,
  getLiveChat,
  getManualModeEnabled,
  setGlobalAIEnabled,
  setManualModeEnabled,
} from '@/lib/support/live-chat';

// GET - Get chat data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('sessionId');

    const liveChat = getLiveChat();

    switch (action) {
      case 'session': {
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }
        const session = liveChat.getSession(sessionId);
        return NextResponse.json({ session });
      }

      case 'sessions': {
        return NextResponse.json({ sessions: liveChat.getSessions() });
      }

      case 'notifications': {
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        return NextResponse.json({ notifications: liveChat.getNotifications(unreadOnly) });
      }

      case 'visitors': {
        return NextResponse.json({ visitors: liveChat.getVisitors() });
      }

      case 'stats': {
        return NextResponse.json({ stats: liveChat.getStats() });
      }

      case 'settings': {
        return NextResponse.json({
          aiEnabled: getGlobalAIEnabled(),
          manualMode: getManualModeEnabled(),
        });
      }

      default: {
        // Return overview for admin
        return NextResponse.json({
          stats: liveChat.getStats(),
          sessions: liveChat.getSessions().slice(0, 10),
          notifications: liveChat.getNotifications().slice(0, 20),
          visitors: liveChat.getVisitors().slice(0, 10),
          settings: {
            aiEnabled: getGlobalAIEnabled(),
            manualMode: getManualModeEnabled(),
          },
        });
      }
    }
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Chat actions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const liveChat = getLiveChat();

    switch (action) {
      case 'start-session': {
        const { visitorInfo } = body;
        const session = liveChat.createSession(visitorInfo || {});
        return NextResponse.json({ success: true, session });
      }

      case 'send-message': {
        const { sessionId, content, visitorName } = body;
        if (!sessionId || !content) {
          return NextResponse.json({ error: 'Session ID and content required' }, { status: 400 });
        }
        const response = await liveChat.processMessage(sessionId, content, visitorName);
        return NextResponse.json({ success: true, message: response });
      }

      case 'admin-reply': {
        const { sessionId, content, adminId } = body;
        if (!sessionId || !content) {
          return NextResponse.json({ error: 'Session ID and content required' }, { status: 400 });
        }
        const message = liveChat.sendAdminResponse(sessionId, content, adminId || 'admin');
        return NextResponse.json({ success: true, message });
      }

      case 'track-visitor': {
        const { visitorInfo } = body;
        liveChat.trackVisitor(visitorInfo);
        return NextResponse.json({ success: true });
      }

      case 'toggle-ai': {
        const newState = !getGlobalAIEnabled();
        setGlobalAIEnabled(newState);
        return NextResponse.json({ success: true, aiEnabled: newState });
      }

      case 'toggle-manual': {
        const newState = !getManualModeEnabled();
        setManualModeEnabled(newState);
        return NextResponse.json({ success: true, manualMode: newState });
      }

      case 'set-ai-mode': {
        setGlobalAIEnabled(body.enabled);
        setManualModeEnabled(!body.enabled);
        return NextResponse.json({
          success: true,
          aiEnabled: body.enabled,
          manualMode: !body.enabled,
        });
      }

      case 'mark-read': {
        const { notificationId } = body;
        if (notificationId) {
          liveChat.markNotificationRead(notificationId);
        } else {
          liveChat.markAllNotificationsRead();
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
