"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    username: string;
  };
  recipient?: {
    id: string;
    email: string;
    username: string;
  };
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all"); // all, sent, received
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, completed, pending, failed

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const response = await fetch(
        `${API_URL}/api/transactions?userId=${userId}&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const userId = localStorage.getItem("userId");

    // Type filter
    if (filter === "sent" && tx.sender?.id !== userId) return false;
    if (filter === "received" && tx.recipient?.id !== userId) return false;

    // Status filter
    if (statusFilter !== "all" && tx.status.toLowerCase() !== statusFilter)
      return false;

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "transfer":
      case "send":
        return "↗️";
      case "receive":
        return "↙️";
      case "deposit":
        return "💰";
      case "withdrawal":
        return "💸";
      case "purchase":
        return "🛒";
      default:
        return "💱";
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    if (currency === "USD") {
      return `$${num.toFixed(2)}`;
    }
    return `${num.toFixed(8)} ${currency}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <svg
            className="w-6 h-6 text-blue-600"
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
        </h2>
        <p className="text-gray-600 mt-1">
          View all your transactions and transfers
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("sent")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "sent"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilter("received")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "received"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Received
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "completed"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg">No transactions found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const userId = localStorage.getItem("userId");
            const isSent = tx.sender?.id === userId;
            const counterparty = isSent ? tx.recipient : tx.sender;

            return (
              <div
                key={tx.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Left side - Type & Details */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-3xl">{getTypeIcon(tx.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {tx.type}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                            tx.status,
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {tx.description || "No description"}
                      </p>
                      {counterparty && (
                        <p className="text-sm text-gray-500 mt-1">
                          {isSent ? "To: " : "From: "}
                          <span className="font-medium">
                            {counterparty.username || counterparty.email}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Amount */}
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        isSent ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isSent ? "-" : "+"}
                      {formatAmount(tx.amount, tx.currency)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{tx.currency}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {filteredTransactions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Showing {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
