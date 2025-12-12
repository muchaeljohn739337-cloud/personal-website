"use client";

import { useState } from "react";

interface BotCheckButtonProps {
  token?: string;
}

export default function BotCheckButton({ token }: BotCheckButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    isRobot: boolean;
    confidence: number;
    method?: string;
  } | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const response = await fetch(`${apiUrl}/api/bot-check/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      setResult(data);

      if (token) {
        await fetch(`${apiUrl}/api/bot-check/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            eventName: "bot_check_click",
            metadata: { result: data.isRobot },
          }),
        });
      }
    } catch (error) {
      console.error("Bot check error:", error);
      setResult({
        message: "Error checking bot status",
        isRobot: false,
        confidence: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <button
        onClick={handleCheck}
        disabled={loading}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {loading ? "Checking..." : "🤖 Am I a Robot?"}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.isRobot
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-green-50 border border-green-200 text-green-800"
          }`}
        >
          <p className="font-semibold text-lg">{result.message}</p>
          <div className="mt-2 text-sm space-y-1">
            <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
            {result.method && (
              <p className="text-gray-600">Method: {result.method}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
