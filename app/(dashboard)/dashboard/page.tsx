'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  CreditCard,
  Globe,
  Shield,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Target,
  Banknote,
} from 'lucide-react';

// Mock data - in production, this would come from API
const generateMockData = () => ({
  totalBalance: 847392.45,
  monthlyRevenue: 124567.89,
  transactionVolume: 2847,
  activeUsers: 12453,
  growthRate: 24.5,
  pendingPayouts: 45678.90,
  fraudBlocked: 12340.00,
  successRate: 99.2,
});

const recentTransactions = [
  { id: 1, merchant: 'Stripe Payment', amount: 2450.00, status: 'completed', type: 'credit', time: '2 min ago', currency: 'USD' },
  { id: 2, merchant: 'Wire Transfer', amount: 15000.00, status: 'pending', type: 'credit', time: '15 min ago', currency: 'USD' },
  { id: 3, merchant: 'Subscription Renewal', amount: 99.00, status: 'completed', type: 'debit', time: '1 hour ago', currency: 'USD' },
  { id: 4, merchant: 'Crypto Exchange', amount: 5230.00, status: 'completed', type: 'credit', time: '2 hours ago', currency: 'BTC' },
  { id: 5, merchant: 'Refund - Order #4521', amount: 189.00, status: 'completed', type: 'debit', time: '3 hours ago', currency: 'USD' },
  { id: 6, merchant: 'API Payment', amount: 890.00, status: 'failed', type: 'credit', time: '4 hours ago', currency: 'EUR' },
];

const topAccounts = [
  { name: 'TechCorp Inc.', volume: 245000, growth: 15.2 },
  { name: 'Global Retail', volume: 189000, growth: 8.7 },
  { name: 'StartupXYZ', volume: 156000, growth: 32.1 },
  { name: 'Enterprise Co.', volume: 134000, growth: -2.3 },
  { name: 'Digital Agency', volume: 98000, growth: 18.9 },
];

const paymentMethods = [
  { name: 'Credit Card', percentage: 45, color: 'bg-blue-500' },
  { name: 'Bank Transfer', percentage: 28, color: 'bg-emerald-500' },
  { name: 'Crypto', percentage: 15, color: 'bg-violet-500' },
  { name: 'Digital Wallet', percentage: 12, color: 'bg-amber-500' },
];

