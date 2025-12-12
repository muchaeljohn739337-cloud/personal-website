/**
 * IP Whitelist/Blacklist Middleware
 * Provides IP-based access control with database-backed lists
 * Auto-blocks suspicious IPs and enforces admin-defined rules
 */

import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const prisma = new PrismaClient();

// In-memory cache for performance (refreshed every 5 minutes)
let cachedWhitelist: Set<string> = new Set();
let cachedBlacklist: Set<string> = new Set();
let lastCacheRefresh = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * IP blocking reasons
 */
export enum BlockReason {
  MANUAL_BLOCK = "MANUAL_BLOCK",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  FAILED_AUTH_ATTEMPTS = "FAILED_AUTH_ATTEMPTS",
  SECRET_EXPOSURE_ATTEMPT = "SECRET_EXPOSURE_ATTEMPT",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
}

/**
 * Initialize IP whitelist/blacklist tables in database
 */
export async function initializeIPTables(): Promise<void> {
  try {
    // Check if tables exist, create if not
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ip_whitelist (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL UNIQUE,
        description TEXT,
        added_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS ip_blacklist (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL UNIQUE,
        reason VARCHAR(100),
        block_count INTEGER DEFAULT 1,
        added_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_ip_whitelist_address ON ip_whitelist(ip_address);
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_ip_blacklist_address ON ip_blacklist(ip_address);
    `);

    console.log("✅ IP whitelist/blacklist tables initialized");

    // Refresh cache
    await refreshIPCache();
  } catch (error) {
    console.error("Failed to initialize IP tables:", error);
    throw error;
  }
}

/**
 * Refresh in-memory IP cache from database
 */
async function refreshIPCache(): Promise<void> {
  try {
    // Load whitelist
    const whitelist = await prisma.$queryRawUnsafe<Array<{ ip_address: string }>>(
      `SELECT ip_address FROM ip_whitelist WHERE active = TRUE AND (expires_at IS NULL OR expires_at > NOW())`
    );

    cachedWhitelist = new Set(whitelist.map((row) => row.ip_address));

    // Load blacklist
    const blacklist = await prisma.$queryRawUnsafe<Array<{ ip_address: string }>>(
      `SELECT ip_address FROM ip_blacklist WHERE active = TRUE AND (expires_at IS NULL OR expires_at > NOW())`
    );

    cachedBlacklist = new Set(blacklist.map((row) => row.ip_address));

    lastCacheRefresh = Date.now();

    console.log(`🔄 IP cache refreshed: ${cachedWhitelist.size} whitelisted, ${cachedBlacklist.size} blacklisted`);
  } catch (error) {
    console.error("Failed to refresh IP cache:", error);
  }
}

/**
 * Check if cache needs refresh
 */
function shouldRefreshCache(): boolean {
  return Date.now() - lastCacheRefresh > CACHE_TTL;
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: Request): string {
  // Check for proxy headers
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor;
    return ips.split(",")[0].trim();
  }

  const xRealIP = req.headers["x-real-ip"];
  if (xRealIP) {
    return Array.isArray(xRealIP) ? xRealIP[0] : xRealIP;
  }

  return req.ip || req.connection.remoteAddress || "unknown";
}

/**
 * Check if IP is whitelisted
 */
async function isWhitelisted(ip: string): Promise<boolean> {
  if (shouldRefreshCache()) {
    await refreshIPCache();
  }

  return cachedWhitelist.has(ip);
}

/**
 * Check if IP is blacklisted
 */
async function isBlacklisted(ip: string): Promise<boolean> {
  if (shouldRefreshCache()) {
    await refreshIPCache();
  }

  return cachedBlacklist.has(ip);
}

/**
 * Add IP to blacklist
 */
export async function blockIP(
  ip: string,
  reason: BlockReason,
  expiresInHours?: number,
  addedByUserId?: number
): Promise<void> {
  try {
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null;

    await prisma.$executeRawUnsafe(
      `INSERT INTO ip_blacklist (ip_address, reason, added_by, expires_at) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (ip_address) 
       DO UPDATE SET block_count = ip_blacklist.block_count + 1, reason = $2`,
      ip,
      reason,
      addedByUserId,
      expiresAt
    );

    // Add to cache immediately
    cachedBlacklist.add(ip);

    console.log(`🚫 IP blocked: ${ip} (Reason: ${reason})`);

    // Log to audit trail
    await prisma.audit_logs.create({
      data: {
        userId: addedByUserId || null,
        action: "IP_BLOCKED",
        resourceType: "SECURITY",
        resourceId: ip,
        ipAddress: ip,
        metadata: {
          reason,
          expires_at: expiresAt,
          auto_blocked: !addedByUserId,
        } as any,
        severity: "HIGH",
      },
    });
  } catch (error) {
    console.error(`Failed to block IP ${ip}:`, error);
  }
}

/**
 * Add IP to whitelist
 */
export async function whitelistIP(
  ip: string,
  description: string,
  addedByUserId?: number,
  expiresInHours?: number
): Promise<void> {
  try {
    const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null;

    await prisma.$executeRawUnsafe(
      `INSERT INTO ip_whitelist (ip_address, description, added_by, expires_at) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (ip_address) DO UPDATE SET description = $2`,
      ip,
      description,
      addedByUserId,
      expiresAt
    );

    // Add to cache immediately
    cachedWhitelist.add(ip);

    // Remove from blacklist if present
    await prisma.$executeRawUnsafe(`UPDATE ip_blacklist SET active = FALSE WHERE ip_address = $1`, ip);
    cachedBlacklist.delete(ip);

    console.log(`✅ IP whitelisted: ${ip}`);
  } catch (error) {
    console.error(`Failed to whitelist IP ${ip}:`, error);
  }
}

/**
 * Remove IP from blacklist
 */
export async function unblockIP(ip: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`UPDATE ip_blacklist SET active = FALSE WHERE ip_address = $1`, ip);

    cachedBlacklist.delete(ip);
    console.log(`✅ IP unblocked: ${ip}`);
  } catch (error) {
    console.error(`Failed to unblock IP ${ip}:`, error);
  }
}

/**
 * Middleware to enforce IP whitelist/blacklist
 */
export function ipFilterMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIP = getClientIP(req);

  // Check blacklist first (most restrictive)
  isBlacklisted(clientIP)
    .then((blocked) => {
      if (blocked) {
        console.warn(`🚫 Blocked request from blacklisted IP: ${clientIP}`);

        // Log attempt
        prisma.audit_logs
          .create({
            data: {
              action: "BLOCKED_IP_ATTEMPT",
              resource_type: "SECURITY",
              resource_id: req.path,
              ip_address: clientIP,
              user_agent: req.get("user-agent") || "unknown",
              metadata: {
                method: req.method,
                path: req.path,
                blocked: true,
              } as any,
              severity: "HIGH",
            },
          })
          .catch((err) => console.error("Failed to log blocked IP attempt:", err));

        return res.status(403).json({
          error: "Access denied",
          message: "Your IP address has been blocked due to suspicious activity",
          code: "IP_BLOCKED",
        });
      }

      // If not blocked, continue
      next();
    })
    .catch((error) => {
      console.error("Error checking IP filter:", error);
      // On error, allow request but log the issue
      next();
    });
}

/**
 * Admin-only middleware to enforce whitelist (stricter mode)
 */
export function whitelistOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIP = getClientIP(req);

  isWhitelisted(clientIP)
    .then((allowed) => {
      if (!allowed) {
        console.warn(`⚠️ Non-whitelisted IP attempted access: ${clientIP}`);

        return res.status(403).json({
          error: "Access denied",
          message: "Only whitelisted IP addresses can access this resource",
          code: "IP_NOT_WHITELISTED",
        });
      }

      next();
    })
    .catch((error) => {
      console.error("Error checking whitelist:", error);
      // On error, deny access for security
      res.status(500).json({
        error: "Security check failed",
        code: "SECURITY_ERROR",
      });
    });
}

/**
 * Auto-block IP after repeated violations
 */
export async function checkAndAutoBlock(req: Request, violationType: BlockReason): Promise<boolean> {
  const clientIP = getClientIP(req);

  // Check violation count in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const violations = await prisma.audit_logs.count({
    where: {
      ipAddress: clientIP,
      createdAt: {
        gte: oneHourAgo,
      },
      severity: {
        in: ["HIGH", "CRITICAL"],
      },
    },
  });

  // Auto-block thresholds
  const thresholds: Record<BlockReason, number> = {
    [BlockReason.RATE_LIMIT_EXCEEDED]: 10,
    [BlockReason.FAILED_AUTH_ATTEMPTS]: 5,
    [BlockReason.SECRET_EXPOSURE_ATTEMPT]: 3,
    [BlockReason.SQL_INJECTION_ATTEMPT]: 1,
    [BlockReason.SUSPICIOUS_ACTIVITY]: 7,
    [BlockReason.MANUAL_BLOCK]: 1,
  };

  const threshold = thresholds[violationType] || 5;

  if (violations >= threshold) {
    await blockIP(clientIP, violationType, 24); // Block for 24 hours
    return true;
  }

  return false;
}

/**
 * Get IP statistics
 */
export async function getIPStats(ip: string): Promise<any> {
  const isWhite = await isWhitelisted(ip);
  const isBlack = await isBlacklisted(ip);

  const recentLogs = await prisma.audit_logs.findMany({
    where: {
      ipAddress: ip,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return {
    ip,
    whitelisted: isWhite,
    blacklisted: isBlack,
    recent_activity: recentLogs,
  };
}

export default {
  ipFilterMiddleware,
  whitelistOnlyMiddleware,
  initializeIPTables,
  blockIP,
  unblockIP,
  whitelistIP,
  checkAndAutoBlock,
  getIPStats,
};
