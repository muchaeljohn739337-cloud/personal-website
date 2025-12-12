/**
 * UNIFIED SECURITY ORCHESTRATOR
 * Integrates Guardian AI + Anti-Detect Layer
 *
 * Creates self-protecting, self-correcting, anti-intrusion system
 */

const { GuardianAI } = require("./ai_orchestrator");
const { AntiDetectLayer } = require("./anti_detect");
const EventEmitter = require("events");

class UnifiedSecurityOrchestrator extends EventEmitter {
  constructor() {
    super();

    this.guardian = null;
    this.antiDetect = null;
    this.initialized = false;

    // Unified threat intelligence
    this.threatIntelligence = {
      blocked_ips: new Set(),
      suspicious_users: new Map(),
      attack_patterns: new Map(),
      forensic_timeline: [],
    };

    // System status
    this.systemStatus = {
      guardian_active: false,
      anti_detect_active: false,
      protect_mode: false,
      threat_level: "LOW", // LOW, MEDIUM, HIGH, CRITICAL
      active_threats: 0,
      pending_approvals: 0,
    };
  }

  async initialize() {
    console.log("\n═══════════════════════════════════════════════");
    console.log("🛡️  UNIFIED SECURITY ORCHESTRATOR");
    console.log("   Self-Protecting | Self-Correcting | Anti-Intrusion");
    console.log("═══════════════════════════════════════════════\n");

    try {
      // Initialize Guardian AI (health & monitoring)
      console.log("1️⃣  Starting Guardian AI...");
      this.guardian = new GuardianAI();
      await this.guardian.initialize();
      this.systemStatus.guardian_active = true;
      console.log("   ✅ Guardian AI active\n");

      // Initialize Anti-Detect Layer (6-layer protection)
      console.log("2️⃣  Starting Anti-Detect Layer...");
      this.antiDetect = new AntiDetectLayer();
      await this.antiDetect.init();
      this.systemStatus.anti_detect_active = true;
      console.log("   ✅ Anti-Detect Layer active\n");

      // Connect event streams
      this.connectEventStreams();

      // Start unified monitoring
      this.startUnifiedMonitoring();

      this.initialized = true;

      console.log("═══════════════════════════════════════════════");
      console.log("✅ UNIFIED SECURITY ORCHESTRATOR READY");
      console.log("═══════════════════════════════════════════════\n");

      this.emit("initialized", this.systemStatus);
    } catch (error) {
      console.error("❌ Unified Security initialization failed:", error);
      throw error;
    }
  }

  connectEventStreams() {
    console.log("3️⃣  Connecting event streams...");

    // Guardian AI → Anti-Detect coordination
    this.guardian.on("security_threat", async (threat) => {
      await this.handleUnifiedThreat(threat, "GUARDIAN");
    });

    this.guardian.on("memory_leak_detected", async (data) => {
      // Anti-Detect should prevent auto-restart during critical operations
      const hasPendingApprovals = this.antiDetect.approvalQueue.size > 0;

      if (hasPendingApprovals) {
        console.log(
          "⚠️  Memory leak detected but restart delayed - pending approvals exist"
        );
        this.emit("restart_delayed", { reason: "pending_approvals", data });
      } else {
        // Safe to auto-restart
        this.emit("auto_restart_approved", data);
      }
    });

    // Anti-Detect → Guardian AI coordination
    this.antiDetect.on("critical_threat", async (threat) => {
      await this.handleUnifiedThreat(threat, "ANTI_DETECT");

      // Notify Guardian to increase monitoring
      this.guardian.emit("escalate_monitoring", {
        reason: "critical_threat",
        threat,
      });
    });

    this.antiDetect.on("protect_mode_activated", (data) => {
      this.systemStatus.protect_mode = true;
      this.systemStatus.threat_level = "CRITICAL";

      // Guardian should send immediate alerts
      this.guardian.sendEmailAlert(
        "CRITICAL",
        "🚨 PROTECT MODE ACTIVATED",
        `System entered protect mode due to: ${data.threats
          .map((t) => t.type)
          .join(", ")}`
      );

      this.emit("system_locked_down", data);
    });

    this.antiDetect.on("approval_required", (approval) => {
      this.systemStatus.pending_approvals++;

      // Guardian should alert admin
      this.guardian.sendEmailAlert(
        "WARNING",
        "⚠️ APPROVAL REQUIRED",
        `Operation requires admin approval:\n${approval.description}\n\nApproval ID: ${approval.id}`
      );

      this.emit("admin_approval_needed", approval);
    });

    this.antiDetect.on("approval_processed", (data) => {
      this.systemStatus.pending_approvals--;

      // Log in Guardian metrics
      this.guardian.emit("approval_completed", {
        approval_id: data.approval.id,
        decision: data.decision.approved ? "APPROVED" : "REJECTED",
      });
    });

    this.antiDetect.on("exploit_detected", async (exploit) => {
      // Guardian should increase security monitoring frequency
      this.guardian.emit("increase_security_monitoring");

      // Add to threat intelligence
      this.threatIntelligence.attack_patterns.set(exploit.forensics.source_ip, {
        type: "EXPLOIT_ATTEMPT",
        timestamp: new Date(),
        details: exploit,
      });

      this.emit("forensic_evidence_collected", exploit.forensics);
    });

    this.antiDetect.on("ip_blocked", (data) => {
      this.threatIntelligence.blocked_ips.add(data.ip);

      // Guardian should log this in system metrics
      this.guardian.emit("ip_blocked_by_anti_detect", data);
    });

    console.log("   ✅ Event streams connected\n");
  }

