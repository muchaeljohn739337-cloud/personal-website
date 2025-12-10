'use client';

import {
  BarChart3,
  ExternalLink,
  Globe,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  traffic: {
    total: number;
    unique: number;
    pageViews: number;
    bounceRate: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
  };
  ai: {
    requests: number;
    tokens: number;
    cost: number;
  };
  regions: Array<{
    country: string;
    users: number;
    percentage: number;
  }>;
  sources: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;
}

export default function AnalyticsAdminPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Real-time analytics, user metrics, and traffic insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://vercel.com/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Vercel Analytics
            </a>
          </Button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data?.users.active.toLocaleString()} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.users.newThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.users.newThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.traffic.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data?.traffic.unique.toLocaleString()} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.traffic.bounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Lower is better</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & AI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>Monthly revenue metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${data?.revenue.thisMonth.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              {data?.revenue.growth > 0 ? '+' : ''}
              {data?.revenue.growth}% from last month
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Total: ${data?.revenue.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
            <CardDescription>AI requests and token usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Requests</span>
                <span className="font-semibold">{data?.ai.requests.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tokens</span>
                <span className="font-semibold">{data?.ai.tokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cost</span>
                <span className="font-semibold">${data?.ai.cost.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.sources.slice(0, 5).map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm">{source.source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">
                      {source.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Distribution
          </CardTitle>
          <CardDescription>User distribution by country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data?.regions.slice(0, 10).map((region) => (
              <div key={region.country} className="flex items-center justify-between">
                <span className="text-sm">{region.country}</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${region.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-16 text-right">
                    {region.users.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    ({region.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* External Analytics Links */}
      <Card>
        <CardHeader>
          <CardTitle>External Analytics</CardTitle>
          <CardDescription>Quick access to analytics platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a
                href="https://vercel.com/analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span className="text-2xl">▲</span>
                <span>Vercel Analytics</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a
                href="https://cloudflare.com/analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span className="text-2xl">☁️</span>
                <span>Cloudflare</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a
                href="https://plausible.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span className="text-2xl">📊</span>
                <span>Plausible</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span className="text-2xl">⚡</span>
                <span>Supabase Logs</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

