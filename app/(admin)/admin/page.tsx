'use client';

import {
  AlertTriangle,
  Ban,
  Calendar,
  CreditCard,
  RefreshCw,
  Shield,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Stats {
  users: {
    total: number;
    newToday: number;
    newThisMonth: number;
    suspended: number;
  };
  payments: {
    total: number;
    thisMonth: number;
  };
  bookings: {
    total: number;
    active: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-500">{error}</p>
        <Button variant="outline" onClick={fetchStats} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage users, monitor activity, and control system settings
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.users.total.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <UserPlus className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.users.newToday}</p>
              <p className="text-sm text-slate-500">New Today</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.users.newThisMonth}</p>
              <p className="text-sm text-slate-500">This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.users.suspended}</p>
              <p className="text-sm text-slate-500">Suspended</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-blue-500" />
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Completed</span>
                <span className="font-semibold">{stats?.payments.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">This Month</span>
                <span className="font-semibold">{stats?.payments.thisMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-teal-500" />
              MedBed Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Bookings</span>
                <span className="font-semibold">{stats?.bookings.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active</span>
                <span className="font-semibold">{stats?.bookings.active}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-amber-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">API Status</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Database</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a href="/admin/users">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a href="/admin/users?suspended=true">
                <Ban className="h-6 w-6" />
                <span>View Suspended</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a href="/admin/logs">
                <UserCheck className="h-6 w-6" />
                <span>Activity Logs</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a href="/admin/settings">
                <Shield className="h-6 w-6" />
                <span>System Settings</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
