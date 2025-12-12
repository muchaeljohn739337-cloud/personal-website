/**
 * usePredictiveAnalytics Hook
 * Provides AI-powered predictive analytics and forecasting
 */

import {
  PredictiveAnalysis,
  RevenueForecast,
} from "@/lib/ai-brain/ai-core.types";
import { getRevenueForecast, predictMetric } from "@/services/aiCore";
import { useCallback, useState } from "react";

export function usePredictiveAnalytics() {
  const [predictions, setPredictions] = useState<
    Map<string, PredictiveAnalysis>
  >(new Map());
  const [revenueForecast, setRevenueForecast] =
    useState<RevenueForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(
    async (metric: string, timeframe: string = "30d") => {
      setLoading(true);
      setError(null);
      try {
        const prediction = await predictMetric(metric, timeframe);
        setPredictions((prev) => new Map(prev).set(metric, prediction));
        return prediction;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Prediction failed";
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const forecastRevenue = useCallback(async (days: number = 30) => {
    setLoading(true);
    setError(null);
    try {
      const forecast = await getRevenueForecast(days);
      setRevenueForecast(forecast);
      return forecast;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Revenue forecast failed";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPrediction = useCallback(
    (metric: string): PredictiveAnalysis | undefined => {
      return predictions.get(metric);
    },
    [predictions],
  );

  return {
    predictions: Array.from(predictions.values()),
    revenueForecast,
    loading,
    error,
    predict,
    forecastRevenue,
    getPrediction,
  };
}
