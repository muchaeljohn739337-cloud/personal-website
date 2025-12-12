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
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// eslint-disable-next-line import/no-unresolved
import { PremiumBadge } from '@/components/PremiumBadge';
// eslint-disable-next-line import/no-unresolved
import { Button } from '@/components/ui/button';
// eslint-disable-next-line import/no-unresolved
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// eslint-disable-next-line import/no-unresolved
import { EnhancedDropdown, type DropdownOption } from '@/components/ui/enhanced-dropdown';

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
  SUPER_ADMIN:
    'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-300/50 dark:ring-red-400/30',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  MODERATOR: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  USER: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default function AdminUsersPage() {
  const router = useRouter();
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

  const roleOptions: DropdownOption[] = [
    { value: '', label: 'All Roles', icon: <Users className="h-4 w-4" /> },
    { value: 'USER', label: 'User', icon: <Users className="h-4 w-4" /> },
    { value: 'MODERATOR', label: 'Moderator', icon: <Shield className="h-4 w-4" /> },
    { value: 'ADMIN', label: 'Admin', icon: <Crown className="h-4 w-4" /> },
  ];

  const statusOptions: DropdownOption[] = [
    { value: '', label: 'All Status', icon: <Users className="h-4 w-4" /> },
    { value: 'false', label: 'Active', icon: <CheckCircle className="h-4 w-4" /> },
    { value: 'true', label: 'Suspended', icon: <Ban className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500">
            Manage all users and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => router.push('/admin/users/add')}
            className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:opacity-90 text-sm sm:text-base min-h-[44px] sm:min-h-[40px]"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button
            onClick={() => fetchUsers(pagination?.page || 1)}
            variant="outline"
            className="min-h-[44px] sm:min-h-[40px]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters - Mobile Responsive */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 sm:py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 min-h-[44px] sm:min-h-[40px]"
                />
              </div>
              <Button type="submit" className="min-h-[44px] sm:min-h-[40px]">
                <span className="hidden sm:inline">Search</span>
                <Search className="sm:hidden h-4 w-4" />
              </Button>
            </form>

            <div className="flex gap-2 sm:gap-4">
              <div className="flex-1 sm:flex-initial sm:w-40">
                <EnhancedDropdown
                  options={roleOptions}
                  value={roleFilter}
                  onChange={(val) => setRoleFilter(val as string)}
                  placeholder="Filter by role"
                  searchable
                  showIcons
                  className="w-full"
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-40">
                <EnhancedDropdown
                  options={statusOptions}
                  value={suspendedFilter}
                  onChange={(val) => setSuspendedFilter(val as string)}
                  placeholder="Filter by status"
                  searchable
                  showIcons
                  className="w-full"
                />
              </div>
            </div>
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
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="h-24 w-24 animate-spin-slow">
                  <svg viewBox="0 0 200 200" className="h-full w-full">
                    <defs>
                      <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="url(#loaderGradient)"
                      strokeWidth="4"
                      strokeDasharray="200 100"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 shadow-lg" />
                </div>
              </div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No users found</p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                        Role
                      </th>
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
                            {user.role === 'SUPER_ADMIN' && <PremiumBadge variant="icon" />}
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
                            {user.role === 'SUPER_ADMIN' && <PremiumBadge variant="compact" />}
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <Card key={user.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                            {user.image ? (
                              <img src={user.image} alt="" className="h-12 w-12 rounded-full" />
                            ) : (
                              <span className="text-base font-medium">
                                {user.name?.[0] || user.email[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name || 'No name'}</p>
                            <p className="text-sm text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="relative flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setShowActionMenu(showActionMenu === user.id ? null : user.id)
                            }
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                          {showActionMenu === user.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px]"
                                onClick={() => setShowActionMenu(null)}
                              >
                                <Edit className="h-4 w-4" />
                                View Details
                              </Link>
                              {!user.isVerified && (
                                <button
                                  onClick={() => {
                                    handleAction(user.id, 'verify');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px]"
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
                                    setShowActionMenu(null);
                                  }
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px]"
                              >
                                <Shield className="h-4 w-4" />
                                {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                              </button>
                              {user.isSuspended ? (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reason for unsuspending:');
                                    if (reason) {
                                      handleAction(user.id, 'unsuspend', { reason });
                                      setShowActionMenu(null);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px]"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Unsuspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    const reason = prompt('Reason for suspension:');
                                    if (reason) {
                                      handleAction(user.id, 'suspend', {
                                        reason,
                                        type: 'TEMPORARY',
                                      });
                                      setShowActionMenu(null);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px]"
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
                                    setShowActionMenu(null);
                                  }
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px]"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {user.role === 'SUPER_ADMIN' && <PremiumBadge variant="icon" />}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${roleColors[user.role]}`}
                          >
                            {user.role === 'SUPER_ADMIN' && <Crown className="h-3 w-3" />}
                            {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role}
                          </span>
                          {user.isSuspended ? (
                            <span className="flex items-center gap-1 text-red-600 text-xs">
                              <Ban className="h-3 w-3" />
                              Suspended
                            </span>
                          ) : user.isVerified ? (
                            <span className="flex items-center gap-1 text-emerald-600 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Unverified</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          <p>
                            {user._count.cryptoPayments} payments • {user._count.medBedBookings}{' '}
                            bookings
                          </p>
                          <p>Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
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
