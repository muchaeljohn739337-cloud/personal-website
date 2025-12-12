import OpenAI from "openai";

/**
 * Reinforcement Learning from Human Feedback (RLHF)
 * Learns from human approvals to improve AI decision-making
 */

export interface HumanFeedback {
  taskId: string;
  decision: string;
  approved: boolean;
  confidence?: number; // 0-1
  feedback?: string;
  context: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface RewardModel {
  feature: string;
  weight: number;
  confidence: number;
}

export interface RLConfig {
  openaiApiKey: string;
  learningRate?: number;
  decayRate?: number;
  minSamples?: number;
}

export interface Prediction {
  approvalProbability: number;
  confidence: number;
  reasoning: string;
  suggestedImprovements: string[];
}

export class ReinforcementLearning {
  private config: Required<RLConfig>;
  private openai: OpenAI;
  private feedbackHistory: HumanFeedback[] = [];
  private rewardModels: Map<string, RewardModel[]> = new Map();

  constructor(config: RLConfig) {
    this.config = {
      learningRate: config.learningRate || 0.1,
      decayRate: config.decayRate || 0.95,
      minSamples: config.minSamples || 10,
      ...config,
    };
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
  }

  /**
   * Record human feedback on an AI decision
   */
  async recordFeedback(feedback: HumanFeedback): Promise<void> {
    this.feedbackHistory.push(feedback);

    // Keep only last 10,000 feedback entries
    if (this.feedbackHistory.length > 10000) {
      this.feedbackHistory = this.feedbackHistory.slice(-10000);
    }

    console.log(`[RL] Recorded feedback: ${feedback.approved ? "APPROVED" : "REJECTED"} - ${feedback.decision}`);

    // Update reward model if we have enough samples
    if (this.feedbackHistory.length >= this.config.minSamples) {
      await this.updateRewardModel(feedback.decision);
    }
  }

