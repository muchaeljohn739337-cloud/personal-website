/**
 * Mom AI Core - Orchestrator for all Mom agents
 *
 * Workflow:
 * 1. Analyzer: Parse error/logs → Build RAG context → Diagnose
 * 2. ProblemSolver: Generate fixes → Calculate confidence
 * 3. Decision: Ensemble vote → Risk assessment → Approval routing
 * 4. Learner: Store outcome → Build knowledge base
 *
 * Usage:
 * ```typescript
 * import { momAICore } from './ai/mom-core';
 *
 * const result = await momAICore.handleIncident({
 *   errorMessage: "TypeError: Cannot read property 'id' of undefined",
 *   stackTrace: "...",
 *   severity: "ERROR"
 * });
 *
 * if (result.decision.approved) {
 *   // Auto-execute or route to sandbox
 * } else {
 *   // Send for admin approval
 * }
 * ```
 */

import { analyzerAgent } from "./analyzer";
import { decisionAgent } from "./decision";
import { learnerAgent } from "./learner";
import { problemSolverAgent } from "./problem-solver";
import { AnalysisContext, DecisionResult, Diagnosis, LearningOutcome, ProposedSolution } from "./types";

interface IncidentHandlingResult {
  requestId: string;
  diagnosis: Diagnosis;
  solution: ProposedSolution;
  decision: DecisionResult;
  status: "auto-approved" | "requires-approval" | "requires-sandbox" | "rejected";
  nextSteps: string[];
}

export class MomAICore {
  private initialized: boolean = false;

  constructor() {}

  /**
   * Initialize all Mom agents
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🧠 [MomAI Core] Initializing all agents...");

    await Promise.all([
      analyzerAgent.initialize(),
      problemSolverAgent.initialize(),
      decisionAgent.initialize(),
      learnerAgent.initialize(),
    ]);

    this.initialized = true;
    console.log("✅ [MomAI Core] All agents ready");
  }

  /**
   * Handle incident - main entry point
   */
  async handleIncident(context: AnalysisContext): Promise<IncidentHandlingResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const requestId = this.generateRequestId();

    console.log(`🔍 [MomAI Core] Handling incident ${requestId}`);
    console.log(`   Severity: ${context.severity}`);
    console.log(`   Error: ${context.errorMessage?.substring(0, 100)}...`);

    try {
      // Step 1: Analyze the issue
      console.log("📊 Step 1: Analyzing...");
      const diagnosis = await analyzerAgent.analyzeError(context);
      console.log(`   ✓ Diagnosis: ${diagnosis.rootCause}`);
      console.log(`   ✓ Confidence: ${(diagnosis.confidence * 100).toFixed(0)}%`);

      // Step 2: Generate solution
      console.log("🔧 Step 2: Generating solution...");
      const solution = await problemSolverAgent.generateSolution(diagnosis);
      console.log(`   ✓ Solution: ${solution.description.substring(0, 100)}...`);
      console.log(`   ✓ Changes: ${solution.codeChanges?.length || 0} file(s)`);

      // Step 3: Make decision
      console.log("⚖️  Step 3: Making decision...");
      const decision = await decisionAgent.makeDecision(solution);
      console.log(`   ✓ Risk: ${decision.riskLevel}`);
      console.log(`   ✓ Approved: ${decision.approved}`);
      console.log(`   ✓ Requires approval: ${decision.requiresApproval}`);

      // Determine status and next steps
      const { status, nextSteps } = this.determineStatus(decision);

      console.log(`✅ [MomAI Core] Incident handling complete: ${status}`);

      return {
        requestId,
        diagnosis,
        solution,
        decision,
        status,
        nextSteps,
      };
    } catch (error) {
      console.error(`❌ [MomAI Core] Incident handling failed:`, error);
      throw error;
    }
  }

  /**
   * Record execution result (after solution is applied)
   */
  async recordOutcome(
    result: IncidentHandlingResult,
    executionResult: {
      success: boolean;
      error?: string;
      metrics?: Record<string, any>;
    },
    feedback?: {
      rating: number;
      comments: string;
    }
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`📝 [MomAI Core] Recording outcome for ${result.requestId}`);

    const outcome: LearningOutcome = {
      requestId: result.requestId,
      diagnosis: result.diagnosis,
      solution: result.solution,
      decision: result.decision,
      executionResult,
      feedback,
      timestamp: new Date().toISOString(),
    };

    await learnerAgent.storeLearning(outcome);

    console.log(`✅ [MomAI Core] Outcome recorded (success: ${executionResult.success})`);
  }

  /**
   * Get learning statistics
   */
  async getStatistics(): Promise<{
    totalIncidents: number;
    successRate: number;
    averageConfidence: number;
    riskDistribution: Record<string, number>;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const stats = await learnerAgent.getStatistics();

    return {
      totalIncidents: stats.totalLearnings,
      successRate: stats.totalLearnings > 0 ? stats.successCount / stats.totalLearnings : 0,
      averageConfidence: stats.averageConfidence,
      riskDistribution: stats.riskDistribution,
    };
  }

  /**
   * Query past similar incidents
   */
  async querySimilarIncidents(query: string, limit: number = 5): Promise<LearningOutcome[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return await learnerAgent.queryLearnings(query, limit);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `mom-${timestamp}-${random}`;
  }

  /**
   * Determine status and next steps based on decision
   */
  private determineStatus(decision: DecisionResult): {
    status: "auto-approved" | "requires-approval" | "requires-sandbox" | "rejected";
    nextSteps: string[];
  } {
    const nextSteps: string[] = [];

    // Auto-approved: High confidence + Low risk
    if (decision.approved && !decision.sandboxRequired) {
      nextSteps.push("Execute solution immediately");
      nextSteps.push("Monitor system for 10 minutes");
      nextSteps.push("Record execution result");

      return { status: "auto-approved", nextSteps };
    }

    // Requires sandbox testing
    if (decision.sandboxRequired && decision.approved) {
      nextSteps.push("Deploy solution to sandbox environment");
      nextSteps.push("Run automated tests");
      nextSteps.push("If tests pass, execute in production");
      nextSteps.push("If tests fail, reject and record failure");

      return { status: "requires-sandbox", nextSteps };
    }

    // Requires human approval
    if (decision.requiresApproval) {
      nextSteps.push(`Create approval request for ${decision.approverRoles.join("/")} role(s)`);
      nextSteps.push("Wait for required approvals");
      nextSteps.push("If approved, proceed to sandbox testing (if required)");
      nextSteps.push("If rejected, record feedback and improve");

      return { status: "requires-approval", nextSteps };
    }

    // Rejected (very low confidence or high risk)
    nextSteps.push("Solution rejected due to low confidence or high risk");
    nextSteps.push("Manual investigation required");
    nextSteps.push("Consider alternative approaches");

    return { status: "rejected", nextSteps };
  }

  /**
   * Health check - verify all agents are operational
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    agents: Record<string, boolean>;
  }> {
    const agents = {
      analyzer: false,
      problemSolver: false,
      decision: false,
      learner: false,
    };

    try {
      await this.initialize();

      // Simple check - all agents initialized
      agents.analyzer = true;
      agents.problemSolver = true;
      agents.decision = true;
      agents.learner = true;
    } catch (error) {
      console.error("[MomAI Core] Health check failed:", error);
    }

    const healthy = Object.values(agents).every((status) => status);

    return { healthy, agents };
  }
}

// Singleton export
export const momAICore = new MomAICore();
