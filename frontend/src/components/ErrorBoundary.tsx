"use client";
import React from "react";

type State = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  aiSuggestions?: string[];
  errorPattern?: string;
  severity?: "low" | "medium" | "high" | "critical";
};

/**
 * AI-Enhanced Error Boundary
 * Features:
 * - Error pattern detection
 * - Auto-suggestions for fixes
 * - Severity ranking
 * - Similar error tracking
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("UI Error Caught:", error, errorInfo);

    // AI-powered error analysis
    try {
      const response = await fetch("/api/ai/errors/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const analysis = await response.json();
        this.setState({
          errorInfo,
          aiSuggestions: analysis.suggestions || [],
          errorPattern: analysis.pattern || "Unknown",
          severity: analysis.severity || "medium",
        });
      } else {
        this.setState({ errorInfo });
      }
    } catch (analyzerError) {
      console.error("AI error analysis failed:", analyzerError);
      this.setState({ errorInfo });
    }
  }

  getSeverityColor() {
    switch (this.state.severity) {
      case "critical":
        return "bg-red-100 border-red-500 text-red-900";
      case "high":
        return "bg-orange-100 border-orange-500 text-orange-900";
      case "medium":
        return "bg-yellow-100 border-yellow-500 text-yellow-900";
      case "low":
        return "bg-blue-100 border-blue-500 text-blue-900";
      default:
        return "bg-gray-100 border-gray-500 text-gray-900";
    }
  }

  render() {
    if (this.state.hasError) {
      const severityColor = this.getSeverityColor();

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Something went wrong
                </h2>
                {this.state.severity && (
                  <span
                    className={`inline-block mt-1 px-3 py-1 text-xs font-semibold rounded-full ${severityColor}`}
                  >
                    {this.state.severity.toUpperCase()} SEVERITY
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm font-mono text-red-800">
                {this.state.error?.message || "Unknown error"}
              </p>
              {this.state.errorPattern && (
                <p className="text-xs text-red-600 mt-2">
                  Pattern: {this.state.errorPattern}
                </p>
              )}
            </div>

            {/* AI Suggestions */}
            {this.state.aiSuggestions &&
              this.state.aiSuggestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    AI-Powered Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {this.state.aiSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-700 bg-purple-50 p-3 rounded-lg"
                      >
                        <span className="text-purple-600 font-bold">
                          {index + 1}.
                        </span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Go Home
              </button>
            </div>

            {/* Debug Info (Development) */}
            {process.env.NODE_ENV === "development" &&
              this.state.error?.stack && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-900 text-green-400 text-xs rounded overflow-x-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
