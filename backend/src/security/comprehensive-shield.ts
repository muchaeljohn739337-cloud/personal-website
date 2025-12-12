import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { moderationService } from "../services/ModerationService";
import { siemIntegration } from "../services/SIEMIntegration";

const prisma = new PrismaClient();

interface ThreatEvent {
  id: string;
  timestamp: Date;
  ip: string;
  endpoint: string;
  method: string;
  threatType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  blocked: boolean;
  details: string;
}

interface SecurityMetrics {
  totalRequests: number;
  threatsDetected: number;
  threatsBlocked: number;
  averageThreatScore: number;
  lockdownActive: boolean;
  lastIncident?: ThreatEvent;
}

let threatDatabase: Map<string, ThreatEvent[]> = new Map();
let globalThreatScore = 0;
let lockdownMode = false;
let securityMetrics: SecurityMetrics = {
  totalRequests: 0,
  threatsDetected: 0,
  threatsBlocked: 0,
  averageThreatScore: 0,
  lockdownActive: false,
};

const ddosLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
  blockDuration: 300,
});

const bruteForceLimiter = new RateLimiterMemory({
  points: 5,
  duration: 900,
  blockDuration: 1800,
});

async function checkDDoS(req: Request): Promise<{ blocked: boolean; score: number; reason?: string }> {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  try {
    await ddosLimiter.consume(ip);
    return { blocked: false, score: 0 };
  } catch (error) {
    return { blocked: true, score: 30, reason: "DDoS detected: Rate limit exceeded" };
  }
}

async function checkBruteForce(req: Request): Promise<{ blocked: boolean; score: number; reason?: string }> {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const key = `${ip}:${req.path}`;
  if (!req.path.includes("login") && !req.path.includes("auth")) {
    return { blocked: false, score: 0 };
  }
  try {
    await bruteForceLimiter.consume(key);
    return { blocked: false, score: 0 };
  } catch (error) {
    return { blocked: true, score: 40, reason: "Brute force detected" };
  }
}

function checkMITM(req: Request): { blocked: boolean; score: number; reason?: string } {
  if (process.env.NODE_ENV === "production" && req.protocol !== "https") {
    return { blocked: true, score: 50, reason: "MITM risk: Unencrypted connection" };
  }
  return { blocked: false, score: 0 };
}

function checkSQLInjection(req: Request): { blocked: boolean; score: number; reason?: string } {
  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
  ];
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);
  for (const pattern of sqlPatterns) {
    if (pattern.test(checkString)) {
      return { blocked: true, score: 80, reason: "SQL injection detected" };
    }
  }
  return { blocked: false, score: 0 };
}

function checkXSS(req: Request): { blocked: boolean; score: number; reason?: string } {
  const xssPatterns = [
    /<script[^>]*>.*<\/script>/i,
    /<iframe[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<img[^>]*onerror/i,
  ];
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);
  for (const pattern of xssPatterns) {
    if (pattern.test(checkString)) {
      return { blocked: true, score: 70, reason: "XSS attack detected" };
    }
  }
  return { blocked: false, score: 0 };
}

function checkCSRF(req: Request): { blocked: boolean; score: number; reason?: string } {
  if (req.method === "GET") {
    return { blocked: false, score: 0 };
  }
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = ["http://localhost:4000", "http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean);
  if (origin && !allowedOrigins.some((allowed) => origin.startsWith(allowed as string))) {
    return { blocked: false, score: 20, reason: "CSRF warning" };
  }
  return { blocked: false, score: 0 };
}

function checkAuthAnomaly(req: Request): { blocked: boolean; score: number; reason?: string } {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (req.path.includes("/admin") && !token) {
    return { blocked: false, score: 15, reason: "Auth anomaly: Missing token" };
  }
  return { blocked: false, score: 0 };
}

async function checkModeration(req: Request): Promise<{ blocked: boolean; score: number; reason?: string }> {
  // Moderate request content (body, query, params)
  const requestContent = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  const result = await moderationService.moderate(requestContent, "input");

  if (result.violations.length === 0) {
    return { blocked: false, score: 0 };
  }

  // Calculate threat score from violations
  const threatScore = moderationService.calculateThreatScore(result.violations);

  // Build reason string
  const reasons = result.violations.map((v) => `${v.rule} (${v.severity})`).join(", ");

  // Check for lockdown triggers
  const hasLockdownTrigger = result.violations.some((v) => v.rule === "malware_patterns" && v.severity === "CRITICAL");

  if (hasLockdownTrigger) {
    console.error("[SHIELD] CRITICAL: Malware pattern detected, triggering lockdown!");
    // Lockdown will be triggered by score threshold
  }

  // Block if action is BLOCK
  const shouldBlock = result.action === "BLOCK";

  return {
    blocked: shouldBlock,
    score: threatScore,
    reason: `Moderation: ${reasons}`,
  };
}

function calculateThreatScore(checks: Array<{ blocked: boolean; score: number }>): number {
  return checks.reduce((total, check) => total + check.score, 0);
}

function assessThreatLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score >= 80) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

