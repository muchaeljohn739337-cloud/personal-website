"use client";

import AdminNotifyLite from "@/components/AdminNotifyLite";
import RecentBulkCredits from "@/components/RecentBulkCredits";
import SidebarLayout from "@/components/SidebarLayout";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Ban,
  BarChart3,
  CheckCircle,
  Database,
  DollarSign,
  Eye,
  Lock,
  Server,
  Settings,
  Shield,
  TrendingUp,
  Unlock,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended" | "pending";
  balance: number;
  joinedDate: string;
  lastActive: string;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  suspendedUsers: number;
  pendingApprovals: number;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const sessionUser = session?.user as SessionUser | undefined;

  const [selectedTab, setSelectedTab] = useState<
    "overview" | "users" | "security" | "system"
  >("overview");
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<string>("");
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "user",
      status: "active",
      balance: 5250.0,
      joinedDate: "2025-01-15",
      lastActive: "2025-10-16 08:30",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "user",
      status: "active",
      balance: 3420.5,
      joinedDate: "2025-02-20",
      lastActive: "2025-10-15 14:22",
    },
    {
      id: "3",
      name: "Bob Wilson",
      email: "bob@example.com",
      role: "user",
      status: "suspended",
      balance: 120.0,
      joinedDate: "2025-03-10",
      lastActive: "2025-10-10 09:15",
    },
    {
      id: "4",
      name: "Admin User",
      email: "admin@advancia.com",
      role: "admin",
      status: "active",
      balance: 0,
      joinedDate: "2025-01-01",
      lastActive: "2025-10-16 10:00",
    },
  ]);

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 4,
    activeUsers: 3,
    totalTransactions: 1247,
    totalVolume: 156780.5,
    suspendedUsers: 1,
    pendingApprovals: 2,
  });

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    // Check if user has admin role
    const isAdmin =
      sessionUser?.role === "admin" ||
      sessionUser?.email === "admin@advancia.com" ||
      sessionUser?.email?.includes("admin");

    if (!isAdmin) {
      alert("⛔ Access Denied: Admin privileges required");
      router.push("/");
      return;
    }
  }, [session, status, router, sessionUser]);

  const handleSuspendUser = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "suspended" ? "active" : "suspended",
            }
          : user,
      ),
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      setUsers(users.filter((user) => user.id !== userId));
      setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
    }
  };

  const handleMakeAdmin = (userId: string) => {
    if (confirm("Grant admin privileges to this user?")) {
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: "admin" } : user,
        ),
      );
    }
  };

  const handleEditBalance = (userId: string, currentBalance: number) => {
    setEditingBalance(userId);
    setNewBalance(currentBalance.toString());
  };

  const handleSaveBalance = (userId: string) => {
    const parsedBalance = parseFloat(newBalance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      alert("⚠️ Please enter a valid positive number");
      return;
    }

    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, balance: parsedBalance } : user,
      ),
    );

    // Update total volume in stats
    const totalBalance = users.reduce(
      (sum, user) =>
        user.id === userId ? sum + parsedBalance : sum + user.balance,
      0,
    );
    setStats({ ...stats, totalVolume: totalBalance });

    setEditingBalance(null);
    setNewBalance("");

    // Show success message
    const user = users.find((u) => u.id === userId);
    alert(
      `✅ Balance updated for ${
        user?.name
      }\nNew balance: $${parsedBalance.toFixed(2)}`,
    );
  };

  const handleCancelEdit = () => {
    setEditingBalance(null);
    setNewBalance("");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "users" as const, label: "User Management", icon: Users },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "system" as const, label: "System", icon: Server },
  ];

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-red-500" size={40} />
              <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-slate-300">
              Restricted access - Administrator: {sessionUser?.email}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white"
            >
              <Users size={32} className="mb-4 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Total Users</p>
              <p className="text-4xl font-bold">{stats.totalUsers}</p>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <TrendingUp size={16} />
                <span>{stats.activeUsers} Active</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white"
            >
              <Activity size={32} className="mb-4 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Transactions</p>
              <p className="text-4xl font-bold">
                {stats.totalTransactions.toLocaleString()}
              </p>
              <p className="text-sm mt-2 opacity-90">All time</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white"
            >
              <DollarSign size={32} className="mb-4 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Total Volume</p>
              <p className="text-4xl font-bold">
                ${(stats.totalVolume / 1000).toFixed(1)}K
              </p>
              <p className="text-sm mt-2 opacity-90">USD</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl p-6 text-white"
            >
              <Ban size={32} className="mb-4 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Suspended Users</p>
              <p className="text-4xl font-bold">{stats.suspendedUsers}</p>
              <p className="text-sm mt-2 opacity-90">Requires review</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl p-6 text-white"
            >
              <AlertCircle size={32} className="mb-4 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Pending Approvals</p>
              <p className="text-4xl font-bold">{stats.pendingApprovals}</p>
              <p className="text-sm mt-2 opacity-90">Action required</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-6 text-white"
            >
              <Database size={32} className="mb-4 opacity-80" />
              <p className="text-sm opacity-90 mb-1">Database Status</p>
              <p className="text-2xl font-bold flex items-center gap-2">
                <CheckCircle size={24} />
                Healthy
              </p>
              <p className="text-sm mt-2 opacity-90">All systems operational</p>
            </motion.div>
          </div>

          {/* Notification System Widget */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <AdminNotifyLite />
            </motion.div>
          </div>

          {/* Bulk Credits Summary */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <RecentBulkCredits limit={5} />
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedTab === tab.id
                    ? "bg-white text-slate-900 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* User Management Tab */}
          {selectedTab === "users" && (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Users size={28} />
                  User Management
                </h2>
                <p className="text-slate-300 mt-2">
                  Manage user accounts, permissions, and access
                </p>
              </div>

              {/* Info Banner */}
              <div className="mx-6 mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <DollarSign
                    className="text-blue-600 flex-shrink-0 mt-1"
                    size={24}
                  />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Admin Access Required
                    </h3>
                    <p className="text-sm text-blue-700">
                      You can edit user balances directly. Click the{" "}
                      <Settings size={14} className="inline text-blue-600" />{" "}
                      icon next to any balance to modify it. Changes will be
                      reflected immediately in the system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          User
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Role
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">
                          Balance
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">
                          Last Active
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {user.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {user.email}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : user.status === "suspended"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {user.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-slate-800">
                            {editingBalance === user.id ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-slate-500">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={newBalance}
                                  onChange={(e) =>
                                    setNewBalance(e.target.value)
                                  }
                                  className="w-32 px-3 py-1 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-right"
                                  autoFocus
                                  aria-label="Edit user balance"
                                  placeholder="0.00"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleSaveBalance(user.id);
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveBalance(user.id)}
                                  className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors text-sm font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <span>
                                  $
                                  {user.balance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                                <button
                                  onClick={() =>
                                    handleEditBalance(user.id, user.balance)
                                  }
                                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                                  title="Edit Balance"
                                >
                                  <Settings
                                    size={16}
                                    className="text-blue-600"
                                  />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {user.lastActive}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  alert(`Viewing details for ${user.name}`)
                                }
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={18} className="text-blue-600" />
                              </button>
                              {user.role !== "admin" && (
                                <>
                                  <button
                                    onClick={() => handleSuspendUser(user.id)}
                                    className="p-2 hover:bg-yellow-100 rounded-lg transition-colors"
                                    title={
                                      user.status === "suspended"
                                        ? "Activate"
                                        : "Suspend"
                                    }
                                  >
                                    {user.status === "suspended" ? (
                                      <Unlock
                                        size={18}
                                        className="text-green-600"
                                      />
                                    ) : (
                                      <Lock
                                        size={18}
                                        className="text-yellow-600"
                                      />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleMakeAdmin(user.id)}
                                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                                    title="Make Admin"
                                  >
                                    <UserCheck
                                      size={18}
                                      className="text-purple-600"
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Delete User"
                                  >
                                    <UserX size={18} className="text-red-600" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {selectedTab === "security" && (
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                <Shield size={28} className="text-red-600" />
                Security Settings
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-600" size={24} />
                    <div>
                      <p className="font-semibold text-green-900">
                        Backend Protected
                      </p>
                      <p className="text-sm text-green-700">
                        Only admins can access backend endpoints
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="text-blue-600" size={24} />
                    <div>
                      <p className="font-semibold text-blue-900">
                        Role-Based Access Control
                      </p>
                      <p className="text-sm text-blue-700">
                        Users automatically restricted from admin features
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Settings className="text-purple-600" size={24} />
                    <div>
                      <p className="font-semibold text-purple-900">
                        Session Management
                      </p>
                      <p className="text-sm text-purple-700">
                        JWT tokens with 7-day expiration
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {selectedTab === "system" && (
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                <Server size={28} className="text-indigo-600" />
                System Status
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <p className="font-semibold text-slate-800 mb-2">
                    Frontend Server
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-semibold">
                      Online - Port 3000
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <p className="font-semibold text-slate-800 mb-2">
                    Backend Server
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-semibold">
                      Online - Port 4000
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <p className="font-semibold text-slate-800 mb-2">Database</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-600 font-semibold">
                      Offline - Using Mock Data
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <p className="font-semibold text-slate-800 mb-2">
                    Twilio API
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-semibold">
                      Connected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {selectedTab === "overview" && (
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">System Overview</h2>
              <p className="text-slate-600 mb-4">
                Welcome to the ADVANCIA PAYLEDGER Admin Panel. From here you
                can:
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>Manage user accounts and permissions</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>Monitor system security and access controls</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>View real-time system status and health</span>
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <CheckCircle className="text-green-500" size={20} />
                  <span>Control backend access and API endpoints</span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="text-red-600 flex-shrink-0 mt-1"
                    size={24}
                  />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">
                      Security Notice
                    </p>
                    <p className="text-sm text-red-700">
                      This admin panel is restricted to authorized
                      administrators only. Regular users attempting to access
                      this page will be automatically redirected. All admin
                      actions are logged for security auditing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
