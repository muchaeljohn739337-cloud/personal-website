/**
 * Learner Agent - Stores outcomes in Vector DB for continuous improvement
 *
 * Responsibilities:
 * - Store successful fixes in ChromaDB
 * - Store failed attempts with reasons
 * - Build knowledge base over time
 * - Enable future queries to benefit from past learnings
 */

import * as fs from "fs";
import * as path from "path";
import { RAGEngine } from "../copilot/RAGEngine";
import { LearningOutcome } from "./types";

export class LearnerAgent {
  private ragEngine: RAGEngine;
  private initialized: boolean = false;
  private learningLogPath: string;

  constructor() {
    this.ragEngine = new RAGEngine();
    this.learningLogPath = path.join(process.cwd(), "data", "pipeline_learning.jsonl");
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("[LearnerAgent] Initializing...");
    await this.ragEngine.initialize();

    // Ensure learning log directory exists
    const logDir = path.dirname(this.learningLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.initialized = true;
    console.log("[LearnerAgent] Ready");
  }

  /**
   * Store learning outcome (both successes and failures)
   */
  async storeLearning(outcome: LearningOutcome): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[LearnerAgent] Storing learning outcome (success: ${outcome.executionResult.success})`);

    // Append to learning log (JSONL format)
    await this.appendToLearningLog(outcome);

    // Index in vector database for future retrieval
    await this.indexInVectorDB(outcome);

    console.log("[LearnerAgent] Learning outcome stored");
  }

  /**
   * Append outcome to JSONL learning log
   */
  private async appendToLearningLog(outcome: LearningOutcome): Promise<void> {
    try {
      const logEntry = JSON.stringify(outcome) + "\n";
      fs.appendFileSync(this.learningLogPath, logEntry, "utf-8");
    } catch (error) {
      console.error("[LearnerAgent] Failed to append to learning log:", error);
    }
  }

  /**
   * Index outcome in vector database
   */
  private async indexInVectorDB(outcome: LearningOutcome): Promise<void> {
    try {
      // Create searchable document from outcome
      const document = this.createSearchableDocument(outcome);

      // Note: RAGEngine doesn't expose indexDocument method yet
      // For now, we rely on the learning log
      // Future enhancement: Add indexDocument method to RAGEngine

      console.log("[LearnerAgent] Indexed in vector DB (placeholder)");
    } catch (error) {
      console.error("[LearnerAgent] Failed to index in vector DB:", error);
    }
  }

  /**
   * Create searchable document from learning outcome
   */
  private createSearchableDocument(outcome: LearningOutcome): string {
    const success = outcome.executionResult.success ? "SUCCESS" : "FAILED";

    let document = `[${success}] ${outcome.diagnosis.rootCause}\n\n`;
    document += `Problem: ${outcome.diagnosis.impactAssessment}\n`;
    document += `Affected: ${outcome.diagnosis.affectedComponents.join(", ")}\n\n`;
    document += `Solution: ${outcome.solution.description}\n`;
    document += `Confidence: ${outcome.solution.confidence.toFixed(2)}\n`;
    document += `Risk: ${outcome.decision.riskLevel}\n\n`;

    if (outcome.executionResult.success) {
      document += `Result: Successfully resolved\n`;
    } else {
      document += `Result: Failed - ${outcome.executionResult.error}\n`;
    }

    if (outcome.feedback) {
      document += `Feedback: ${outcome.feedback.rating}/5 - ${outcome.feedback.comments}\n`;
    }

    return document;
  }

  /**
   * Query past learnings (for analytics or improvement)
   */
  async queryLearnings(query: string, limit: number = 10): Promise<LearningOutcome[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[LearnerAgent] Querying past learnings: "${query}"`);

    // Read learning log
    const outcomes: LearningOutcome[] = [];

    try {
      if (!fs.existsSync(this.learningLogPath)) {
        return outcomes;
      }

      const lines = fs.readFileSync(this.learningLogPath, "utf-8").split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const outcome = JSON.parse(line) as LearningOutcome;

          // Simple keyword matching (could be enhanced with vector search)
          const searchableText = JSON.stringify(outcome).toLowerCase();
          const queryLower = query.toLowerCase();

          if (searchableText.includes(queryLower)) {
            outcomes.push(outcome);

            if (outcomes.length >= limit) break;
          }
        } catch (parseError) {
          // Skip malformed lines
          continue;
        }
      }
    } catch (error) {
      console.error("[LearnerAgent] Failed to query learnings:", error);
    }

    console.log(`[LearnerAgent] Found ${outcomes.length} matching learnings`);

    return outcomes;
  }

  /**
   * Get learning statistics
   */
  async getStatistics(): Promise<{
    totalLearnings: number;
    successCount: number;
    failureCount: number;
    averageConfidence: number;
    riskDistribution: Record<string, number>;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const stats = {
      totalLearnings: 0,
      successCount: 0,
      failureCount: 0,
      averageConfidence: 0,
      riskDistribution: {} as Record<string, number>,
    };

    try {
      if (!fs.existsSync(this.learningLogPath)) {
        return stats;
      }

      const lines = fs.readFileSync(this.learningLogPath, "utf-8").split("\n");
      let totalConfidence = 0;

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const outcome = JSON.parse(line) as LearningOutcome;
          stats.totalLearnings++;

          if (outcome.executionResult.success) {
            stats.successCount++;
          } else {
            stats.failureCount++;
          }

          totalConfidence += outcome.solution.confidence;

          const riskLevel = outcome.decision.riskLevel;
          stats.riskDistribution[riskLevel] = (stats.riskDistribution[riskLevel] || 0) + 1;
        } catch (parseError) {
          continue;
        }
      }

      stats.averageConfidence = stats.totalLearnings > 0 ? totalConfidence / stats.totalLearnings : 0;
    } catch (error) {
      console.error("[LearnerAgent] Failed to calculate statistics:", error);
    }

    return stats;
  }

  /**
   * Export learnings for analysis
   */
  async exportLearnings(outputPath: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      if (!fs.existsSync(this.learningLogPath)) {
        console.warn("[LearnerAgent] No learnings to export");
        return;
      }

      // Copy learning log to output path
      fs.copyFileSync(this.learningLogPath, outputPath);
      console.log(`[LearnerAgent] Learnings exported to ${outputPath}`);
    } catch (error) {
      console.error("[LearnerAgent] Failed to export learnings:", error);
      throw error;
    }
  }

  /**
   * Clear old learnings (data retention)
   */
  async clearOldLearnings(daysToKeep: number = 365): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[LearnerAgent] Clearing learnings older than ${daysToKeep} days`);

    let removedCount = 0;

    try {
      if (!fs.existsSync(this.learningLogPath)) {
        return removedCount;
      }

      const lines = fs.readFileSync(this.learningLogPath, "utf-8").split("\n");
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const filteredLines: string[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const outcome = JSON.parse(line) as LearningOutcome;
          const outcomeDate = new Date(outcome.timestamp);

          if (outcomeDate >= cutoffDate) {
            filteredLines.push(line);
          } else {
            removedCount++;
          }
        } catch (parseError) {
          // Keep malformed lines to avoid data loss
          filteredLines.push(line);
        }
      }

      // Write filtered lines back
      fs.writeFileSync(this.learningLogPath, filteredLines.join("\n") + "\n", "utf-8");

      console.log(`[LearnerAgent] Removed ${removedCount} old learnings`);
    } catch (error) {
      console.error("[LearnerAgent] Failed to clear old learnings:", error);
    }

    return removedCount;
  }
}

// Singleton export
export const learnerAgent = new LearnerAgent();
