/**
 * AI Core Service
 * Backend API integration for all AI Brain features
 */

import {
  AIAnalysisRequest,
  AIAnalysisResponse,
  AIInsight,
  AnomalyDetection,
  AutoCompleteContext,
  ComplianceAlert,
  FormAssistance,
  FraudDetection,
  GeographyInsight,
  LoginRiskAssessment,
  PredictiveAnalysis,
  RevenueForecast,
  RiskScore,
  SessionRiskAnalysis,
  SmartDateRange,
  SmartRecommendation,
  UIPersonalization,
} from "@/lib/ai-brain/ai-core.types";
import { api } from "@/utils/api";

// ============================================
// SECURITY APIs
// ============================================

export async function analyzeSessionSecurity(): Promise<SessionRiskAnalysis> {
  return api.post("/api/ai/security/analyze-session", {});
}

export async function assessLoginRisk(credentials: {
  email: string;
  ip?: string;
  userAgent?: string;
}): Promise<LoginRiskAssessment> {
  return api.post("/api/ai/security/assess-login", credentials);
}

export async function detectAnomaly(
  action: string,
  metadata?: Record<string, unknown>,
): Promise<AnomalyDetection> {
  return api.post("/api/ai/security/detect-anomaly", {
    action,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

export async function scanForBots(
  requestData: Record<string, unknown>,
): Promise<{
  isBot: boolean;
  confidence: number;
  reason: string;
}> {
  return api.post("/api/ai/security/bot-detection", requestData);
}

// ============================================
// INSIGHTS APIs
// ============================================

export async function generateInsights(context: string): Promise<AIInsight[]> {
  return api.post("/api/ai/insights/generate", {
    context,
    timestamp: new Date().toISOString(),
  });
}

export async function getRecommendations(
  category?: string,
): Promise<SmartRecommendation[]> {
  const url = category
    ? `/api/ai/insights/recommendations?category=${category}`
    : "/api/ai/insights/recommendations";
  return api.get(url);
}

export async function predictMetric(
  metric: string,
  timeframe: string,
): Promise<PredictiveAnalysis> {
  return api.post("/api/ai/insights/predict", { metric, timeframe });
}

export async function getSmartDateRange(
  purpose: string,
): Promise<SmartDateRange> {
  return api.post("/api/ai/insights/smart-date-range", { purpose });
}

export async function getUserPersonalization(): Promise<UIPersonalization> {
  return api.get("/api/ai/insights/personalization");
}

export async function updateUserPersonalization(
  preferences: Partial<UIPersonalization["preferences"]>,
): Promise<UIPersonalization> {
  return api.put("/api/ai/insights/personalization", { preferences });
}

// ============================================
// COMPLIANCE APIs
// ============================================

export async function checkCompliance(
  entity: string,
  type: string,
): Promise<ComplianceAlert[]> {
  return api.post("/api/ai/compliance/check", { entity, type });
}

export async function detectFraud(
  transactionData: Record<string, unknown>,
): Promise<FraudDetection> {
  return api.post("/api/ai/compliance/detect-fraud", transactionData);
}

export async function assessRisk(
  operation: string,
  context: Record<string, unknown>,
): Promise<{ riskScore: RiskScore }> {
  return api.post("/api/ai/compliance/assess-risk", { operation, context });
}

export async function getComplianceStatus(): Promise<{
  alerts: ComplianceAlert[];
  fraudDetections: FraudDetection[];
  overallRisk: RiskScore;
}> {
  return api.get("/api/ai/compliance/status");
}

// ============================================
// ANALYTICS ENHANCEMENT APIs
// ============================================

export async function getGeographyInsights(dateRange?: {
  start: string;
  end: string;
}): Promise<GeographyInsight[]> {
  const params = dateRange
    ? `?start=${dateRange.start}&end=${dateRange.end}`
    : "";
  return api.get(`/api/ai/analytics/geography${params}`);
}

export async function getRevenueForecast(
  days: number = 30,
): Promise<RevenueForecast> {
  return api.get(`/api/ai/analytics/revenue-forecast?days=${days}`);
}

export async function getSmartMetrics(userId?: string): Promise<{
  metrics: Array<{
    name: string;
    value: number;
    trend: "up" | "down" | "stable";
    insight: string;
    prediction?: number;
  }>;
}> {
  const params = userId ? `?userId=${userId}` : "";
  return api.get(`/api/ai/analytics/smart-metrics${params}`);
}

// ============================================
// UI ASSISTANCE APIs
// ============================================

export async function getAutoComplete(
  field: string,
  currentValue: string,
  context?: Record<string, unknown>,
): Promise<AutoCompleteContext> {
  return api.post("/api/ai/ui/autocomplete", {
    field,
    currentValue,
    context,
  });
}

export async function getFormAssistance(
  formType: string,
  currentData: Record<string, unknown>,
): Promise<FormAssistance[]> {
  return api.post("/api/ai/ui/form-assist", {
    formType,
    currentData,
  });
}

export async function getSmartSearch(
  query: string,
  filters?: Record<string, unknown>,
): Promise<{
  results: Array<{
    id: string;
    title: string;
    description: string;
    relevance: number;
    category: string;
  }>;
  suggestions: string[];
  enhancedQuery?: string;
}> {
  return api.post("/api/ai/ui/smart-search", { query, filters });
}

// ============================================
// GENERAL AI ANALYSIS API
// ============================================

export async function performAIAnalysis<T = unknown>(
  request: AIAnalysisRequest,
): Promise<AIAnalysisResponse<T>> {
  return api.post("/api/ai/analyze", request);
}

// ============================================
// BATCH OPERATIONS
// ============================================

export async function batchAnalyze(
  requests: AIAnalysisRequest[],
): Promise<AIAnalysisResponse[]> {
  return api.post("/api/ai/batch-analyze", { requests });
}

// ============================================
// AI MODEL INFO
// ============================================

export async function getAIStatus(): Promise<{
  security: { active: boolean; model: string };
  insights: { active: boolean; model: string };
  compliance: { active: boolean; model: string };
  health: "healthy" | "degraded" | "down";
}> {
  return api.get("/api/ai/status");
}
