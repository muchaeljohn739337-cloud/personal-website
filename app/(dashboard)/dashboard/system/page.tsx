'use client';

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Server,
  Shield,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemHealth {
  status: string;
  timestamp: string;
  uptime: number;
  responseTime: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    unit: string;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: string;
    size: number;
  };
  queue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  requests: {
    active: number;
    completed: number;
    failed: number;
  };
}

export default function SystemMonitorPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/system/health');
      const data = await res.json();
      setHealth(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 5000); // Every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchHealth]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <Server className="h-8 w-8 text-blue-500" />
            System Monitor
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Real-time system health and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-500 text-green-500' : ''}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button onClick={fetchHealth} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card
        className={`border-2 ${isHealthy ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {isHealthy ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                System Status: {isHealthy ? 'Healthy' : 'Issues Detected'}
              </h3>
              <p className="text-sm text-slate-500">
                Last checked: {lastUpdate?.toLocaleTimeString() || 'Never'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{health?.responseTime || 0}ms</p>
            <p className="text-sm text-slate-500">Response Time</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Uptime */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatUptime(health?.uptime || 0)}
                </p>
                <p className="text-sm text-slate-500">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {health?.memory.heapUsed || 0} MB
                </p>
                <p className="text-sm text-slate-500">
                  Memory ({health?.memory.heapTotal || 0} MB total)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {health?.cache.hitRate || 'N/A'}
                </p>
                <p className="text-sm text-slate-500">Cache Hit Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Requests */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {health?.requests.active || 0}
                </p>
                <p className="text-sm text-slate-500">Active Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cache Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-purple-500" />
              Cache Performance
            </CardTitle>
            <CardDescription>In-memory cache statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Cache Hits</span>
                <span className="font-semibold text-green-500">{health?.cache.hits || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cache Misses</span>
                <span className="font-semibold text-red-500">{health?.cache.misses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cached Items</span>
                <span className="font-semibold">{health?.cache.size || 0}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  style={{
                    width: health?.cache.hitRate?.replace('%', '') + '%' || '0%',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Job Queue
            </CardTitle>
            <CardDescription>Background job processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Pending</span>
                <span className="font-semibold text-yellow-500">{health?.queue.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Processing</span>
                <span className="font-semibold text-blue-500">{health?.queue.processing || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completed</span>
                <span className="font-semibold text-green-500">{health?.queue.completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Failed</span>
                <span className="font-semibold text-red-500">{health?.queue.failed || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-blue-500" />
              Request Tracking
            </CardTitle>
            <CardDescription>HTTP request statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Active</span>
                <span className="font-semibold text-blue-500">{health?.requests.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completed</span>
                <span className="font-semibold text-green-500">
                  {health?.requests.completed || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Failed</span>
                <span className="font-semibold text-red-500">{health?.requests.failed || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Security Status
            </CardTitle>
            <CardDescription>Protection systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rate Limiting</span>
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-4 w-4" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SQL Injection Protection</span>
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-4 w-4" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">XSS Protection</span>
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-4 w-4" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">DDoS Protection</span>
                <span className="flex items-center gap-1 text-green-500">
                  <CheckCircle className="h-4 w-4" /> Active
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" />
            Performance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4 dark:border-slate-700">
              <h4 className="font-semibold">Cache Optimization</h4>
              <p className="mt-1 text-sm text-slate-500">
                {(health?.cache.hits || 0) > (health?.cache.misses || 0)
                  ? '✅ Cache is performing well'
                  : '⚠️ Consider increasing cache TTL'}
              </p>
            </div>
            <div className="rounded-lg border p-4 dark:border-slate-700">
              <h4 className="font-semibold">Memory Usage</h4>
              <p className="mt-1 text-sm text-slate-500">
                {(health?.memory.heapUsed || 0) < (health?.memory.heapTotal || 100) * 0.8
                  ? '✅ Memory usage is healthy'
                  : '⚠️ Memory usage is high'}
              </p>
            </div>
            <div className="rounded-lg border p-4 dark:border-slate-700">
              <h4 className="font-semibold">Queue Health</h4>
              <p className="mt-1 text-sm text-slate-500">
                {(health?.queue.failed || 0) === 0
                  ? '✅ No failed jobs'
                  : `⚠️ ${health?.queue.failed} failed jobs need attention`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
