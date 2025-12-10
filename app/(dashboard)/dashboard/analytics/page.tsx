'use client';

import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Clock,
  Eye,
  Globe,
  MousePointer,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// Mini chart component
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex h-12 items-end gap-1">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-300 hover:opacity-80"
          style={{
            height: `${((value - min) / range) * 100}%`,
            minHeight: '4px',
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

// Stats data
const stats = [
  {
    title: 'Total Visitors',
    value: 24853,
    change: 12.5,
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    chartData: [30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 75, 90],
  },
  {
    title: 'Page Views',
    value: 89432,
    change: 8.2,
    icon: Eye,
    color: 'from-purple-500 to-pink-500',
    chartData: [50, 60, 45, 70, 55, 80, 65, 90, 75, 95, 85, 100],
  },
  {
    title: 'Avg. Session',
    value: 4.2,
    suffix: 'm',
    change: -2.1,
    icon: Clock,
    color: 'from-orange-500 to-yellow-500',
    chartData: [4, 5, 4.5, 3.8, 4.2, 4.8, 4.1, 3.9, 4.5, 4.3, 4.6, 4.2],
  },
  {
    title: 'Bounce Rate',
    value: 32.4,
    suffix: '%',
    change: -5.3,
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-500',
    chartData: [40, 38, 35, 36, 34, 33, 35, 32, 34, 33, 32, 32],
  },
];

const topPages = [
  { path: '/', views: 12453, change: 15.2 },
  { path: '/dashboard', views: 8234, change: 8.7 },
  { path: '/crypto', views: 6521, change: 22.1 },
  { path: '/auth/login', views: 4832, change: -3.2 },
  { path: '/medbed', views: 3241, change: 45.8 },
];

const topCountries = [
  { country: 'United States', flag: '🇺🇸', visitors: 8432, percentage: 34 },
  { country: 'United Kingdom', flag: '🇬🇧', visitors: 4521, percentage: 18 },
  { country: 'Germany', flag: '🇩🇪', visitors: 3214, percentage: 13 },
  { country: 'Canada', flag: '🇨🇦', visitors: 2843, percentage: 11 },
  { country: 'Australia', flag: '🇦🇺', visitors: 2156, percentage: 9 },
];

const deviceStats = [
  { device: 'Desktop', percentage: 58, color: 'bg-blue-500' },
  { device: 'Mobile', percentage: 35, color: 'bg-purple-500' },
  { device: 'Tablet', percentage: 7, color: 'bg-cyan-500' },
];

const realtimeData = [
  { time: '12:00', users: 145 },
  { time: '12:05', users: 152 },
  { time: '12:10', users: 148 },
  { time: '12:15', users: 167 },
  { time: '12:20', users: 175 },
  { time: '12:25', users: 182 },
  { time: '12:30', users: 178 },
  { time: '12:35', users: 195 },
  { time: '12:40', users: 203 },
  { time: '12:45', users: 198 },
  { time: '12:50', users: 215 },
  { time: '12:55', users: 223 },
];

export default function AnalyticsPage() {
  const [activeUsers, setActiveUsers] = useState(223);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => prev + Math.floor(Math.random() * 10) - 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Track your platform performance and user engagement
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-green-500">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>
          <span className="font-medium">{activeUsers} users online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {stat.change >= 0 ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
              </div>
              <div className="mt-4">
                <MiniChart
                  data={stat.chartData}
                  color={
                    stat.color.includes('blue')
                      ? '#3b82f6'
                      : stat.color.includes('purple')
                        ? '#a855f7'
                        : stat.color.includes('orange')
                          ? '#f97316'
                          : '#22c55e'
                  }
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-500" />
                Real-time Traffic
              </CardTitle>
              <CardDescription>Active users in the last hour</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Zap className="h-4 w-4 text-yellow-500" />
              Live updates
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <div className="flex h-full items-end gap-2">
              {realtimeData.map((point, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-cyan-500 to-blue-500 transition-all duration-500"
                    style={{ height: `${(point.users / 250) * 100}%` }}
                  />
                  <span className="text-xs text-slate-400">{point.time}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Three Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Top Pages
            </CardTitle>
            <CardDescription>Most visited pages this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages.map((page, i) => (
                <div key={page.path} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {page.path}
                    </p>
                    <p className="text-sm text-slate-500">{page.views.toLocaleString()} views</p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      page.change >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {page.change >= 0 ? '+' : ''}
                    {page.change}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Top Countries
            </CardTitle>
            <CardDescription>Visitors by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCountries.map((country) => (
                <div key={country.country} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{country.flag}</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {country.country}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {country.visitors.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${country.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-green-500" />
              Devices
            </CardTitle>
            <CardDescription>Traffic by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Donut Chart */}
            <div className="relative mx-auto h-48 w-48">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                {
                  deviceStats.reduce(
                    (acc, device, i) => {
                      const circumference = 2 * Math.PI * 40;
                      const offset = acc.offset;
                      const length = (device.percentage / 100) * circumference;
                      acc.elements.push(
                        <circle
                          key={device.device}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          strokeWidth="12"
                          stroke={i === 0 ? '#3b82f6' : i === 1 ? '#a855f7' : '#06b6d4'}
                          strokeDasharray={`${length} ${circumference - length}`}
                          strokeDashoffset={-offset}
                          className="transition-all duration-500"
                        />
                      );
                      acc.offset += length;
                      return acc;
                    },
                    { elements: [] as React.ReactNode[], offset: 0 }
                  ).elements
                }
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats[0].value.toLocaleString()}
                </span>
                <span className="text-sm text-slate-500">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 space-y-3">
              {deviceStats.map((device) => (
                <div key={device.device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${device.color}`} />
                    <span className="text-slate-600 dark:text-slate-300">{device.device}</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {device.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Core Web Vitals and loading performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: 'LCP',
                value: '1.2s',
                status: 'good',
                description: 'Largest Contentful Paint',
              },
              { name: 'FID', value: '18ms', status: 'good', description: 'First Input Delay' },
              {
                name: 'CLS',
                value: '0.05',
                status: 'good',
                description: 'Cumulative Layout Shift',
              },
              { name: 'TTFB', value: '0.3s', status: 'good', description: 'Time to First Byte' },
            ].map((metric) => (
              <div
                key={metric.name}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">{metric.name}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    Good
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{metric.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
