/**
 * useSmartSuggestions Hook
 * Provides AI-powered suggestions for user actions and UI elements
 */

import { SmartRecommendation } from "@/lib/ai-brain/ai-core.types";
import { getRecommendations } from "@/services/aiCore";
import { useCallback, useEffect, useState } from "react";

export function useSmartSuggestions(category?: string) {
  const [suggestions, setSuggestions] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations(category);
      setSuggestions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch suggestions",
      );
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const refresh = useCallback(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refresh,
  };
}
