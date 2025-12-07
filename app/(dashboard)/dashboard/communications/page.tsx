'use client';

import {
  Bot,
  Clock,
  Loader2,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Plus,
  Power,
  RefreshCw,
  Settings,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VirtualNumber {
  id: string;
  number: string;
  country: string;
  type: string;
  status: string;
  expiresAt: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  receivedAt: string;
  aiResponse?: string;
}

interface Call {
  id: string;
  from: string;
  to: string;
  startedAt: string;
  duration?: number;
  status: string;
  aiHandled: boolean;
}

interface Stats {
  totalCalls: number;
  totalMessages: number;
  aiHandledCalls: number;
  aiHandledMessages: number;
  avgCallDuration: number;
  activeNumbers: number;
}

interface Settings {
  aiAnsweringEnabled: boolean;
  businessHoursOnly: boolean;
  configured: boolean;
}

export default function CommunicationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [numbers, setNumbers] = useState<VirtualNumber[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/communications');
      const data = await res.json();
      setStats(data.stats);
      setSettings(data.settings);
      setNumbers(data.activeNumbers || []);
      setMessages(data.recentMessages || []);
      setCalls(data.recentCalls || []);
    } catch (error) {
      console.error('Failed to fetch communications data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleAI = async () => {
    setToggling(true);
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-ai' }),
      });
      const data = await res.json();
      if (data.success && settings) {
        setSettings({ ...settings, aiAnsweringEnabled: data.aiAnsweringEnabled });
      }
    } catch (error) {
      console.error('Failed to toggle AI:', error);
    } finally {
      setToggling(false);
    }
  };

  const toggleBusinessHours = async () => {
    setToggling(true);
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-business-hours' }),
      });
      const data = await res.json();
      if (data.success && settings) {
        setSettings({ ...settings, businessHoursOnly: data.businessHoursOnly });
      }
    } catch (error) {
      console.error('Failed to toggle business hours:', error);
    } finally {
      setToggling(false);
    }
  };

  const rentNumber = async () => {
    try {
      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rent-number', country: 'US', type: 'both' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to rent number:', error);
    }
  };

  const releaseNumber = async (numberId: string) => {
    if (!confirm('Release this number?')) return;
    try {
      await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release-number', numberId }),
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to release number:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <Phone className="h-8 w-8 text-green-500" />
            Communications
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage calls, SMS, and AI answering
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* AI Control Panel */}
      <Card className="border-2 border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-500" />
            AI Answering Control
          </CardTitle>
          <CardDescription>Toggle AI agents to answer calls and messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Main AI Toggle */}
            <button
              onClick={toggleAI}
              disabled={toggling}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                settings?.aiAnsweringEnabled
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-red-500 bg-red-500/10'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  settings?.aiAnsweringEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {settings?.aiAnsweringEnabled ? (
                  <Power className="h-6 w-6 text-white" />
                ) : (
                  <PhoneOff className="h-6 w-6 text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white">
                  AI Answering: {settings?.aiAnsweringEnabled ? 'ON' : 'OFF'}
                </p>
                <p className="text-sm text-slate-500">
                  {settings?.aiAnsweringEnabled
                    ? 'AI agents are answering calls'
                    : 'Calls go to voicemail'}
                </p>
              </div>
            </button>

            {/* Business Hours Toggle */}
            <button
              onClick={toggleBusinessHours}
              disabled={toggling}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                settings?.businessHoursOnly
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-800'
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  settings?.businessHoursOnly ? 'bg-amber-500' : 'bg-slate-400'
                }`}
              >
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-900 dark:text-white">
                  Business Hours: {settings?.businessHoursOnly ? 'ON' : 'OFF'}
                </p>
                <p className="text-sm text-slate-500">
                  {settings?.businessHoursOnly ? 'Mon-Fri 9AM-6PM only' : 'Answer 24/7'}
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <PhoneCall className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalCalls || 0}</p>
                <p className="text-sm text-slate-500">Total Calls</p>
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
                <p className="text-2xl font-bold">{stats?.aiHandledCalls || 0}</p>
                <p className="text-sm text-slate-500">AI Handled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
                <p className="text-sm text-slate-500">Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.avgCallDuration ? formatDuration(stats.avgCallDuration) : '0:00'}
                </p>
                <p className="text-sm text-slate-500">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Virtual Numbers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  Business Numbers
                </CardTitle>
                <CardDescription>Your virtual phone numbers</CardDescription>
              </div>
              <Button onClick={rentNumber} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Number
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {numbers.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <Phone className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2">No active numbers</p>
                <Button onClick={rentNumber} className="mt-4" variant="outline">
                  Get Your First Number
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {numbers.map((num) => (
                  <div
                    key={num.id}
                    className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700"
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        {num.number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {num.country} • {num.type} • {num.status}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => releaseNumber(num.id)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-blue-500" />
              Recent Calls
            </CardTitle>
            <CardDescription>Latest incoming calls</CardDescription>
          </CardHeader>
          <CardContent>
            {calls.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <PhoneMissed className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2">No calls yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          call.aiHandled ? 'bg-green-100' : 'bg-slate-100'
                        }`}
                      >
                        {call.aiHandled ? (
                          <Bot className="h-4 w-4 text-green-600" />
                        ) : (
                          <Phone className="h-4 w-4 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{call.from}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(call.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          call.status === 'ended'
                            ? 'bg-green-100 text-green-700'
                            : call.status === 'missed'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {call.status}
                      </span>
                      {call.duration && (
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDuration(call.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-500" />
            Recent Messages
          </CardTitle>
          <CardDescription>Latest SMS conversations</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border p-4 dark:border-slate-700">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">{msg.from}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(msg.receivedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mb-2 text-slate-600 dark:text-slate-300">{msg.body}</p>
                  {msg.aiResponse && (
                    <div className="mt-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                      <p className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                        <Bot className="h-3 w-3" /> AI Response
                      </p>
                      <p className="mt-1 text-sm text-green-800 dark:text-green-300">
                        {msg.aiResponse}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Notice */}
      {!settings?.configured && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-4 p-4">
            <Settings className="h-8 w-8 text-amber-500" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                SMS Pool Not Configured
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Add your SMS Pool API key to enable real phone numbers:
              </p>
              <code className="mt-2 block rounded bg-amber-100 p-2 text-xs dark:bg-amber-900/50">
                SMSPOOL_API_KEY=your-api-key
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
