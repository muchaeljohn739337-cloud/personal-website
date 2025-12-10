'use client';

import {
  ArrowLeft,
  Ban,
  CheckCircle,
  CreditCard,
  Crown,
  Edit,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PremiumBadge } from '@/components/PremiumBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserDetails {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  phone: string | null;
  isSuspended: boolean;
  isVerified: boolean;
  isApproved: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tokenWallet: {
    balance: number;
  } | null;
  cryptoPayments: Array<{
    id: string;
    amountUsd: number;
    status: string;
    createdAt: string;
  }>;
  medBedBookings: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
  suspensions: Array<{
    id: string;
    reason: string;
    type: string;
    createdAt: string;
  }>;
  actionsReceived: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string;
    admin: {
      name: string | null;
      email: string;
    };
  }>;
  _count: {
    wallets: number;
    sentTransactions: number;
    receivedTransactions: number;
    medBedSessions: number;
    cryptoPayments: number;
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    try {
      setIsActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      await fetchUser();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-500">{error || 'User not found'}</p>
        <Button variant="outline" onClick={() => router.push('/admin/users')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {user.name || 'No name'}
            </h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchUser}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Premium Banner for SUPER_ADMIN */}
      {user.role === 'SUPER_ADMIN' && (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-50/50 via-yellow-50/50 to-amber-50/50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-amber-950/30">
          <CardContent className="p-6">
            <PremiumBadge variant="banner" />
          </CardContent>
        </Card>
      )}

      {/* User Info Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className={`lg:col-span-2 ${user.role === 'SUPER_ADMIN' ? 'border-amber-500/20 shadow-lg shadow-amber-500/10' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              User Information
              {user.role === 'SUPER_ADMIN' && (
                <PremiumBadge variant="icon" />
              )}
            </CardTitle>
            <CardDescription>Basic user details and account status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                {user.image ? (
                  <img src={user.image} alt="" className="h-20 w-20 rounded-full" />
                ) : (
                  <span className="text-2xl font-medium">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Premium Badge for SUPER_ADMIN */}
                  {user.role === 'SUPER_ADMIN' && (
                    <PremiumBadge variant="default" />
                  )}
                  
                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                      user.role === 'SUPER_ADMIN'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-300/50 dark:ring-red-400/30'
                        : user.role === 'ADMIN'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : user.role === 'MODERATOR'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {user.role === 'SUPER_ADMIN' && <Crown className="h-3.5 w-3.5" />}
                    {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role}
                  </span>
                  
                  {user.isSuspended && (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-300">
                      <Ban className="h-4 w-4" />
                      Suspended
                    </span>
                  )}
                  {user.isVerified && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle className="h-4 w-4" />
                      Verified
                    </span>
                  )}
                  {!user.isApproved && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-500">Email</label>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{user.email}</span>
                </div>
              </div>
              {user.phone && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Phone</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-slate-500">Joined</label>
                <p className="mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              {user.lastLoginAt && (
                <div>
                  <label className="text-sm font-medium text-slate-500">Last Login</label>
                  <p className="mt-1">{new Date(user.lastLoginAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">Wallets</span>
              <span className="font-semibold">{user._count.wallets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payments</span>
              <span className="font-semibold">{user._count.cryptoPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bookings</span>
              <span className="font-semibold">{user._count.medBedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transactions</span>
              <span className="font-semibold">
                {user._count.sentTransactions + user._count.receivedTransactions}
              </span>
            </div>
            {user.tokenWallet && (
              <div className="flex justify-between border-t pt-4">
                <span className="text-slate-500">Token Balance</span>
                <span className="font-semibold">{user.tokenWallet.balance.toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage user account and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {!user.isVerified && (
              <Button
                variant="outline"
                onClick={() => handleAction('verify')}
                disabled={isActionLoading}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Verify Email
              </Button>
            )}
            {!user.isApproved && (
              <Button
                variant="outline"
                onClick={() => handleAction('approve')}
                disabled={isActionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve User
              </Button>
            )}
            {!user.isSuspended ? (
              <Button
                variant="outline"
                onClick={() => {
                  const reason = prompt('Suspension reason:');
                  if (reason) {
                    handleAction('suspend', {
                      reason,
                      type: 'TEMPORARY',
                    });
                  }
                }}
                disabled={isActionLoading}
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  const reason = prompt('Unsuspension reason:');
                  if (reason) {
                    handleAction('unsuspend', { reason });
                  }
                }}
                disabled={isActionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Unsuspend
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                const newRole = prompt('New role (USER, MODERATOR, ADMIN):');
                if (newRole && ['USER', 'MODERATOR', 'ADMIN'].includes(newRole)) {
                  handleAction('changeRole', { role: newRole });
                }
              }}
              disabled={isActionLoading}
            >
              <Shield className="mr-2 h-4 w-4" />
              Change Role
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const amount = prompt('Token amount to adjust (positive to add, negative to remove):');
                if (amount) {
                  handleAction('adjustBalance', { amount: parseFloat(amount) });
                }
              }}
              disabled={isActionLoading}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Adjust Tokens
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                  handleAction('delete');
                }
              }}
              disabled={isActionLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {user.cryptoPayments.length > 0 ? (
              <div className="space-y-3">
                {user.cryptoPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">${payment.amountUsd.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        payment.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No payments yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {user.actionsReceived.length > 0 ? (
              <div className="space-y-3">
                {user.actionsReceived.map((action) => (
                  <div key={action.id} className="border-b pb-3">
                    <p className="font-medium">{action.action}</p>
                    <p className="text-sm text-slate-500">{action.details}</p>
                    <p className="text-xs text-slate-400">
                      by {action.admin.name || action.admin.email} on{' '}
                      {new Date(action.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No admin actions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suspensions */}
      {user.suspensions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suspension History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.suspensions.map((suspension) => (
                <div key={suspension.id} className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{suspension.type}</span>
                    <span className="text-sm text-slate-500">
                      {new Date(suspension.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{suspension.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

