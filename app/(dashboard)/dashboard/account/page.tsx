'use client';

import {
  Activity,
  Award,
  Calendar,
  CreditCard,
  DollarSign,
  Mail,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
  Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BalanceVisibility } from '@/components/dashboard/BalanceVisibility';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccountData {
  tokenBalance: number;
  tokenUsdValue: number;
  web3Balance: number;
  web3UsdValue: number;
  stripeBalance: number;
  totalBalance: number;
  memberSince: string;
  accountStatus: 'active' | 'pending' | 'suspended';
  verificationStatus: 'verified' | 'unverified' | 'pending';
  stats: {
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
  };
}

interface WaterDrop {
  width: number;
  height: number;
  left: number;
  top?: number;
  delay: number;
  duration: number;
}

export default function AccountPage() {
  const { data: session } = useSession();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileDrops, setProfileDrops] = useState<WaterDrop[]>([]);
  const [balanceDrops, setBalanceDrops] = useState<WaterDrop[]>([]);
  const [tokenDrops, setTokenDrops] = useState<WaterDrop[]>([]);
  const [web3Drops, setWeb3Drops] = useState<WaterDrop[]>([]);
  const [stripeDrops, setStripeDrops] = useState<WaterDrop[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Generate random water drop positions on client only (avoid hydration mismatch)
    setProfileDrops(
      Array.from({ length: 10 }, () => ({
        width: 20 + Math.random() * 30,
        height: 20 + Math.random() * 30,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 3,
      }))
    );

    setBalanceDrops(
      Array.from({ length: 8 }, () => ({
        width: 30 + Math.random() * 40,
        height: 30 + Math.random() * 40,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
      }))
    );

    setTokenDrops(
      Array.from({ length: 4 }, () => ({
        width: 15 + Math.random() * 20,
        height: 15 + Math.random() * 20,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      }))
    );

    setWeb3Drops(
      Array.from({ length: 4 }, () => ({
        width: 15 + Math.random() * 20,
        height: 15 + Math.random() * 20,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      }))
    );

    setStripeDrops(
      Array.from({ length: 4 }, () => ({
        width: 15 + Math.random() * 20,
        height: 15 + Math.random() * 20,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
      }))
    );

    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch account data
    const fetchAccountData = async () => {
      try {
        // In production, this would fetch from API
        // For now, using mock data
        const mockData: AccountData = {
          tokenBalance: 125000,
          tokenUsdValue: 12500,
          web3Balance: 2.45,
          web3UsdValue: 6125,
          stripeBalance: 847392.45,
          totalBalance: 865017.45,
          memberSince: '2024-01-15',
          accountStatus: 'active',
          verificationStatus: 'verified',
          stats: {
            totalTransactions: 2847,
            successfulTransactions: 2820,
            failedTransactions: 27,
            lifetimeEarned: 1250000,
            lifetimeSpent: 384982.55,
          },
        };
        setAccountData(mockData);
      } catch (error) {
        console.error('Failed to fetch account data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (!accountData || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-400">Failed to load account information</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitials =
    session.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  const memberDate = new Date(accountData.memberSince);
  const daysSince = Math.floor((Date.now() - memberDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  My Account
                </h1>
                <p className="text-sm sm:text-base text-slate-400">
                  Manage your account and view balances
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
          >
            <Shield className="w-4 h-4" />
            <span className="text-sm sm:text-base">Settings</span>
          </Link>
        </div>

        {/* Profile Card with Water Drop Effects */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 border-0 shadow-2xl">
          {/* Water Drop Animation Background */}
          {mounted && (
            <div className="absolute inset-0 overflow-hidden">
              {profileDrops.map((drop, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white/10 blur-xl animate-float"
                  style={{
                    width: `${drop.width}px`,
                    height: `${drop.height}px`,
                    left: `${drop.left}%`,
                    top: `${drop.top}%`,
                    animationDelay: `${drop.delay}s`,
                    animationDuration: `${drop.duration}s`,
                  }}
                />
              ))}
            </div>
          )}

          <CardContent className="relative p-6 sm:p-8 lg:p-10 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/30 blur-xl animate-pulse" />
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-3xl sm:text-4xl font-bold shadow-2xl">
                  {userInitials}
                </div>
                {accountData.verificationStatus === 'verified' && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 border-4 border-violet-600 flex items-center justify-center">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
                    {session.user?.name || 'User'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base">
                    <div className="flex items-center gap-2 text-white/80">
                      <Mail className="w-4 h-4" />
                      <span>{session.user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="w-4 h-4" />
                      <span>Member for {daysSince} days</span>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      accountData.accountStatus === 'active'
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                        : accountData.accountStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-200 border border-red-500/30'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        accountData.accountStatus === 'active'
                          ? 'bg-emerald-400'
                          : accountData.accountStatus === 'pending'
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                      }`}
                    />
                    {accountData.accountStatus.charAt(0).toUpperCase() +
                      accountData.accountStatus.slice(1)}
                  </span>
                  {accountData.verificationStatus === 'verified' && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-500/20 text-blue-200 border border-blue-500/30">
                      <Shield className="w-3 h-3" />
                      Verified Account
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Balance Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 border-0 shadow-2xl">
          {/* Water Drop Effects */}
          {mounted && (
            <div className="absolute inset-0 overflow-hidden">
              {balanceDrops.map((drop, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-cyan-400/20 blur-2xl animate-water-drop"
                  style={{
                    width: `${drop.width}px`,
                    height: `${drop.height}px`,
                    left: `${drop.left}%`,
                    animationDelay: `${drop.delay}s`,
                  }}
                />
              ))}
            </div>
          )}

          <CardContent className="relative p-6 sm:p-8 lg:p-10 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-white/80">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                  <p className="text-sm sm:text-base font-medium">Total Account Balance</p>
                </div>
                <BalanceVisibility
                  value={accountData.totalBalance}
                  currency="USD"
                  size="xl"
                  variant="gradient"
                  iconPosition="right"
                  className="mb-2"
                />
                <p className="text-sm sm:text-base text-white/70">
                  Combined balance across all payment methods
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-white/30 blur-xl animate-pulse" />
                <div className="relative rounded-full bg-white/20 backdrop-blur-sm p-6 sm:p-8 border border-white/30 shadow-2xl hover:scale-105 transition-transform duration-300">
                  <Wallet className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 drop-shadow-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Breakdown */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Token Balance */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
            {mounted && (
              <div className="absolute inset-0 overflow-hidden">
                {tokenDrops.map((drop, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-emerald-400/10 blur-lg animate-float"
                    style={{
                      width: `${drop.width}px`,
                      height: `${drop.height}px`,
                      left: `${drop.left}%`,
                      top: `${drop.top}%`,
                      animationDelay: `${drop.delay}s`,
                      animationDuration: `${drop.duration}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-emerald-400">
                <Zap className="h-5 w-5" />
                Token Balance
              </CardTitle>
              <CardDescription className="text-emerald-300/70">ADV Tokens</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-2">
              <BalanceVisibility
                value={accountData.tokenBalance}
                currency="ADV"
                size="lg"
                variant="default"
                iconPosition="right"
                className="text-white"
              />
              <BalanceVisibility
                value={accountData.tokenUsdValue}
                currency="USD"
                size="sm"
                variant="minimal"
                className="text-emerald-200/80"
              />
              <Link
                href="/dashboard/tokens"
                className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 transition-colors mt-2"
              >
                <span>View Token Wallet</span>
                <TrendingUp className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Web3 Balance */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            {mounted && (
              <div className="absolute inset-0 overflow-hidden">
                {web3Drops.map((drop, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-blue-400/10 blur-lg animate-float"
                    style={{
                      width: `${drop.width}px`,
                      height: `${drop.height}px`,
                      left: `${drop.left}%`,
                      top: `${drop.top}%`,
                      animationDelay: `${drop.delay}s`,
                      animationDuration: `${drop.duration}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Wallet className="h-5 w-5" />
                Web3 Balance
              </CardTitle>
              <CardDescription className="text-blue-300/70">Cryptocurrency</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-2">
              <BalanceVisibility
                value={accountData.web3Balance}
                currency="ETH"
                size="lg"
                variant="default"
                iconPosition="right"
                className="text-white"
              />
              <BalanceVisibility
                value={accountData.web3UsdValue}
                currency="USD"
                size="sm"
                variant="minimal"
                className="text-blue-200/80"
              />
              <Link
                href="/dashboard/web3"
                className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors mt-2"
              >
                <span>View Web3 Wallet</span>
                <TrendingUp className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Stripe Balance */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-500/30 md:col-span-2 lg:col-span-1">
            {mounted && (
              <div className="absolute inset-0 overflow-hidden">
                {stripeDrops.map((drop, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-violet-400/10 blur-lg animate-float"
                    style={{
                      width: `${drop.width}px`,
                      height: `${drop.height}px`,
                      left: `${drop.left}%`,
                      top: `${drop.top}%`,
                      animationDelay: `${drop.delay}s`,
                      animationDuration: `${drop.duration}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-violet-400">
                <CreditCard className="h-5 w-5" />
                Stripe Balance
              </CardTitle>
              <CardDescription className="text-violet-300/70">Fiat Currency</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-2">
              <BalanceVisibility
                value={accountData.stripeBalance}
                currency="USD"
                size="lg"
                variant="default"
                iconPosition="right"
                className="text-white"
              />
              <p className="text-xs sm:text-sm text-violet-200/80">Available for withdrawal</p>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-200 transition-colors mt-2"
              >
                <span>Manage Billing</span>
                <TrendingUp className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Account Stats */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Total Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {accountData.stats.totalTransactions.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Success Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {(
                      (accountData.stats.successfulTransactions /
                        accountData.stats.totalTransactions) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Lifetime Earned</p>
                  <BalanceVisibility
                    value={accountData.stats.lifetimeEarned}
                    currency="USD"
                    size="md"
                    variant="default"
                    showIcon={false}
                    className="text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Member Since</p>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {memberDate.toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-400">{daysSince} days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/tokens"
            className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-emerald-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="font-semibold mb-1 text-white">Token Wallet</h4>
            <p className="text-sm text-slate-400">Manage ADV tokens</p>
          </Link>

          <Link
            href="/dashboard/web3"
            className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-blue-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-semibold mb-1 text-white">Web3 Wallet</h4>
            <p className="text-sm text-slate-400">Crypto & blockchain</p>
          </Link>

          <Link
            href="/dashboard/billing"
            className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-violet-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6 text-violet-400" />
            </div>
            <h4 className="font-semibold mb-1 text-white">Billing</h4>
            <p className="text-sm text-slate-400">Manage payments</p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-6 hover:border-amber-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="font-semibold mb-1 text-white">Settings</h4>
            <p className="text-sm text-slate-400">Account preferences</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
