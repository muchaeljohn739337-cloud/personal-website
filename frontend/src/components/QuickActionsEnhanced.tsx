"use client";

import { safeRedirect, TRUSTED_REDIRECT_DOMAINS } from "@/utils/security";
import { useEffect, useState } from "react";
import SendTransaction from "./SendTransaction";

export default function QuickActions() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const userEmail =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

  const handleCopyUserId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      alert("User ID copied to clipboard!");
    }
  };

  const handleCopyEmail = () => {
    if (userEmail) {
      navigator.clipboard.writeText(userEmail);
      alert("Email copied to clipboard!");
    }
  };

  const handleTopUp = async (amount?: number) => {
    const enteredAmount = amount || prompt("Enter amount to add (USD):", "50");
    if (!enteredAmount) return;

    const parsedAmount = parseFloat(enteredAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/payments/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parsedAmount,
          metadata: {
            userId,
            email: userEmail,
            source: "quick-actions",
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to create checkout session");

      const data = await response.json();
      if (data.url) {
        try {
          safeRedirect(data.url, TRUSTED_REDIRECT_DOMAINS);
        } catch {
          alert("Invalid checkout URL received. Please try again.");
        }
      }
    } catch (error) {
      console.error("Top-up error:", error);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  const handleExchange = async (fromCurrency, toCurrency, amount) => {
    if (!fromCurrency || !toCurrency || !amount) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_URL}/api/exchange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromCurrency,
          toCurrency,
          amount,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Exchange failed");

      const data = await response.json();
      alert(`Exchange successful: ${data.message}`);
    } catch (error) {
      console.error("Exchange error:", error);
      alert("Failed to complete exchange. Please try again.");
    }
  };

  const toggleTopUpModal = () => setShowTopUpModal((prev) => !prev);

  useEffect(() => {
    if (!userId || !userEmail) {
      alert("User ID or Email is missing. Please log in again.");
    }
  }, [userId, userEmail]);

  return (
    <>
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Send Money */}
          <button
            title="Send Money"
            onClick={() => setShowSendModal(true)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105 flex flex-col items-center gap-2"
          >
            <svg
              className="w-8 h-8"
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
            <span className="font-medium text-sm">Send</span>
          </button>

          {/* Receive Money */}
          <button
            title="Receive Money"
            onClick={() => setShowReceiveModal(true)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105 flex flex-col items-center gap-2"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            <span className="font-medium text-sm">Receive</span>
          </button>

          {/* Top Up */}
          <button
            title="Top Up Wallet"
            onClick={toggleTopUpModal}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105 flex flex-col items-center gap-2"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="font-medium text-sm">Top Up</span>
          </button>

          {/* Exchange */}
          <button
            title="Exchange Currency"
            onClick={() => setShowExchangeModal(true)}
            className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all hover:scale-105 flex flex-col items-center gap-2"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <span className="font-medium text-sm">Exchange</span>
          </button>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Send Money</h3>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <SendTransaction onSuccess={() => setShowSendModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Receive Money</h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Your User ID</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-sm font-mono">
                    {userId}
                  </code>
                  <button
                    onClick={handleCopyUserId}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Your Email</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-sm">
                    {userEmail}
                  </code>
                  <button
                    onClick={handleCopyEmail}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Share your User ID or Email with
                  others so they can send you money directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Top Up</h3>
              <button
                onClick={toggleTopUpModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose an amount to add to your account balance.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTopUp(10)}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-all"
                >
                  $10
                </button>
                <button
                  onClick={() => handleTopUp(25)}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-all"
                >
                  $25
                </button>
                <button
                  onClick={() => handleTopUp(50)}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition-all"
                >
                  $50
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={toggleTopUpModal}
                  className="mt-4 px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Modal */}
      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Exchange Currency</h3>
              <button
                onClick={() => setShowExchangeModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close Exchange Modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select the currencies and amount to exchange.
              </p>

              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="From Currency (e.g., USD)"
                  className="border border-gray-300 rounded-lg p-2"
                  id="fromCurrency"
                />
                <input
                  type="text"
                  placeholder="To Currency (e.g., EUR)"
                  className="border border-gray-300 rounded-lg p-2"
                  id="toCurrency"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  className="border border-gray-300 rounded-lg p-2"
                  id="amount"
                />
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    const fromCurrency =
                      document.getElementById("fromCurrency").value;
                    const toCurrency =
                      document.getElementById("toCurrency").value;
                    const amount = document.getElementById("amount").value;
                    handleExchange(fromCurrency, toCurrency, amount);
                  }}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
                  title="Perform Exchange"
                >
                  Exchange Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
