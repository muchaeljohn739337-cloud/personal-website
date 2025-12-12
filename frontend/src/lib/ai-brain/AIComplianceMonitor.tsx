/**
 * AI Compliance Monitor
 * Provides fraud detection, compliance alerts, and risk assessment
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
import { ComplianceAlert, FraudDetection, RiskScore } from "./ai-core.types";

interface AIComplianceContextType {
  alerts: ComplianceAlert[];
  fraudDetections: FraudDetection[];
  overallRisk: RiskScore;
  loading: boolean;

  // Methods
  checkCompliance: (entity: string, type: string) => Promise<ComplianceAlert[]>;
  detectFraud: (
    transactionData: Record<string, unknown>,
  ) => Promise<FraudDetection | null>;
  assessRisk: (
    operation: string,
    context: Record<string, unknown>,
  ) => Promise<RiskScore>;
  dismissAlert: (alertId: string) => void;
  refreshMonitoring: () => Promise<void>;
}

const AIComplianceContext = createContext<AIComplianceContextType | undefined>(
  undefined,
);

export function AIComplianceProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [fraudDetections, setFraudDetections] = useState<FraudDetection[]>([]);
  const [overallRisk, setOverallRisk] = useState<RiskScore>(0);
  const [loading, setLoading] = useState(false);

  // Check compliance for specific entity
  const checkCompliance = useCallback(
    async (entity: string, type: string): Promise<ComplianceAlert[]> => {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/compliance/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ entity, type }),
        });

        if (response.ok) {
          const data: ComplianceAlert[] = await response.json();

          // Add new alerts to existing ones
          setAlerts((prev) => {
            const combined = [...prev, ...data];
            const unique = combined.filter(
              (alert, index, self) =>
                index === self.findIndex((a) => a.id === alert.id),
            );
            return unique;
          });

          return data;
        }
      } catch (error) {
        console.error("Failed to check compliance:", error);
      } finally {
        setLoading(false);
      }

      return [];
    },
    [],
  );

  // Detect fraud in transaction
  const detectFraud = useCallback(
    async (
      transactionData: Record<string, unknown>,
    ): Promise<FraudDetection | null> => {
      try {
        const response = await fetch("/api/ai/compliance/detect-fraud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(transactionData),
        });

        if (response.ok) {
          const detection: FraudDetection = await response.json();

          if (detection.isFraudulent || detection.fraudScore > 50) {
            setFraudDetections((prev) => [...prev, detection].slice(-20)); // Keep last 20
          }

          return detection;
        }
      } catch (error) {
        console.error("Failed to detect fraud:", error);
      }

      return null;
    },
    [],
  );

  // Assess risk for an operation
  const assessRisk = useCallback(
    async (
      operation: string,
      context: Record<string, unknown>,
    ): Promise<RiskScore> => {
      try {
        const response = await fetch("/api/ai/compliance/assess-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ operation, context }),
        });

        if (response.ok) {
          const { riskScore } = await response.json();

          // Update overall risk if higher
          if (riskScore > overallRisk) {
            setOverallRisk(riskScore);
          }

          return riskScore;
        }
      } catch (error) {
        console.error("Failed to assess risk:", error);
      }

      return 0;
    },
    [overallRisk],
  );

  // Dismiss a compliance alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  // Refresh all monitoring data
  const refreshMonitoring = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/compliance/status", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setFraudDetections(data.fraudDetections || []);
        setOverallRisk(data.overallRisk || 0);
      }
    } catch (error) {
      console.error("Failed to refresh monitoring:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial compliance status
  useEffect(() => {
    refreshMonitoring();
  }, [refreshMonitoring]);

  // Periodic refresh (every 15 minutes)
  useEffect(() => {
    const interval = setInterval(refreshMonitoring, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshMonitoring]);

  const value: AIComplianceContextType = {
    alerts,
    fraudDetections,
    overallRisk,
    loading,
    checkCompliance,
    detectFraud,
    assessRisk,
    dismissAlert,
    refreshMonitoring,
  };

  return (
    <AIComplianceContext.Provider value={value}>
      {children}
    </AIComplianceContext.Provider>
  );
}

export function useAICompliance() {
  const context = useContext(AIComplianceContext);
  if (!context) {
    throw new Error("useAICompliance must be used within AIComplianceProvider");
  }
  return context;
}
