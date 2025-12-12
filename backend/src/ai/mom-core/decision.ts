/**
 * Decision Agent - Ensemble consensus and risk scoring
 *
 * Responsibilities:
 * - Get consensus from multiple LLMs
 * - Calculate risk level (LOW/MEDIUM/HIGH/EMERGENCY)
 * - Determine if sandbox testing required
 * - Determine approval requirements
 * - Apply approval policy rules
 */

import * as fs from "fs";
import OpenAI from "openai";
import * as path from "path";
import * as yaml from "yaml";
import { vaultService } from "../../services/VaultService";
import { DecisionResult, ProposedSolution, RiskLevel } from "./types";

interface ApprovalPolicy {
  risk_levels: Record<
    string,
    {
      auto_apply: boolean;
      min_confidence: number;
      approvals_required: number;
      approver_roles: string[];
      require_2fa: boolean;
      sandbox_required: boolean;
    }
  >;
}

export class DecisionAgent {
  private openai: OpenAI | null = null;
  private initialized: boolean = false;
  private approvalPolicy: ApprovalPolicy | null = null;

  constructor() {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("[DecisionAgent] Initializing...");

    // Load OpenAI for ensemble voting
    const openaiKey = (await vaultService.getSecret("OPENAI_API_KEY").catch(() => null)) || process.env.OPENAI_API_KEY;

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    // Load approval policy
    await this.loadApprovalPolicy();

    this.initialized = true;
    console.log("[DecisionAgent] Ready");
  }

  /**
   * Load approval policy from configuration
   */
  private async loadApprovalPolicy(): Promise<void> {
    const policyPath = path.join(process.cwd(), "config", "ai-policies", "approval_policy.yaml");

    try {
      const policyContent = fs.readFileSync(policyPath, "utf-8");
      this.approvalPolicy = yaml.parse(policyContent);
      console.log("[DecisionAgent] Approval policy loaded");
    } catch (error) {
      console.warn("[DecisionAgent] Could not load approval policy, using defaults");
      this.approvalPolicy = this.getDefaultPolicy();
    }
  }

  /**
   * Get default approval policy
   */
  private getDefaultPolicy(): ApprovalPolicy {
    return {
      risk_levels: {
        LOW: {
          auto_apply: true,
          min_confidence: 0.85,
          approvals_required: 0,
          approver_roles: [],
          require_2fa: false,
          sandbox_required: false,
        },
        MEDIUM: {
          auto_apply: false,
          min_confidence: 0.75,
          approvals_required: 1,
          approver_roles: ["admin", "ops"],
          require_2fa: false,
          sandbox_required: true,
        },
        HIGH: {
          auto_apply: false,
          min_confidence: 0.9,
          approvals_required: 2,
          approver_roles: ["admin"],
          require_2fa: true,
          sandbox_required: true,
        },
        EMERGENCY: {
          auto_apply: false,
          min_confidence: 0.95,
          approvals_required: 2,
          approver_roles: ["admin"],
          require_2fa: true,
          sandbox_required: false,
        },
      },
    };
  }

  /**
   * Make decision on proposed solution
   */
  async makeDecision(solution: ProposedSolution): Promise<DecisionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log("[DecisionAgent] Making decision...");

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(solution);

    // Get ensemble voting results
    const votingResults = await this.getEnsembleVote(solution, riskLevel);

    // Calculate consensus confidence
    const confidence = this.calculateConsensusConfidence(votingResults, solution.confidence);

    // Determine if approved
    const approved = this.determineApproval(riskLevel, confidence);

    // Get approval requirements
    const { requiresApproval, approverRoles, sandboxRequired } = this.getApprovalRequirements(riskLevel, confidence);

    // Generate reasoning
    const reasoning = this.generateReasoning(riskLevel, confidence, votingResults, approved);

    const decision: DecisionResult = {
      approved,
      riskLevel,
      confidence,
      reasoning,
      votingResults,
      requiresApproval,
      approverRoles,
      sandboxRequired,
    };