  async handleUnifiedThreat(threat, source) {
    console.log(`\n⚠️  UNIFIED THREAT DETECTED [${source}]`);

    this.systemStatus.active_threats++;

    // Add to forensic timeline
    this.threatIntelligence.forensic_timeline.push({
      timestamp: new Date(),
      source,
      threat,
      system_state: { ...this.systemStatus },
    });

    // Determine threat level
    const severity = threat.severity || threat.threats?.[0]?.severity;

    if (severity === "CRITICAL") {
      this.systemStatus.threat_level = "CRITICAL";

      // Coordinate lockdown
      await this.coordinateLockdown(threat);
    } else if (severity === "HIGH") {
      if (this.systemStatus.threat_level === "LOW") {
        this.systemStatus.threat_level = "MEDIUM";
      }
    }

    // Cross-layer response
    await this.executeUnifiedResponse(threat, source);

    this.emit("unified_threat_handled", { threat, source });
  }

  async coordinateLockdown(threat) {
    console.log("🚨 COORDINATING SYSTEM LOCKDOWN\n");

    // 1. Anti-Detect enters protect mode
    this.antiDetect.protectMode = true;

    // 2. Guardian increases monitoring to real-time
    this.guardian.emit("enter_realtime_monitoring");

    // 3. Block all non-admin access
    this.systemStatus.protect_mode = true;

    // 4. Snapshot current state for forensics
    const snapshot = await this.createForensicSnapshot();

    // 5. Alert all admins immediately
    await this.alertAllAdmins({
      severity: "CRITICAL",
      title: "🚨 SYSTEM LOCKDOWN ACTIVATED",
      message: "Critical threat detected. System entered protection mode.",
      threat,
      snapshot,
    });

    this.emit("lockdown_complete", { threat, snapshot });
  }

  async executeUnifiedResponse(threat, source) {
    const actions = [];

    // Guardian actions
    if (source === "ANTI_DETECT" || threat.severity === "CRITICAL") {
      // Increase monitoring frequency
      actions.push({
        system: "GUARDIAN",
        action: "INCREASE_MONITORING",
        status: "PENDING",
      });
    }

    // Anti-Detect actions
    if (source === "GUARDIAN" && threat.type === "SUSPICIOUS_LOGIN") {
      // Additional security validation
      const validation = await this.antiDetect.checkSecurityThreats({
        ip: threat.ip,
        user: threat.user,
        endpoint: "/api/auth/login",
      });

      actions.push({
        system: "ANTI_DETECT",
        action: "SECURITY_VALIDATION",
        result: validation,
        status: "COMPLETED",
      });
    }

    // Log coordinated response
    console.log(`   📋 Executed ${actions.length} unified response actions\n`);

    return actions;
  }

