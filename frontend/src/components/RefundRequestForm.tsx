"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface RefundEligibility {
  eligible: boolean;
  reason: string;
  daysRemaining: number;
  purchaseDate: string;
  amount: number;
  transactionId: string;
}

interface RefundRequestFormProps {
  userId: string;
  transactionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RefundRequestForm({
  userId,
  transactionId,
  onSuccess,
  onCancel,
}: RefundRequestFormProps) {
  const [step, setStep] = useState<"check" | "form" | "success" | "error">(
    "check",
  );
  const [eligibility, setEligibility] = useState<RefundEligibility | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refundId, setRefundId] = useState("");

  const checkEligibility = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/refund/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, transactionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check eligibility");
      }

      setEligibility(data);
      if (data.eligible) {
        setStep("form");
      } else {
        setStep("error");
        setError(data.reason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  const submitRefundRequest = async () => {
    if (reason.trim().length < 10) {
      setError("Please provide a detailed reason (minimum 10 characters)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/refund/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, transactionId, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit refund request");
      }

      setRefundId(data.refundRequest.id);
      setStep("success");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
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
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            30-Day Money-Back Guarantee
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Request a full refund within 30 days
          </p>
        </div>
      </div>

      {/* Step: Check Eligibility */}
      {step === "check" && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              We&apos;ll check if your purchase is eligible for a refund under
              our 30-day money-back guarantee.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={checkEligibility}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Checking..." : "Check Eligibility"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Refund Form */}
      {step === "form" && eligibility && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium text-green-800 dark:text-green-200">
                Eligible for Refund
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              {eligibility.daysRemaining} days remaining in refund window
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Refund Amount:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${eligibility.amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">
                Purchase Date:
              </span>
              <span className="text-gray-900 dark:text-white">
                {new Date(eligibility.purchaseDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for refund <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please tell us why you're requesting a refund..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 10 characters ({reason.length}/10)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("check")}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={submitRefundRequest}
              disabled={loading || reason.length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Refund Request Submitted
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your refund request has been submitted successfully. We&apos;ll
            review it and process your refund within 3-5 business days.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Reference ID
            </p>
            <p className="font-mono text-sm text-gray-900 dark:text-white">
              {refundId}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === "error" && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
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
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Not Eligible for Refund
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@example.com"
                className="underline hover:no-underline"
              >
                support@example.com
              </a>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </motion.div>
  );
}
