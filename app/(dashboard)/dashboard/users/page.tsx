'use client';

import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Crown,
  Eye,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  emailVerified: string | null;
  isSuspended: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  _count?: {
    transactions: number;
    wallets: number;
  };
}

interface PendingUser {
  id: string;
  email: string;
  name?: string;
  registeredAt: string;
  status: string;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
  newThisWeek: number;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter === 'suspended' && { suspended: 'true' }),
        ...(statusFilter === 'active' && { suspended: 'false' }),
      });

      const [usersRes, pendingRes] = await Promise.all([
        fetch(`/api/admin/users?${params}`),
        fetch('/api/admin/users/approval'),
      ]);

      const usersData = await usersRes.json();
      const pendingData = await pendingRes.json();

      setUsers(usersData.users || []);
      setTotalPages(usersData.totalPages || 1);
      setPendingUsers(pendingData.pending || []);

      // Calculate stats
      const allUsers = usersData.users || [];
      setStats({
        total: usersData.total || allUsers.length,
        active: allUsers.filter((u: UserData) => !u.isSuspended).length,
        suspended: allUsers.filter((u: UserData) => u.isSuspended).length,
        admins: allUsers.filter((u: UserData) => u.role === 'ADMIN').length,
        newThisWeek: allUsers.filter((u: UserData) => {
          const created = new Date(u.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (userId: string, action: string, data?: Record<string, unknown>) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      if (res.ok) {
        await fetchUsers();
        setShowUserModal(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproval = async (userId: string, approve: boolean, reason?: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approve ? 'approve' : 'reject',
          userId,
          reason,
        }),
      });

      if (res.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchUsers();
        setShowUserModal(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <Crown className="h-3 w-3" /> Admin
          </span>
        );
      case 'MODERATOR':
        return (
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Shield className="h-3 w-3" /> Moderator
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <User className="h-3 w-3" /> User
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <Users className="h-8 w-8 text-purple-500" />
            User Management
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-slate-500">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.active || 0}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.suspended || 0}</p>
                <p className="text-sm text-slate-500">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.admins || 0}</p>
                <p className="text-sm text-slate-500">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.newThisWeek || 0}</p>
                <p className="text-sm text-slate-500">New This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card className="border-2 border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Approvals ({pendingUsers.length})
            </CardTitle>
            <CardDescription>Users waiting for account approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingUsers.slice(0, 6).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div>
                    <p className="font-medium">{user.name || 'New User'}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(user.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleApproval(user.id, true)}
                      disabled={actionLoading === user.id}
                      className="h-8 w-8 bg-green-500 p-0 hover:bg-green-600"
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reason = prompt('Rejection reason (optional):');
                        handleApproval(user.id, false, reason || undefined);
                      }}
                      disabled={actionLoading === user.id}
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border py-2 pl-10 pr-4 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="appearance-none rounded-lg border bg-white py-2 pl-3 pr-10 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Roles</option>
                <option value="USER">Users</option>
                <option value="ADMIN">Admins</option>
                <option value="MODERATOR">Moderators</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border bg-white py-2 pl-3 pr-10 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-slate-500 dark:border-slate-700">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Verified</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b dark:border-slate-700">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {user.image ? (
                              <img src={user.image} alt="" className="h-10 w-10 rounded-full" />
                            ) : (
                              <span className="text-sm font-bold">
                                {(user.name || user.email)[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.name || 'No Name'}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">{getRoleBadge(user.role)}</td>
                      <td className="py-4">
                        {user.isSuspended ? (
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="h-4 w-4" /> Suspended
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle className="h-4 w-4" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {user.emailVerified ? (
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        )}
                      </td>
                      <td className="py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserModal(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
                              if (confirm(`Change role to ${newRole}?`)) {
                                handleAction(user.id, 'changeRole', { role: newRole });
                              }
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                          {user.isSuspended ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const reason = prompt('Unsuspend reason:');
                                if (reason) handleAction(user.id, 'unsuspend', { reason });
                              }}
                              className="h-8 w-8 p-0 text-green-500"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const reason = prompt('Suspension reason:');
                                if (reason) {
                                  handleAction(user.id, 'suspend', {
                                    reason,
                                    type: 'TEMPORARY',
                                  });
                                }
                              }}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(user.id)}
                            className="h-8 w-8 p-0 text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">User Details</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowUserModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl font-bold">
                  {selectedUser.image ? (
                    <img src={selectedUser.image} alt="" className="h-16 w-16 rounded-full" />
                  ) : (
                    (selectedUser.name || selectedUser.email)[0].toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedUser.name || 'No Name'}</h3>
                  <p className="text-slate-500">{selectedUser.email}</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-medium">{selectedUser.isSuspended ? 'Suspended' : 'Active'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email Verified</p>
                  <p className="font-medium">{selectedUser.emailVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Joined</p>
                  <p className="font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Last Login</p>
                  <p className="font-medium">
                    {selectedUser.lastLoginAt
                      ? new Date(selectedUser.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const newRole = selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
                    handleAction(selectedUser.id, 'changeRole', { role: newRole });
                  }}
                  disabled={actionLoading === selectedUser.id}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  {selectedUser.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                </Button>

                {!selectedUser.emailVerified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(selectedUser.id, 'verify')}
                    disabled={actionLoading === selectedUser.id}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Verify Email
                  </Button>
                )}

                {selectedUser.isSuspended ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600"
                    onClick={() => {
                      const reason = prompt('Unsuspend reason:');
                      if (reason) handleAction(selectedUser.id, 'unsuspend', { reason });
                    }}
                    disabled={actionLoading === selectedUser.id}
                  >
                    <UserCheck className="mr-2 h-4 w-4" />
                    Unsuspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => {
                      const reason = prompt('Suspension reason:');
                      if (reason) {
                        handleAction(selectedUser.id, 'suspend', { reason, type: 'TEMPORARY' });
                      }
                    }}
                    disabled={actionLoading === selectedUser.id}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(selectedUser.id)}
                  disabled={actionLoading === selectedUser.id}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
