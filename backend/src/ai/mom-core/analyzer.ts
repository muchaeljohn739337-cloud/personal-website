/**
 * Analyzer Agent - Parses errors/logs and builds context using RAG
 *
 * Responsibilities:
 * - Parse error messages and stack traces
 * - Extract relevant context from logs
 * - Query RAG (Vector DB) for similar issues
 * - Build comprehensive context for problem solver
 */

import * as path from "path";
import { RAGEngine } from "../copilot/RAGEngine";
import { AnalysisContext, Diagnosis, RAGContext } from "./types";

export class AnalyzerAgent {
  private ragEngine: RAGEngine;
  private initialized: boolean = false;

  constructor() {
    this.ragEngine = new RAGEngine();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("[AnalyzerAgent] Initializing...");
    await this.ragEngine.initialize();
    this.initialized = true;
    console.log("[AnalyzerAgent] Ready");
  }

  /**
   * Parse error message and build context
   */
  async analyzeError(context: AnalysisContext): Promise<Diagnosis> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log("[AnalyzerAgent] Analyzing error...");

    // Extract key information from error
    const errorInfo = this.extractErrorInfo(context);

    // Query RAG for similar issues and relevant code
    const ragContext = await this.buildRAGContext(errorInfo);

    // Perform root cause analysis
    const diagnosis = await this.diagnoseIssue(context, ragContext);

    console.log(`[AnalyzerAgent] Diagnosis complete. Confidence: ${diagnosis.confidence}`);

