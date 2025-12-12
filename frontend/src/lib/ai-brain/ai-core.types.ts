/**
 * AI Brain Core - Type Definitions
 * Central type system for all AI-powered features
 */

// ============================================
// SECURITY & RISK TYPES
// ============================================

export type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskScore = number; // 0-100

export interface SessionRiskAnalysis {
  riskScore: RiskScore;
  threatLevel: ThreatLevel;
  factors: {
    unusualLocation: boolean;
    unusualDevice: boolean;
    unusualTime: boolean;
    rapidActions: boolean;
    suspiciousPatterns: boolean;
  };
  recommendations: string[];
  requiresVerification: boolean;
  timestamp: string;
}

export interface LoginRiskAssessment {
  riskScore: RiskScore;
  isBotLikely: boolean;
  isAnomalous: boolean;
  factors: {
    ipReputation: number;
    deviceTrust: number;
    loginPattern: number;
    velocityScore: number;
  };
  action: "ALLOW" | "CHALLENGE" | "BLOCK";
  reason: string;
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  anomalyType: "behavioral" | "transactional" | "security" | "system";
  confidence: number; // 0-1
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  suggestedActions: string[];
  metadata?: Record<string, unknown>;
}

// ============================================
// INSIGHTS & ANALYTICS TYPES
// ============================================

export interface AIInsight {
  id: string;
  type: "predictive" | "diagnostic" | "prescriptive" | "descriptive";
  category: "financial" | "behavioral" | "security" | "operational";
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: "low" | "medium" | "high";
  actionable: boolean;
  actions?: AIAction[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AIAction {
  id: string;
  label: string;
  description: string;
  route?: string;
  handler?: string;
  priority: number;
  estimatedValue?: number;
}

export interface PredictiveAnalysis {
  metric: string;
  currentValue: number;
  predictedValue: number;
  trend: "up" | "down" | "stable";
  confidence: number;
  timeframe: string;
  factors: string[];
}

export interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  type: "action" | "feature" | "optimization" | "warning";
  priority: number;
  relevanceScore: number;
  estimatedBenefit?: string;
  quickAction?: {
    label: string;
    route: string;
  };
}

// ============================================
// COMPLIANCE & FRAUD TYPES
// ============================================

export interface ComplianceAlert {
  id: string;
  level: "info" | "warning" | "violation" | "critical";
  category: "KYC" | "AML" | "REGULATORY" | "POLICY";
  title: string;
  description: string;
  affectedEntities: string[];
  requiresAction: boolean;
  deadline?: string;
  autoResolved: boolean;
}

export interface FraudDetection {
  isFraudulent: boolean;
  fraudScore: RiskScore;
  patterns: string[];
  similarCases: number;
  recommendedAction: "MONITOR" | "FLAG" | "BLOCK" | "INVESTIGATE";
  evidence: {
    type: string;
    description: string;
    severity: number;
  }[];
}

// ============================================
// UI ENHANCEMENT TYPES
// ============================================

export interface AutoCompleteContext {
  field: string;
  currentValue: string;
  suggestions: {
    value: string;
    confidence: number;
    reason?: string;
  }[];
  userHistory: boolean;
  aiGenerated: boolean;
}

export interface FormAssistance {
  fieldName: string;
  suggestion: string;
  prefill?: string;
  validation?: {
    isValid: boolean;
    message: string;
  };
  smartHelp?: string;
}

export interface UIPersonalization {
  userId: string;
  preferences: {
    dashboardLayout?: string[];
    quickActions?: string[];
    defaultViews?: Record<string, string>;
  };
  recommendations: {
    feature: string;
    reason: string;
    priority: number;
  }[];
  hiddenElements: string[];
}

// ============================================
// ERROR & MONITORING TYPES
// ============================================

export interface ErrorPattern {
  errorType: string;
  frequency: number;
  affectedUsers: number;
  firstSeen: string;
  lastSeen: string;
  severity: "low" | "medium" | "high" | "critical";
  suggestedFix?: string;
  relatedErrors: string[];
}

export interface ErrorAnalysis {
  pattern: ErrorPattern;
  isKnownIssue: boolean;
  autoFixAvailable: boolean;
  userImpact: "minimal" | "moderate" | "severe";
  recommendations: string[];
  escalate: boolean;
}

// ============================================
// ANALYTICS ENHANCEMENT TYPES
// ============================================

export interface SmartDateRange {
  label: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  isOptimal: boolean;
  expectedInsights: string[];
}

export interface GeographyInsight {
  location: string;
  latitude: number;
  longitude: number;
  value: number;
  isAnomaly: boolean;
  trend: "growing" | "stable" | "declining";
  predictedGrowth?: number;
  insights: string[];
}

export interface RevenueForecast {
  period: string;
  historical: number[];
  predicted: number[];
  confidence: number;
  factors: {
    seasonality: number;
    trend: number;
    external: number;
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

// ============================================
// AI AGENT TYPES
// ============================================

export interface AIAgent {
  id: string;
  name: string;
  type: "security" | "analytics" | "compliance" | "assistant" | "monitor";
  status: "active" | "idle" | "processing" | "error";
  capabilities: string[];
  lastActivity?: string;
  performance?: {
    accuracy: number;
    responseTime: number;
    tasksCompleted: number;
  };
}

export interface AIBrainConfig {
  enableSecurity: boolean;
  enableInsights: boolean;
  enableCompliance: boolean;
  enablePredictions: boolean;
  enableAutoComplete: boolean;
  enableRecommendations: boolean;
  realtimeUpdates: boolean;
  debugMode?: boolean;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface AIAnalysisRequest {
  type: "security" | "insight" | "prediction" | "recommendation" | "fraud";
  context: Record<string, unknown>;
  userId?: string;
  timestamp?: string;
}

export interface AIAnalysisResponse<T = unknown> {
  success: boolean;
  data: T;
  processingTime: number;
  confidence: number;
  model?: string;
  cached?: boolean;
}

// ============================================
// WEBSOCKET EVENT TYPES
// ============================================

export interface AIRealtimeEvent {
  type:
    | "risk_alert"
    | "insight_generated"
    | "anomaly_detected"
    | "recommendation_ready";
  payload: unknown;
  priority: "low" | "medium" | "high" | "urgent";
  timestamp: string;
  userId?: string;
}
