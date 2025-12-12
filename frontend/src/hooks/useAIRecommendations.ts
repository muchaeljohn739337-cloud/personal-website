/**
 * useAIRecommendations Hook
 * Advanced recommendations with context and user behavior analysis
 */

import { SmartRecommendation } from "@/lib/ai-brain/ai-core.types";
import { getRecommendations } from "@/services/aiCore";
import { useCallback, useEffect, useState } from "react";

interface RecommendationFilters {
  category?: string;
  minPriority?: number;
  minRelevance?: number;
}

export function useAIRecommendations(filters?: RecommendationFilters) {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>(
    [],
  );
  const [filteredRecommendations, setFilteredRecommendations] = useState<
    SmartRecommendation[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations(filters?.category);
      setRecommendations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch recommendations",
      );
    } finally {
      setLoading(false);
    }
  }, [filters?.category]);

  // Apply filters
  useEffect(() => {
    let filtered = [...recommendations];

    if (filters?.minPriority !== undefined) {
      filtered = filtered.filter((r) => r.priority >= filters.minPriority!);
    }

    if (filters?.minRelevance !== undefined) {
      filtered = filtered.filter(
        (r) => r.relevanceScore >= filters.minRelevance!,
      );
    }

    // Sort by priority and relevance
    filtered.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return b.relevanceScore - a.relevanceScore;
    });

    setFilteredRecommendations(filtered);
  }, [recommendations, filters]);

  useEffect(() => {
    fetchRecommendations();
    // Refresh every 10 minutes
    const interval = setInterval(fetchRecommendations, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRecommendations]);

  const getTopRecommendation = useCallback((): SmartRecommendation | null => {
    return filteredRecommendations[0] || null;
  }, [filteredRecommendations]);

  const getRecommendationsByType = useCallback(
    (type: SmartRecommendation["type"]) => {
      return filteredRecommendations.filter((r) => r.type === type);
    },
    [filteredRecommendations],
  );

  return {
    recommendations: filteredRecommendations,
    allRecommendations: recommendations,
    loading,
    error,
    refresh: fetchRecommendations,
    getTopRecommendation,
    getRecommendationsByType,
  };
}
