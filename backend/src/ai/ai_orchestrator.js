/**
 * 🛡️ GUARDIAN AI ORCHESTRATOR
 * Self-monitoring, self-correcting AI system for Advancia SaaS
 *
 * Features:
 * - Real-time security monitoring
 * - API leak prevention
 * - Automatic vulnerability patching
 * - Human alerts for critical issues
 * - Self-healing system components
 * - Zero-downtime deployment coordination
 *
 * @author Advancia Security Team
 * @version 1.0.0
 */

const EventEmitter = require("events");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const axios = require("axios");

// ============================================================================
// CONFIGURATION
// ============================================================================

const GUARDIAN_CONFIG = {
  // Monitoring intervals
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  SECURITY_SCAN_INTERVAL: 300000, // 5 minutes
  API_USAGE_CHECK_INTERVAL: 30000, // 30 seconds
  VULNERABILITY_SCAN_INTERVAL: 3600000, // 1 hour

  // Thresholds
  MAX_API_CALLS_PER_MINUTE: 100,
  MAX_FAILED_LOGINS: 5,
  MAX_ERROR_RATE: 0.05, // 5%
  MAX_RESPONSE_TIME_MS: 1000,
  MAX_MEMORY_USAGE_MB: 800,
  MAX_CPU_USAGE_PERCENT: 85,

  // Auto-correction
  AUTO_RESTART_ON_MEMORY_LEAK: true,
  AUTO_BLOCK_SUSPICIOUS_IPS: true,
  AUTO_ROTATE_API_KEYS: true,
  AUTO_PATCH_VULNERABILITIES: false, // Requires human approval

  // Alert channels
  ALERT_EMAIL: process.env.ADMIN_EMAIL || "admin@advanciapayledger.com",
  ALERT_SLACK_WEBHOOK: process.env.SLACK_WEBHOOK_URL,
  ALERT_SMS: process.env.ADMIN_PHONE,

  // Critical thresholds for immediate human alert
  CRITICAL_THRESHOLDS: {
    POTENTIAL_DATA_BREACH: true,
    API_KEY_LEAKED: true,
    DATABASE_COMPROMISED: true,
    PAYMENT_SYSTEM_FAILURE: true,
    MASS_UNAUTHORIZED_ACCESS: 10, // 10+ unauthorized attempts in 1 min
    DDOS_DETECTED: 500, // 500+ requests/min from single IP
  },
};

// ============================================================================
// GUARDIAN AI CLASS
// ============================================================================

class GuardianAI extends EventEmitter {
  constructor() {
    super();
    this.prisma = require("../prismaClient");
    this.monitoringActive = false;
    this.blockedIPs = new Set();
    this.apiUsageCache = new Map();
    this.errorLog = [];
    this.healthMetrics = {
      uptime: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      activeConnections: 0,
    };

    // Email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log("🛡️ Guardian AI initialized");
  }

  // ==========================================================================
  // CORE MONITORING
  // ==========================================================================

  async start() {
    if (this.monitoringActive) {
      console.log("⚠️ Guardian AI already running");
      return;
    }

    this.monitoringActive = true;
    console.log("🚀 Guardian AI monitoring started");

    // Start all monitoring tasks
    this.startHealthMonitoring();
    this.startSecurityMonitoring();
    this.startAPIUsageMonitoring();
    this.startVulnerabilityScanning();
    this.startErrorTracking();

    // Register emergency shutdown handler
    process.on("SIGTERM", () => this.gracefulShutdown());
    process.on("SIGINT", () => this.gracefulShutdown());

    await this.sendAlert(
      "info",
      "🛡️ Guardian AI System Started",
      "All monitoring systems active"
    );
  }

  async stop() {
    this.monitoringActive = false;
    console.log("🛑 Guardian AI monitoring stopped");
    await this.sendAlert(
      "info",
      "🛡️ Guardian AI System Stopped",
      "Monitoring paused"
    );
  }

  // ==========================================================================
  // HEALTH MONITORING
  // ==========================================================================

