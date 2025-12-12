"use client";

import {
  ArrowPathIcon,
  CheckCircleIcon,
  PhoneIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SMSVerificationProps {
  onSuccess?: (code: string) => void;
  onError?: (error: string) => void;
  countryId?: string;
  serviceId?: string;
}

export default function SMSVerification({
  onSuccess,
  onError,
  countryId = "US",
  serviceId = "any",
}: SMSVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [status, setStatus] = useState<
    "idle" | "ordered" | "verified" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Auto-check for SMS every 5 seconds when order is active
  useEffect(() => {
    if (status === "ordered" && orderId) {
      const interval = setInterval(() => {
        checkForSMS();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status, orderId]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const orderNumber = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          countryId,
          serviceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to order number");
      }

      setOrderId(data.orderId);
      setStatus("ordered");
      setMessage(`Number ordered: ${data.phoneNumber}. Waiting for SMS...`);
      setCountdown(120); // 2 minute timeout
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to order number";
      setStatus("error");
      setMessage(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const checkForSMS = async () => {
    if (!orderId || checking) return;

    setChecking(true);

    try {
      const response = await fetch(`/api/sms/verify?orderId=${orderId}`);
      const data = await response.json();

      if (data.success && data.code) {
        setVerificationCode(data.code);
        setStatus("verified");
        setMessage(`Verification code received: ${data.code}`);
        onSuccess?.(data.code);
      }
    } catch (error) {
      console.error("Error checking SMS:", error);
    } finally {
      setChecking(false);
    }
  };

  const cancelOrder = async () => {
    if (!orderId) return;

    try {
      await fetch(`/api/sms/verify?orderId=${orderId}`, {
        method: "DELETE",
      });
      resetForm();
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setOrderId("");
    setVerificationCode("");
    setStatus("idle");
    setMessage("");
    setCountdown(0);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <PhoneIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            SMS Verification
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by SMS Pool
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to get a random number from SMS Pool
              </p>
            </div>

            <button
              onClick={orderNumber}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Ordering Number...
                </span>
              ) : (
                "Order Verification Number"
              )}
            </button>
          </motion.div>
        )}

        {status === "ordered" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center">
              <div className="relative">
                <ArrowPathIcon className="w-16 h-16 text-blue-600 animate-spin" />
                {countdown > 0 && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-gray-500">
                    {countdown}s
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>

            <button
              onClick={checkForSMS}
              disabled={checking}
              className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {checking ? "Checking..." : "Check Now"}
            </button>

            <button
              onClick={cancelOrder}
              className="w-full py-2 text-red-600 hover:text-red-700 transition-colors text-sm"
            >
              Cancel Order
            </button>
          </motion.div>
        )}

        {status === "verified" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Code Received!
              </h3>
              <div className="text-3xl font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 py-3 px-6 rounded-lg inline-block">
                {verificationCode}
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Verify Another Number
            </button>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center">
              <XCircleIcon className="w-16 h-16 text-red-500" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {message}
              </p>
            </div>

            <button
              onClick={resetForm}
              className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
