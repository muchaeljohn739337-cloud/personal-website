'use client';

import {
  Bell,
  Bot,
  Check,
  CheckCircle,
  Clock,
  Eye,
  Globe,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  User,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatSession {
  id: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorCountry?: string;
  visitorPage?: string;
  startedAt: string;
  lastActivity: string;
  status: string;
  messages: ChatMessage[];
  aiEnabled: boolean;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  isAI: boolean;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Visitor {
  id: string;
  country?: string;
  currentPage: string;
  visitedAt: string;
}

interface PendingUser {
  id: string;
  email: string;
  name?: string;
  registeredAt: string;
  status: string;
}

interface Stats {
  activeSessions: number;
  waitingSessions: number;
  totalMessages: number;
  aiResponses: number;
  manualResponses: number;
  activeVisitors: number;
  unreadNotifications: number;
}

interface Settings {
  aiEnabled: boolean;
  manualMode: boolean;
}

export default function SupportDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [chatRes, usersRes] = await Promise.all([
        fetch('/api/support/chat'),
        fetch('/api/admin/users/approval'),
      ]);

      const chatData = await chatRes.json();
      const usersData = await usersRes.json();

      setStats(chatData.stats);
      setSettings(chatData.settings);
      setSessions(chatData.sessions || []);
      setNotifications(chatData.notifications || []);
      setVisitors(chatData.visitors || []);
      setPendingUsers(usersData.pending || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleAIMode = async () => {
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-ai-mode', enabled: !settings?.aiEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings({ aiEnabled: data.aiEnabled, manualMode: data.manualMode });
      }
    } catch (error) {
      console.error('Failed to toggle AI:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedSession || !replyText.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-reply',
          sessionId: selectedSession.id,
          content: replyText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        await fetchData();
        // Refresh selected session
        const updated = sessions.find((s) => s.id === selectedSession.id);
        if (updated) setSelectedSession(updated);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await fetch('/api/admin/users/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', userId }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const rejectUser = async (userId: string) => {
    const reason = prompt('Rejection reason (optional):');
    try {
      await fetch('/api/admin/users/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', userId, reason }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to reject user:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-read' }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <MessageSquare className="h-8 w-8 text-purple-500" />
            Support Console
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage live chat, user approvals, and notifications
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* AI Mode Control */}
      <Card className="border-2 border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleAIMode}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                  settings?.aiEnabled
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-orange-500 bg-orange-500/10'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    settings?.aiEnabled ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                >
                  {settings?.aiEnabled ? (
                    <Bot className="h-6 w-6 text-white" />
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {settings?.aiEnabled ? 'AI Mode: ON' : 'Manual Mode: ON'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {settings?.aiEnabled ? 'AI is responding to chats' : 'You must reply manually'}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
                <span>{stats?.activeSessions || 0} active chats</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span>{stats?.waitingSessions || 0} waiting</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
                <p className="text-sm text-slate-500">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Bot className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.aiResponses || 0}</p>
                <p className="text-sm text-slate-500">AI Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeVisitors || 0}</p>
                <p className="text-sm text-slate-500">Active Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.unreadNotifications || 0}</p>
                <p className="text-sm text-slate-500">Unread Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending User Approvals */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Pending Approvals
            </CardTitle>
            <CardDescription>Users waiting for account approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle className="mx-auto h-12 w-12 text-green-300" />
                <p className="mt-2">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="rounded-lg border p-3 dark:border-slate-700">
                    <div className="mb-2">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {user.name || 'New User'}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(user.registeredAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveUser(user.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectUser(user.id)}
                        className="flex-1 text-red-500 hover:bg-red-50"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Sessions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Live Chats
            </CardTitle>
            <CardDescription>Active chat sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Session List */}
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-2">No active chats</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        selectedSession?.id === session.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{session.visitorName || 'Visitor'}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            session.status === 'waiting'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {session.messages[session.messages.length - 1]?.content || 'No messages'}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <Globe className="h-3 w-3" />
                        {session.visitorCountry || 'Unknown'}
                        <Clock className="ml-2 h-3 w-3" />
                        {new Date(session.lastActivity).toLocaleTimeString()}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Chat View */}
              <div className="rounded-lg border dark:border-slate-700">
                {selectedSession ? (
                  <div className="flex h-80 flex-col">
                    {/* Chat Header */}
                    <div className="border-b p-3 dark:border-slate-700">
                      <p className="font-medium">{selectedSession.visitorName || 'Visitor'}</p>
                      <p className="text-xs text-slate-500">
                        {selectedSession.visitorCountry} • {selectedSession.visitorPage}
                      </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-2 overflow-y-auto p-3">
                      {selectedSession.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === 'user'
                                ? 'bg-slate-100 dark:bg-slate-800'
                                : msg.isAI
                                  ? 'bg-green-100 text-green-900'
                                  : 'bg-purple-100 text-purple-900'
                            }`}
                          >
                            {msg.isAI && (
                              <span className="mb-1 flex items-center gap-1 text-xs opacity-70">
                                <Bot className="h-3 w-3" /> AI
                              </span>
                            )}
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input */}
                    <div className="border-t p-3 dark:border-slate-700">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                          placeholder="Type your reply..."
                          className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                        />
                        <Button onClick={sendReply} disabled={sending} size="sm">
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-80 items-center justify-center text-slate-500">
                    Select a chat to view
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications & Visitors */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-red-500" />
                  Notifications
                </CardTitle>
                <CardDescription>Real-time alerts</CardDescription>
              </div>
              <Button onClick={markAllRead} variant="outline" size="sm">
                Mark All Read
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-4 text-center text-slate-500">No notifications</p>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.id}
                    className={`rounded-lg border p-3 ${
                      notif.read
                        ? 'opacity-60 dark:border-slate-700'
                        : 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20'
                    }`}
                  >
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-slate-500">{notif.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Visitors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Active Visitors
            </CardTitle>
            <CardDescription>Users currently on the website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {visitors.length === 0 ? (
                <p className="py-4 text-center text-slate-500">No active visitors</p>
              ) : (
                visitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700"
                  >
                    <div>
                      <p className="text-sm font-medium">{visitor.currentPage}</p>
                      <p className="text-xs text-slate-500">
                        {visitor.country || 'Unknown location'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      <span className="text-xs text-slate-400">
                        {new Date(visitor.visitedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