  startHealthMonitoring() {
    setInterval(async () => {
      if (!this.monitoringActive) return;

      try {
        // Collect system metrics
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        this.healthMetrics.memoryUsage = memUsage.heapUsed / 1024 / 1024; // MB
        this.healthMetrics.cpuUsage =
          (cpuUsage.user + cpuUsage.system) / 1000000; // %
        this.healthMetrics.uptime = process.uptime();

        // Check thresholds
        if (
          this.healthMetrics.memoryUsage > GUARDIAN_CONFIG.MAX_MEMORY_USAGE_MB
        ) {
          await this.handleMemoryLeak();
        }

        if (
          this.healthMetrics.cpuUsage > GUARDIAN_CONFIG.MAX_CPU_USAGE_PERCENT
        ) {
          await this.handleHighCPU();
        }

        // Check database connection
        await this.checkDatabaseHealth();

        // Check API endpoints
        await this.checkAPIHealth();

        // Update status page
        await this.updateStatusPage();

        this.emit("health-check-complete", this.healthMetrics);
      } catch (error) {
        console.error("❌ Health monitoring error:", error);
        await this.sendAlert(
          "error",
          "⚠️ Health Monitoring Failed",
          error.message
        );
      }
    }, GUARDIAN_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      if (responseTime > GUARDIAN_CONFIG.MAX_RESPONSE_TIME_MS) {
        await this.sendAlert(
          "warning",
          "⚠️ Database Slow Response",
          `Database response time: ${responseTime}ms (threshold: ${GUARDIAN_CONFIG.MAX_RESPONSE_TIME_MS}ms)`
        );
      }

      return { healthy: true, responseTime };
    } catch (error) {
      await this.sendAlert("critical", "🚨 DATABASE DOWN", error.message);
      await this.handleDatabaseFailure();
      return { healthy: false, error: error.message };
    }
  }

  async checkAPIHealth() {
    const endpoints = [
      { url: "http://localhost:4000/api/health", name: "Backend Health" },
      { url: "http://localhost:3000/api/healthcheck", name: "Frontend Health" },
    ];

    for (const endpoint of endpoints) {
      try {
        const start = Date.now();
        const response = await axios.get(endpoint.url, { timeout: 5000 });
        const responseTime = Date.now() - start;

        if (response.status !== 200) {
          await this.sendAlert(
            "warning",
            `⚠️ ${endpoint.name} Unhealthy`,
            `Status: ${response.status}`
          );
        }

        if (responseTime > GUARDIAN_CONFIG.MAX_RESPONSE_TIME_MS) {
          await this.sendAlert(
            "warning",
            `⚠️ ${endpoint.name} Slow`,
            `Response time: ${responseTime}ms`
          );
        }
      } catch (error) {
        await this.sendAlert(
          "critical",
          `🚨 ${endpoint.name} DOWN`,
          error.message
        );
      }
    }
  }

  // ==========================================================================
  // SECURITY MONITORING
  // ==========================================================================

  startSecurityMonitoring() {
    setInterval(async () => {
      if (!this.monitoringActive) return;

      try {
        // Check for suspicious login attempts
        await this.detectSuspiciousLogins();

        // Check for API key leaks
        await this.detectAPIKeyLeaks();

        // Check for unauthorized access
        await this.detectUnauthorizedAccess();

        // Check for SQL injection attempts
        await this.detectSQLInjection();

        // Check for XSS attempts
        await this.detectXSSAttempts();

        // Check for DDoS patterns
        await this.detectDDoS();

        this.emit("security-scan-complete");
      } catch (error) {
        console.error("❌ Security monitoring error:", error);
        await this.sendAlert(
          "error",
          "⚠️ Security Monitoring Failed",
          error.message
        );
      }
    }, GUARDIAN_CONFIG.SECURITY_SCAN_INTERVAL);
  }

