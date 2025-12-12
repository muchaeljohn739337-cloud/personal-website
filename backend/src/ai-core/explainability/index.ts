import OpenAI from "openai";

/**
 * AI Decision Explainability Engine
 * Provides interpretable explanations for AI decisions using SHAP-inspired techniques
 */

export interface ExplanationResult {
  decision: string;
  confidence: number;
  factors: ExplanationFactor[];
  reasoning: string;
  alternatives: Alternative[];
  timestamp: Date;
  modelUsed: string;
}

export interface ExplanationFactor {
  feature: string;
  importance: number; // -1 to 1 (negative = against decision, positive = for decision)
  value: any;
  description: string;
}

export interface Alternative {
  decision: string;
  probability: number;
  reasoning: string;
}

export interface ExplainabilityConfig {
  openaiApiKey: string;
  enableDetailedLogging?: boolean;
  maxAlternatives?: number;
}

export class ExplainabilityEngine {
  private openai: OpenAI;
  private config: ExplainabilityConfig;

  constructor(config: ExplainabilityConfig) {
    this.config = {
      enableDetailedLogging: false,
      maxAlternatives: 3,
      ...config,
    };
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
  }

  /**
   * Explain an AI decision with detailed reasoning
   */
  async explainDecision(decision: string, context: Record<string, any>, modelOutput?: any): Promise<ExplanationResult> {
    try {
      // Extract features from context
      const features = this.extractFeatures(context);

      // Generate explanation using GPT-4
      const explanation = await this.generateExplanation(decision, features, modelOutput);

      // Calculate feature importance (SHAP-inspired)
      const factors = await this.calculateFeatureImportance(features, decision, explanation);

      // Generate alternatives
      const alternatives = await this.generateAlternatives(decision, features);

      const result: ExplanationResult = {
        decision,
        confidence: explanation.confidence,
        factors,
        reasoning: explanation.reasoning,
        alternatives: alternatives.slice(0, this.config.maxAlternatives),
        timestamp: new Date(),
        modelUsed: explanation.model,
      };

      if (this.config.enableDetailedLogging) {
        console.log("[Explainability] Generated explanation:", JSON.stringify(result, null, 2));
      }

      return result;
    } catch (error) {
      console.error("[Explainability] Error generating explanation:", error);
      throw error;
    }
  }