  /**
   * Update reward model based on recent feedback
   */
  private async updateRewardModel(decisionType: string): Promise<void> {
    const relevantFeedback = this.feedbackHistory.filter((f) => f.decision === decisionType);

    if (relevantFeedback.length < this.config.minSamples) {
      return;
    }

    try {
      // Use GPT-4 to analyze patterns in approved vs rejected decisions
      const approvedSamples = relevantFeedback.filter((f) => f.approved).slice(-20);
      const rejectedSamples = relevantFeedback.filter((f) => !f.approved).slice(-20);

      if (approvedSamples.length === 0 || rejectedSamples.length === 0) {
        return; // Need both approved and rejected samples
      }

      const prompt = `Analyze these AI decisions to identify patterns that lead to human approval.

APPROVED DECISIONS (${approvedSamples.length}):
${approvedSamples.map((f, i) => `${i + 1}. Context: ${JSON.stringify(f.context)}`).join("\n")}

REJECTED DECISIONS (${rejectedSamples.length}):
${rejectedSamples.map((f, i) => `${i + 1}. Context: ${JSON.stringify(f.context)}`).join("\n")}

Identify the key features/patterns that distinguish approved from rejected decisions.
Return as JSON array of features with importance weights (0-1):

[
  {
    "feature": "feature_name",
    "weight": 0.8,
    "confidence": 0.9,
    "description": "Why this matters"
  }
]

Focus on the top 5-7 most important features.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content || "[]";
      const features = JSON.parse(content);

      this.rewardModels.set(decisionType, features);

      console.log(`[RL] Updated reward model for "${decisionType}" with ${features.length} features`);
    } catch (error) {
      console.error("[RL] Error updating reward model:", error);
    }
  }

  /**
   * Predict if a decision will be approved by humans
   */
  async predictApproval(decision: string, context: Record<string, any>): Promise<Prediction> {
    const rewardModel = this.rewardModels.get(decision);

    if (!rewardModel) {
      // No model yet, use GPT-4 for prediction
      return this.fallbackPrediction(decision, context);
    }

    // Calculate approval probability based on reward model
    let score = 0;
    let totalWeight = 0;

    for (const feature of rewardModel) {
      const featureValue = this.extractFeatureValue(context, feature.feature);
      if (featureValue !== null) {
        score += feature.weight * feature.confidence;
        totalWeight += feature.confidence;
      }
    }

    const approvalProbability = totalWeight > 0 ? score / totalWeight : 0.5;

    // Use GPT-4 to explain the prediction
    const reasoning = await this.generateReasoning(decision, context, approvalProbability);

    return {
      approvalProbability,
      confidence: totalWeight > 0 ? totalWeight / rewardModel.length : 0.3,
      reasoning,
      suggestedImprovements: await this.suggestImprovements(decision, context, rewardModel),
    };
  }

  /**
   * Fallback prediction using GPT-4 when no model is available
   */
  private async fallbackPrediction(decision: string, context: Record<string, any>): Promise<Prediction> {
    const prompt = `Predict if this AI decision would be approved by a human.

Decision: ${decision}
Context: ${JSON.stringify(context, null, 2)}

Based on general best practices, estimate:
1. Approval probability (0-100)
2. Confidence in prediction (0-100)
3. Brief reasoning

Return as JSON:
{
  "approvalProbability": 75,
  "confidence": 60,
  "reasoning": "Explanation here"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content || "{}";
      const prediction = JSON.parse(content);

      return {
        approvalProbability: prediction.approvalProbability / 100,
        confidence: prediction.confidence / 100,
        reasoning: prediction.reasoning,
        suggestedImprovements: [],
      };
    } catch (error) {
      console.error("[RL] Error generating fallback prediction:", error);
      return {
        approvalProbability: 0.5,
        confidence: 0.3,
        reasoning: "Insufficient data for prediction",
        suggestedImprovements: [],
      };
    }
  }

  /**
   * Generate reasoning for a prediction
   */
  private async generateReasoning(
    decision: string,
    context: Record<string, any>,
    probability: number
  ): Promise<string> {
    const prompt = `Explain why this AI decision has a ${Math.round(probability * 100)}% approval probability.

Decision: ${decision}
Context: ${JSON.stringify(context, null, 2)}

Provide a 1-2 sentence explanation.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
      });

      return response.choices[0].message.content || "No reasoning available";
    } catch (error) {
      console.error("[RL] Error generating reasoning:", error);
      return "Unable to generate reasoning";
    }
  }

  /**
   * Suggest improvements to increase approval probability
   */
  private async suggestImprovements(
    decision: string,
    context: Record<string, any>,
    rewardModel: RewardModel[]
  ): Promise<string[]> {
    const improvements: string[] = [];

    // Find features with low scores
    const weakFeatures = rewardModel
      .filter((f) => {
        const value = this.extractFeatureValue(context, f.feature);
        return value === null || (typeof value === "number" && value < 0.5);
      })
      .slice(0, 3);

    for (const feature of weakFeatures) {
      improvements.push(`Improve ${feature.feature} (weight: ${feature.weight.toFixed(2)})`);
    }

    return improvements;
  }

  /**
   * Extract feature value from context
   */
  private extractFeatureValue(context: Record<string, any>, feature: string): any {
    const parts = feature.split(".");
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Get learning statistics
   */
  getStatistics(): {
    totalFeedback: number;
    approvalRate: number;
    rewardModels: number;
    recentFeedback: Array<{ decision: string; approved: boolean; timestamp: Date }>;
  } {
    const approvals = this.feedbackHistory.filter((f) => f.approved).length;

    return {
      totalFeedback: this.feedbackHistory.length,
      approvalRate: this.feedbackHistory.length > 0 ? approvals / this.feedbackHistory.length : 0,
      rewardModels: this.rewardModels.size,
      recentFeedback: this.feedbackHistory.slice(-10).map((f) => ({
        decision: f.decision,
        approved: f.approved,
        timestamp: f.timestamp,
      })),
    };
  }

  /**
   * Get reward model for a specific decision type
   */
  getRewardModel(decision: string): RewardModel[] | null {
    return this.rewardModels.get(decision) || null;
  }

  /**
   * Export feedback history for analysis
   */
  exportFeedback(limit?: number): HumanFeedback[] {
    return limit ? this.feedbackHistory.slice(-limit) : this.feedbackHistory;
  }
}

// Global RL instance
let globalRL: ReinforcementLearning | null = null;

export function initializeReinforcementLearning(config: RLConfig): ReinforcementLearning {
  globalRL = new ReinforcementLearning(config);
  return globalRL;
}

export function getReinforcementLearning(): ReinforcementLearning {
  if (!globalRL) {
    throw new Error("Reinforcement Learning not initialized. Call initializeReinforcementLearning() first.");
  }
  return globalRL;
}
