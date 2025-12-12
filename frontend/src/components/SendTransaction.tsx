"use client";

import { useState } from "react";

interface SendTransactionProps {
  onSuccess?: () => void;
}

export default function SendTransaction({ onSuccess }: SendTransactionProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currencies = [
    { value: "USD", label: "USD - US Dollar", icon: "💵" },
    { value: "BTC", label: "BTC - Bitcoin", icon: "₿" },
    { value: "ETH", label: "ETH - Ethereum", icon: "Ξ" },
    { value: "USDT", label: "USDT - Tether", icon: "₮" },
    { value: "LTC", label: "LTC - Litecoin", icon: "Ł" },
  ];

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!recipient || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    if (!validateEmail(recipient)) {
      setError("Please enter a valid email address");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const senderId = localStorage.getItem("userId");

      // First, get recipient user ID by email
      const userSearchResponse = await fetch(
        `/api/users/search?email=${encodeURIComponent(recipient)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!userSearchResponse.ok) {
        throw new Error("Recipient not found");
      }

      const recipientData = await userSearchResponse.json();
      const recipientId = recipientData.id;

      // Create transaction
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId,
          recipientId,
          amount: amountNum,
          currency,
          description: description || `Transfer to ${recipient}`,
          type: "TRANSFER",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transaction failed");
      }

      const result = await response.json();
      console.log(result); // Use result for debugging or remove if unnecessary

      setSuccess(
        `✅ Successfully sent ${amountNum} ${currency} to ${recipient}`,
      );

      // Reset form
      setRecipient("");
      setAmount("");
      setDescription("");

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-lg">
          <svg
            className="w-6 h-6 text-white"
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
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Send Money</h2>
          <p className="text-sm text-gray-500">
            Transfer funds to another user
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Email *
          </label>
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="recipient@example.com"
            disabled={loading}
          />
        </div>

        {/* Currency Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency *
          </label>
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              disabled={loading}
              title="Transaction Type"
            >
              {currencies.map((curr) => (
                <option key={curr.value} value={curr.value}>
                  {curr.icon} {curr.label}
                </option>
              ))}
            </select>
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0.00"
              disabled={loading}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              {currency}
            </span>
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="What's this for?"
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all transform ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            "Send Money"
          )}
        </button>
      </form>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Transaction Info</p>
            <ul className="space-y-1 text-xs">
              <li>• Transactions are processed instantly</li>
              <li>• Recipient must have an account</li>
              <li>• You'll receive a confirmation notification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
