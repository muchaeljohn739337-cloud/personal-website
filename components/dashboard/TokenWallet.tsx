'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  RefreshCw,
  Send,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceVisibility } from '../dashboard/BalanceVisibility';

interface TokenWalletData {
  wallet: {
    balance: number;
    lockedBalance: number;
    availableBalance: number;
    lifetimeEarned: number;
    lifetimeSpent: number;
    tokenSymbol: string;
    exchangeRate: number;
    usdValue: number;
  };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    fee: number;
    balanceAfter: number;
    description: string | null;
    createdAt: string;
  }>;
  config: {
    symbol: string;
    exchangeRate: number;
    bonusRate: number;
    fees: {
      withdraw: number;
      cashOut: number;
      transfer: number;
    };
  };
}

export function TokenWallet() {
  const [data, setData] = useState<TokenWalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tokens');
      if (!response.ok) throw new Error('Failed to fetch wallet');
      const walletData = await response.json();
      setData(walletData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  if (isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="h-8 w-8 animate-spin text-violet-400" />
            <p className="text-slate-400">Loading wallet...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-500/20 bg-red-950/10">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-400 mb-4">{error || 'Failed to load wallet'}</p>
          <Button
            variant="outline"
            onClick={fetchWallet}
            className="border-red-500/30 hover:bg-red-500/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { wallet, transactions, config } = data;

  return (
    <div className="space-y-6">
      {/* Enhanced Balance Card with Advanced Water Drop Effects */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 border-0 shadow-2xl">
        {/* Advanced Water Drop Animation Background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 blur-xl animate-float"
              style={{
                width: `${15 + Math.random() * 35}px`,
                height: `${15 + Math.random() * 35}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
              }}
            />
          ))}
          {/* Larger floating drops */}
          {[...Array(4)].map((_, i) => (
            <div
              key={`large-${i}`}
              className="absolute rounded-full bg-cyan-400/20 blur-2xl animate-water-drop"
              style={{
                width: `${40 + Math.random() * 30}px`,
                height: `${40 + Math.random() * 30}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />

        <CardContent className="relative p-6 sm:p-8 lg:p-10 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-white/80">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <p className="text-sm sm:text-base font-medium">Token Balance</p>
              </div>
              <BalanceVisibility
                value={wallet.balance}
                currency={wallet.tokenSymbol}
                size="xl"
                variant="gradient"
                iconPosition="right"
                className="mb-2"
              />
              <div className="flex items-center gap-2">
                <BalanceVisibility
                  value={wallet.usdValue}
                  currency="USD"
                  size="sm"
                  variant="minimal"
                  className="text-white/70"
                />
                <span className="text-xs sm:text-sm text-white/60">
                  @ ${config.exchangeRate.toFixed(4)}/ADV
                </span>
              </div>
            </div>
            <div className="relative">
              {/* Icon with water drop glow */}
              <div className="absolute inset-0 rounded-full bg-white/30 blur-xl animate-pulse" />
              <div className="relative rounded-full bg-white/20 backdrop-blur-sm p-4 sm:p-6 lg:p-8 border border-white/30 shadow-2xl hover:scale-105 transition-transform duration-300">
                <Coins className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 drop-shadow-lg" />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/20 pt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all">
              <p className="text-xs sm:text-sm text-white/70 mb-2">Available</p>
              <BalanceVisibility
                value={wallet.availableBalance}
                size="md"
                variant="default"
                showIcon={false}
                className="text-white"
              />
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all">
              <p className="text-xs sm:text-sm text-white/70 mb-2">Locked</p>
              <BalanceVisibility
                value={wallet.lockedBalance}
                size="md"
                variant="default"
                showIcon={false}
                className="text-white"
              />
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all">
              <p className="text-xs sm:text-sm text-white/70 mb-2">Exchange Rate</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                ${config.exchangeRate.toFixed(4)}
              </p>
              <p className="text-xs text-white/60 mt-1">per ADV</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Button
          variant="outline"
          className="flex flex-col gap-2 h-auto py-4 sm:py-5 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all group"
        >
          <Send className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
          <span className="text-sm sm:text-base">Transfer</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col gap-2 h-auto py-4 sm:py-5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group"
        >
          <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
          <span className="text-sm sm:text-base">Withdraw</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col gap-2 h-auto py-4 sm:py-5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all group"
        >
          <Wallet className="h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" />
          <span className="text-sm sm:text-base">Cash Out</span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col gap-2 h-auto py-4 sm:py-5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all group"
          onClick={fetchWallet}
        >
          <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-sm sm:text-base">Refresh</span>
        </Button>
      </div>

      {/* Lifetime Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-emerald-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-400 flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Lifetime Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceVisibility
              value={wallet.lifetimeEarned}
              currency={wallet.tokenSymbol}
              size="lg"
              variant="default"
              showIcon={false}
              className="text-emerald-400"
            />
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-gradient-to-br from-red-950/20 to-red-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Lifetime Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceVisibility
              value={wallet.lifetimeSpent}
              currency={wallet.tokenSymbol}
              size="lg"
              variant="default"
              showIcon={false}
              className="text-red-400"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Your latest token activity</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">No transactions yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full ${
                        tx.amount > 0
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : 'bg-red-500/20 border border-red-500/30'
                      }`}
                    >
                      {tx.amount > 0 ? (
                        <ArrowDownRight className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-100 text-sm sm:text-base">
                        {tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-400">
                        {tx.description || new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <BalanceVisibility
                      value={tx.amount}
                      currency={wallet.tokenSymbol}
                      size="sm"
                      variant="default"
                      showIcon={false}
                      className={tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}
                    />
                    {tx.fee > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Fee: {tx.fee} {wallet.tokenSymbol}
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
  );
}
