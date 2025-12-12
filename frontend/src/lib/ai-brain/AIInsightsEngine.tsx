/**
 * AI Insights Engine
 * Provides analytics, predictions, recommendations, and personalization
 */

"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AIInsight,
  PredictiveAnalysis,
  SmartDateRange,
  SmartRecommendation,
  UIPersonalization,
} from "./ai-core.types";

interface AIInsightsContextType {
  insights: AIInsight[];
  recommendations: SmartRecommendation[];
  predictions: PredictiveAnalysis[];
  personalization: UIPersonalization | null;
  loading: boolean;

  // Methods
  generateInsights: (context: string) => Promise<void>;
  getRecommendations: (category?: string) => Promise<void>;
  predictMetric: (
    metric: string,
    timeframe: string,
  ) => Promise<PredictiveAnalysis | null>;
  getSuggestedDateRange: (purpose: string) => Promise<SmartDateRange | null>;
  updatePersonalization: (
    preferences: Partial<UIPersonalization["preferences"]>,
  ) => Promise<void>;
}

const AIInsightsContext = createContext<AIInsightsContextType | undefined>(
  undefined,
);

export function AIInsightsProvider({ children }: { children: ReactNode }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>(
    [],
  );
  const [predictions, setPredictions] = useState<PredictiveAnalysis[]>([]);
  const [personalization, setPersonalization] =
    useState<UIPersonalization | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate contextual insights
  const generateInsights = useCallback(async (context: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ context, timestamp: new Date().toISOString() }),
      });

      if (response.ok) {
        const data: AIInsight[] = await response.json();
        setInsights((prev) => {
          const combined = [...prev, ...data];
          // Keep only unique insights, max 20
          const unique = combined.filter(
            (insight, index, self) =>
              index === self.findIndex((i) => i.id === insight.id),
          );
          return unique.slice(-20);
        });
      }
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get personalized recommendations
  const getRecommendations = useCallback(async (category?: string) => {
    setLoading(true);
    try {
      const url = category
        ? `/api/ai/insights/recommendations?category=${category}`
        : "/api/ai/insights/recommendations";

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data: SmartRecommendation[] = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Predict future metric values
  const predictMetric = useCallback(
    async (
      metric: string,
      timeframe: string,
    ): Promise<PredictiveAnalysis | null> => {
      try {
        const response = await fetch("/api/ai/insights/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ metric, timeframe }),
        });

        if (response.ok) {
          const prediction: PredictiveAnalysis = await response.json();
          setPredictions((prev) => {
            const filtered = prev.filter((p) => p.metric !== metric);
            return [...filtered, prediction];
          });
          return prediction;
        }
      } catch (error) {
        console.error("Failed to predict metric:", error);
      }

      return null;
    },
    [],
  );

  // Get AI-suggested optimal date range for analytics
  const getSuggestedDateRange = useCallback(
    async (purpose: string): Promise<SmartDateRange | null> => {
      try {
        const response = await fetch("/api/ai/insights/smart-date-range", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ purpose }),
        });

        if (response.ok) {
          const dateRange: SmartDateRange = await response.json();
          return dateRange;
        }
      } catch (error) {
        console.error("Failed to get smart date range:", error);
      }

      return null;
    },
    [],
  );

  // Update user personalization preferences
  const updatePersonalization = useCallback(
    async (preferences: Partial<UIPersonalization["preferences"]>) => {
      try {
        const response = await fetch("/api/ai/insights/personalization", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ preferences }),
        });

        if (response.ok) {
          const updated: UIPersonalization = await response.json();
          setPersonalization(updated);
        }
      } catch (error) {
        console.error("Failed to update personalization:", error);
      }
    },
    [],
  );

  // Load initial personalization on mount
  useEffect(() => {
    const loadPersonalization = async () => {
      try {
        const response = await fetch("/api/ai/insights/personalization", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data: UIPersonalization = await response.json();
          setPersonalization(data);
        }
      } catch (error) {
        console.error("Failed to load personalization:", error);
      }
    };

    loadPersonalization();
  }, []);

  // Load recommendations on mount and every 10 minutes
  useEffect(() => {
    getRecommendations();
    const interval = setInterval(() => getRecommendations(), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getRecommendations]);

  const value: AIInsightsContextType = {
    insights,
    recommendations,
    predictions,
    personalization,
    loading,
    generateInsights,
    getRecommendations,
    predictMetric,
    getSuggestedDateRange,
    updatePersonalization,
  };

  return (
    <AIInsightsContext.Provider value={value}>
      {children}
    </AIInsightsContext.Provider>
  );
}

export function useAIInsights() {
  const context = useContext(AIInsightsContext);
  if (!context) {
    throw new Error("useAIInsights must be used within AIInsightsProvider");
  }
  return context;
}
