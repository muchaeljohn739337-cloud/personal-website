'use client';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    latency: number;
  };
  api: {
    status: 'operational' | 'slow' | 'down';
    responseTime: number;
  };
  jobs: {
    active: number;
    queued: number;
    failed: number;
  };
}

interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source: string;
}

export default function SystemAdminPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [healthRes, logsRes] = await Promise.all([
        fetch('/api/admin/system/health'),
        fetch('/api/admin/system/logs'),
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'operational':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950';
      case 'degraded':
      case 'slow':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950';
      case 'down':
      case 'disconnected':
        return 'text-red-600 bg-red-50 dark:bg-red-950';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-950';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            System Monitoring
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Monitor system health, logs, and background jobs
          </p>
        </div>
        <Button variant="outline" onClick={fetchSystemData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* System Health */}
      {health && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{health.status}</div>
              <p className="text-xs text-muted-foreground">
                Uptime: {Math.floor(health.uptime / 3600)}h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{health.database.status}</div>
              <p className="text-xs text-muted-foreground">
                Latency: {health.database.latency}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{health.api.status}</div>
              <p className="text-xs text-muted-foreground">
                Response: {health.api.responseTime}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Background Jobs</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{health.jobs.active}</div>
              <p className="text-xs text-muted-foreground">
                {health.jobs.queued} queued, {health.jobs.failed} failed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>Real-time system events and errors</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="warnings">Warnings</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <LogsTable logs={logs} getLogLevelColor={getLogLevelColor} />
            </TabsContent>
            <TabsContent value="errors" className="mt-4">
              <LogsTable
                logs={logs.filter((l) => l.level === 'error')}
                getLogLevelColor={getLogLevelColor}
              />
            </TabsContent>
            <TabsContent value="warnings" className="mt-4">
              <LogsTable
                logs={logs.filter((l) => l.level === 'warning')}
                getLogLevelColor={getLogLevelColor}
              />
            </TabsContent>
            <TabsContent value="info" className="mt-4">
              <LogsTable
                logs={logs.filter((l) => l.level === 'info')}
                getLogLevelColor={getLogLevelColor}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsTable({
  logs,
  getLogLevelColor,
}: {
  logs: SystemLog[];
  getLogLevelColor: (level: string) => string;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-slate-500">
                No logs found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${getLogLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{log.source}</TableCell>
                <TableCell className="text-sm">{log.message}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

