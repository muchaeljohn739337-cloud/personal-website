/**
 * AI Security Context
 * Provides session risk scoring, anomaly detection, bot detection, and login risk assessment
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
  AIRealtimeEvent,
  AnomalyDetection,
  LoginRiskAssessment,
  SessionRiskAnalysis,
  ThreatLevel,
} from "./ai-core.types";

interface AISecurityContextType {
  sessionRisk: SessionRiskAnalysis | null;
  loginRisk: LoginRiskAssessment | null;
  anomalies: AnomalyDetection[];
  threatLevel: ThreatLevel;
  loading: boolean;

  // Methods
  analyzeSession: () => Promise<void>;
  assessLoginRisk: (
    credentials: LoginCredentials,
  ) => Promise<LoginRiskAssessment>;
  checkForAnomalies: (
    action: string,
    metadata?: Record<string, unknown>,
  ) => Promise<AnomalyDetection | null>;
  clearAlerts: () => void;
}

interface LoginCredentials {
  email: string;
  ip?: string;
  userAgent?: string;
  timestamp?: string;
}

const AISecurityContext = createContext<AISecurityContextType | undefined>(
  undefined,
);

export function AISecurityProvider({ children }: { children: ReactNode }) {
  const [sessionRisk, setSessionRisk] = useState<SessionRiskAnalysis | null>(
    null,
  );
  const [loginRisk, setLoginRisk] = useState<LoginRiskAssessment | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>("LOW");
  const [loading, setLoading] = useState(false);

  // Analyze current session for risk factors
  const analyzeSession = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/security/analyze-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data: SessionRiskAnalysis = await response.json();
        setSessionRisk(data);
        setThreatLevel(data.threatLevel);
      }
    } catch (error) {
      console.error("Failed to analyze session risk:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Assess login risk before authentication
  const assessLoginRisk = useCallback(
    async (credentials: LoginCredentials): Promise<LoginRiskAssessment> => {
      const defaultRisk: LoginRiskAssessment = {
        riskScore: 0,
        isBotLikely: false,
        isAnomalous: false,
        factors: {
          ipReputation: 100,
          deviceTrust: 100,
          loginPattern: 100,
          velocityScore: 100,
        },
        action: "ALLOW",
        reason: "Security check unavailable",
      };

      try {
        const response = await fetch("/api/ai/security/assess-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (response.ok) {
          const assessment: LoginRiskAssessment = await response.json();
          setLoginRisk(assessment);
          return assessment;
        }
      } catch (error) {
        console.error("Failed to assess login risk:", error);
      }

      return defaultRisk;
    },
    [],
  );

  // Check for anomalies in user actions
  const checkForAnomalies = useCallback(
    async (
      action: string,
      metadata?: Record<string, unknown>,
    ): Promise<AnomalyDetection | null> => {
      try {
        const response = await fetch("/api/ai/security/detect-anomaly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action,
            metadata,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          const anomaly: AnomalyDetection = await response.json();

          if (anomaly.isAnomaly) {
            setAnomalies((prev) => [...prev, anomaly].slice(-10)); // Keep last 10

            // Update threat level if severe
            if (
              anomaly.severity === "critical" ||
              anomaly.severity === "high"
            ) {
              setThreatLevel(
                anomaly.severity === "critical" ? "CRITICAL" : "HIGH",
              );
            }
          }

          return anomaly;
        }
      } catch (error) {
        console.error("Failed to check for anomalies:", error);
      }

      return null;
    },
    [],
  );

  // Clear security alerts
  const clearAlerts = useCallback(() => {
    setAnomalies([]);
    setThreatLevel("LOW");
  }, []);

  // Periodic session analysis (every 5 minutes)
  useEffect(() => {
    analyzeSession();
    const interval = setInterval(analyzeSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [analyzeSession]);

  // Setup real-time security event listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleSecurityEvent = (event: CustomEvent<AIRealtimeEvent>) => {
      const { type, payload, priority } = event.detail;

      if (type === "risk_alert" || type === "anomaly_detected") {
        if (priority === "urgent" || priority === "high") {
          setThreatLevel("HIGH");
        }

        // Trigger session re-analysis
        analyzeSession();
      }
    };

    window.addEventListener("ai:security:event" as any, handleSecurityEvent);
    return () =>
      window.removeEventListener(
        "ai:security:event" as any,
        handleSecurityEvent,
      );
  }, [analyzeSession]);

  const value: AISecurityContextType = {
    sessionRisk,
    loginRisk,
    anomalies,
    threatLevel,
    loading,
    analyzeSession,
    assessLoginRisk,
    checkForAnomalies,
    clearAlerts,
  };

  return (
    <AISecurityContext.Provider value={value}>
      {children}
    </AISecurityContext.Provider>
  );
}

export function useAISecurity() {
  const context = useContext(AISecurityContext);
  if (!context) {
    throw new Error("useAISecurity must be used within AISecurityProvider");
  }
  return context;
}
