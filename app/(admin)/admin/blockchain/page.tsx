'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bitcoin,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BlockchainStats {
  totalWallets: number;
  activeWallets: number;
  totalTransactions: number;
  totalVolumeUsd: number;
  pendingTransactions: number;
  failedTransactions: number;
  networks: Array<{
    name: string;
    wallets: number;
    transactions: number;
    volume: number;
  }>;
}

interface RecentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  network: string;
  amount: string;
  amountUsd: number;
  txHash: string;
  status: string;
  createdAt: string;
}

export default function AdminBlockchainPage() {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, txRes] = await Promise.all([
        fetch('/api/admin/blockchain/stats'),
        fetch('/api/admin/blockchain/transactions?limit=10'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch blockchain data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blockchain & Web3 Management</h1>
          <p className="mt-1 text-slate-500">Monitor wallets, transactions, and network activity</p>
        </div>
        <Button onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalWallets || 0}</p>
              <p className="text-sm text-slate-500">Total Wallets</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.activeWallets || 0}</p>
              <p className="text-sm text-slate-500">Active Wallets</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-950">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalTransactions || 0}</p>
              <p className="text-sm text-slate-500">Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${(stats?.totalVolumeUsd || 0).toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Volume</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Distribution */}
      {stats?.networks && stats.networks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Distribution</CardTitle>
            <CardDescription>Activity across different blockchain networks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.networks.map((network, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Bitcoin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{network.name}</p>
                      <p className="text-sm text-slate-500">
                        {network.wallets} wallets • {network.transactions} txs
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${network.volume.toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Volume</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Status */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-950">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.pendingTransactions || 0}</p>
              <p className="text-sm text-slate-500">Pending Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.failedTransactions || 0}</p>
              <p className="text-sm text-slate-500">Failed Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest blockchain activity from users</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                    <th className="pb-3 text-sm font-medium text-slate-500">User</th>
                    <th className="pb-3 text-sm font-medium text-slate-500">Type</th>
                    <th className="pb-3 text-sm font-medium text-slate-500">Network</th>
                    <th className="pb-3 text-sm font-medium text-slate-500">Amount</th>
                    <th className="pb-3 text-sm font-medium text-slate-500">Status</th>
                    <th className="pb-3 text-sm font-medium text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{tx.userEmail}</p>
                          <p className="text-xs text-slate-500">{tx.userId.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-800">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm font-medium">{tx.network.toUpperCase()}</span>
                      </td>
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{tx.amount}</p>
                          <p className="text-xs text-slate-500">${tx.amountUsd.toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            tx.status === 'completed'
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : tx.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alchemy Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Alchemy Web3 Integration</CardTitle>
          <CardDescription>Web3 infrastructure provider status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">API Status</p>
                  <p className="text-sm text-slate-500">Alchemy Node Provider</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Connected
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500">Supported Networks</p>
                <p className="mt-1 text-2xl font-bold">5</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500">API Calls Today</p>
                <p className="mt-1 text-2xl font-bold">847</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500">Response Time</p>
                <p className="mt-1 text-2xl font-bold">124ms</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