async function logThreatEvent(req: Request, threatScore: number, blocked: boolean, reasons: string[]): Promise<void> {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const severity = assessThreatLevel(threatScore);
  const event: ThreatEvent = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ip,
    endpoint: req.path,
    method: req.method,
    threatType: reasons.join("; "),
    severity,
    score: threatScore,
    blocked,
    details: JSON.stringify({ userAgent: req.headers["user-agent"], origin: req.headers.origin }),
  };
  if (!threatDatabase.has(ip)) {
    threatDatabase.set(ip, []);
  }
  threatDatabase.get(ip)?.push(event);
  globalThreatScore += threatScore;
  securityMetrics.totalRequests++;
  if (threatScore > 0) securityMetrics.threatsDetected++;
  if (blocked) securityMetrics.threatsBlocked++;
  securityMetrics.averageThreatScore = globalThreatScore / securityMetrics.totalRequests;
  securityMetrics.lastIncident = event;

  // Send threat event to SIEM for correlation and alerting
  siemIntegration
    .ingestThreatEvent({
      timestamp: event.timestamp.toISOString(),
      event_type: event.threatType,
      severity: event.severity,
      source_ip: ip,
      user_id: (req as any).user?.id,
      api_key: req.headers["x-api-key"] as string,
      threat_score: threatScore,
      details: JSON.parse(event.details),
      blocked,
      rule_triggered: reasons[0],
    })
    .catch((error) => {
      console.error("Failed to send threat event to SIEM:", error);
    });
  if (severity === "HIGH" || severity === "CRITICAL") {
    try {
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: "SECURITY_THREAT",
          resourceType: "SECURITY",
          resourceId: event.id,
          severity,
          userId: null,
          timestamp: new Date(),
          metadata: JSON.stringify(event),
          ipAddress: ip,
        },
      });
      console.log(`SHIELD ALERT [${severity}]: ${reasons.join(", ")} | IP: ${ip}`);
    } catch (error) {
      console.error("Failed to log threat:", error);
    }
  }
  if (globalThreatScore >= 100 && !lockdownMode) {
    await activateLockdown();
  }
}

async function activateLockdown(): Promise<void> {
  lockdownMode = true;
  securityMetrics.lockdownActive = true;
  console.log("SHIELD LOCKDOWN ACTIVATED");
  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "SYSTEM_LOCKDOWN",
        resourceType: "SYSTEM",
        resourceId: "shield-lockdown",
        severity: "CRITICAL",
        userId: null,
        timestamp: new Date(),
        metadata: JSON.stringify({ score: globalThreatScore }),
        ipAddress: "system",
      },
    });
  } catch (error) {
    console.error("Failed to log lockdown:", error);
  }
}

async function deactivateLockdown(): Promise<void> {
  lockdownMode = false;
  securityMetrics.lockdownActive = false;
  globalThreatScore = Math.floor(globalThreatScore * 0.5);
  console.log("SHIELD LOCKDOWN DEACTIVATED");
  try {
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "SYSTEM_RECOVERY",
        resourceType: "SYSTEM",
        resourceId: "shield-recovery",
        severity: "MEDIUM",
        userId: null,
        timestamp: new Date(),
        metadata: JSON.stringify({ remainingScore: globalThreatScore }),
        ipAddress: "system",
      },
    });
  } catch (error) {
    console.error("Failed to log recovery:", error);
  }
}

setInterval(() => {
  if (globalThreatScore > 0) {
    globalThreatScore = Math.max(0, globalThreatScore - 10);
    console.log(`SHIELD AUTO-HEAL: Threat score decayed to ${globalThreatScore}`);
    if (lockdownMode && globalThreatScore < 50) {
      deactivateLockdown();
    }
  }
}, 3600000);

export function activateShield() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Whitelist health check and dev endpoints
      if (req.path === "/health" || req.path === "/api/health" || 
          (process.env.NODE_ENV === "development" && req.path.includes("/dev/"))) {
        return next();
      }
      if (lockdownMode) {
        const token = req.headers.authorization?.replace("Bearer ", "");
        const isAdmin = token && (req as any).user?.role === "ADMIN";
        if (!isAdmin) {
          return res.status(503).json({
            error: "Service Temporarily Unavailable",
            message: "System is under maintenance.",
            code: "SHIELD_LOCKDOWN",
          });
        }
      }
      const checks = await Promise.all([
        checkDDoS(req),
        checkBruteForce(req),
        Promise.resolve(checkMITM(req)),
        Promise.resolve(checkSQLInjection(req)),
        Promise.resolve(checkXSS(req)),
        Promise.resolve(checkCSRF(req)),
        Promise.resolve(checkAuthAnomaly(req)),
        checkModeration(req),
      ]);
      const threatScore = calculateThreatScore(checks);
      const blocked = checks.some((check) => check.blocked);
      const reasons = checks.filter((check) => check.reason).map((check) => check.reason!);
      if (threatScore > 0) {
        await logThreatEvent(req, threatScore, blocked, reasons);
      }
      if (blocked) {
        return res.status(403).json({
          error: "Forbidden",
          message: "Security threat detected.",
          code: "SHIELD_BLOCKED",
          threatScore,
        });
      }
      next();
    } catch (error) {
      console.error("SHIELD error:", error);
      next();
    }
  };
}

export function getSecurityMetrics(): SecurityMetrics {
  return securityMetrics;
}

export function getThreatDatabase(): Map<string, ThreatEvent[]> {
  return threatDatabase;
}

export function getGlobalThreatScore(): number {
  return globalThreatScore;
}

export function isLockdownActive(): boolean {
  return lockdownMode;
}

export async function manualLockdown(): Promise<void> {
  await activateLockdown();
}

export async function manualRecovery(): Promise<void> {
  await deactivateLockdown();
}

export function resetThreatScore(): void {
  globalThreatScore = 0;
  console.log("SHIELD: Threat score reset");
}

export function clearThreatDatabase(): void {
  threatDatabase.clear();
  console.log("SHIELD: Database cleared");
}

export async function initializeShield(): Promise<void> {
  console.log("🛡️  [SHIELD] Initializing comprehensive security system...");

  // Initialize moderation service
  await moderationService.initialize();

  // Initialize SIEM integration
  await siemIntegration.initialize();

  console.log("✅ [SHIELD] All systems operational");
}

export { moderationService };
