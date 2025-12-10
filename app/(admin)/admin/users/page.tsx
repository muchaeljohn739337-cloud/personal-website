'use client';

import {
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Edit,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { PremiumBadge } from '@/components/PremiumBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isSuspended: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    wallets: number;
    medBedBookings: number;
    cryptoPayments: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-300/50 dark:ring-red-400/30',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  MODERATOR: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  USER: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [suspendedFilter, setSuspendedFilter] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (suspendedFilter) params.set('suspended', suspendedFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, suspendedFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleAction = async (userId: string, action: string, data?: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Action failed');
        return;
      }

      fetchUsers(pagination?.page || 1);
      setShowActionMenu(null);
    } catch (error) {
      console.error('Action error:', error);
      alert('Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="mt-1 text-slate-500">Manage all users and their permissions</p>
        </div>
        <Button onClick={() => fetchUsers(pagination?.page || 1)} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={suspendedFilter}
              onChange={(e) => setSuspendedFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="">All Status</option>
              <option value="false">Active</option>
              <option value="true">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({pagination?.total || 0})
          </CardTitle>
          <CardDescription>
            Click on a user to view details and manage their account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                      Activity
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            {user.image ? (
                              <img src={user.image} alt="" className="h-10 w-10 rounded-full" />
                            ) : (
                              <span className="text-sm font-medium">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.name || 'No name'}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === 'SUPER_ADMIN' && (
                            <PremiumBadge variant="icon" />
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${roleColors[user.role]}`}
                          >
                            {user.role === 'SUPER_ADMIN' && <Crown className="h-3 w-3" />}
                            {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === 'SUPER_ADMIN' && (
                            <PremiumBadge variant="compact" />
                          )}
                          {user.isSuspended ? (
                            <span className="flex items-center gap-1 text-red-600">
                              <Ban className="h-4 w-4" />
                              Suspended
                            </span>
                          ) : user.isVerified ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="h-4 w-4" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-slate-500">Unverified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>{user._count.cryptoPayments} payments</p>
                          <p className="text-slate-500">{user._count.medBedBookings} bookings</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowActionMenu(showActionMenu === user.id ? null : user.id)
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>

                          {showActionMenu === user.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Edit className="h-4 w-4" />
                                View Details
                              </Link>
                              {!user.isVerified && (
                                <button
                                  onClick={() => handleAction(user.id, 'verify')}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Verify Email
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
                                  if (confirm(`Change role to ${newRole}?`)) {
                                    handleAction(user.id, 'changeRole', { role: newRole });
                                  }
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Shield className="h-4 w-4" />
                                {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              {user.isSuspended ? (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reason for unsuspending:');
                                    if (reason) handleAction(user.id, 'unsuspend', { reason });
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Unsuspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reason for suspension:');
                                    if (reason)
                                      handleAction(user.id, 'suspend', {
                                        reason,
                                        type: 'TEMPORARY',
                                      });
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                  <Ban className="h-4 w-4" />
                                  Suspend
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      'Are you sure you want to delete this user? This cannot be undone.'
                                    )
                                  ) {
                                    handleAction(user.id, 'delete');
                                  }
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
