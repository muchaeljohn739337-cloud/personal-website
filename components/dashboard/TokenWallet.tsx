'use client';

import { ArrowDownRight, ArrowUpRight, Coins, RefreshCw, Send, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500">{error || 'Failed to load wallet'}</p>
          <Button variant="outline" onClick={fetchWallet} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { wallet, transactions, config } = data;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Token Balance</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{wallet.balance.toLocaleString()}</span>
                <span className="text-xl font-medium text-white/80">{wallet.tokenSymbol}</span>
              </div>
              <p className="mt-1 text-sm text-white/70">
                ≈ ${wallet.usdValue.toFixed(2)} USD
              </p>
            </div>
            <div className="rounded-full bg-white/20 p-4">
              <Coins className="h-8 w-8" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/20 pt-4">
            <div>
              <p className="text-xs text-white/70">Available</p>
              <p className="font-semibold">{wallet.availableBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Locked</p>
              <p className="font-semibold">{wallet.lockedBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-white/70">Exchange Rate</p>
              <p className="font-semibold">${config.exchangeRate}/ADV</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
          <Send className="h-5 w-5" />
          <span>Transfer</span>
        </Button>
        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
          <ArrowUpRight className="h-5 w-5" />
          <span>Withdraw</span>
        </Button>
        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4">
          <Wallet className="h-5 w-5" />
          <span>Cash Out</span>
        </Button>
        <Button variant="outline" className="flex flex-col gap-2 h-auto py-4" onClick={fetchWallet}>
          <RefreshCw className="h-5 w-5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Lifetime Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-emerald-600">
                {wallet.lifetimeEarned.toLocaleString()} {wallet.tokenSymbol}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Lifetime Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">
                {wallet.lifetimeSpent.toLocaleString()} {wallet.tokenSymbol}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest token activity</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No transactions yet</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        tx.amount > 0
                          ? 'bg-emerald-100 dark:bg-emerald-950'
                          : 'bg-red-100 dark:bg-red-950'
                      }`}
                    >
                      {tx.amount > 0 ? (
                        <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-slate-500">
                        {tx.description || new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ADV
                    </p>
                    {tx.fee > 0 && (
                      <p className="text-xs text-slate-500">Fee: {tx.fee} ADV</p>
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
