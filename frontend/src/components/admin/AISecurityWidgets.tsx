/**
 * AI Security Dashboard Components
 * Enhanced threat intelligence, risk scoring, and automated detection
 */

"use client";

import { useSecurityAI } from "@/hooks/useSecurityAI";
import { ThreatLevel } from "@/lib/ai-brain/ai-core.types";

/**
 * Real-time Threat Monitor
 */
export function AIThreatMonitor() {
  const { sessionRisk, threatLevel, anomalies, analyzeSession, loading } =
    useSecurityAI();

  const getThreatColor = (level: ThreatLevel) => {
    switch (level) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          AI Threat Intelligence
        </h3>
        <button
          onClick={analyzeSession}
          disabled={loading}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {loading ? "Analyzing..." : "Refresh"}
        </button>
      </div>

      {/* Threat Level Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Current Threat Level
          </span>
          <span
            className={`px-3 py-1 text-xs font-bold text-white rounded-full ${getThreatColor(
              threatLevel,
            )}`}
          >
            {threatLevel}
          </span>
        </div>

        {sessionRisk && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Risk Score
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {sessionRisk.riskScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getThreatColor(
                  threatLevel,
                )}`}
                style={{ width: `${sessionRisk.riskScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Risk Factors */}
      {sessionRisk && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Risk Factors
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(sessionRisk.factors).map(([key, value]) => (
              <div
                key={key}
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  value
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200"
                    : "bg-green-50 dark:bg-green-900/20 border border-green-200"
                }`}
              >
                {value ? (
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span
                  className={`text-xs font-medium ${
                    value ? "text-red-700" : "text-green-700"
                  }`}
                >
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Anomalies */}
      {anomalies.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Recent Anomalies ({anomalies.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase">
                    {anomaly.anomalyType}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(anomaly.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {anomaly.description}
                </p>
                {anomaly.suggestedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {anomaly.suggestedActions.map((action, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {sessionRisk && sessionRisk.recommendations.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
            Security Recommendations
          </h4>
          <ul className="space-y-1">
            {sessionRisk.recommendations.map((rec, index) => (
              <li
                key={index}
                className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2"
              >
                <span>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