  /**
   * Extract relevant features from context
   */
  private extractFeatures(context: Record<string, any>): Map<string, any> {
    const features = new Map<string, any>();

    const traverse = (obj: any, prefix = "") => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === "object" && !Array.isArray(value)) {
          traverse(value, fullKey);
        } else {
          features.set(fullKey, value);
        }
      }
    };

    traverse(context);
    return features;
  }

  /**
   * Generate human-readable explanation using GPT-4
   */
  private async generateExplanation(
    decision: string,
    features: Map<string, any>,
    modelOutput?: any
  ): Promise<{ reasoning: string; confidence: number; model: string }> {
    const featuresObj = Object.fromEntries(features);

    const prompt = `You are an AI explainability system. Explain the following AI decision clearly and concisely.

Decision: ${decision}

Context Features:
${JSON.stringify(featuresObj, null, 2)}

${modelOutput ? `Model Output:\n${JSON.stringify(modelOutput, null, 2)}` : ""}

Provide:
1. A clear explanation of WHY this decision was made
2. Which factors were most influential
3. A confidence score (0-100)

Format your response as JSON:
{
  "reasoning": "Clear explanation here",
  "confidence": 85,
  "keyFactors": ["factor1", "factor2"]
}`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);

    return {
      reasoning: parsed.reasoning || "No explanation provided",
      confidence: (parsed.confidence || 50) / 100,
      model: "gpt-4",
    };
  }

  /**
   * Calculate feature importance (SHAP-inspired approach)
   */
  private async calculateFeatureImportance(
    features: Map<string, any>,
    decision: string,
    explanation: { reasoning: string; keyFactors?: string[] }
  ): Promise<ExplanationFactor[]> {
    const factors: ExplanationFactor[] = [];

    // Use GPT-4 to analyze feature importance
    const featuresObj = Object.fromEntries(features);

    const prompt = `Analyze the importance of each feature in making this decision.

Decision: ${decision}
Features: ${JSON.stringify(featuresObj, null, 2)}

For each feature, provide:
1. Importance score (-1 to 1, where -1 = strongly against, 0 = neutral, 1 = strongly for)
2. Brief description of how it influenced the decision

Return as JSON array:
[
  {
    "feature": "feature_name",
    "importance": 0.8,
    "description": "Brief explanation"
  }
]

Focus on the top 5-7 most important features.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 600,
      });

      const content = response.choices[0].message.content || "[]";
      const analyzed = JSON.parse(content);

      for (const item of analyzed) {
        factors.push({
          feature: item.feature,
          importance: item.importance,
          value: features.get(item.feature),
          description: item.description,
        });
      }
    } catch (error) {
      console.error("[Explainability] Error calculating feature importance:", error);
      // Fallback: basic importance based on key factors
      for (const [key, value] of features.entries()) {
        const isKeyFactor = explanation.keyFactors?.includes(key);
        factors.push({
          feature: key,
          importance: isKeyFactor ? 0.7 : 0.3,
          value,
          description: isKeyFactor ? "Key factor in decision" : "Supporting factor",
        });
      }
    }

    // Sort by absolute importance
    return factors.sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance)).slice(0, 7);
  }

  /**
   * Generate alternative decisions that could have been made
   */
  private async generateAlternatives(decision: string, features: Map<string, any>): Promise<Alternative[]> {
    const featuresObj = Object.fromEntries(features);

    const prompt = `Given this decision and context, what alternative decisions could have been made?

Current Decision: ${decision}
Context: ${JSON.stringify(featuresObj, null, 2)}

Provide 2-3 plausible alternative decisions with:
1. The alternative decision
2. Probability it would be chosen (0-100)
3. Brief reasoning

Format as JSON array:
[
  {
    "decision": "alternative decision",
    "probability": 30,
    "reasoning": "Why this could have been chosen"
  }
]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 400,
      });

      const content = response.choices[0].message.content || "[]";
      const alternatives = JSON.parse(content);

      return alternatives.map((alt: any) => ({
        decision: alt.decision,
        probability: alt.probability / 100,
        reasoning: alt.reasoning,
      }));
    } catch (error) {
      console.error("[Explainability] Error generating alternatives:", error);
      return [];
    }
  }

  /**
   * Compare two decisions and explain the difference
   */
  async compareDecisions(decision1: ExplanationResult, decision2: ExplanationResult): Promise<string> {
    const prompt = `Compare these two AI decisions and explain the key differences:

Decision 1: ${decision1.decision}
Confidence: ${decision1.confidence}
Key Factors: ${decision1.factors
      .slice(0, 3)
      .map((f) => f.feature)
      .join(", ")}

Decision 2: ${decision2.decision}
Confidence: ${decision2.confidence}
Key Factors: ${decision2.factors
      .slice(0, 3)
      .map((f) => f.feature)
      .join(", ")}

Explain in 2-3 sentences what caused the different outcomes.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    });

    return response.choices[0].message.content || "Unable to compare decisions";
  }

  /**
   * Generate a visual explanation (returns data for charting)
   */
  getVisualExplanation(explanation: ExplanationResult): {
    chartType: "bar" | "waterfall";
    data: Array<{ label: string; value: number; color: string }>;
  } {
    return {
      chartType: "bar",
      data: explanation.factors.map((factor) => ({
        label: factor.feature,
        value: factor.importance,
        color: factor.importance > 0 ? "#10b981" : factor.importance < 0 ? "#ef4444" : "#6b7280",
      })),
    };
  }
}
