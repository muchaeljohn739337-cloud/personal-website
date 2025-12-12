/**
 * AI-Enhanced Summary Card Component
 * Features:
 * - Real-time AI insights
 * - Predictive trends
 * - Smart recommendations
 */

"use client";

import { usePredictiveAnalytics } from "@/hooks/usePredictiveAnalytics";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  gradient: string;
  delay?: number;
  clickable?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
  metricKey?: string; // For AI predictions
  enableAI?: boolean;
}

export default function SummaryCard({
  title,
  value,
  icon,
  iconBg,
  gradient,
  delay = 0,
  clickable = false,
  badge,
  onClick,
  metricKey,
  enableAI = true,
}: SummaryCardProps) {
  const countRef = useRef<HTMLSpanElement>(null);
  const { predict, getPrediction } = usePredictiveAnalytics();
  const [aiInsight, setAIInsight] = useState<string | null>(null);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [predictedValue, setPredictedValue] = useState<number | null>(null);

  // Animated counter
  useEffect(() => {
    if (!countRef.current) return;

    const target = value;
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      if (countRef.current) {
        countRef.current.textContent = `$${current.toFixed(2)}`;
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  // AI Prediction
  useEffect(() => {
    if (enableAI && metricKey) {
      predict(metricKey, "7d").then((prediction) => {
        if (prediction) {
          setTrend(prediction.trend);
          setPredictedValue(prediction.predictedValue);

          // Generate insight based on prediction
          if (prediction.trend === "up") {
            setAIInsight(
              `Expected to ${
                prediction.trend === "up" ? "increase" : "decrease"
              } by ${Math.abs(
                ((prediction.predictedValue - prediction.currentValue) /
                  prediction.currentValue) *
                  100,
              ).toFixed(1)}%`,
            );
          } else if (prediction.trend === "down") {
            setAIInsight(
              `Trending down ${Math.abs(
                ((prediction.predictedValue - prediction.currentValue) /
                  prediction.currentValue) *
                  100,
              ).toFixed(1)}%`,
            );
          }
        }
      });
    }
  }, [enableAI, metricKey, predict, value]);

  const getTrendIcon = () => {
    if (trend === "up") {
      return (
        <svg
          className="w-4 h-4 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (trend === "down") {
      return (
        <svg
          className="w-4 h-4 text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onClick={clickable ? onClick : undefined}
      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden ${
        clickable ? "cursor-pointer hover:shadow-xl transition-shadow" : ""
      }`}
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 opacity-5 ${gradient}`}
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0% 100%)" }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconBg}`}>{icon}</div>
          {badge}
        </div>

        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </h3>

        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            <span ref={countRef}>$0.00</span>
          </p>
          {enableAI && getTrendIcon()}
        </div>

        {/* AI Insight */}
        {enableAI && aiInsight && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-semibold">AI</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              {aiInsight}
            </span>
          </div>
        )}

        {/* Predicted Value */}
        {enableAI &&
          predictedValue !== null &&
          Math.abs(predictedValue - value) > value * 0.05 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Predicted: ${predictedValue.toFixed(2)} (7d)
            </div>
          )}
      </div>
    </motion.div>
  );
}
