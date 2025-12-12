"use client";

import RealTimeNotifications from "@/components/RealTimeNotifications";
import SendTransaction from "@/components/SendTransaction";
import SidebarLayout from "@/components/SidebarLayout";
import TransactionHistory from "@/components/TransactionHistory";
import { useState } from "react";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<"history" | "send">("history");

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Notifications */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Transactions
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your transactions and send money
              </p>
            </div>
            <RealTimeNotifications />
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab("history")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "history"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Transaction History
                </span>
              </button>
              <button
                onClick={() => setActiveTab("send")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "send"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Send Money
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "history" && <TransactionHistory />}
            {activeTab === "send" && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <SendTransaction />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Total Sent
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">$0.00</p>
                </div>
                <div className="text-4xl">📤</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Total Received
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    $0.00
                  </p>
                </div>
                <div className="text-4xl">📥</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    $0.00
                  </p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Security Tips for Transactions
                </h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>
                    • Always verify recipient details before sending money
                  </li>
                  <li>• Check transaction status in real-time</li>
                  <li>• Enable 2FA for additional security</li>
                  <li>• Contact support if you notice suspicious activity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
