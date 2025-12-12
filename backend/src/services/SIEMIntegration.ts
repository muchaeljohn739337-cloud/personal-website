/**
 * SIEM Integration Service
 *
 * Connects SHIELD to Elasticsearch for:
 * - Real-time threat event ingestion
 * - Correlation rule processing
 * - Automated alerting
 * - Security analytics and dashboards
 */

import { Client } from "@elastic/elasticsearch";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

const prisma = new PrismaClient();

interface ShieldPolicy {
  version: string;
  enabled: boolean;
  threat_scoring: {
    enabled: boolean;
    decay_rate: number;
    decay_interval: number;
    thresholds: Record<string, number>;
    weights: Record<string, number>;
  };
  correlation_rules: CorrelationRule[];
  auto_response: {
    enabled: boolean;
    actions: Record<string, any>;
  };
  incidents: {
    auto_create: boolean;
    severity_mapping: Record<string, any>;
    notification_channels: Record<string, string[]>;
    playbooks: Record<string, string>;
  };
}

interface CorrelationRule {
  id: string;
  name: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  enabled: boolean;
  conditions: Array<{
    event_type?: string;
    event_types?: string[];
    count?: number;
    time_window?: number;
    group_by?: string;
    field?: string;
    operator?: string;
    threshold?: number;
    threshold_multiplier?: number;
    min_distinct_types?: number;
    distinct_field?: string;
  }>;
  actions: Array<{
    type: string;
    [key: string]: any;
  }>;
}

interface ThreatEvent {
  timestamp: string;
  event_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  source_ip: string;
  user_id?: string;
  api_key?: string;
  threat_score: number;
  details: Record<string, any>;
  blocked: boolean;
  rule_triggered?: string;
}

interface AlertChannel {
  type: "elasticsearch" | "slack" | "email" | "pagerduty" | "sms";
  enabled: boolean;
  config: Record<string, any>;
}

export class SIEMIntegration {
  private client: Client | null = null;
  private policy: ShieldPolicy | null = null;
  private alertChannels: Map<string, AlertChannel> = new Map();
  private correlationCache: Map<string, any[]> = new Map();
  private enabled: boolean = false;

  constructor() {
    this.setupAlertChannels();
  }

  /**
   * Initialize Elasticsearch client and load SHIELD policy
   */
  async initialize(): Promise<void> {
    try {
      // Load SHIELD policy from YAML
      const policyPath = path.join(process.cwd(), "config", "ai-policies", "shield_policy.yaml");

      if (fs.existsSync(policyPath)) {
        const policyContent = fs.readFileSync(policyPath, "utf-8");
        this.policy = yaml.parse(policyContent) as ShieldPolicy;
        console.log("✅ [SIEM] Loaded SHIELD policy");
      } else {
        console.warn("⚠️  [SIEM] shield_policy.yaml not found, using defaults");
        this.policy = this.getDefaultPolicy();
      }

      // Initialize Elasticsearch client if configured
      const elasticUrl = process.env.ELASTICSEARCH_URL;
      const elasticApiKey = process.env.ELASTICSEARCH_API_KEY;
      const elasticUsername = process.env.ELASTICSEARCH_USERNAME;
      const elasticPassword = process.env.ELASTICSEARCH_PASSWORD;

      if (elasticUrl) {
        const clientConfig: any = {
          node: elasticUrl,
        };

        if (elasticApiKey) {
          clientConfig.auth = {
            apiKey: elasticApiKey,
          };
        } else if (elasticUsername && elasticPassword) {
          clientConfig.auth = {
            username: elasticUsername,
            password: elasticPassword,
          };
        }

        this.client = new Client(clientConfig);

        // Test connection
        await this.client.ping();
        console.log("✅ [SIEM] Connected to Elasticsearch");

        // Create index templates
        await this.createIndexTemplates();

        this.enabled = true;
      } else {
        console.warn("⚠️  [SIEM] Elasticsearch not configured (ELASTICSEARCH_URL missing)");
        console.log("💡 [SIEM] Running in local-only mode (database logging)");
      }

      // Start correlation engine
      this.startCorrelationEngine();

      console.log("✅ [SIEM] Initialization complete");
    } catch (error) {
      console.error("❌ [SIEM] Initialization failed:", error);
      // Continue without SIEM - fall back to local logging
      this.enabled = false;
    }
  }