const geographicData = [
  { country: 'United States', flag: '🇺🇸', percentage: 42, amount: 356000 },
  { country: 'United Kingdom', flag: '🇬🇧', percentage: 18, amount: 152000 },
  { country: 'Germany', flag: '🇩🇪', percentage: 12, amount: 101000 },
  { country: 'Canada', flag: '🇨🇦', percentage: 10, amount: 84000 },
  { country: 'Australia', flag: '🇦🇺', percentage: 8, amount: 67000 },
  { country: 'Others', flag: '🌍', percentage: 10, amount: 84000 },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState(generateMockData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(generateMockData());
      setIsRefreshing(false);
    }, 1000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}
            </h1>
          </div>
          <p className="text-slate-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' • '}
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90 transition-opacity"
          >
            <Zap className="w-4 h-4" />
            <span>Upgrade</span>
          </Link>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Balance */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl border border-emerald-500/30 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Total Balance</span>
            </div>
            <p className="text-3xl lg:text-4xl font-bold mb-2">{formatCurrency(data.totalBalance)}</p>
            <div className="flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">+{data.growthRate}%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Monthly Revenue</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold mb-2">{formatCurrency(data.monthlyRevenue)}</p>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">+18.2%</span>
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 text-violet-400 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">Transactions</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold mb-2">{formatNumber(data.transactionVolume)}</p>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400">+342</span>
            <span className="text-slate-400">today</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Target className="w-5 h-5" />
            <span className="text-sm font-medium">Success Rate</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold mb-2">{data.successRate}%</p>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-2 rounded-full transition-all"
              style={{ width: `${data.successRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Active Users</p>
            <p className="text-xl font-bold">{formatNumber(data.activeUsers)}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Pending Payouts</p>
            <p className="text-xl font-bold">{formatCurrency(data.pendingPayouts)}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Fraud Blocked</p>
            <p className="text-xl font-bold">{formatCurrency(data.fraudBlocked)}</p>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Growth Rate</p>
            <p className="text-xl font-bold">+{data.growthRate}%</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Revenue Overview</h3>
              <p className="text-sm text-slate-400">Monthly revenue performance</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                12M
              </button>
              <button className="px-3 py-1 text-sm rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700">
                6M
              </button>
              <button className="px-3 py-1 text-sm rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700">
                30D
              </button>
            </div>
          </div>
          
          {/* Chart Visualization */}
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(52, 211, 153)" />
                  <stop offset="100%" stopColor="rgb(59, 130, 246)" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 62.5}
                  x2="800"
                  y2={i * 62.5}
                  stroke="rgb(51, 65, 85)"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              ))}
              {/* Area */}
              <path
                d="M0,200 Q100,180 200,150 T400,100 T600,80 T800,40 L800,250 L0,250 Z"
                fill="url(#revenueGradient)"
              />
              {/* Line */}
              <path
                d="M0,200 Q100,180 200,150 T400,100 T600,80 T800,40"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Data Points */}
              {[
                { x: 0, y: 200 },
                { x: 133, y: 170 },
                { x: 266, y: 140 },
                { x: 400, y: 100 },
                { x: 533, y: 90 },
                { x: 666, y: 70 },
                { x: 800, y: 40 },
              ].map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="rgb(15, 23, 42)"
                  stroke="rgb(52, 211, 153)"
                  strokeWidth="2"
                />
              ))}
            </svg>
            {/* Y-axis Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 py-2">
              <span>$200K</span>
              <span>$150K</span>
              <span>$100K</span>
              <span>$50K</span>
              <span>$0</span>
            </div>
          </div>
          
          {/* X-axis Labels */}
          <div className="flex justify-between text-xs text-slate-500 mt-2 px-8">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Payment Methods</h3>
              <p className="text-sm text-slate-400">Distribution by type</p>
            </div>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>
          
          {/* Donut Chart */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {paymentMethods.reduce((acc, method, index) => {
                const prevTotal = paymentMethods.slice(0, index).reduce((sum, m) => sum + m.percentage, 0);
                const circumference = 2 * Math.PI * 35;
                const strokeDasharray = `${(method.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((prevTotal / 100) * circumference);
                
                acc.push(
                  <circle
                    key={method.name}
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke={method.color.replace('bg-', 'rgb(').replace('-500', '')}
                    strokeWidth="12"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className={method.color.replace('bg-', 'stroke-')}
                  />
                );
                return acc;
              }, [] as JSX.Element[])}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatNumber(data.transactionVolume)}</p>
                <p className="text-xs text-slate-400">Total</p>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${method.color}`} />
                  <span className="text-sm text-slate-300">{method.name}</span>
                </div>
                <span className="text-sm font-medium">{method.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <p className="text-sm text-slate-400">Latest payment activities</p>
            </div>
            <Link href="/dashboard/billing" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-medium">Transaction</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === 'credit' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          {tx.type === 'credit' ? (
                            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.merchant}</p>
                          <p className="text-xs text-slate-500">{tx.currency}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                         tx.status === 'pending' ? <Clock className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-slate-400">{tx.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Top Regions</h3>
              <p className="text-sm text-slate-400">Revenue by country</p>
            </div>
            <Globe className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            {geographicData.map((region) => (
              <div key={region.country}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{region.flag}</span>
                    <span className="text-sm">{region.country}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(region.amount)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${region.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/dashboard/billing" className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-emerald-500/50 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Banknote className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="font-semibold mb-1">Send Payment</h4>
          <p className="text-sm text-slate-400">Transfer funds instantly</p>
        </Link>
        <Link href="/dashboard/tokens" className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-blue-500/50 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CreditCard className="w-6 h-6 text-blue-400" />
          </div>
          <h4 className="font-semibold mb-1">Manage Cards</h4>
          <p className="text-sm text-slate-400">View payment methods</p>
        </Link>
        <Link href="/dashboard/team" className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-violet-500/50 transition-all">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-violet-400" />
          </div>
          <h4 className="font-semibold mb-1">Team Access</h4>
          <p className="text-sm text-slate-400">Manage permissions</p>
        </Link>
        <Link href="/dashboard/settings" className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-amber-500/50 transition-all">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-6 h-6 text-amber-400" />
          </div>
          <h4 className="font-semibold mb-1">Analytics</h4>
          <p className="text-sm text-slate-400">View detailed reports</p>
        </Link>
      </div>
    </div>
  );
}
