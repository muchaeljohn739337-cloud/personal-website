/**
 * useSecurityAI Hook
 * Provides security-specific AI features: risk scoring, anomaly detection, bot detection
 */

import {
  AnomalyDetection,
  LoginRiskAssessment,
  SessionRiskAnalysis,
  ThreatLevel,
} from "@/lib/ai-brain/ai-core.types";
import {
  analyzeSessionSecurity,
  assessLoginRisk,
  detectAnomaly,
  scanForBots,
} from "@/services/aiCore";
import { useCallback, useEffect, useState } from "react";

export function useSecurityAI() {
  const [sessionRisk, setSessionRisk] = useState<SessionRiskAnalysis | null>(
    null,
  );
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>("LOW");
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [loading, setLoading] = useState(false);

  // Analyze current session
  const analyzeSession = useCallback(async () => {
    setLoading(true);
    try {
      const analysis = await analyzeSessionSecurity();
      setSessionRisk(analysis);
      setThreatLevel(analysis.threatLevel);
    } catch (error) {
      console.error("Session analysis failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Assess login risk
  const checkLoginRisk = useCallback(
    async (credentials: {
      email: string;
      ip?: string;
      userAgent?: string;
    }): Promise<LoginRiskAssessment | null> => {
      try {
        const assessment = await assessLoginRisk(credentials);
        return assessment;
      } catch (error) {
        console.error("Login risk assessment failed:", error);
        return null;
      }
    },
    [],
  );

  // Check for anomalous behavior
  const checkAnomaly = useCallback(
    async (
      action: string,
      metadata?: Record<string, unknown>,
    ): Promise<AnomalyDetection | null> => {
      try {
        const anomaly = await detectAnomaly(action, metadata);

        if (anomaly.isAnomaly) {
          setAnomalies((prev) => [...prev, anomaly].slice(-10));

          if (anomaly.severity === "critical" || anomaly.severity === "high") {
            setThreatLevel(
              anomaly.severity === "critical" ? "CRITICAL" : "HIGH",
            );
          }
        }

        return anomaly;
      } catch (error) {
        console.error("Anomaly detection failed:", error);
        return null;
      }
    },
    [],
  );

  // Bot detection
  const checkForBot = useCallback(
    async (requestData: Record<string, unknown>) => {
      try {
        const result = await scanForBots(requestData);
        return result;
      } catch (error) {
        console.error("Bot detection failed:", error);
        return { isBot: false, confidence: 0, reason: "Detection unavailable" };
      }
    },
    [],
  );

  // Auto-analyze session on mount and periodically
  useEffect(() => {
    analyzeSession();
    const interval = setInterval(analyzeSession, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [analyzeSession]);

  return {
    sessionRisk,
    threatLevel,
    anomalies,
    loading,
    analyzeSession,
    checkLoginRisk,
    checkAnomaly,
    checkForBot,
    clearAnomalies: () => setAnomalies([]),
  };
}
