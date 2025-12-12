'use client';

import {
  CreditCard,
  DollarSign,
  ExternalLink,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BillingStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  activeSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  upcomingPayments: number;
  failedPayments: number;
  refunds: number;
}

export default function BillingManagementPage() {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/billing/stats?timeframe=${timeframe}`);
      // const data = await response.json();

      // Mock data for now
      setStats({
        totalRevenue: 125000,
        monthlyRecurringRevenue: 45000,
        activeSubscriptions: 234,
        churnRate: 2.5,
        averageRevenuePerUser: 192.31,
        upcomingPayments: 12500,
        failedPayments: 8,
        refunds: 1250,
      });
    } catch (err) {
      console.error('Failed to fetch billing stats:', err);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Billing Management</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage subscriptions, revenue, and billing settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchStats} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${stats?.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${stats?.monthlyRecurringRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">MRR</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.activeSubscriptions.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Active Subscriptions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950">
              <TrendingDown className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.churnRate}%</p>
              <p className="text-sm text-slate-500">Churn Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">ARPU</span>
              <span className="font-semibold">${stats?.averageRevenuePerUser.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Upcoming Payments</span>
              <span className="font-semibold">${stats?.upcomingPayments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Failed Payments</span>
              <span className="font-semibold text-red-600">{stats?.failedPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Refunds</span>
              <span className="font-semibold">${stats?.refunds.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/admin/billing/overrides">
                <Settings className="mr-2 h-4 w-4" />
                Billing Overrides
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/admin/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                View All Payments
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>External Dashboards</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Stripe
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Vercel
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