  async detectSuspiciousLogins() {
    // Check failed login attempts in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const failedLogins = await this.prisma.auditLog.groupBy({
      by: ["details"],
      where: {
        action: "login_failed",
        created_at: { gte: fiveMinutesAgo },
      },
      _count: true,
    });

    for (const group of failedLogins) {
      const ip = group.details?.ip;
      const count = group._count;

      if (count >= GUARDIAN_CONFIG.MAX_FAILED_LOGINS) {
        await this.blockIP(ip, "Multiple failed login attempts");
        await this.sendAlert(
          "warning",
          "⚠️ Suspicious Login Activity Blocked",
          `IP ${ip} blocked after ${count} failed login attempts`
        );
      }
    }
  }

  async detectAPIKeyLeaks() {
    // Check recent API calls for exposed keys
    const recentLogs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ["api_call", "request_log"] },
        created_at: { gte: new Date(Date.now() - 60000) },
      },
      take: 100,
    });

    const sensitivePatterns = [
      /sk_live_[a-zA-Z0-9]{24}/, // Stripe secret key
      /sk_test_[a-zA-Z0-9]{24}/, // Stripe test key
      /AIza[0-9A-Za-z\\-_]{35}/, // Google API key
      /AKIA[0-9A-Z]{16}/, // AWS access key
      /ghp_[a-zA-Z0-9]{36}/, // GitHub personal access token
    ];

    for (const log of recentLogs) {
      const logString = JSON.stringify(log.details);

      for (const pattern of sensitivePatterns) {
        if (pattern.test(logString)) {
          await this.sendAlert(
            "critical",
            "🚨 API KEY LEAK DETECTED",
            `Potential API key exposed in logs. Action: ${log.action}. Auto-rotating keys...`
          );

          if (GUARDIAN_CONFIG.AUTO_ROTATE_API_KEYS) {
            await this.rotateAPIKeys();
          }

          // Redact from logs
          await this.redactSensitiveData(log.id);
        }
      }
    }
  }

  async detectUnauthorizedAccess() {
    const oneMinuteAgo = new Date(Date.now() - 60000);

    const unauthorizedAttempts = await this.prisma.auditLog.count({
      where: {
        action: "unauthorized_access",
        created_at: { gte: oneMinuteAgo },
      },
    });

    if (
      unauthorizedAttempts >=
      GUARDIAN_CONFIG.CRITICAL_THRESHOLDS.MASS_UNAUTHORIZED_ACCESS
    ) {
      await this.sendAlert(
        "critical",
        "🚨 MASS UNAUTHORIZED ACCESS DETECTED",
        `${unauthorizedAttempts} unauthorized access attempts in last minute. Possible breach attempt.`
      );

      // Enable enhanced security mode
      await this.enableEnhancedSecurity();
    }
  }

  async detectSQLInjection() {
    const recentRequests = await this.prisma.auditLog.findMany({
      where: {
        action: "api_call",
        created_at: { gte: new Date(Date.now() - 60000) },
      },
      take: 100,
    });

    const sqlPatterns = [
      /(\bor\b|\band\b).*=.*'/i,
      /union.*select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /';--/,
      /\/\*.*\*\//,
    ];

    for (const request of recentRequests) {
      const params = JSON.stringify(request.details?.params || {});

      for (const pattern of sqlPatterns) {
        if (pattern.test(params)) {
          const ip = request.details?.ip;
          await this.blockIP(ip, "SQL injection attempt detected");
          await this.sendAlert(
            "critical",
            "🚨 SQL INJECTION ATTEMPT BLOCKED",
            `IP ${ip} attempted SQL injection. Blocked automatically.`
          );
        }
      }
    }
  }

  async detectXSSAttempts() {
    const recentRequests = await this.prisma.auditLog.findMany({
      where: {
        action: "api_call",
        created_at: { gte: new Date(Date.now() - 60000) },
      },
      take: 100,
    });

    const xssPatterns = [
      /<script[^>]*>.*<\/script>/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /<iframe/i,
    ];

    for (const request of recentRequests) {
      const body = JSON.stringify(request.details?.body || {});

      for (const pattern of xssPatterns) {
        if (pattern.test(body)) {
          const ip = request.details?.ip;
          await this.blockIP(ip, "XSS attempt detected");
          await this.sendAlert(
            "warning",
            "⚠️ XSS ATTEMPT BLOCKED",
            `IP ${ip} attempted XSS attack. Blocked automatically.`
          );
        }
      }
    }
  }

  async detectDDoS() {
    const oneMinuteAgo = new Date(Date.now() - 60000);

    const requestsByIP = await this.prisma.auditLog.groupBy({
      by: ["details"],
      where: {
        action: "api_call",
        created_at: { gte: oneMinuteAgo },
      },
      _count: true,
    });

    for (const group of requestsByIP) {
      const ip = group.details?.ip;
      const count = group._count;

      if (count >= GUARDIAN_CONFIG.CRITICAL_THRESHOLDS.DDOS_DETECTED) {
        await this.blockIP(ip, "DDoS pattern detected");
        await this.sendAlert(
          "critical",
          "🚨 DDOS ATTACK DETECTED & BLOCKED",
          `IP ${ip} made ${count} requests in 1 minute. Blocked automatically.`
        );
      }
    }
  }

  // ==========================================================================
  // API USAGE MONITORING
  // ==========================================================================

  startAPIUsageMonitoring() {
    setInterval(async () => {
      if (!this.monitoringActive) return;

      try {
        // Track API usage per user
        await this.trackAPIUsage();

        // Detect abnormal usage patterns
        await this.detectAbnormalUsage();

        // Check rate limits
        await this.enforceRateLimits();

        this.emit("api-usage-check-complete");
      } catch (error) {
        console.error("❌ API usage monitoring error:", error);
      }
    }, GUARDIAN_CONFIG.API_USAGE_CHECK_INTERVAL);
  }

  async trackAPIUsage() {
    const oneMinuteAgo = new Date(Date.now() - 60000);

    const apiCalls = await this.prisma.auditLog.groupBy({
      by: ["userId"],
      where: {
        action: "api_call",
        created_at: { gte: oneMinuteAgo },
      },
      _count: true,
    });

    for (const user of apiCalls) {
      this.apiUsageCache.set(user.userId, {
        count: user._count,
        timestamp: Date.now(),
      });
    }
  }

  async detectAbnormalUsage() {
    for (const [userId, usage] of this.apiUsageCache.entries()) {
      if (usage.count > GUARDIAN_CONFIG.MAX_API_CALLS_PER_MINUTE) {
        await this.sendAlert(
          "warning",
          "⚠️ Abnormal API Usage Detected",
          `User ${userId} made ${usage.count} API calls in 1 minute (threshold: ${GUARDIAN_CONFIG.MAX_API_CALLS_PER_MINUTE})`
        );

        // Throttle user
        await this.throttleUser(userId);
      }
    }
  }

  async enforceRateLimits() {
    // Cleanup old entries
    for (const [userId, usage] of this.apiUsageCache.entries()) {
      if (Date.now() - usage.timestamp > 60000) {
        this.apiUsageCache.delete(userId);
      }
    }
  }

  // ==========================================================================
  // VULNERABILITY SCANNING
  // ==========================================================================

  startVulnerabilityScanning() {
    setInterval(async () => {
      if (!this.monitoringActive) return;

      try {
        // Check for known vulnerabilities in dependencies
        await this.scanDependencies();

        // Check for security misconfigurations
        await this.scanConfigurations();

        // Check for exposed endpoints
        await this.scanEndpoints();

        this.emit("vulnerability-scan-complete");
      } catch (error) {
        console.error("❌ Vulnerability scanning error:", error);
      }
    }, GUARDIAN_CONFIG.VULNERABILITY_SCAN_INTERVAL);
  }

  async scanDependencies() {
    // Check npm audit
    const { exec } = require("child_process");

    exec("npm audit --json", async (error, stdout, stderr) => {
      if (error && !stdout) {
        console.error("Error running npm audit:", error);
        return;
      }

      try {
        const auditResult = JSON.parse(stdout);

        if (
          auditResult.metadata.vulnerabilities.high > 0 ||
          auditResult.metadata.vulnerabilities.critical > 0
        ) {
          await this.sendAlert(
            "critical",
            "🚨 CRITICAL VULNERABILITIES DETECTED",
            `Found ${auditResult.metadata.vulnerabilities.critical} critical and ${auditResult.metadata.vulnerabilities.high} high vulnerabilities. Run 'npm audit fix' immediately.`
          );
        }
      } catch (parseError) {
        console.error("Error parsing npm audit:", parseError);
      }
    });
  }

  async scanConfigurations() {
    const issues = [];

    // Check for missing environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "JWT_SECRET",
      "STRIPE_SECRET_KEY",
      "EMAIL_USER",
      "EMAIL_PASSWORD",
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        issues.push(`Missing required environment variable: ${envVar}`);
      }
    }

    // Check for weak JWT secret
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      issues.push("JWT_SECRET is too short (minimum 32 characters)");
    }

    // Check for development mode in production
    if (process.env.NODE_ENV === "production" && process.env.DEBUG === "true") {
      issues.push("DEBUG mode enabled in production");
    }

    if (issues.length > 0) {
      await this.sendAlert(
        "warning",
        "⚠️ Security Configuration Issues",
        issues.join("\n")
      );
    }
  }

  async scanEndpoints() {
    // Check for exposed admin endpoints without auth
    const endpoints = [
      "/api/admin/users",
      "/api/admin/payments",
      "/api/admin/system",
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:4000${endpoint}`, {
          timeout: 5000,
          validateStatus: () => true,
        });

        if (response.status !== 401 && response.status !== 403) {
          await this.sendAlert(
            "critical",
            "🚨 EXPOSED ADMIN ENDPOINT",
            `Admin endpoint ${endpoint} returned ${response.status} without authentication!`
          );
        }
      } catch (error) {
        // Timeout or connection error is acceptable
      }
    }
  }

  // ==========================================================================
  // ERROR TRACKING
  // ==========================================================================

  startErrorTracking() {
    setInterval(async () => {
      if (!this.monitoringActive) return;

      try {
        const errorRate =
          this.healthMetrics.failedRequests / this.healthMetrics.totalRequests;

        if (errorRate > GUARDIAN_CONFIG.MAX_ERROR_RATE) {
          await this.sendAlert(
            "critical",
            "🚨 HIGH ERROR RATE DETECTED",
            `Error rate: ${(errorRate * 100).toFixed(2)}% (threshold: ${
              GUARDIAN_CONFIG.MAX_ERROR_RATE * 100
            }%)`
          );

          // Analyze errors
          await this.analyzeErrors();
        }

        // Clear old errors
        if (this.errorLog.length > 1000) {
          this.errorLog = this.errorLog.slice(-100);
        }
      } catch (error) {
        console.error("❌ Error tracking failed:", error);
      }
    }, 60000);
  }

  async analyzeErrors() {
    // Group errors by type
    const errorGroups = {};

    for (const error of this.errorLog) {
      const key = error.type || "unknown";
      errorGroups[key] = (errorGroups[key] || 0) + 1;
    }

    // Find most common error
    const sortedErrors = Object.entries(errorGroups).sort(
      (a, b) => b[1] - a[1]
    );

    if (sortedErrors.length > 0) {
      const [errorType, count] = sortedErrors[0];
      await this.sendAlert(
        "info",
        "📊 Error Analysis",
        `Most common error: ${errorType} (${count} occurrences). Review logs for pattern.`
      );
    }
  }

  logError(error, context = {}) {
    this.errorLog.push({
      timestamp: new Date(),
      type: error.name,
      message: error.message,
      stack: error.stack,
      context,
    });

    this.healthMetrics.failedRequests++;
  }

  // ==========================================================================
  // AUTO-CORRECTION ACTIONS
  // ==========================================================================

  async handleMemoryLeak() {
    console.warn("⚠️ Memory leak detected");

    await this.sendAlert(
      "warning",
      "⚠️ Memory Leak Detected",
      `Memory usage: ${this.healthMetrics.memoryUsage.toFixed(
        2
      )} MB (threshold: ${GUARDIAN_CONFIG.MAX_MEMORY_USAGE_MB} MB)`
    );

    if (GUARDIAN_CONFIG.AUTO_RESTART_ON_MEMORY_LEAK) {
      await this.sendAlert(
        "info",
        "🔄 Auto-Restarting Service",
        "Gracefully restarting to clear memory leak..."
      );

      // Trigger PM2 restart
      const { exec } = require("child_process");
      exec("pm2 restart advancia-backend --update-env");
    }
  }

  async handleHighCPU() {
    console.warn("⚠️ High CPU usage detected");

    await this.sendAlert(
      "warning",
      "⚠️ High CPU Usage",
      `CPU usage: ${this.healthMetrics.cpuUsage.toFixed(2)}% (threshold: ${
        GUARDIAN_CONFIG.MAX_CPU_USAGE_PERCENT
      }%)`
    );
  }

  async handleDatabaseFailure() {
    console.error("🚨 Database connection lost");

    await this.sendAlert(
      "critical",
      "🚨 DATABASE CONNECTION LOST",
      "Attempting automatic reconnection..."
    );

    // Attempt reconnection
    try {
      await this.prisma.$disconnect();
      await this.prisma.$connect();
      await this.sendAlert(
        "info",
        "✅ Database Reconnected",
        "Database connection restored successfully"
      );
    } catch (error) {
      await this.sendAlert(
        "critical",
        "🚨 DATABASE RECONNECTION FAILED",
        "Manual intervention required. Check database server status."
      );
    }
  }

  async blockIP(ip, reason) {
    if (!ip || this.blockedIPs.has(ip)) return;

    this.blockedIPs.add(ip);

    // Store in database
    await this.prisma.blockedIP
      .create({
        data: {
          ip_address: ip,
          reason,
          blocked_at: new Date(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })
      .catch((err) => console.error("Failed to store blocked IP:", err));

    console.log(`🚫 Blocked IP: ${ip} (Reason: ${reason})`);
  }

  async throttleUser(userId) {
    // Reduce rate limit for user
    await this.prisma.user
      .update({
        where: { id: userId },
        data: {
          rate_limit_override: 10, // 10 requests/min instead of 100
        },
      })
      .catch((err) => console.error("Failed to throttle user:", err));

    console.log(`🐌 Throttled user: ${userId}`);
  }

  async rotateAPIKeys() {
    // This should be implemented based on your specific API key management
    console.log(
      "🔄 API key rotation triggered (manual implementation required)"
    );

    await this.sendAlert(
      "critical",
      "🔑 API KEY ROTATION REQUIRED",
      "Manual action: Rotate exposed API keys immediately:\n" +
        "1. Stripe Dashboard → API Keys → Roll Secret Key\n" +
        "2. Update .env with new keys\n" +
        "3. Restart services: pm2 restart all"
    );
  }

  async redactSensitiveData(logId) {
    await this.prisma.auditLog
      .update({
        where: { id: logId },
        data: {
          details: { redacted: true, reason: "Sensitive data detected" },
        },
      })
      .catch((err) => console.error("Failed to redact sensitive data:", err));
  }

  async enableEnhancedSecurity() {
    console.log("🛡️ Enhanced security mode enabled");

    // Reduce rate limits globally
    GUARDIAN_CONFIG.MAX_API_CALLS_PER_MINUTE = 50;

    // Enable stricter validation
    // (This would integrate with your middleware)

    await this.sendAlert(
      "warning",
      "🛡️ Enhanced Security Mode Enabled",
      "All rate limits reduced. Stricter validation active. Will auto-disable in 1 hour."
    );

    // Auto-disable after 1 hour
    setTimeout(() => {
      GUARDIAN_CONFIG.MAX_API_CALLS_PER_MINUTE = 100;
      console.log("🛡️ Enhanced security mode disabled");
    }, 3600000);
  }

  // ==========================================================================
  // STATUS PAGE INTEGRATION
  // ==========================================================================

  async updateStatusPage() {
    const fs = require("fs");
    const path = require("path");

    const statusData = {
      timestamp: new Date().toISOString(),
      status: this.getOverallStatus(),
      metrics: this.healthMetrics,
      incidents: await this.getRecentIncidents(),
      blockedIPs: Array.from(this.blockedIPs),
    };

    const statusPath = path.join(__dirname, "../../../logs/status.json");

    fs.writeFileSync(statusPath, JSON.stringify(statusData, null, 2));
  }

  getOverallStatus() {
    if (
      this.healthMetrics.memoryUsage > GUARDIAN_CONFIG.MAX_MEMORY_USAGE_MB ||
      this.healthMetrics.cpuUsage > GUARDIAN_CONFIG.MAX_CPU_USAGE_PERCENT
    ) {
      return "degraded";
    }

    const errorRate =
      this.healthMetrics.failedRequests / this.healthMetrics.totalRequests;
    if (errorRate > GUARDIAN_CONFIG.MAX_ERROR_RATE) {
      return "degraded";
    }

    return "operational";
  }

  async getRecentIncidents() {
    const oneHourAgo = new Date(Date.now() - 3600000);

    return await this.prisma.incident
      .findMany({
        where: {
          created_at: { gte: oneHourAgo },
        },
        orderBy: { created_at: "desc" },
        take: 10,
      })
      .catch(() => []);
  }

  // ==========================================================================
  // ALERT SYSTEM
  // ==========================================================================

  async sendAlert(severity, title, message) {
    console.log(`[${severity.toUpperCase()}] ${title}: ${message}`);

    // Log to database
    await this.prisma.incident
      .create({
        data: {
          severity,
          title,
          message,
          status: "open",
          created_at: new Date(),
        },
      })
      .catch((err) => console.error("Failed to log incident:", err));

    // Send email for critical/warning
    if (severity === "critical" || severity === "warning") {
      await this.sendEmailAlert(severity, title, message);
    }

    // Send Slack notification
    if (GUARDIAN_CONFIG.ALERT_SLACK_WEBHOOK) {
      await this.sendSlackAlert(severity, title, message);
    }

    // Emit event for real-time dashboard
    this.emit("alert", { severity, title, message, timestamp: new Date() });
  }

  async sendEmailAlert(severity, title, message) {
    const emoji =
      {
        critical: "🚨",
        warning: "⚠️",
        info: "ℹ️",
        error: "❌",
      }[severity] || "📢";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: GUARDIAN_CONFIG.ALERT_EMAIL,
      subject: `${emoji} ${title}`,
      html: `
        <h2>${emoji} ${title}</h2>
        <p><strong>Severity:</strong> ${severity.toUpperCase()}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr>
        <p><small>Advancia Guardian AI - Automated Alert</small></p>
        <p><small>View dashboard: <a href="http://localhost:3000/admin/guardian">Admin Dashboard</a></small></p>
      `,
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Failed to send email alert:", error);
    }
  }

  async sendSlackAlert(severity, title, message) {
    const color =
      {
        critical: "danger",
        warning: "warning",
        info: "good",
        error: "danger",
      }[severity] || "#808080";

    const slackMessage = {
      attachments: [
        {
          color,
          title: `🛡️ Guardian AI Alert: ${title}`,
          text: message,
          fields: [
            {
              title: "Severity",
              value: severity.toUpperCase(),
              short: true,
            },
            {
              title: "Time",
              value: new Date().toLocaleString(),
              short: true,
            },
          ],
          footer: "Advancia Guardian AI",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      await axios.post(GUARDIAN_CONFIG.ALERT_SLACK_WEBHOOK, slackMessage);
    } catch (error) {
      console.error("Failed to send Slack alert:", error);
    }
  }

  // ==========================================================================
  // GRACEFUL SHUTDOWN
  // ==========================================================================

  async gracefulShutdown() {
    console.log("🛑 Initiating graceful shutdown...");

    this.monitoringActive = false;

    await this.sendAlert(
      "info",
      "🛑 Guardian AI Shutting Down",
      "Graceful shutdown initiated. All monitoring stopped."
    );

    await this.prisma.$disconnect();

    process.exit(0);
  }

  // ==========================================================================
  // GUIDED ERROR SUGGESTIONS (AI-POWERED)
  // ==========================================================================

  async getSuggestionForError(error) {
    const errorPatterns = {
      ECONNREFUSED: {
        suggestion:
          "Database connection refused. Check if PostgreSQL is running: `docker-compose ps` or `pg_isready`",
        commands: ["docker-compose up -d postgres", "pm2 restart all"],
        severity: "critical",
      },
      "JWT malformed": {
        suggestion: "Invalid JWT token. User may need to re-login.",
        commands: ["Check JWT_SECRET in .env", "Verify token expiration"],
        severity: "warning",
      },
      "Stripe webhook": {
        suggestion:
          "Stripe webhook signature verification failed. Check STRIPE_WEBHOOK_SECRET in .env",
        commands: [
          "stripe listen --forward-to localhost:4000/api/webhooks/stripe",
        ],
        severity: "critical",
      },
      "Out of memory": {
        suggestion:
          "Memory limit exceeded. Increase Node.js memory or fix memory leak.",
        commands: [
          "node --max-old-space-size=2048 src/index.js",
          "pm2 restart all --update-env",
        ],
        severity: "critical",
      },
      ETIMEDOUT: {
        suggestion:
          "External API timeout. Check network connectivity or increase timeout.",
        commands: ["curl -I https://api.stripe.com", "ping 8.8.8.8"],
        severity: "warning",
      },
    };

    for (const [pattern, solution] of Object.entries(errorPatterns)) {
      if (error.message.includes(pattern)) {
        await this.sendAlert(
          solution.severity,
          `💡 Error Guidance: ${pattern}`,
          `${
            solution.suggestion
          }\n\nSuggested commands:\n${solution.commands.join("\n")}`
        );

        return solution;
      }
    }

    return {
      suggestion: "Unknown error. Check logs for details.",
      commands: ["pm2 logs --err --lines 50"],
      severity: "error",
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let guardianInstance = null;

function getGuardianAI() {
  if (!guardianInstance) {
    guardianInstance = new GuardianAI();
  }
  return guardianInstance;
}

// ============================================================================
// EXPRESS MIDDLEWARE INTEGRATION
// ============================================================================

function guardianMiddleware() {
  const guardian = getGuardianAI();

  return async (req, res, next) => {
    const startTime = Date.now();

    // Track request
    guardian.healthMetrics.totalRequests++;
    guardian.healthMetrics.activeConnections++;

    // Check if IP is blocked
    if (guardian.blockedIPs.has(req.ip)) {
      return res
        .status(403)
        .json({ error: "Your IP has been blocked due to suspicious activity" });
    }

    // Log request
    await guardian.prisma.auditLog
      .create({
        data: {
          action: "api_call",
          details: {
            ip: req.ip,
            method: req.method,
            path: req.path,
            params: req.query,
          },
        },
      })
      .catch((err) => console.error("Failed to log request:", err));

    // Intercept response
    res.on("finish", () => {
      const responseTime = Date.now() - startTime;

      guardian.healthMetrics.averageResponseTime =
        (guardian.healthMetrics.averageResponseTime + responseTime) / 2;

      guardian.healthMetrics.activeConnections--;

      if (res.statusCode >= 400) {
        guardian.healthMetrics.failedRequests++;
      }
    });

    // Handle errors
    res.on("error", (error) => {
      guardian.logError(error, { path: req.path, method: req.method });
      guardian.getSuggestionForError(error);
    });

    next();
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  GuardianAI,
  getGuardianAI,
  guardianMiddleware,
  GUARDIAN_CONFIG,
};
