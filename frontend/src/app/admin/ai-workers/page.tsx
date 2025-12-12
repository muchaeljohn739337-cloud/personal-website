"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface AIWorker {
  id: string;
  name: string;
  description: string;
  category: string;
  health: {
    status: "operational" | "degraded" | "failed" | "initializing";
    lastHeartbeat: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
  };
  rateLimit: {
    maxRequestsPerMinute: number;
    currentRequests: number;
  };
  circuitBreaker: {
    state: "closed" | "open" | "half-open";
    currentFailures: number;
    failureThreshold: number;
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

interface SystemHealth {
  totalWorkers: number;
  operational: number;
  degraded: number;
  failed: number;
  healthScore: number;
  color: "blue" | "yellow" | "red";
}

interface Alert {
  severity: "info" | "warning" | "critical";
  message: string;
  workerId?: string;
  timestamp: Date;
}

export default function AIWorkersPage() {
  const [workers, setWorkers] = useState<AIWorker[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loadBalancerStats, setLoadBalancerStats] = useState<any>(null);

  useEffect(() => {
    // Fetch initial data
    fetchWorkers();

    // Connect to Socket.IO for real-time updates
    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
      {
        transports: ["websocket"],
      },
    );

    newSocket.on("connect", () => {
      console.log("Connected to AI Workers socket");
    });

    newSocket.on("ai-worker:status-change", (data: any) => {
      console.log("Worker status changed:", data);
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === data.workerId ? { ...w, ...data.worker } : w,
        ),
      );
    });

    newSocket.on("ai-worker:alert", (alert: Alert) => {
      console.log("Worker alert:", alert);
      setAlerts((prev) => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai-workers/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setWorkers(data.workers);
        setSystemHealth(data.systemHealth);
        setLoadBalancerStats(data.loadBalancer);
      }
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const restartWorker = async (workerId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai-workers/${workerId}/restart`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        alert("Worker restart initiated");
        fetchWorkers();
      } else {
        alert("Failed to restart worker");
      }
    } catch (error) {
      console.error("Failed to restart worker:", error);
      alert("Failed to restart worker");
    }
  };

  const runTypescriptFixer = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai-workers/typescript-fixer/run`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        alert(
          `TypeScript Fixer Complete\nErrors: ${data.result.totalErrors}\nFixes Applied: ${data.result.fixesApplied}`,
        );
      } else {
        alert("Failed to run TypeScript fixer");
      }
    } catch (error) {
      console.error("Failed to run TypeScript fixer:", error);
      alert("Failed to run TypeScript fixer");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-blue-500";
      case "degraded":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      case "initializing":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return "✅";
      case "degraded":
        return "⚠️";
      case "failed":
        return "❌";
      case "initializing":
        return "🔄";
      default:
        return "❓";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return "🛡️";
      case "database":
        return "🗄️";
      case "code-generation":
        return "🤖";
      case "monitoring":
        return "👁️";
      case "communication":
        return "📢";
      case "optimization":
        return "⚡";
      default:
        return "🔧";
    }
  };

  const filteredWorkers =
    selectedCategory === "all"
      ? workers
      : workers.filter((w) => w.category === selectedCategory);

  const categories = ["all", ...new Set(workers.map((w) => w.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🤖 AI Worker Management</h1>
        <p className="text-gray-600">
          Real-time monitoring and control of all AI workers
        </p>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div
          className={`p-6 rounded-lg shadow-lg mb-8 ${
            systemHealth.color === "blue"
              ? "bg-blue-100 border-blue-500"
              : systemHealth.color === "yellow"
                ? "bg-yellow-100 border-yellow-500"
                : "bg-red-100 border-red-500"
          } border-4`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">System Health</h2>
              <div className="text-6xl font-bold">
                {systemHealth.healthScore.toFixed(1)}%
              </div>
              <p className="text-sm mt-2">
                {systemHealth.operational} operational • {systemHealth.degraded}{" "}
                degraded • {systemHealth.failed} failed
              </p>
            </div>
            <div className="text-right">
              <div
                className={`w-32 h-32 rounded-full ${
                  systemHealth.color === "blue"
                    ? "bg-blue-500"
                    : systemHealth.color === "yellow"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                } flex items-center justify-center text-white text-4xl`}
              >
                {systemHealth.color === "blue"
                  ? "✓"
                  : systemHealth.color === "yellow"
                    ? "⚠"
                    : "✗"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Balancer Stats */}
      {loadBalancerStats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-600 mb-1">Active Users</h3>
            <p className="text-3xl font-bold">
              {loadBalancerStats.activeUsers}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Threshold:{" "}
              {loadBalancerStats.preventShutdown ? "✅ Met" : "❌ Not met"}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-600 mb-1">Active Requests</h3>
            <p className="text-3xl font-bold">
              {loadBalancerStats.activeRequests}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max: {loadBalancerStats.maxConcurrentRequests}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-600 mb-1">Queued Requests</h3>
            <p className="text-3xl font-bold">
              {loadBalancerStats.queuedRequests}
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm text-gray-600 mb-1">System Utilization</h3>
            <p className="text-3xl font-bold">
              {loadBalancerStats.utilizationPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={runTypescriptFixer}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          🔧 Run TypeScript Fixer
        </button>
        <button
          onClick={fetchWorkers}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded ${
              selectedCategory === category
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {category === "all" ? "All" : category}
          </button>
        ))}
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">🚨 Recent Alerts</h2>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  alert.severity === "critical"
                    ? "bg-red-50 border-red-500"
                    : alert.severity === "warning"
                      ? "bg-yellow-50 border-yellow-500"
                      : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold">
                      {alert.severity === "critical"
                        ? "🚨"
                        : alert.severity === "warning"
                          ? "⚠️"
                          : "ℹ️"}{" "}
                      {alert.message}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Worker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className={`bg-white rounded-lg shadow-lg p-6 border-t-4 ${
              worker.health.status === "operational"
                ? "border-blue-500"
                : worker.health.status === "degraded"
                  ? "border-yellow-500"
                  : "border-red-500"
            }`}
          >
            {/* Worker Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {getCategoryIcon(worker.category)}
                  </span>
                  <h3 className="text-lg font-bold">{worker.name}</h3>
                  <span className="text-xl">
                    {getStatusIcon(worker.health.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{worker.description}</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(
                  worker.health.status,
                )}`}
              >
                {worker.health.status.toUpperCase()}
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Requests:</span>
                <span className="font-semibold">
                  {worker.health.totalRequests}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-semibold">
                  {worker.health.totalRequests > 0
                    ? (
                        (worker.health.successfulRequests /
                          worker.health.totalRequests) *
                        100
                      ).toFixed(1)
                    : 100}
                  %
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Response:</span>
                <span className="font-semibold">
                  {worker.health.avgResponseTime.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rate Limit:</span>
                <span className="font-semibold">
                  {worker.rateLimit.currentRequests}/
                  {worker.rateLimit.maxRequestsPerMinute}/min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Circuit Breaker:</span>
                <span
                  className={`font-semibold ${
                    worker.circuitBreaker.state === "closed"
                      ? "text-green-600"
                      : worker.circuitBreaker.state === "half-open"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {worker.circuitBreaker.state.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => restartWorker(worker.id)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                🔄 Restart
              </button>
              <button
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                onClick={() => alert(`View logs for ${worker.name}`)}
              >
                📋 Logs
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
