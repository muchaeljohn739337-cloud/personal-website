/**
 * AI Web Context
 * Provides UI enhancements: search, auto-complete, form assistance, personalization
 */

"use client";

import {
  AutoCompleteContext,
  FormAssistance,
  UIPersonalization,
} from "@/lib/ai-brain/ai-core.types";
import {
  getAutoComplete,
  getFormAssistance,
  getSmartSearch,
  getUserPersonalization,
} from "@/services/aiCore";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface AIWebContextType {
  personalization: UIPersonalization | null;
  loading: boolean;

  // Methods
  getSuggestions: (
    field: string,
    currentValue: string,
    context?: Record<string, unknown>,
  ) => Promise<AutoCompleteContext | null>;
  getFormHelp: (
    formType: string,
    currentData: Record<string, unknown>,
  ) => Promise<FormAssistance[]>;
  enhancedSearch: (
    query: string,
    filters?: Record<string, unknown>,
  ) => Promise<any>;
  loadPersonalization: () => Promise<void>;
}

const AIWebContext = createContext<AIWebContextType | undefined>(undefined);

export function AIWebProvider({ children }: { children: ReactNode }) {
  const [personalization, setPersonalization] =
    useState<UIPersonalization | null>(null);
  const [loading, setLoading] = useState(false);

  // Get autocomplete suggestions
  const getSuggestions = useCallback(
    async (
      field: string,
      currentValue: string,
      context?: Record<string, unknown>,
    ): Promise<AutoCompleteContext | null> => {
      try {
        const suggestions = await getAutoComplete(field, currentValue, context);
        return suggestions;
      } catch (error) {
        console.error("Failed to get autocomplete suggestions:", error);
        return null;
      }
    },
    [],
  );

  // Get form assistance
  const getFormHelp = useCallback(
    async (
      formType: string,
      currentData: Record<string, unknown>,
    ): Promise<FormAssistance[]> => {
      try {
        const assistance = await getFormAssistance(formType, currentData);
        return assistance;
      } catch (error) {
        console.error("Failed to get form assistance:", error);
        return [];
      }
    },
    [],
  );

  // Enhanced search with AI
  const enhancedSearch = useCallback(
    async (query: string, filters?: Record<string, unknown>) => {
      try {
        const results = await getSmartSearch(query, filters);
        return results;
      } catch (error) {
        console.error("Enhanced search failed:", error);
        return { results: [], suggestions: [] };
      }
    },
    [],
  );

  // Load user personalization
  const loadPersonalization = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserPersonalization();
      setPersonalization(data);
    } catch (error) {
      console.error("Failed to load personalization:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AIWebContextType = {
    personalization,
    loading,
    getSuggestions,
    getFormHelp,
    enhancedSearch,
    loadPersonalization,
  };

  return (
    <AIWebContext.Provider value={value}>{children}</AIWebContext.Provider>
  );
}

export function useAIWeb() {
  const context = useContext(AIWebContext);
  if (!context) {
    throw new Error("useAIWeb must be used within AIWebProvider");
  }
  return context;
}