  startUnifiedMonitoring() {
    console.log("4️⃣  Starting unified monitoring...");

    // Consolidated status check every 30 seconds
    setInterval(() => {
      this.updateSystemStatus();
    }, 30000);

    // Threat intelligence analysis every 5 minutes
    setInterval(() => {
      this.analyzeThreatIntelligence();
    }, 300000);

    // Cleanup expired data every hour
    setInterval(() => {
      this.cleanupExpiredData();
    }, 3600000);

    console.log("   ✅ Unified monitoring started\n");
  }

  updateSystemStatus() {
    // Get Guardian metrics
    const guardianHealth = this.guardian.getCurrentMetrics();

    // Get Anti-Detect status
    const antiDetectStatus = this.antiDetect.getStatus();

    // Update unified status
    this.systemStatus = {
      ...this.systemStatus,
      guardian_health: guardianHealth,
      anti_detect_status: antiDetectStatus,
      timestamp: new Date(),
    };

    // Auto-adjust threat level based on metrics
    if (
      this.systemStatus.active_threats === 0 &&
      this.systemStatus.threat_level !== "LOW"
    ) {
      this.systemStatus.threat_level = "LOW";
      this.systemStatus.protect_mode = false;
      this.antiDetect.protectMode = false;
    }

    this.emit("status_updated", this.systemStatus);
  }

  async analyzeThreatIntelligence() {
    console.log("\n📊 Analyzing threat intelligence...");

    // Pattern detection
    const patterns = new Map();

    for (const [ip, data] of this.threatIntelligence.attack_patterns) {
      const key = data.type;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }

    // Generate insights
    const insights = {
      total_blocked_ips: this.threatIntelligence.blocked_ips.size,
      attack_patterns: Object.fromEntries(patterns),
      threat_timeline: this.threatIntelligence.forensic_timeline.slice(-20),
      recommendations: [],
    };

    // Auto-recommendations
    if (insights.total_blocked_ips > 50) {
      insights.recommendations.push({
        priority: "HIGH",
        action: "Review and purge old blocked IPs",
        reason: `${insights.total_blocked_ips} IPs currently blocked`,
      });
    }

    for (const [pattern, count] of patterns) {
      if (count > 10) {
        insights.recommendations.push({
          priority: "MEDIUM",
          action: `Strengthen defenses against ${pattern}`,
          reason: `${count} attempts detected`,
        });
      }
    }

    this.emit("threat_intelligence_updated", insights);

    return insights;
  }

