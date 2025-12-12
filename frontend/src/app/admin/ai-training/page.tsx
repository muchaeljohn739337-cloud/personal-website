"use client";

import { useEffect, useState } from "react";

interface TrainingData {
  id: string;
  ipAddress: string;
  userAgent: string;
  features: Record<string, unknown>;
  label: boolean | null;
  verifiedBy: string | null;
  createdAt: string;
}

interface TrainingStats {
  total: number;
  verified: number;
  bots: number;
  humans: number;
  verificationRate: number;
}

export default function AITrainingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [data, setData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [models, setModels] = useState<
    Array<{
      id: string;
      name: string;
      accuracy: number | null;
      trainingSamples: number;
      isActive: boolean;
    }>
  >([]);

  useEffect(() => {
    // Get token from localStorage or context
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      setToken(storedToken);
      if (storedToken) {
        loadData(storedToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const loadData = async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const [statsRes, dataRes, modelsRes] = await Promise.all([
        fetch(`${apiUrl}/api/ai-training/stats`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${apiUrl}/api/ai-training/data?limit=100`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${apiUrl}/api/ai-training/models`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (dataRes.ok) {
        const dataJson = await dataRes.json();
        setData(dataJson.data);
      }
      if (modelsRes.ok) setModels(await modelsRes.json());
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyData = async (id: string, label: boolean) => {
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${apiUrl}/api/ai-training/verify/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ label }),
      });
      loadData(token);
    } catch (error) {
      console.error("Failed to verify:", error);
    }
  };

  const trainModel = async () => {
    if (!token) return;
    setTraining(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/ai-training/train`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (res.ok) {
        alert(
          `Training complete! Accuracy: ${(
            result.metrics.accuracy * 100
          ).toFixed(1)}%`,
        );
        loadData(token);
      } else {
        alert(`Training failed: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error("Training failed:", error);
      alert("Training failed");
    } finally {
      setTraining(false);
    }
  };

  const activateModel = async (id: string) => {
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${apiUrl}/api/ai-training/models/${id}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      loadData(token);
    } catch (error) {
      console.error("Failed to activate:", error);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (!token) {
    return (
      <div className="p-6">
        <p className="text-red-600">
          Please log in to access the AI Training Dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Training Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Samples</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Verified</p>
            <p className="text-2xl font-bold">{stats.verified}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-600">Bots</p>
            <p className="text-2xl font-bold">{stats.bots}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Humans</p>
            <p className="text-2xl font-bold">{stats.humans}</p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={trainModel}
          disabled={training || !stats || stats.verified < 100}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          {training ? "Training..." : "Train Model"}
        </button>
        {stats && stats.verified < 100 && (
          <p className="text-sm text-gray-600 self-center">
            Need at least 100 verified samples
          </p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Trained Models</h2>
        <div className="space-y-2">
          {models.length === 0 ? (
            <p className="text-gray-500">No models trained yet</p>
          ) : (
            models.map((model) => (
              <div
                key={model.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{model.name}</p>
                  <p className="text-sm text-gray-600">
                    Accuracy: {(Number(model.accuracy) * 100).toFixed(1)}% |{" "}
                    Samples: {model.trainingSamples}
                  </p>
                </div>
                <button
                  onClick={() => activateModel(model.id)}
                  className={`px-4 py-2 rounded ${
                    model.isActive
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {model.isActive ? "Active" : "Activate"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Training Data</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {data.length === 0 ? (
            <p className="text-gray-500">No training data yet</p>
          ) : (
            data.map((item) => (
              <div
                key={item.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <p className="text-sm font-mono text-gray-600">
                    {item.userAgent.substring(0, 60)}...
                  </p>
                  <p className="text-xs text-gray-500">{item.ipAddress}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => verifyData(item.id, false)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm disabled:opacity-50"
                    disabled={item.verifiedBy !== null}
                  >
                    Human
                  </button>
                  <button
                    onClick={() => verifyData(item.id, true)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm disabled:opacity-50"
                    disabled={item.verifiedBy !== null}
                  >
                    Bot
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
