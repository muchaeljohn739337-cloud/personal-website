"use client";

import RequireRole from "@/components/RequireRole";
import { adminApi } from "@/utils/api";
import {
  ArrowUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  GiftIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface TokenStats {
  totalSupply: string;
  totalInCirculation: string;
  totalLocked: string;
  activeUsers: number;
  totalTransactions: number;
  conversionRate: string;
}

interface RecentActivity {
  id: string;
  type: string;
  userId: string;
  userEmail: string;
  amount: string;
  timestamp: string;
  status: string;
}

interface TopHolder {
  userId: string;
  userEmail: string;
  balance: string;
  lifetimeEarned: string;
}

export default function AdminTokenFlowPage() {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [topHolders, setTopHolders] = useState<TopHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "holders"
  >("overview");

  // Reward sending form
  const [sendRewardForm, setSetRewardForm] = useState({
    userId: "",
    amount: "",
    title: "",
    description: "",
    expiresInDays: 30,
  });
  const [sendingReward, setSendingReward] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch token statistics
      const statsResponse: any = await adminApi.get("/tokens/admin/stats");
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Fetch recent activities
      const activityResponse: any = await adminApi.get(
        "/tokens/admin/recent-activity?limit=20",
      );
      if (activityResponse.data?.activities) {
        setActivities(activityResponse.data.activities);
      }

      // Fetch top holders
      const holdersResponse: any = await adminApi.get(
        "/tokens/admin/top-holders?limit=10",
      );
      if (holdersResponse.data?.holders) {
        setTopHolders(holdersResponse.data.holders);
      }
    } catch (error) {
      console.error("Error fetching token flow data:", error);
      toast.error("Failed to load token flow data");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReward = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !sendRewardForm.userId ||
      !sendRewardForm.amount ||
      !sendRewardForm.title
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSendingReward(true);

    try {
      const response: any = await adminApi.post(
        "/rewards/admin/send",
        sendRewardForm,
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setSetRewardForm({
          userId: "",
          amount: "",
          title: "",
          description: "",
          expiresInDays: 30,
        });
        fetchData(); // Refresh data
      }
    } catch (error: any) {
      console.error("Error sending reward:", error);
      toast.error(error.response?.data?.error || "Failed to send reward");
    } finally {
      setSendingReward(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading token flow data...</div>
      </div>
    );
  }

  return (
    <RequireRole role="ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              🪙 Advancia Token Flow
            </h1>
            <p className="text-gray-300">
              Real-time overview of token circulation, transactions, and user
              activity
            </p>
          </motion.div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Supply"
              value={stats?.totalSupply || "0"}
              icon={BanknotesIcon}
              color="blue"
            />
            <StatCard
              title="In Circulation"
              value={stats?.totalInCirculation || "0"}
              icon={ArrowUpIcon}
              color="green"
            />
            <StatCard
              title="Locked Tokens"
              value={stats?.totalLocked || "0"}
              icon={ClockIcon}
              color="yellow"
            />
            <StatCard
              title="Active Users"
              value={stats?.activeUsers?.toLocaleString() || "0"}
              icon={UsersIcon}
              color="purple"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === "activity"}
              onClick={() => setActiveTab("activity")}
            >
              Recent Activity
            </TabButton>
            <TabButton
              active={activeTab === "holders"}
              onClick={() => setActiveTab("holders")}
            >
              Top Holders
            </TabButton>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Reward Form */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <GiftIcon className="w-6 h-6 mr-2" />
                  Send Reward to User
                </h2>
                <form onSubmit={handleSendReward} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      User ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={sendRewardForm.userId}
                      onChange={(e) =>
                        setSetRewardForm({
                          ...sendRewardForm,
                          userId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter user ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (Tokens) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sendRewardForm.amount}
                      onChange={(e) =>
                        setSetRewardForm({
                          ...sendRewardForm,
                          amount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={sendRewardForm.title}
                      onChange={(e) =>
                        setSetRewardForm({
                          ...sendRewardForm,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Welcome Bonus"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={sendRewardForm.description}
                      onChange={(e) =>
                        setSetRewardForm({
                          ...sendRewardForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Expires In (Days)
                    </label>
                    <input
                      type="number"
                      value={sendRewardForm.expiresInDays}
                      onChange={(e) =>
                        setSetRewardForm({
                          ...sendRewardForm,
                          expiresInDays: parseInt(e.target.value) || 30,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingReward}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReward ? "Sending..." : "Send Reward"}
                  </button>
                </form>
              </motion.div>

              {/* Token Economics */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <ChartBarIcon className="w-6 h-6 mr-2" />
                  Token Economics
                </h2>
                <div className="space-y-4">
                  <EconomicStat
                    label="Total Transactions"
                    value={stats?.totalTransactions?.toLocaleString() || "0"}
                  />
                  <EconomicStat
                    label="Conversion Rate"
                    value={`1 token = $${stats?.conversionRate || "0.10"} USD`}
                  />
                  <EconomicStat
                    label="Circulation Rate"
                    value={
                      stats?.totalSupply && stats?.totalInCirculation
                        ? `${(
                            (parseFloat(stats.totalInCirculation) /
                              parseFloat(stats.totalSupply)) *
                            100
                          ).toFixed(2)}%`
                        : "0%"
                    }
                  />
                  <EconomicStat
                    label="Lock Rate"
                    value={
                      stats?.totalSupply && stats?.totalLocked
                        ? `${(
                            (parseFloat(stats.totalLocked) /
                              parseFloat(stats.totalSupply)) *
                            100
                          ).toFixed(2)}%`
                        : "0%"
                    }
                  />
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "activity" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Recent Token Activity
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-white/20">
                    <tr className="text-gray-300 text-sm">
                      <th className="pb-3">Type</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr
                        key={activity.id}
                        className="border-b border-white/10"
                      >
                        <td className="py-3">
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                            {activity.type}
                          </span>
                        </td>
                        <td className="py-3 text-gray-300">
                          {activity.userEmail}
                        </td>
                        <td className="py-3 text-white font-semibold">
                          {activity.amount}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              activity.status === "COMPLETED"
                                ? "bg-green-500/20 text-green-300"
                                : activity.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {activity.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 text-sm">
                          {new Date(activity.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "holders" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Top Token Holders
              </h2>
              <div className="space-y-4">
                {topHolders.map((holder, index) => (
                  <div
                    key={holder.userId}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {holder.userEmail}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Lifetime Earned: {holder.lifetimeEarned}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {holder.balance}
                      </div>
                      <div className="text-gray-400 text-sm">tokens</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </RequireRole>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  color: "blue" | "green" | "yellow" | "purple";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    yellow: "from-yellow-500 to-orange-500",
    purple: "from-purple-500 to-pink-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div
          className={`w-14 h-14 rounded-full bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
        active
          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          : "bg-white/5 text-gray-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function EconomicStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
      <span className="text-gray-300">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