  async cleanupExpiredData() {
    // Remove old forensic timeline entries (keep last 1000)
    if (this.threatIntelligence.forensic_timeline.length > 1000) {
      this.threatIntelligence.forensic_timeline =
        this.threatIntelligence.forensic_timeline.slice(-1000);
    }

    // Cleanup old attack patterns (>7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    for (const [ip, data] of this.threatIntelligence.attack_patterns) {
      if (data.timestamp < sevenDaysAgo) {
        this.threatIntelligence.attack_patterns.delete(ip);
      }
    }
  }

  async createForensicSnapshot() {
    return {
      timestamp: new Date(),
      system_status: { ...this.systemStatus },
      guardian_metrics: this.guardian.getCurrentMetrics(),
      anti_detect_status: this.antiDetect.getStatus(),
      threat_intelligence: {
        blocked_ips: Array.from(this.threatIntelligence.blocked_ips),
        attack_patterns: Object.fromEntries(
          this.threatIntelligence.attack_patterns
        ),
        recent_timeline: this.threatIntelligence.forensic_timeline.slice(-50),
      },
      pending_approvals: Array.from(this.antiDetect.approvalQueue.values()),
    };
  }

  async alertAllAdmins(alert) {
    // Use Guardian's alert system
    await this.guardian.sendEmailAlert(
      alert.severity,
      alert.title,
      `${alert.message}\n\nForensic Data:\n${JSON.stringify(
        alert.snapshot,
        null,
        2
      )}`
    );

    if (this.guardian.slackWebhook) {
      await this.guardian.sendSlackAlert(
        alert.severity,
        alert.title,
        alert.message
      );
    }
  }

  // ===== PUBLIC API =====

  async validateAISuggestion(suggestion) {
    if (!this.initialized) {
      throw new Error("Unified Security not initialized");
    }

    // Layer 1: Anti-Suggest validation
    const validation = await this.antiDetect.validateSuggestion(suggestion);

    if (!validation.allowed) {
      // Log in Guardian
      await this.guardian.logSecurityIncident({
        type: "AI_SUGGESTION_BLOCKED",
        severity: "MEDIUM",
        details: validation,
      });
    }

    return validation;
  }

  async validateAIPlan(plan) {
    if (!this.initialized) {
      throw new Error("Unified Security not initialized");
    }

    // Layer 2: Anti-Plan validation
    const validation = await this.antiDetect.validatePlan(plan);

    if (validation.requires_approval) {
      // Request human approval
      const approval = await this.antiDetect.requestApproval({
        type: plan.type,
        description: plan.description,
        user: plan.user,
        data: plan,
      });

      return {
        ...validation,
        approval,
      };
    }

    return validation;
  }

  async requestHumanApproval(operation) {
    if (!this.initialized) {
      throw new Error("Unified Security not initialized");
    }

    // Layer 3: Anti-Approve
    return await this.antiDetect.requestApproval(operation);
  }

  async processAdminApproval(approvalId, adminUser, decision) {
    if (!this.initialized) {
      throw new Error("Unified Security not initialized");
    }

    const result = await this.antiDetect.processApproval(
      approvalId,
      adminUser,
      decision
    );

    // Log in Guardian
    await this.guardian.logSecurityIncident({
      type: "APPROVAL_PROCESSED",
      severity: "INFO",
      details: {
        approval_id: approvalId,
        decision: decision.approved ? "APPROVED" : "REJECTED",
        admin: adminUser.email,
      },
    });

    return result;
  }

  getUnifiedStatus() {
    return {
      ...this.systemStatus,
      guardian: this.guardian?.getCurrentMetrics(),
      anti_detect: this.antiDetect?.getStatus(),
      threat_intelligence: {
        blocked_ips: this.threatIntelligence.blocked_ips.size,
        attack_patterns: this.threatIntelligence.attack_patterns.size,
        forensic_entries: this.threatIntelligence.forensic_timeline.length,
      },
    };
  }

  async getForensicReport(timeframe = 3600000) {
    const guardianReport = await this.guardian.getHealthReport();
    const antiDetectReport = await this.antiDetect.getForensicReport(timeframe);

    return {
      timeframe,
      timestamp: new Date(),
      guardian: guardianReport,
      anti_detect: antiDetectReport,
      unified_insights: await this.analyzeThreatIntelligence(),
      system_status: this.systemStatus,
    };
  }

  // ===== EXPRESS MIDDLEWARE =====

  unifiedSecurityMiddleware() {
    return async (req, res, next) => {
      if (!this.initialized) {
        return next();
      }

      try {
        // Skip health checks
        if (req.path === "/api/health") {
          return next();
        }

        // Guardian tracking
        req.guardianStartTime = Date.now();

        // Anti-Detect validation
        const antiDetectResult = await this.antiDetect.antiDetectMiddleware()(
          req,
          res,
          () => {}
        );

        if (antiDetectResult === false) {
          // Request was blocked by Anti-Detect
          return;
        }

        // Attach unified security to request
        req.security = {
          guardian: this.guardian,
          antiDetect: this.antiDetect,
          orchestrator: this,
        };

        // Track response
        const originalSend = res.send;
        res.send = function (data) {
          const duration = Date.now() - req.guardianStartTime;

          // Log slow requests
          if (duration > 3000) {
            console.log(`⚠️  Slow request: ${req.path} took ${duration}ms`);
          }

          return originalSend.call(this, data);
        };

        next();
      } catch (error) {
        console.error("Unified Security middleware error:", error);
        next(error);
      }
    };
  }
}

module.exports = { UnifiedSecurityOrchestrator };