    return diagnosis;
  }

  /**
   * Extract structured information from error context
   */
  private extractErrorInfo(context: AnalysisContext): {
    errorType: string;
    errorMessage: string;
    affectedFiles: string[];
    keywords: string[];
  } {
    const errorMessage = context.errorMessage || "Unknown error";

    // Extract error type (e.g., TypeError, ValidationError)
    const errorTypeMatch = errorMessage.match(/^(\w+Error):/);
    const errorType = errorTypeMatch ? errorTypeMatch[1] : "UnknownError";

    // Extract affected files from stack trace
    const affectedFiles = context.affectedFiles || [];
    if (context.stackTrace) {
      const fileMatches = context.stackTrace.match(/at .+\((.+\.ts):\d+:\d+\)/g);
      if (fileMatches) {
        fileMatches.forEach((match) => {
          const fileMatch = match.match(/\((.+\.ts):/);
          if (fileMatch && !affectedFiles.includes(fileMatch[1])) {
            affectedFiles.push(fileMatch[1]);
          }
        });
      }
    }

    // Extract keywords for RAG search
    const keywords = this.extractKeywords(errorMessage);

    return {
      errorType,
      errorMessage,
      affectedFiles,
      keywords,
    };
  }

  /**
   * Extract relevant keywords from error message
   */
  private extractKeywords(message: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = ["error", "failed", "cannot", "unable", "the", "a", "an", "is", "at", "in"];
    const words = message
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3 && !stopWords.includes(word));

    return [...new Set(words)].slice(0, 5); // Top 5 unique keywords
  }

  /**
   * Build context using RAG (Vector DB queries)
   */
  private async buildRAGContext(errorInfo: {
    errorType: string;
    errorMessage: string;
    affectedFiles: string[];
    keywords: string[];
  }): Promise<RAGContext> {
    console.log("[AnalyzerAgent] Querying RAG for similar issues...");

    // Query 1: Search for similar error messages
    const errorQuery = `${errorInfo.errorType}: ${errorInfo.errorMessage}`;
    const similarErrors = await this.ragEngine.searchSimilar(errorQuery, 3);

    // Query 2: Search for relevant code patterns
    const codeQuery = errorInfo.keywords.join(" ");
    const relevantCode = await this.ragEngine.searchSimilar(codeQuery, 5);

    // Query 3: Search for documentation
    const docQuery = `${errorInfo.errorType} documentation examples`;
    const documentation = await this.ragEngine.searchSimilar(docQuery, 3);

    // Calculate confidence based on result quality
    const confidence = this.calculateRAGConfidence(similarErrors, relevantCode, documentation);

    return {
      relevantCode: relevantCode.map((r) => `${r.filePath}:${r.startLine}\n${r.content}`),
      documentation: documentation.map((r) => r.content),
      similarIssues: similarErrors.map((r) => ({
        issue: r.content.split("\n")[0] || "Unknown issue",
        solution: r.content.split("\n").slice(1).join("\n") || "No solution found",
        confidence: r.score,
      })),
      confidence,
    };
  }

  /**
   * Calculate confidence score based on RAG results quality
   */
  private calculateRAGConfidence(similarErrors: any[], relevantCode: any[], documentation: any[]): number {
    const hasStrongMatch = similarErrors.some((r) => r.score > 0.85);
    const hasRelevantCode = relevantCode.length > 0;
    const hasDocumentation = documentation.length > 0;

    let confidence = 0.5; // Base confidence

    if (hasStrongMatch) confidence += 0.3;
    if (hasRelevantCode) confidence += 0.1;
    if (hasDocumentation) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Perform root cause analysis and generate diagnosis
   */
  private async diagnoseIssue(context: AnalysisContext, ragContext: RAGContext): Promise<Diagnosis> {
    // Use RAG context to infer root cause
    const rootCause = this.inferRootCause(context, ragContext);

    // Identify affected components
    const affectedComponents = this.identifyAffectedComponents(context);

    // Assess impact
    const impactAssessment = this.assessImpact(context, affectedComponents);

    // Calculate overall diagnosis confidence
    const confidence = Math.min(
      ragContext.confidence * 0.7 + // RAG context quality
        (ragContext.similarIssues.length > 0 ? 0.2 : 0) + // Has similar issues
        (context.stackTrace ? 0.1 : 0), // Has stack trace
      1.0
    );

    return {
      rootCause,
      affectedComponents,
      impactAssessment,
      confidence,
      context: ragContext,
    };
  }

  /**
   * Infer root cause from context and RAG results
   */
  private inferRootCause(context: AnalysisContext, ragContext: RAGContext): string {
    // Check if we have similar issues with known solutions
    if (ragContext.similarIssues.length > 0 && ragContext.similarIssues[0].confidence > 0.8) {
      return `Similar to known issue: ${ragContext.similarIssues[0].issue}`;
    }

    // Parse error message for common patterns
    const errorMessage = context.errorMessage || "";

    if (errorMessage.includes("undefined") || errorMessage.includes("null")) {
      return "Null/undefined reference - likely missing validation or initialization";
    }

    if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
      return "Connection timeout - network or service availability issue";
    }

    if (errorMessage.includes("permission") || errorMessage.includes("EACCES")) {
      return "Permission denied - insufficient access rights";
    }

    if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
      return "Data validation failure - invalid input format or constraints";
    }

    // Default if no pattern matches
    return `${context.severity} error in system component requiring investigation`;
  }

  /**
   * Identify affected system components
   */
  private identifyAffectedComponents(context: AnalysisContext): string[] {
    const components = new Set<string>();

    // Extract from file paths
    if (context.affectedFiles) {
      context.affectedFiles.forEach((file) => {
        const parts = file.split(path.sep);
        if (parts.includes("src")) {
          const srcIndex = parts.indexOf("src");
          if (parts[srcIndex + 1]) {
            components.add(parts[srcIndex + 1]); // e.g., "services", "routes", "ai"
          }
        }
      });
    }

    // Infer from error message
    const errorMessage = (context.errorMessage || "").toLowerCase();
    if (errorMessage.includes("database") || errorMessage.includes("prisma")) {
      components.add("database");
    }
    if (errorMessage.includes("api") || errorMessage.includes("endpoint")) {
      components.add("api");
    }
    if (errorMessage.includes("auth")) {
      components.add("authentication");
    }

    return Array.from(components);
  }

  /**
   * Assess the impact of the issue
   */
  private assessImpact(context: AnalysisContext, affectedComponents: string[]): string {
    const severity = context.severity;
    const componentCount = affectedComponents.length;

    if (severity === "CRITICAL") {
      return `CRITICAL: System stability at risk. ${componentCount} component(s) affected. Immediate action required.`;
    }

    if (severity === "ERROR") {
      return `HIGH: Functionality impaired. ${componentCount} component(s) affected. Requires prompt resolution.`;
    }

    if (severity === "WARN") {
      return `MEDIUM: Potential issues detected in ${componentCount} component(s). Monitor and address soon.`;
    }

    return `LOW: Minor issue in ${componentCount} component(s). Can be addressed during regular maintenance.`;
  }
}

// Singleton export
export const analyzerAgent = new AnalyzerAgent();
