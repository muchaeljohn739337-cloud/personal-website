'use client';

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Shield,
  ShieldAlert,
  UserX,
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

interface SecurityStats {
  loginAttempts: {
    total: number;
    failed: number;
    suspicious: number;
  };
  blockedIPs: number;
  activeSessions: number;
  twoFactorEnabled: number;
  recentAlerts: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

interface LoginAttempt {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: string;
  location?: string;
}

export default function SecurityAdminPage() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [statsRes, attemptsRes] = await Promise.all([
        fetch('/api/admin/security/stats'),
        fetch('/api/admin/security/login-attempts'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (attemptsRes.ok) {
        const attemptsData = await attemptsRes.json();
        setLoginAttempts(attemptsData.attempts || []);
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
      case 'medium':
        return 'text-amber-600 bg-amber-50 dark:bg-amber-950';
      case 'low':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-950';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Security Center</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Monitor security events, login attempts, and system threats
          </p>
        </div>
        <Button variant="outline" onClick={fetchSecurityData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Login Attempts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.loginAttempts.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.loginAttempts.failed} failed attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.loginAttempts.suspicious}</div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.blockedIPs}</div>
            <p className="text-xs text-muted-foreground">Currently blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA Enabled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.twoFactorEnabled}</div>
            <p className="text-xs text-muted-foreground">Users protected</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Alerts</CardTitle>
          <CardDescription>Critical security events requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.recentAlerts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No recent alerts</p>
            ) : (
              stats?.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{alert.type}</div>
                      <div className="text-sm opacity-80">{alert.message}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Login Attempts</CardTitle>
          <CardDescription>Recent authentication attempts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="suspicious">Suspicious</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <LoginAttemptsTable attempts={loginAttempts} />
            </TabsContent>
            <TabsContent value="failed" className="mt-4">
              <LoginAttemptsTable attempts={loginAttempts.filter((a) => !a.success)} />
            </TabsContent>
            <TabsContent value="suspicious" className="mt-4">
              <LoginAttemptsTable attempts={loginAttempts.filter((a) => !a.success)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginAttemptsTable({ attempts }: { attempts: LoginAttempt[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-slate-500">
                No login attempts found
              </TableCell>
            </TableRow>
          ) : (
            attempts.map((attempt) => (
              <TableRow key={attempt.id}>
                <TableCell>{attempt.email}</TableCell>
                <TableCell className="font-mono text-xs">{attempt.ipAddress}</TableCell>
                <TableCell>{attempt.location || 'Unknown'}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      attempt.success
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                        : 'text-red-600 bg-red-50 dark:bg-red-950'
                    }`}
                  >
                    {attempt.success ? 'Success' : 'Failed'}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(attempt.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Ban className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