  /**
   * Create Elasticsearch index templates for time-series data
   */
  private async createIndexTemplates(): Promise<void> {
    if (!this.client) return;

    try {
      // Security events index template
      await this.client.indices.putIndexTemplate({
        name: "security-events-template",
        index_patterns: ["security-events-*"],
        template: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1,
            "index.lifecycle.name": "security-events-ilm-policy",
            "index.lifecycle.rollover_alias": "security-events",
          },
          mappings: {
            properties: {
              timestamp: { type: "date" },
              event_type: { type: "keyword" },
              severity: { type: "keyword" },
              source_ip: { type: "ip" },
              user_id: { type: "keyword" },
              api_key: { type: "keyword" },
              threat_score: { type: "integer" },
              blocked: { type: "boolean" },
              rule_triggered: { type: "keyword" },
              details: { type: "object", enabled: true },
            },
          },
        },
      });

      // Audit logs index template
      await this.client.indices.putIndexTemplate({
        name: "audit-logs-template",
        index_patterns: ["audit-logs-*"],
        template: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
            "index.lifecycle.name": "audit-logs-ilm-policy",
          },
          mappings: {
            properties: {
              timestamp: { type: "date" },
              action: { type: "keyword" },
              user_id: { type: "keyword" },
              resource_type: { type: "keyword" },
              resource_id: { type: "keyword" },
              ip_address: { type: "ip" },
              user_agent: { type: "text" },
              changes: { type: "text" },
              metadata: { type: "object", enabled: true },
            },
          },
        },
      });

      // Threat intelligence index template
      await this.client.indices.putIndexTemplate({
        name: "threat-intel-template",
        index_patterns: ["threat-intel-*"],
        template: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
          },
          mappings: {
            properties: {
              timestamp: { type: "date" },
              indicator_type: { type: "keyword" },
              indicator_value: { type: "keyword" },
              threat_level: { type: "keyword" },
              source: { type: "keyword" },
              confidence: { type: "integer" },
              tags: { type: "keyword" },
              metadata: { type: "object", enabled: true },
            },
          },
        },
      });

      console.log("✅ [SIEM] Index templates created");
    } catch (error) {
      console.error("❌ [SIEM] Failed to create index templates:", error);
    }
  }

  /**
   * Ingest threat event to Elasticsearch and database
   */
  async ingestThreatEvent(event: ThreatEvent): Promise<void> {
    try {
      // Always log to database
      await prisma.audit_logs.create({
        data: {
          id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: event.event_type,
          userId: event.user_id || null,
          resourceType: "security_event",
          resourceId: event.source_ip,
          changes: JSON.stringify(event.details),
          metadata: JSON.stringify({
            severity: event.severity,
            threat_score: event.threat_score,
            blocked: event.blocked,
            rule_triggered: event.rule_triggered,
          }),
          ipAddress: event.source_ip,
          userAgent: event.details.user_agent || "Unknown",
          severity: event.severity,
        },
      });

      // Send to Elasticsearch if enabled
      if (this.enabled && this.client) {
        const indexName = `security-events-${new Date().toISOString().slice(0, 7)}`; // YYYY-MM format

        await this.client.index({
          index: indexName,
          document: event,
        });
      }

      // Check correlation rules
      await this.checkCorrelationRules(event);
    } catch (error) {
      console.error("❌ [SIEM] Failed to ingest threat event:", error);
    }
  }

  /**
   * Check correlation rules against the event
   */
  private async checkCorrelationRules(event: ThreatEvent): Promise<void> {
    if (!this.policy?.correlation_rules) return;

    for (const rule of this.policy.correlation_rules) {
      if (!rule.enabled) continue;

      try {
        const matches = await this.evaluateRule(rule, event);
        if (matches) {
          console.log(`🚨 [SIEM] Correlation rule triggered: ${rule.name}`);
          await this.executeRuleActions(rule, event);
        }
      } catch (error) {
        console.error(`❌ [SIEM] Error evaluating rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate if a correlation rule matches the event
   */
  private async evaluateRule(rule: CorrelationRule, event: ThreatEvent): Promise<boolean> {
    for (const condition of rule.conditions) {
      // Single event type check
      if (condition.event_type && event.event_type !== condition.event_type) {
        continue;
      }

      // Multiple event types check (coordinated attack)
      if (condition.event_types && condition.min_distinct_types) {
        const cacheKey = `${rule.id}_${event.source_ip}_multi`;
        const cached = this.correlationCache.get(cacheKey) || [];
        cached.push({
          event_type: event.event_type,
          timestamp: event.timestamp,
        });

        // Keep only events within time window
        const cutoff = Date.now() - (condition.time_window || 600) * 1000;
        const recent = cached.filter((e: any) => new Date(e.timestamp).getTime() > cutoff);
        this.correlationCache.set(cacheKey, recent);

        const distinctTypes = new Set(recent.map((e: any) => e.event_type));
        if (distinctTypes.size >= condition.min_distinct_types) {
          return true;
        }
      }

      // Count-based check
      if (condition.count && condition.time_window) {
        const groupKey = condition.group_by ? (event as any)[condition.group_by] : "global";
        const cacheKey = `${rule.id}_${groupKey}_${condition.event_type}`;

        const cached = this.correlationCache.get(cacheKey) || [];
        cached.push({ timestamp: event.timestamp });

        // Keep only events within time window
        const cutoff = Date.now() - condition.time_window * 1000;
        const recent = cached.filter((e: any) => new Date(e.timestamp).getTime() > cutoff);
        this.correlationCache.set(cacheKey, recent);

        if (recent.length >= condition.count) {
          return true;
        }
      }

      // Threshold-based check
      if (condition.field && condition.operator && (condition.threshold || condition.threshold_multiplier)) {
        const fieldValue = (event.details as any)[condition.field];
        if (fieldValue !== undefined) {
          if (condition.operator === ">" && condition.threshold) {
            if (fieldValue > condition.threshold) {
              return true;
            }
          }
        }
      }

      // Distinct field check (e.g., multiple IPs for same API key)
      if (condition.distinct_field && condition.count) {
        const groupKey = condition.group_by ? (event as any)[condition.group_by] : "global";
        const cacheKey = `${rule.id}_${groupKey}_distinct`;

        const cached = this.correlationCache.get(cacheKey) || [];
        cached.push({
          value: (event as any)[condition.distinct_field],
          timestamp: event.timestamp,
        });

        const cutoff = Date.now() - (condition.time_window || 60) * 1000;
        const recent = cached.filter((e: any) => new Date(e.timestamp).getTime() > cutoff);
        this.correlationCache.set(cacheKey, recent);

        const distinctValues = new Set(recent.map((e: any) => e.value));
        if (distinctValues.size >= condition.count) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Execute actions defined in a correlation rule
   */
  private async executeRuleActions(rule: CorrelationRule, event: ThreatEvent): Promise<void> {
    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case "increase_threat_score":
            console.log(`📊 [SIEM] Increasing threat score by ${action.points}`);
            // Threat score is managed by SHIELD, log the recommendation
            break;

          case "block_ip":
            console.log(`🛡️  [SIEM] Recommending IP block: ${event.source_ip} for ${action.duration}s`);
            // This would integrate with iptables or Cloudflare
            break;

          case "alert":
            await this.sendAlerts(action.channels || ["elasticsearch"], rule, event);
            break;

          case "create_incident":
            await this.createIncident(rule, event, action.severity);
            break;

          case "hold_account":
            if (event.user_id) {
              console.log(`🔒 [SIEM] Recommending account hold: ${event.user_id}`);
            }
            break;

          case "suspend_api_key":
            if (event.api_key) {
              console.log(`🔑 [SIEM] Recommending API key suspension: ${event.api_key}`);
            }
            break;

          case "emergency_lockdown":
            console.log(`🚨 [SIEM] EMERGENCY LOCKDOWN RECOMMENDED - Scope: ${action.scope}`);
            break;

          case "require_admin_approval":
            console.log(`👮 [SIEM] Admin approval required (${action.approvers_required} approvers)`);
            break;

          default:
            console.log(`❓ [SIEM] Unknown action type: ${action.type}`);
        }
      } catch (error) {
        console.error(`❌ [SIEM] Failed to execute action ${action.type}:`, error);
      }
    }
  }

  /**
   * Send alerts through configured channels
   */
  private async sendAlerts(channels: string[], rule: CorrelationRule, event: ThreatEvent): Promise<void> {
    const alertMessage = {
      title: `🚨 Security Alert: ${rule.name}`,
      severity: rule.severity,
      rule_id: rule.id,
      event_type: event.event_type,
      source_ip: event.source_ip,
      threat_score: event.threat_score,
      timestamp: event.timestamp,
      details: event.details,
    };

    for (const channel of channels) {
      const alertChannel = this.alertChannels.get(channel);
      if (alertChannel?.enabled) {
        try {
          switch (channel) {
            case "elasticsearch":
              if (this.client) {
                await this.client.index({
                  index: `alerts-${new Date().toISOString().slice(0, 7)}`,
                  document: alertMessage,
                });
              }
              break;

            case "slack":
              console.log(`💬 [SIEM] Slack alert:`, alertMessage.title);
              // Integration with Slack webhook would go here
              break;

            case "email":
              console.log(`📧 [SIEM] Email alert:`, alertMessage.title);
              // Integration with email service would go here
              break;

            case "pagerduty":
              console.log(`📟 [SIEM] PagerDuty alert:`, alertMessage.title);
              // Integration with PagerDuty API would go here
              break;

            case "sms":
              console.log(`📱 [SIEM] SMS alert:`, alertMessage.title);
              // Integration with SMS service would go here
              break;

            default:
              console.log(`❓ [SIEM] Unknown alert channel: ${channel}`);
          }
        } catch (error) {
          console.error(`❌ [SIEM] Failed to send alert to ${channel}:`, error);
        }
      }
    }
  }

  /**
   * Create incident in database for tracking
   */
  private async createIncident(rule: CorrelationRule, event: ThreatEvent, severity: string): Promise<void> {
    try {
      const incident = await prisma.audit_logs.create({
        data: {
          id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: "incident_created",
          userId: event.user_id || null,
          resourceType: "security_incident",
          resourceId: rule.id,
          changes: JSON.stringify({
            rule_name: rule.name,
            rule_id: rule.id,
            event,
          }),
          metadata: JSON.stringify({
            severity,
            status: "open",
            created_at: new Date().toISOString(),
          }),
          ipAddress: event.source_ip,
          userAgent: "SIEM Correlation Engine",
          severity: severity as any,
        },
      });

      console.log(`📋 [SIEM] Incident created: ${incident.id}`);
    } catch (error) {
      console.error("❌ [SIEM] Failed to create incident:", error);
    }
  }

  /**
   * Start correlation engine background task
   */
  private startCorrelationEngine(): void {
    // Clean up correlation cache every minute
    setInterval(() => {
      const cutoff = Date.now() - 3600000; // 1 hour
      const entries = Array.from(this.correlationCache.entries());
      for (const [key, events] of entries) {
        const recent = events.filter((e: any) => e.timestamp && new Date(e.timestamp).getTime() > cutoff);
        if (recent.length === 0) {
          this.correlationCache.delete(key);
        } else {
          this.correlationCache.set(key, recent);
        }
      }
    }, 60000);

    console.log("✅ [SIEM] Correlation engine started");
  }

  /**
   * Setup alert channels configuration
   */
  private setupAlertChannels(): void {
    this.alertChannels.set("elasticsearch", {
      type: "elasticsearch",
      enabled: true,
      config: {},
    });

    this.alertChannels.set("slack", {
      type: "slack",
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      config: { webhook_url: process.env.SLACK_WEBHOOK_URL },
    });

    this.alertChannels.set("email", {
      type: "email",
      enabled: !!process.env.EMAIL_ENABLED,
      config: {},
    });

    this.alertChannels.set("pagerduty", {
      type: "pagerduty",
      enabled: !!process.env.PAGERDUTY_API_KEY,
      config: { api_key: process.env.PAGERDUTY_API_KEY },
    });

    this.alertChannels.set("sms", {
      type: "sms",
      enabled: false,
      config: {},
    });
  }

  /**
   * Get default SHIELD policy if YAML not found
   */
  private getDefaultPolicy(): ShieldPolicy {
    return {
      version: "1.0",
      enabled: true,
      threat_scoring: {
        enabled: true,
        decay_rate: 10,
        decay_interval: 3600,
        thresholds: {
          low: 20,
          medium: 50,
          high: 80,
          critical: 100,
          lockdown: 150,
        },
        weights: {
          sql_injection: 50,
          xss_attempt: 30,
          brute_force: 10,
        },
      },
      correlation_rules: [],
      auto_response: {
        enabled: true,
        actions: {},
      },
      incidents: {
        auto_create: true,
        severity_mapping: {},
        notification_channels: {},
        playbooks: {},
      },
    };
  }

  /**
   * Query Elasticsearch for threat analytics
   */
  async queryThreatAnalytics(timeRange: string = "24h"): Promise<Record<string, any>> {
    if (!this.enabled || !this.client) {
      console.warn("⚠️  [SIEM] Elasticsearch not available for analytics");
      return {};
    }

    try {
      const response = await this.client.search({
        index: "security-events-*",
        body: {
          query: {
            range: {
              timestamp: {
                gte: `now-${timeRange}`,
              },
            },
          },
          aggs: {
            by_severity: {
              terms: { field: "severity" },
            },
            by_event_type: {
              terms: { field: "event_type" },
            },
            top_ips: {
              terms: { field: "source_ip", size: 10 },
            },
          },
        },
      });

      return response;
    } catch (error) {
      console.error("❌ [SIEM] Failed to query analytics:", error);
      return {};
    }
  }

  /**
   * Check if SIEM is enabled and connected
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton export
export const siemIntegration = new SIEMIntegration();
