/**
 * ANTI-DETECT LAYER
 * 6-Layer AI Security System
 *
 * Protects against:
 * - Unsafe AI suggestions
 * - Unauthorized approvals
 * - Dangerous plans
 * - Security breaches
 * - Destructive reorganization
 * - External exploits
 *
 * Integrated with Guardian AI for unified protection
 */

const prisma = require("../prismaClient");
const EventEmitter = require("events");
const crypto = require("crypto");

class AntiDetectLayer extends EventEmitter {
  constructor() {
    super();

    this.protectMode = false;
    this.blockedIPs = new Set();
    this.suspiciousPatterns = new Map();
    this.approvalQueue = new Map();
    this.auditLog = [];

    // Security rules configuration
    this.rules = {
      // LAYER 1: Anti-Suggest Rules
      antiSuggest: {
        blocked_keywords: [
          "delete environment",
          "drop database",
          "bypass approval",
          "skip verification",
          "disable security",
          "remove encryption",
          "expose api key",
          "public database",
          "disable firewall",
          "allow all ips",
          "sudo access",
          "root access",
        ],
        blocked_actions: [
          "DELETE_ENV",
          "DROP_TABLE",
          "BYPASS_AUTH",
          "DISABLE_2FA",
          "EXPOSE_SECRETS",
          "MODIFY_PERMISSIONS",
          "ESCALATE_PRIVILEGES",
        ],
        restricted_paths: [
          "/api/admin/delete",
          "/api/keys/generate",
          "/api/payments/bypass",
          "/api/users/elevate",
          "/api/config/security",
        ],
      },

      // LAYER 2: Anti-Plan Rules
      antiPlan: {
        requires_approval: [
          "INFRASTRUCTURE_CHANGE",
          "SECURITY_MODIFICATION",
          "API_ALTERATION",
          "DATABASE_MIGRATION",
          "AUTO_SCALING",
          "NETWORK_RECONFIGURATION",
        ],
        blocked_plan_types: [
          "AUTO_DELETE_USERS",
          "AUTO_MODIFY_PAYMENTS",
          "AUTO_ROTATE_MASTER_KEY",
          "AUTO_CHANGE_DNS",
          "AUTO_ALTER_FIREWALL",
        ],
      },

      // LAYER 3: Anti-Approve Rules
      antiApprove: {
        zero_auto_approval: [
          "PAYMENT_PROCESSING",
          "CRYPTO_TRANSFER",
          "API_KEY_ROTATION",
          "USER_DATA_EXPORT",
          "DATABASE_BACKUP_RESTORE",
          "INFRASTRUCTURE_DEPLOYMENT",
          "SECURITY_RULE_CHANGE",
        ],
        requires_admin: true,
        requires_2fa: true,
        min_approvers: 1,
        approval_timeout: 3600000, // 1 hour
      },

      // LAYER 4: Anti-Secure Rules
      antiSecure: {
        rate_limits: {
          login_attempts: { max: 5, window: 900000 }, // 5 per 15 min
          api_calls: { max: 100, window: 60000 }, // 100 per minute
          password_reset: { max: 3, window: 3600000 }, // 3 per hour
          failed_auth: { max: 10, window: 3600000 }, // 10 per hour
        },
        auto_lock_triggers: [
          "BRUTE_FORCE",
          "TOKEN_LEAK",
          "PRIVILEGE_ESCALATION",
          "SUSPICIOUS_LOCATION",
          "ABNORMAL_USAGE",
          "MULTIPLE_FAILED_AUTH",
        ],
        ip_whitelist: [], // Populated from env
        honeypot_endpoints: [
          "/admin/backdoor",
          "/api/internal/secrets",
          "/debug/config",
        ],
      },

      // LAYER 5: Anti-Organize Rules
      antiOrganize: {
        protected_structures: [
          "database_tables",
          "api_routes",
          "security_config",
          "payment_flows",
          "user_permissions",
          "encryption_keys",
        ],
        blocked_operations: [
          "RENAME_TABLE",
          "MOVE_CRITICAL_FILES",
          "RESTRUCTURE_ROUTES",
          "REORGANIZE_CONNECTORS",
          "REORDER_MIDDLEWARE",
        ],
        requires_backup_before: [
          "DATABASE_REORGANIZE",
          "FILE_STRUCTURE_CHANGE",
          "ROUTE_MODIFICATION",
        ],
      },

      // LAYER 6: Anti-Exploit Rules
      antiExploit: {
        injection_patterns: [
          /(\bOR\b|\bAND\b).*=.*(\bOR\b|\bAND\b)/i, // SQL injection
          /<script[^>]*>.*?<\/script>/gi, // XSS
          /\b(union|select|insert|update|delete|drop)\b.*\b(from|into|table)\b/i, // SQL
          /(\.\.\/|\.\.\\)/g, // Path traversal
          /(\$\{|<%=|{{)/g, // Template injection
          /(eval|exec|system|passthru)\s*\(/i, // Code execution
          /base64_decode|gzinflate|str_rot13/i, // Obfuscation
        ],
        command_whitelist: [
          "GET_USER",
          "CREATE_TRANSACTION",
          "UPDATE_PROFILE",
          "SEND_NOTIFICATION",
          "GENERATE_REPORT",
        ],
        blocked_headers: ["X-Forwarded-For", "X-Real-IP", "X-Original-URL"],
        suspicious_behaviors: [
          "RAPID_ENDPOINT_SCANNING",
          "AUTOMATED_REQUESTS",
          "PROXY_DETECTION",
          "BOT_SIGNATURE",
          "ABNORMAL_USER_AGENT",
        ],
      },
    };

    // Attack detection counters
    this.attackCounters = new Map();

    // Initialize
    this.init();
  }

  async init() {
    console.log("🛡️ Anti-Detect Layer initializing...");

    // Load IP whitelist from env
    const whitelistIPs = process.env.WHITELIST_IPS?.split(",") || [];
    this.rules.antiSecure.ip_whitelist = whitelistIPs;

    // Start monitoring
    this.startHoneypotMonitoring();
    this.startSuspiciousActivityDetection();

    console.log("✅ Anti-Detect Layer active - 6 layers protecting system");
    this.emit("initialized");
  }

  // ===== LAYER 1: ANTI-SUGGEST =====

  async validateSuggestion(suggestion, context = {}) {
    const { text, action, path, user } = suggestion;

    const threats = [];

    // Check blocked keywords
    for (const keyword of this.rules.antiSuggest.blocked_keywords) {
      if (text?.toLowerCase().includes(keyword)) {
        threats.push({
          layer: "ANTI_SUGGEST",
          type: "BLOCKED_KEYWORD",
          keyword,
          severity: "HIGH",
        });
      }
    }

    // Check blocked actions
    if (this.rules.antiSuggest.blocked_actions.includes(action)) {
      threats.push({
        layer: "ANTI_SUGGEST",
        type: "BLOCKED_ACTION",
        action,
        severity: "CRITICAL",
      });
    }

    // Check restricted paths
    if (
      path &&
      this.rules.antiSuggest.restricted_paths.some((p) => path.includes(p))
    ) {
      threats.push({
        layer: "ANTI_SUGGEST",
        type: "RESTRICTED_PATH",
        path,
        severity: "HIGH",
      });
    }

    if (threats.length > 0) {
      await this.logSecurityEvent("SUGGESTION_BLOCKED", {
        suggestion,
        threats,
        user,
      });

      return {
        allowed: false,
        reason: "Suggestion contains blocked content",
        threats,
      };
    }

    return { allowed: true, threats: [] };
  }

  // ===== LAYER 2: ANTI-PLAN =====

  async validatePlan(plan, context = {}) {
    const { actions, type, target, user } = plan;

    const issues = [];

    // Check if plan requires approval
    if (this.rules.antiPlan.requires_approval.includes(type)) {
      issues.push({
        layer: "ANTI_PLAN",
        type: "REQUIRES_APPROVAL",
        planType: type,
        severity: "MEDIUM",
      });
    }

    // Check blocked plan types
    if (this.rules.antiPlan.blocked_plan_types.includes(type)) {
      issues.push({
        layer: "ANTI_PLAN",
        type: "BLOCKED_PLAN_TYPE",
        planType: type,
        severity: "CRITICAL",
      });

      await this.logSecurityEvent("PLAN_BLOCKED", {
        plan,
        issues,
        user,
      });

      return {
        allowed: false,
        reason: "Plan type is blocked by security policy",
        issues,
      };
    }

    // Validate plan actions
    for (const action of actions || []) {
      const validation = await this.validateSuggestion(
        {
          text: action.description,
          action: action.type,
        },
        context
      );

      if (!validation.allowed) {
        issues.push({
          layer: "ANTI_PLAN",
          type: "INVALID_ACTION",
          action,
          severity: "HIGH",
        });
      }
    }

    if (
      issues.some((i) => i.severity === "CRITICAL" || i.severity === "HIGH")
    ) {
      return {
        allowed: false,
        reason: "Plan contains high-risk or blocked actions",
        issues,
        requires_approval: true,
      };
    }

    if (issues.some((i) => i.type === "REQUIRES_APPROVAL")) {
      return {
        allowed: false,
        reason: "Plan requires admin approval",
        issues,
        requires_approval: true,
      };
    }

    return { allowed: true, issues: [] };
  }

  // ===== LAYER 3: ANTI-APPROVE =====

  async requestApproval(operation, context = {}) {
    const { type, description, user, data } = operation;

    // Check if operation requires approval
    if (!this.rules.antiApprove.zero_auto_approval.includes(type)) {
      return { auto_approved: true };
    }

    // Create approval request
    const approvalId = crypto.randomUUID();
    const approval = {
      id: approvalId,
      type,
      description,
      user,
      data,
      status: "PENDING",
      requires_admin: this.rules.antiApprove.requires_admin,
      requires_2fa: this.rules.antiApprove.requires_2fa,
      min_approvers: this.rules.antiApprove.min_approvers,
      created_at: new Date(),
      expires_at: new Date(
        Date.now() + this.rules.antiApprove.approval_timeout
      ),
      approvers: [],
    };

    this.approvalQueue.set(approvalId, approval);

    // Store in database
    await prisma.approvalQueue.create({
      data: {
        id: approvalId,
        operation_type: type,
        description,
        user_id: user?.id,
        status: "PENDING",
        data: JSON.stringify(data),
        requires_admin: approval.requires_admin,
        requires_2fa: approval.requires_2fa,
        expires_at: approval.expires_at,
      },
    });

    // Send alert to admin
    this.emit("approval_required", approval);

    await this.logSecurityEvent("APPROVAL_REQUIRED", {
      approval_id: approvalId,
      operation: operation,
    });

    return {
      auto_approved: false,
      approval_id: approvalId,
      status: "PENDING",
      message: "Operation requires admin approval",
    };
  }

  async processApproval(approvalId, adminUser, decision) {
    const approval = this.approvalQueue.get(approvalId);

    if (!approval) {
      throw new Error("Approval request not found");
    }

    if (approval.status !== "PENDING") {
      throw new Error("Approval already processed");
    }

    // Verify admin
    if (this.rules.antiApprove.requires_admin && adminUser.role !== "admin") {
      throw new Error("Admin privileges required");
    }

    // Update approval
    approval.status = decision.approved ? "APPROVED" : "REJECTED";
    approval.approvers.push({
      admin: adminUser,
      decision: decision.approved,
      reason: decision.reason,
      timestamp: new Date(),
    });

    // Update database
    await prisma.approvalQueue.update({
      where: { id: approvalId },
      data: {
        status: approval.status,
        approved_by: adminUser.id,
        approved_at: new Date(),
        rejection_reason: decision.approved ? null : decision.reason,
      },
    });

    await this.logSecurityEvent("APPROVAL_PROCESSED", {
      approval_id: approvalId,
      decision: decision.approved ? "APPROVED" : "REJECTED",
      admin: adminUser.email,
    });

    this.emit("approval_processed", { approval, decision });

    return approval;
  }

  // ===== LAYER 4: ANTI-SECURE =====

  async checkSecurityThreats(request, context = {}) {
    const { ip, user, endpoint, headers } = request;

    const threats = [];

    // Check rate limits
    const rateCheck = await this.checkRateLimits(ip, user, endpoint);
    if (!rateCheck.allowed) {
      threats.push({
        layer: "ANTI_SECURE",
        type: "RATE_LIMIT_EXCEEDED",
        details: rateCheck,
        severity: "HIGH",
      });
    }

    // Check IP whitelist (if strict mode)
    if (process.env.STRICT_IP_MODE === "true") {
      if (!this.rules.antiSecure.ip_whitelist.includes(ip)) {
        threats.push({
          layer: "ANTI_SECURE",
          type: "UNKNOWN_IP",
          ip,
          severity: "MEDIUM",
        });
      }
    }

    // Check honeypot access
    if (
      this.rules.antiSecure.honeypot_endpoints.some((h) => endpoint.includes(h))
    ) {
      threats.push({
        layer: "ANTI_SECURE",
        type: "HONEYPOT_TRIGGERED",
        endpoint,
        severity: "CRITICAL",
      });

      // Auto-block IP
      await this.blockIP(ip, "Honeypot triggered", 86400000); // 24 hours
    }

    // Check suspicious headers
    for (const blockedHeader of this.rules.antiSecure.blocked_headers) {
      if (headers[blockedHeader.toLowerCase()]) {
        threats.push({
          layer: "ANTI_SECURE",
          type: "SUSPICIOUS_HEADER",
          header: blockedHeader,
          severity: "HIGH",
        });
      }
    }

    if (threats.length > 0) {
      await this.handleSecurityThreats(threats, request);
    }

    return {
      safe: threats.length === 0,
      threats,
      action_taken: threats.length > 0 ? "BLOCKED" : "ALLOWED",
    };
  }

  async checkRateLimits(ip, user, endpoint) {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();

    // Get rate limit config for endpoint
    const limitConfig = this.rules.antiSecure.rate_limits.api_calls;

    if (!this.attackCounters.has(key)) {
      this.attackCounters.set(key, []);
    }

    const requests = this.attackCounters.get(key);

    // Remove old requests outside window
    const validRequests = requests.filter((t) => now - t < limitConfig.window);
    this.attackCounters.set(key, validRequests);

    // Check limit
    if (validRequests.length >= limitConfig.max) {
      return {
        allowed: false,
        reason: "Rate limit exceeded",
        limit: limitConfig.max,
        window: limitConfig.window,
        current: validRequests.length,
      };
    }

    // Add current request
    validRequests.push(now);

    return { allowed: true };
  }

  async handleSecurityThreats(threats, request) {
    const criticalThreats = threats.filter((t) => t.severity === "CRITICAL");

    if (criticalThreats.length > 0) {
      // Enter protect mode
      this.protectMode = true;
      this.emit("protect_mode_activated", { threats, request });

      // Block IP
      await this.blockIP(
        request.ip,
        "Critical security threat detected",
        86400000
      );

      // Alert admin immediately
      this.emit("critical_threat", {
        threats: criticalThreats,
        request,
        action: "IP_BLOCKED",
      });
    }

    await this.logSecurityEvent("SECURITY_THREAT", {
      threats,
      request,
      protect_mode: this.protectMode,
    });
  }

  async blockIP(ip, reason, duration) {
    this.blockedIPs.add(ip);

    await prisma.blockedIP.create({
      data: {
        id: crypto.randomUUID(),
        ip_address: ip,
        reason,
        expires_at: new Date(Date.now() + duration),
      },
    });

    this.emit("ip_blocked", { ip, reason, duration });
  }

  // ===== LAYER 5: ANTI-ORGANIZE =====

  async validateOrganization(operation, context = {}) {
    const { type, target, changes } = operation;

    const issues = [];

    // Check protected structures
    for (const structure of this.rules.antiOrganize.protected_structures) {
      if (target?.includes(structure)) {
        issues.push({
          layer: "ANTI_ORGANIZE",
          type: "PROTECTED_STRUCTURE",
          structure,
          severity: "HIGH",
        });
      }
    }

    // Check blocked operations
    if (this.rules.antiOrganize.blocked_operations.includes(type)) {
      issues.push({
        layer: "ANTI_ORGANIZE",
        type: "BLOCKED_OPERATION",
        operation: type,
        severity: "CRITICAL",
      });

      await this.logSecurityEvent("ORGANIZATION_BLOCKED", {
        operation,
        issues,
      });

      return {
        allowed: false,
        reason: "Operation would modify protected structure",
        issues,
      };
    }

    // Check if backup required
    if (this.rules.antiOrganize.requires_backup_before.includes(type)) {
      const backupExists = await this.verifyRecentBackup();

      if (!backupExists) {
        return {
          allowed: false,
          reason: "Backup required before organization changes",
          requires_backup: true,
        };
      }
    }

    return { allowed: issues.length === 0, issues };
  }

  async verifyRecentBackup() {
    // Check if backup was created in last 24 hours
    const recentBackup = await prisma.systemMetric.findFirst({
      where: {
        metric_type: "BACKUP_COMPLETED",
        timestamp: {
          gte: new Date(Date.now() - 86400000),
        },
      },
    });

    return !!recentBackup;
  }

  // ===== LAYER 6: ANTI-EXPLOIT =====

  async detectExploitAttempts(input, context = {}) {
    const { type, value, source } = input;

    const exploits = [];

    // Check injection patterns
    for (const pattern of this.rules.antiExploit.injection_patterns) {
      if (pattern.test(value)) {
        exploits.push({
          layer: "ANTI_EXPLOIT",
          type: "INJECTION_ATTEMPT",
          pattern: pattern.toString(),
          severity: "CRITICAL",
        });
      }
    }

    // Check command whitelist
    if (
      type === "COMMAND" &&
      !this.rules.antiExploit.command_whitelist.includes(value)
    ) {
      exploits.push({
        layer: "ANTI_EXPLOIT",
        type: "UNAUTHORIZED_COMMAND",
        command: value,
        severity: "HIGH",
      });
    }

    // Detect suspicious behaviors
    await this.analyzeSuspiciousBehavior(input, exploits);

    if (exploits.length > 0) {
      await this.handleExploitAttempt(exploits, input, context);

      return {
        safe: false,
        exploits,
        action: "BLOCKED_AND_LOGGED",
      };
    }

    return { safe: true, exploits: [] };
  }

  async analyzeSuspiciousBehavior(input, exploits) {
    const { source, user_agent, request_pattern } = input;

    // Check for rapid endpoint scanning
    if (request_pattern?.rapid_different_endpoints) {
      exploits.push({
        layer: "ANTI_EXPLOIT",
        type: "ENDPOINT_SCANNING",
        severity: "HIGH",
      });
    }

    // Check for bot signatures
    if (user_agent && this.isBotSignature(user_agent)) {
      exploits.push({
        layer: "ANTI_EXPLOIT",
        type: "BOT_DETECTED",
        severity: "MEDIUM",
      });
    }
  }

  isBotSignature(userAgent) {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
    ];

    return botPatterns.some((pattern) => pattern.test(userAgent));
  }

  async handleExploitAttempt(exploits, input, context) {
    const criticalExploits = exploits.filter((e) => e.severity === "CRITICAL");

    if (criticalExploits.length > 0) {
      // Enter protect mode immediately
      this.protectMode = true;

      // Block source IP
      if (input.ip) {
        await this.blockIP(input.ip, "Exploit attempt detected", 604800000); // 7 days
      }

      // Freeze affected connector/endpoint
      if (context.endpoint) {
        this.emit("freeze_endpoint", {
          endpoint: context.endpoint,
          reason: "Exploit attempt",
        });
      }

      // Alert admin with full forensics
      this.emit("exploit_detected", {
        exploits: criticalExploits,
        input,
        context,
        forensics: {
          timestamp: new Date(),
          source_ip: input.ip,
          user_agent: input.user_agent,
          request_data: input,
        },
      });
    }

    await this.logSecurityEvent("EXPLOIT_ATTEMPT", {
      exploits,
      input,
      protect_mode: this.protectMode,
    });
  }

  // ===== MONITORING & LOGGING =====

  startHoneypotMonitoring() {
    setInterval(() => {
      // Monitor honeypot access attempts
      this.emit("honeypot_check");
    }, 60000); // Every minute
  }

  startSuspiciousActivityDetection() {
    setInterval(() => {
      // Analyze patterns across all layers
      this.detectAnomalies();
    }, 300000); // Every 5 minutes
  }

  async detectAnomalies() {
    const recentEvents = await prisma.securityEvent.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - 3600000), // Last hour
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Detect patterns
    const patternCounts = new Map();

    for (const event of recentEvents) {
      const key = `${event.event_type}:${event.ip_address}`;
      patternCounts.set(key, (patternCounts.get(key) || 0) + 1);
    }

    // Alert on suspicious patterns (>10 similar events in 1 hour)
    for (const [pattern, count] of patternCounts) {
      if (count > 10) {
        this.emit("anomaly_detected", {
          pattern,
          count,
          timeframe: "1 hour",
        });
      }
    }
  }

  async logSecurityEvent(eventType, details) {
    const event = {
      id: crypto.randomUUID(),
      event_type: eventType,
      severity: details.severity || "MEDIUM",
      ip_address: details.request?.ip || details.ip,
      user_id: details.user?.id,
      details: JSON.stringify(details),
      action_taken: details.action || "LOGGED",
      created_at: new Date(),
    };

    await prisma.securityEvent.create({ data: event });

    this.auditLog.push(event);
    this.emit("security_event", event);

    return event;
  }

  // ===== EXPRESS MIDDLEWARE =====

  antiDetectMiddleware() {
    return async (req, res, next) => {
      try {
        // Skip health checks
        if (req.path === "/api/health") {
          return next();
        }

        // Check if IP is blocked
        if (this.blockedIPs.has(req.ip)) {
          return res.status(403).json({
            error: "Access denied",
            reason: "IP blocked for security reasons",
          });
        }

        // Check if system is in protect mode
        if (this.protectMode && !req.user?.role === "admin") {
          return res.status(503).json({
            error: "Service temporarily unavailable",
            reason: "System in protection mode",
          });
        }

        // Validate request
        const securityCheck = await this.checkSecurityThreats({
          ip: req.ip,
          user: req.user,
          endpoint: req.path,
          headers: req.headers,
        });

        if (!securityCheck.safe) {
          return res.status(403).json({
            error: "Request blocked by security system",
            threats: securityCheck.threats.map((t) => t.type),
          });
        }

        // Check for exploit attempts in body
        if (req.body) {
          const exploitCheck = await this.detectExploitAttempts({
            type: "REQUEST_BODY",
            value: JSON.stringify(req.body),
            ip: req.ip,
            user_agent: req.headers["user-agent"],
          });

          if (!exploitCheck.safe) {
            return res.status(400).json({
              error: "Request contains suspicious content",
              details: "Possible exploit attempt detected",
            });
          }
        }

        // Attach anti-detect layer to request
        req.antiDetect = this;

        next();
      } catch (error) {
        console.error("Anti-Detect middleware error:", error);
        next(error);
      }
    };
  }

  // ===== UTILITY METHODS =====

  getStatus() {
    return {
      protect_mode: this.protectMode,
      blocked_ips_count: this.blockedIPs.size,
      pending_approvals: this.approvalQueue.size,
      recent_threats: this.auditLog.slice(-10),
      layers: {
        anti_suggest: "ACTIVE",
        anti_plan: "ACTIVE",
        anti_approve: "ACTIVE",
        anti_secure: "ACTIVE",
        anti_organize: "ACTIVE",
        anti_exploit: "ACTIVE",
      },
    };
  }

  async getForensicReport(timeframe = 3600000) {
    const events = await prisma.securityEvent.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - timeframe),
        },
      },
      orderBy: { created_at: "desc" },
    });

    const blockedActions = await prisma.blockedAction.findMany({
      where: {
        created_at: {
          gte: new Date(Date.now() - timeframe),
        },
      },
    });

    return {
      timeframe,
      total_events: events.length,
      events_by_type: this.groupBy(events, "event_type"),
      events_by_severity: this.groupBy(events, "severity"),
      blocked_actions: blockedActions.length,
      top_threat_ips: this.getTopThreatIPs(events),
      recommendations: this.generateSecurityRecommendations(events),
    };
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  getTopThreatIPs(events) {
    const ipCounts = new Map();

    for (const event of events) {
      if (event.ip_address) {
        ipCounts.set(
          event.ip_address,
          (ipCounts.get(event.ip_address) || 0) + 1
        );
      }
    }

    return Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, threat_count: count }));
  }

  generateSecurityRecommendations(events) {
    const recommendations = [];

    // Check for repeated attacks from same IPs
    const topThreats = this.getTopThreatIPs(events);
    if (topThreats.length > 0 && topThreats[0].threat_count > 5) {
      recommendations.push({
        priority: "HIGH",
        action: "Consider permanent IP ban",
        reason: `IP ${topThreats[0].ip} has ${topThreats[0].threat_count} threat events`,
      });
    }

    // Check for high exploit attempts
    const exploitAttempts = events.filter(
      (e) => e.event_type === "EXPLOIT_ATTEMPT"
    );
    if (exploitAttempts.length > 10) {
      recommendations.push({
        priority: "CRITICAL",
        action: "Enable strict mode",
        reason: `${exploitAttempts.length} exploit attempts detected`,
      });
    }

    return recommendations;
  }
}

module.exports = { AntiDetectLayer };
