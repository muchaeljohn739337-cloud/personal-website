"use client";

import AIInsightsWidget from "@/components/AIInsightsWidget";
import BalanceOverview from "@/components/BalanceOverview";
import DashboardRouteGuard from "@/components/DashboardRouteGuard";
import QuickActionsEnhanced from "@/components/QuickActionsEnhanced";
import RealTimeNotifications from "@/components/RealTimeNotifications";
import RecentTransactions from "@/components/RecentTransactions";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [userName, setUserName] = useState("User");
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  useEffect(() => {
    fetchUserInfo();
    fetchPendingItems();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.firstName || data.username || "User");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchPendingItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      // Fetch pending orders
      const ordersResponse = await fetch(`/api/crypto/orders/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        const pending = orders.filter(
          (o: { status: string }) => o.status === "PENDING",
        ).length;
        setPendingOrders(pending);
      }

      // Fetch pending withdrawals
      const withdrawalsResponse = await fetch(
        `/api/crypto/withdrawals/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (withdrawalsResponse.ok) {
        const withdrawals = await withdrawalsResponse.json();
        const pending = withdrawals.filter(
          (w: { status: string }) => w.status === "PENDING",
        ).length;
        setPendingWithdrawals(pending);
      }
    } catch (error) {
      console.error("Error fetching pending items:", error);
    }
  };

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Banner */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {getCurrentGreeting()}, {userName}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome to your dashboard. Here&apos;s an overview of your
                account.
              </p>
            </div>
            <RealTimeNotifications />
          </div>

          {/* Pending Alerts */}
          {(pendingOrders > 0 || pendingWithdrawals > 0) && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrders > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                        Pending Crypto Orders
                      </h3>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                        You have {pendingOrders} crypto purchase{" "}
                        {pendingOrders === 1 ? "order" : "orders"} awaiting
                        admin approval.
                      </p>
                      <a
                        href="/crypto/orders"
                        className="text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 mt-2 inline-block"
                      >
                        View Orders →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {pendingWithdrawals > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Pending Withdrawals
                      </h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                        You have {pendingWithdrawals} withdrawal{" "}
                        {pendingWithdrawals === 1 ? "request" : "requests"}{" "}
                        being processed.
                      </p>
                      <a
                        href="/crypto/withdrawals"
                        className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 mt-2 inline-block"
                      >
                        View Withdrawals →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Balance Overview */}
          <div className="mb-8">
            <BalanceOverview />
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <QuickActionsEnhanced />
          </div>

          {/* AI Insights */}
          <div className="mb-8">
            <AIInsightsWidget />
          </div>

          {/* Recent Transactions */}
          <div className="mb-8">
            <RecentTransactions />
          </div>

          {/* Help Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Need Help?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  If you have questions about crypto trading, withdrawals, or
                  your account, our support team is here to help.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/support"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Contact Support
                  </a>
                  <a
                    href="/faq"
                    className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    View FAQ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
