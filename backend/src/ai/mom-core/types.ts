/**
 * Type definitions for Mom AI Core system
 */

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  EMERGENCY = "EMERGENCY",
}

export interface AnalysisContext {
  errorMessage?: string;
  logEntries?: string[];
  stackTrace?: string;
  affectedFiles?: string[];
  systemState?: Record<string, any>;
  timestamp: string;
  userId?: string;
  severity: "INFO" | "WARN" | "ERROR" | "CRITICAL";
}

export interface RAGContext {
  relevantCode: string[];
  documentation: string[];
  similarIssues: Array<{
    issue: string;
    solution: string;
    confidence: number;
  }>;
  confidence: number;
}

export interface Diagnosis {
  rootCause: string;
  affectedComponents: string[];
  impactAssessment: string;
  confidence: number;
  context: RAGContext;
}

export interface ProposedSolution {
  description: string;
  codeChanges?: Array<{
    file: string;
    changes: string;
    type: "create" | "update" | "delete";
  }>;
  configChanges?: Record<string, any>;
  databaseMigration?: string;
  rollbackSteps: string[];
  testPlan: string[];
  confidence: number;
  estimatedImpact: string;
  requiredApprovals: number;
}

export interface DecisionResult {
  approved: boolean;
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string;
  votingResults: Array<{
    model: string;
    vote: "approve" | "reject" | "uncertain";
    confidence: number;
  }>;
  requiresApproval: boolean;
  approverRoles: string[];
  sandboxRequired: boolean;
}

export interface LearningOutcome {
  requestId: string;
  diagnosis: Diagnosis;
  solution: ProposedSolution;
  decision: DecisionResult;
  executionResult: {
    success: boolean;
    error?: string;
    metrics?: Record<string, any>;
  };
  feedback?: {
    rating: number;
    comments: string;
  };
  timestamp: string;
}

export interface ModerationResult {
  passed: boolean;
  violations: Array<{
    rule: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    pattern: string;
    match: string;
  }>;
  redactedContent?: string;
  action: "ALLOW" | "BLOCK" | "REDACT" | "FLAG";
  alertSent: boolean;
}