    console.log(
      `[DecisionAgent] Decision: ${approved ? "APPROVED" : "REQUIRES APPROVAL"} (Risk: ${riskLevel}, Confidence: ${confidence.toFixed(2)})`
    );

    return decision;
  }

  /**
   * Calculate risk level based on solution characteristics
   */
  private calculateRiskLevel(solution: ProposedSolution): RiskLevel {
    const impact = solution.estimatedImpact.toLowerCase();
    const confidence = solution.confidence;
    const hasCodeChanges = solution.codeChanges && solution.codeChanges.length > 0;
    const hasDatabaseMigration = !!solution.databaseMigration;

    // EMERGENCY: Critical system changes with low confidence
    if (confidence < 0.6 && (impact.includes("critical") || impact.includes("high"))) {
      return RiskLevel.EMERGENCY;
    }

    // HIGH: Database changes, wallet operations, authentication changes
    if (hasDatabaseMigration) {
      return RiskLevel.HIGH;
    }

    if (
      solution.description.toLowerCase().includes("wallet") ||
      solution.description.toLowerCase().includes("payment") ||
      solution.description.toLowerCase().includes("auth")
    ) {
      return RiskLevel.HIGH;
    }

    // MEDIUM: Multiple file changes or config changes
    if (hasCodeChanges && solution.codeChanges!.length > 2) {
      return RiskLevel.MEDIUM;
    }

    if (solution.configChanges && Object.keys(solution.configChanges).length > 0) {
      return RiskLevel.MEDIUM;
    }

    // LOW: Single file changes with high confidence
    if (confidence >= 0.85 && impact.includes("minimal")) {
      return RiskLevel.LOW;
    }

    // Default to MEDIUM if uncertain
    return RiskLevel.MEDIUM;
  }

  /**
   * Get ensemble vote from multiple models
   */
  private async getEnsembleVote(
    solution: ProposedSolution,
    riskLevel: RiskLevel
  ): Promise<
    Array<{
      model: string;
      vote: "approve" | "reject" | "uncertain";
      confidence: number;
    }>
  > {
    const votes: Array<{
      model: string;
      vote: "approve" | "reject" | "uncertain";
      confidence: number;
    }> = [];

    // If no OpenAI, use rule-based voting
    if (!this.openai) {
      return this.getRuleBasedVotes(solution, riskLevel);
    }

    // Get votes from different models
    try {
      // GPT-4 vote
      const gpt4Vote = await this.getModelVote(solution, "gpt-4");
      votes.push({ model: "gpt-4", ...gpt4Vote });

      // GPT-3.5 vote (faster, cost-effective second opinion)
      const gpt35Vote = await this.getModelVote(solution, "gpt-3.5-turbo");
      votes.push({ model: "gpt-3.5-turbo", ...gpt35Vote });
    } catch (error) {
      console.error("[DecisionAgent] Ensemble voting failed:", error);
      return this.getRuleBasedVotes(solution, riskLevel);
    }

    return votes;
  }

  /**
   * Get vote from a specific model
   */
  private async getModelVote(
    solution: ProposedSolution,
    model: string
  ): Promise<{ vote: "approve" | "reject" | "uncertain"; confidence: number }> {
    if (!this.openai) {
      throw new Error("OpenAI not initialized");
    }

    const prompt = `Review this proposed solution and vote:

**Description:** ${solution.description}

**Confidence:** ${solution.confidence}

**Code Changes:** ${solution.codeChanges?.length || 0} file(s)

**Impact:** ${solution.estimatedImpact}

**Rollback:** ${solution.rollbackSteps.join(", ")}

Vote: approve, reject, or uncertain
Explain your reasoning in 1-2 sentences.`;

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are an expert code reviewer. Vote on proposed solutions based on safety, correctness, and impact.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const answer = (response.choices[0].message.content || "").toLowerCase();

    let vote: "approve" | "reject" | "uncertain" = "uncertain";
    if (answer.includes("approve")) vote = "approve";
    if (answer.includes("reject")) vote = "reject";

    // Confidence based on model's response clarity
    const confidence = vote === "uncertain" ? 0.5 : 0.8;

    return { vote, confidence };
  }

  /**
   * Rule-based voting (fallback when AI unavailable)
   */
  private getRuleBasedVotes(
    solution: ProposedSolution,
    riskLevel: RiskLevel
  ): Array<{
    model: string;
    vote: "approve" | "reject" | "uncertain";
    confidence: number;
  }> {
    const votes: Array<{
      model: string;
      vote: "approve" | "reject" | "uncertain";
      confidence: number;
    }> = [];

    // Rule 1: High confidence + low risk = approve
    if (solution.confidence >= 0.85 && riskLevel === RiskLevel.LOW) {
      votes.push({ model: "rule-based-1", vote: "approve", confidence: 0.9 });
    } else if (solution.confidence < 0.6) {
      votes.push({ model: "rule-based-1", vote: "reject", confidence: 0.8 });
    } else {
      votes.push({ model: "rule-based-1", vote: "uncertain", confidence: 0.7 });
    }

    // Rule 2: Impact assessment
    const impact = solution.estimatedImpact.toLowerCase();
    if (impact.includes("minimal") || impact.includes("low")) {
      votes.push({ model: "rule-based-2", vote: "approve", confidence: 0.85 });
    } else if (impact.includes("high")) {
      votes.push({ model: "rule-based-2", vote: "uncertain", confidence: 0.7 });
    }

    return votes;
  }

  /**
   * Calculate consensus confidence from voting results
   */
  private calculateConsensusConfidence(
    votingResults: Array<{ model: string; vote: string; confidence: number }>,
    solutionConfidence: number
  ): number {
    const approveVotes = votingResults.filter((v) => v.vote === "approve").length;
    const totalVotes = votingResults.length;

    // Calculate average confidence from models
    const avgModelConfidence = votingResults.reduce((sum, v) => sum + v.confidence, 0) / totalVotes;

    // Consensus confidence = (vote agreement * model confidence + solution confidence) / 2
    const voteAgreement = approveVotes / totalVotes;
    const consensusConfidence = (voteAgreement * avgModelConfidence + solutionConfidence) / 2;

    return Math.min(consensusConfidence, 1.0);
  }

  /**
   * Determine if solution should be auto-approved
   */
  private determineApproval(riskLevel: RiskLevel, confidence: number): boolean {
    if (!this.approvalPolicy) return false;

    const policy = this.approvalPolicy.risk_levels[riskLevel];

    // Check if auto-apply is enabled and confidence meets threshold
    return policy.auto_apply && confidence >= policy.min_confidence;
  }

  /**
   * Get approval requirements based on risk level and confidence
   */
  private getApprovalRequirements(
    riskLevel: RiskLevel,
    confidence: number
  ): {
    requiresApproval: boolean;
    approverRoles: string[];
    sandboxRequired: boolean;
  } {
    if (!this.approvalPolicy) {
      return { requiresApproval: true, approverRoles: ["admin"], sandboxRequired: true };
    }

    const policy = this.approvalPolicy.risk_levels[riskLevel];

    const requiresApproval = !policy.auto_apply || confidence < policy.min_confidence;

    return {
      requiresApproval,
      approverRoles: policy.approver_roles,
      sandboxRequired: policy.sandbox_required,
    };
  }

  /**
   * Generate reasoning for decision
   */
  private generateReasoning(
    riskLevel: RiskLevel,
    confidence: number,
    votingResults: Array<{ model: string; vote: string; confidence: number }>,
    approved: boolean
  ): string {
    const approveVotes = votingResults.filter((v) => v.vote === "approve").length;
    const totalVotes = votingResults.length;

    let reasoning = `Risk Level: ${riskLevel}. Confidence: ${(confidence * 100).toFixed(0)}%. `;
    reasoning += `Ensemble vote: ${approveVotes}/${totalVotes} approve. `;

    if (approved) {
      reasoning += "Auto-approved based on high confidence and low risk.";
    } else {
      reasoning += `Requires ${this.approvalPolicy?.risk_levels[riskLevel].approvals_required || 1} admin approval(s).`;
    }

    return reasoning;
  }
}

// Singleton export
export const decisionAgent = new DecisionAgent();
