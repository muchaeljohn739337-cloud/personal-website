/**
 * AI Insights Dashboard Widget
 * Displays real-time AI-generated insights and recommendations
 */

"use client";

import { useAIInsights } from "@/lib/ai-brain/AIInsightsEngine";
import { AIInsight } from "@/lib/ai-brain/ai-core.types";
import { useEffect, useState } from "react";

export default function AIInsightsWidget() {
  const { insights, generateInsights, loading } = useAIInsights();
  const [displayedInsights, setDisplayedInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    // Generate dashboard insights on mount
    generateInsights("dashboard");
  }, [generateInsights]);

  useEffect(() => {
    // Filter for high-impact insights
    const filtered = insights
      .filter(
        (insight) => insight.impact === "high" || insight.impact === "medium",
      )
      .slice(0, 3);
    setDisplayedInsights(filtered);
  }, [insights]);

  if (!loading && displayedInsights.length === 0) {
    return null;
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "predictive":
        return "🔮";
      case "diagnostic":
        return "🔍";
      case "prescriptive":
        return "💡";
      case "descriptive":
        return "📊";
      default:
        return "✨";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          AI Insights
        </h2>
        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
        )}
      </div>

      <div className="space-y-3">
        {displayedInsights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getTypeIcon(insight.type)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {insight.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getImpactColor(
                      insight.impact,
                    )}`}
                  >
                    {insight.impact.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {insight.description}
                </p>
                {insight.actionable &&
                  insight.actions &&
                  insight.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {insight.actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => {
                            if (action.route) {
                              window.location.href = action.route;
                            }
                          }}
                          className="px-3 py-1 text-xs bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </span>
                  <span>•</span>
                  <span className="capitalize">{insight.category}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
