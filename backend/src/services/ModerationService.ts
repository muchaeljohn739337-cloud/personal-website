/**
 * Moderation Service - Enforces AI output and input filtering rules
 * Loads rules from config/ai-policies/moderation_rules.yaml
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { ModerationResult } from "../ai/mom-core/types";

interface ModerationRule {
  enabled: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  patterns: string[];
  action: "BLOCK" | "REDACT" | "FLAG" | "ALERT";
  alert?: boolean;
  notify_admin?: boolean;
  trigger_lockdown?: boolean;
  redact_with?: string;
}

interface ModerationConfig {
  version: string;
  enabled: boolean;
  private_keys: ModerationRule;
  credentials: ModerationRule;
  sql_injection: ModerationRule;
  xss_patterns: ModerationRule;
  command_injection: ModerationRule;
  reverse_shell: ModerationRule;
  path_traversal: ModerationRule;
  pii_detection: ModerationRule;
  malware_patterns: ModerationRule;
  crypto_mining: ModerationRule;
  suspicious_activity: ModerationRule;
}

export class ModerationService {
  private config: ModerationConfig | null = null;
  private compiledPatterns: Map<string, RegExp[]> = new Map();
  private initialized: boolean = false;

  constructor() {}

  /**
   * Initialize and load moderation rules
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("[ModerationService] Loading moderation rules...");

    const configPath = path.join(process.cwd(), "config", "ai-policies", "moderation_rules.yaml");

    try {
      const configContent = fs.readFileSync(configPath, "utf-8");
      this.config = yaml.parse(configContent) as ModerationConfig;

      // Pre-compile regex patterns for performance
      this.compilePatterns();

      this.initialized = true;
      console.log("[ModerationService] Rules loaded successfully");
    } catch (error) {
      console.error("[ModerationService] Failed to load rules:", error);
      // Use minimal default config
      this.config = this.getDefaultConfig();
      this.compilePatterns();
      this.initialized = true;
    }
  }

  /**
   * Pre-compile regex patterns for performance
   */
  private compilePatterns(): void {
    if (!this.config) return;

    const ruleCategories = [
      "private_keys",
      "credentials",
      "sql_injection",
      "xss_patterns",
      "command_injection",
      "reverse_shell",
      "path_traversal",
      "pii_detection",
      "malware_patterns",
      "crypto_mining",
      "suspicious_activity",
    ];

    for (const category of ruleCategories) {
      const rule = (this.config as any)[category] as ModerationRule;
      if (rule && rule.enabled && rule.patterns) {
        const compiledPatterns = rule.patterns
          .map((pattern) => {
            try {
              return new RegExp(pattern, "gi");
            } catch (error) {
              console.warn(`[ModerationService] Invalid pattern: ${pattern}`);
              return null;
            }
          })
          .filter((p): p is RegExp => p !== null);

        this.compiledPatterns.set(category, compiledPatterns);
      }
    }
  }

  /**
   * Moderate content (input or output)
   */
  async moderate(content: string, source: "input" | "output" = "input"): Promise<ModerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.config || !this.config.enabled) {
      return {
        passed: true,
        violations: [],
        action: "ALLOW",
        alertSent: false,
      };
    }

    const violations: ModerationResult["violations"] = [];
    let mostSevereAction: "ALLOW" | "BLOCK" | "REDACT" | "FLAG" = "ALLOW";
    let redactedContent = content;
    let shouldTriggerLockdown = false;

    // Check each rule category
    const patternEntries = Array.from(this.compiledPatterns.entries());
    for (const [category, patterns] of patternEntries) {
      const rule = (this.config as any)[category] as ModerationRule;

      for (const pattern of patterns) {
        const matches = content.match(pattern);

        if (matches) {
          // Found a violation
          violations.push({
            rule: category,
            severity: rule.severity,
            pattern: pattern.source,
            match: matches[0].substring(0, 50), // Truncate match for logging
          });

          // Handle redaction for PII
          if (rule.action === "REDACT" && rule.redact_with) {
            redactedContent = redactedContent.replace(pattern, rule.redact_with);
          }

          // Track most severe action (map ALERT to FLAG for ModerationResult type)
          const action = (rule.action === "ALERT" ? "FLAG" : rule.action) as "ALLOW" | "BLOCK" | "REDACT" | "FLAG";
          if (this.isMoreSevere(action, mostSevereAction)) {
            mostSevereAction = action;
          }

          // Check for lockdown trigger
          if (rule.trigger_lockdown) {
            shouldTriggerLockdown = true;
          }
        }
      }
    }

    const passed = violations.length === 0 || mostSevereAction === "FLAG";
    const alertSent = violations.some((v) => v.severity === "HIGH" || v.severity === "CRITICAL");

    // Log violations
    if (violations.length > 0) {
      console.warn(
        `[ModerationService] ${violations.length} violation(s) detected in ${source}:`,
        violations.map((v) => `${v.rule} (${v.severity})`).join(", ")
      );
    }

    const result: ModerationResult = {
      passed,
      violations,
      redactedContent: mostSevereAction === "REDACT" ? redactedContent : undefined,
      action: mostSevereAction,
      alertSent,
    };

    // Trigger lockdown if malware detected
    if (shouldTriggerLockdown) {
      console.error("[ModerationService] CRITICAL: Lockdown trigger activated!");
      // This will be handled by the caller (SHIELD)
    }

    return result;
  }

  /**
   * Check if action A is more severe than action B
   */
  private isMoreSevere(actionA: string, actionB: string): boolean {
    const severity: Record<string, number> = {
      ALLOW: 0,
      FLAG: 1,
      REDACT: 2,
      BLOCK: 3,
    };

    return severity[actionA] > severity[actionB];
  }

  /**
   * Get severity score for calculating threat level
   */
  getSeverityScore(severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"): number {
    const scores: Record<string, number> = {
      LOW: 10,
      MEDIUM: 25,
      HIGH: 50,
      CRITICAL: 100,
    };

    return scores[severity] || 0;
  }

  /**
   * Calculate total threat score from violations
   */
  calculateThreatScore(violations: ModerationResult["violations"]): number {
    return violations.reduce((total, violation) => {
      return total + this.getSeverityScore(violation.severity);
    }, 0);
  }

  /**
   * Check if content contains private keys
   */
  async checkPrivateKeys(content: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    const patterns = this.compiledPatterns.get("private_keys") || [];
    return patterns.some((pattern) => pattern.test(content));
  }

  /**
   * Check if content contains credentials
   */
  async checkCredentials(content: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    const patterns = this.compiledPatterns.get("credentials") || [];
    return patterns.some((pattern) => pattern.test(content));
  }

  /**
   * Check if content contains malware signatures
   */
  async checkMalware(content: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    const patterns = this.compiledPatterns.get("malware_patterns") || [];
    return patterns.some((pattern) => pattern.test(content));
  }

  /**
   * Redact PII from content
   */
  async redactPII(content: string): Promise<string> {
    if (!this.initialized) await this.initialize();

    const patterns = this.compiledPatterns.get("pii_detection") || [];
    let redacted = content;

    for (const pattern of patterns) {
      redacted = redacted.replace(pattern, "[REDACTED]");
    }

    return redacted;
  }

  /**
   * Get default minimal configuration
   */
  private getDefaultConfig(): ModerationConfig {
    return {
      version: "1.0",
      enabled: true,
      private_keys: {
        enabled: true,
        severity: "CRITICAL",
        patterns: ["-----BEGIN.*PRIVATE KEY-----"],
        action: "BLOCK",
        alert: true,
        notify_admin: true,
      },
      credentials: {
        enabled: true,
        severity: "CRITICAL",
        patterns: ["password\\s*[:=]", "API_KEY\\s*[:=]"],
        action: "BLOCK",
        alert: true,
        notify_admin: true,
      },
      sql_injection: {
        enabled: true,
        severity: "HIGH",
        patterns: ["UNION\\s+SELECT", "DROP\\s+TABLE"],
        action: "BLOCK",
        alert: true,
      },
      xss_patterns: {
        enabled: true,
        severity: "HIGH",
        patterns: ["<script", "javascript:"],
        action: "BLOCK",
        alert: true,
      },
      command_injection: {
        enabled: true,
        severity: "CRITICAL",
        patterns: ["rm\\s+-rf", "sudo\\s+rm"],
        action: "BLOCK",
        alert: true,
        notify_admin: true,
      },
      reverse_shell: {
        enabled: true,
        severity: "CRITICAL",
        patterns: ["bash\\s+-i\\s+>&", "nc\\s+-e"],
        action: "BLOCK",
        alert: true,
        notify_admin: true,
      },
      path_traversal: {
        enabled: true,
        severity: "HIGH",
        patterns: ["\\.\\./\\.\\./", "/etc/shadow"],
        action: "BLOCK",
        alert: true,
      },
      pii_detection: {
        enabled: true,
        severity: "MEDIUM",
        patterns: ["\\b\\d{3}-\\d{2}-\\d{4}\\b", "\\b\\d{16}\\b"],
        action: "REDACT",
        alert: true,
        redact_with: "[REDACTED]",
      },
      malware_patterns: {
        enabled: true,
        severity: "CRITICAL",
        patterns: ["WannaCry", "ransomware", "\\.encrypted$"],
        action: "BLOCK",
        alert: true,
        notify_admin: true,
        trigger_lockdown: true,
      },
      crypto_mining: {
        enabled: true,
        severity: "HIGH",
        patterns: ["coinhive", "crypto-loot"],
        action: "BLOCK",
        alert: true,
      },
      suspicious_activity: {
        enabled: true,
        severity: "MEDIUM",
        patterns: ["base64.*exec", "eval\\(atob\\("],
        action: "FLAG",
        alert: true,
      },
    };
  }
}

// Singleton export
export const moderationService = new ModerationService();
