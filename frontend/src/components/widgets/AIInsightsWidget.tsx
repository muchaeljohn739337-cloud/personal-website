"use client";

import {
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BellAlertIcon,
  ChartBarIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AIInsight {
  id: string;
  type: "recommendation" | "alert" | "trend" | "security";
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  actionLabel?: string;
  timestamp: Date;
}

interface AIMetric {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "stable";
}

export default function AIInsightsWidget() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [metrics, setMetrics] = useState<AIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchAIInsights();
    const interval = setInterval(fetchAIInsights, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);

      // Simulate AI insights generation
      // In production, this would call /api/ai/insights/generate
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockInsights: AIInsight[] = [
        {
          id: "1",
          type: "recommendation",
          title: "Optimize Savings",
          description:
            "Based on your spending patterns, you could save $127/month by reducing dining expenses.",
          priority: "medium",
          actionUrl: "/finance",
          actionLabel: "View Analysis",
          timestamp: new Date(),
        },
        {
          id: "2",
          type: "security",
          title: "Enable 2FA",
          description:
            "Secure your account with two-factor authentication for enhanced protection.",
          priority: "high",
          actionUrl: "/settings/security",
          actionLabel: "Enable Now",
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "3",
          type: "trend",
          title: "Revenue Growing",
          description:
            "Your revenue increased 12% compared to last month. Great progress!",
          priority: "low",
          timestamp: new Date(Date.now() - 7200000),
        },
        {
          id: "4",
          type: "alert",
          title: "Unusual Activity",
          description:
            "We detected a login from a new device. Verify if this was you.",
          priority: "high",
          actionUrl: "/settings/security",
          actionLabel: "Review",
          timestamp: new Date(Date.now() - 1800000),
        },
      ];

      const mockMetrics: AIMetric[] = [
        { label: "Fraud Risk", value: "Low", change: -5, trend: "down" },
        { label: "Account Health", value: "98%", change: 2, trend: "up" },
        { label: "Active Alerts", value: 2, change: 1, trend: "up" },
        { label: "Compliance", value: "100%", change: 0, trend: "stable" },
      ];

      setInsights(mockInsights);
      setMetrics(mockMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: AIInsight["type"]) => {
    switch (type) {
      case "recommendation":
        return <LightBulbIcon className="w-5 h-5" />;
      case "alert":
        return <BellAlertIcon className="w-5 h-5" />;
      case "trend":
        return <ArrowTrendingUpIcon className="w-5 h-5" />;
      case "security":
        return <ShieldCheckIcon className="w-5 h-5" />;
    }
  };

  const getInsightColor = (
    type: AIInsight["type"],
    priority: AIInsight["priority"],
  ) => {
    if (priority === "high") {
      return "text-red-500 bg-red-100 dark:bg-red-900/30";
    }
    switch (type) {
      case "recommendation":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
      case "alert":
        return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
      case "trend":
        return "text-green-500 bg-green-100 dark:bg-green-900/30";
      case "security":
        return "text-purple-500 bg-purple-100 dark:bg-purple-900/30";
    }
  };

  const getPriorityBadge = (priority: AIInsight["priority"]) => {
    const styles = {
      low: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
      medium:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[priority];
  };

  const getTrendIcon = (trend: AIMetric["trend"], change: number) => {
    if (trend === "up") {
      return (
        <span
          className={`text-xs ${change > 0 ? "text-green-500" : "text-red-500"}`}
        >
          ↑ {Math.abs(change)}%
        </span>
      );
    }
    if (trend === "down") {
      return (
        <span
          className={`text-xs ${change < 0 ? "text-green-500" : "text-red-500"}`}
        >
          ↓ {Math.abs(change)}%
        </span>
      );
    }
    return <span className="text-xs text-gray-400">—</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Insights
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={fetchAIInsights}
          disabled={loading}
          title="Refresh insights"
          aria-label="Refresh insights"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* AI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {metric.label}
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
            {getTrendIcon(metric.trend, metric.change)}
          </div>
        ))}
      </div>

      {/* Insights List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
          <div className="p-8 text-center">
            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Analyzing your data...
            </p>
          </div>
        ) : (
          insights.slice(0, 4).map((insight) => (
            <div
              key={insight.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getInsightColor(insight.type, insight.priority)}`}
                >
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(insight.priority)}`}
                    >
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {insight.description}
                  </p>
                  {insight.actionUrl && (
                    <Link
                      href={insight.actionUrl}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {insight.actionLabel || "Learn more"}
                      <ChartBarIcon className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
          AI analyzing {Math.floor(Math.random() * 100) + 50} data points
        </div>
        <Link
          href="/support/chat"
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <SparklesIcon className="w-4 h-4" />
          Ask AI Assistant
        </Link>
      </div>
    </motion.div>
  );
}
