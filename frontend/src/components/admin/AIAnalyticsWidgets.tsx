/**
 * AI-Enhanced Admin Analytics Components
 */

"use client";

import { usePredictiveAnalytics } from "@/hooks/usePredictiveAnalytics";
import { useEffect, useState } from "react";

/**
 * Revenue Forecast Chart with AI Predictions
 */
export function AIRevenueForecast() {
  const { revenueForecast, forecastRevenue, loading } =
    usePredictiveAnalytics();
  const [selectedScenario, setSelectedScenario] = useState<
    "realistic" | "optimistic" | "pessimistic"
  >("realistic");

  useEffect(() => {
    forecastRevenue(30);
  }, [forecastRevenue]);

  if (loading || !revenueForecast) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            AI Revenue Forecast
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            30-day prediction • {(revenueForecast.confidence * 100).toFixed(0)}%
            confidence
          </p>
        </div>

        <div className="flex gap-2">
          {(["optimistic", "realistic", "pessimistic"] as const).map(
            (scenario) => (
              <button
                key={scenario}
                onClick={() => setSelectedScenario(scenario)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                  selectedScenario === scenario
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Scenario Display */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">
            Optimistic
          </p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${revenueForecast.scenarios.optimistic.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
            Realistic
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ${revenueForecast.scenarios.realistic.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-700 dark:text-orange-300 mb-1">
            Pessimistic
          </p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            ${revenueForecast.scenarios.pessimistic.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Key Factors
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Seasonality:{" "}
              {(revenueForecast.factors.seasonality * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Trend: {(revenueForecast.factors.trend * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              External: {(revenueForecast.factors.external * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Smart Metrics Panel with AI Insights
 */
export function AISmartMetrics() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/analytics/smart-metrics", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data.metrics || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load smart metrics:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="animate-pulse h-48 bg-gray-200 rounded-lg"></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-purple-500"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {metric.name}
            </p>
            {metric.trend === "up" ? (
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
            ) : metric.trend === "down" ? (
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
            ) : null}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof metric.value === "number"
              ? metric.value.toLocaleString()
              : metric.value}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {metric.insight}
          </p>
          {metric.prediction !== undefined && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Predicted: {metric.prediction}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
