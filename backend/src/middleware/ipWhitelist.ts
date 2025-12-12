/**
 * IP Whitelist Middleware
 * Restricts access to admin routes based on IP address
 */

import { NextFunction, Request, Response } from "express";
import { getRealIP } from "./cloudflare";

/**
 * Parse IP whitelist from environment variable
 */
function getWhitelistedIPs(): string[] {
  const whitelist = process.env.ADMIN_IP_WHITELIST || "";
  if (!whitelist) {
    return [];
  }
  return whitelist
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

/**
 * Check if IP matches whitelist (supports wildcards and CIDR)
 */
function isIPWhitelisted(clientIP: string, whitelist: string[]): boolean {
  if (whitelist.length === 0) {
    // No whitelist = allow all
    return true;
  }

  // Check exact matches
  if (whitelist.includes(clientIP)) {
    return true;
  }

  // Check wildcards (e.g., 192.168.1.*)
  for (const pattern of whitelist) {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
      if (regex.test(clientIP)) {
        return true;
      }
    }
  }

  // Check CIDR ranges (e.g., 192.168.1.0/24)
  for (const pattern of whitelist) {
    if (pattern.includes("/")) {
      if (ipInCIDR(clientIP, pattern)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if IP is in CIDR range
 */
function ipInCIDR(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    return (ip2int(ip) & mask) === (ip2int(range) & mask);
  } catch (e) {
    return false;
  }
}

function ip2int(ip: string): number {
  return ip.split(".").reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * IP Whitelist middleware for admin routes
 * Now supports JWT admin authentication for VPN/dynamic IP scenarios
 * Priority: JWT admin role > IP whitelist > deny
 */
export function ipWhitelistMiddleware(req: Request, res: Response, next: NextFunction) {
  const whitelist = getWhitelistedIPs();
  const clientIP = req.clientIP || getRealIP(req);

  // If no whitelist is configured, allow all (rely on JWT auth)
  if (whitelist.length === 0) {
    return next();
  }

  // Check if user is authenticated as admin via JWT (for VPN/dynamic IPs)
  const authHeader = req.headers["authorization"];
  const token = authHeader && typeof authHeader === "string" ? authHeader.split(" ")[1] : undefined;

  if (token) {
    try {
      const jwt = require("jsonwebtoken");
      const config = require("../config").config;
      const payload = jwt.verify(token, config.jwtSecret) as any;

      // Admin role bypasses IP whitelist
      if (payload.role === "ADMIN") {
        console.log(`[Security] Admin JWT authenticated (IP: ${clientIP}) | Path: ${req.path}`);
        (req as any).user = payload;
        return next();
      }
    } catch (error) {
      // Invalid token, fall through to IP check
    }
  }

  // Fall back to IP whitelist check
  if (!isIPWhitelisted(clientIP, whitelist)) {
    console.warn(`[Security] IP ${clientIP} blocked by whitelist | Ray: ${req.cloudflare?.ray} | Path: ${req.path}`);

    return res.status(403).json({
      error: "Access Denied",
      message: "Your IP address is not authorized to access this resource. Please authenticate with admin credentials.",
      ip: clientIP,
      ray: req.cloudflare?.ray,
      timestamp: new Date().toISOString(),
    });
  }

  // IP is whitelisted, allow access
  console.log(`[Security] IP ${clientIP} whitelisted | Path: ${req.path}`);
  next();
}

/**
 * Get current client IP (for debugging)
 */
export function getClientIPMiddleware(req: Request, res: Response, next: NextFunction) {
  req.clientIP = getRealIP(req);
  next();
}

/**
 * Express route to check current IP
 */
export function checkIPRoute(req: Request, res: Response) {
  const clientIP = req.clientIP || getRealIP(req);
  const whitelist = getWhitelistedIPs();
  const isWhitelisted = isIPWhitelisted(clientIP, whitelist);

  res.json({
    ip: clientIP,
    whitelisted: isWhitelisted,
    whitelist: whitelist.length > 0 ? whitelist : "No whitelist configured (all IPs allowed)",
    cloudflare: req.cloudflare,
    headers: {
      "cf-connecting-ip": req.headers["cf-connecting-ip"],
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
    },
  });
}

export default {
  ipWhitelistMiddleware,
  getClientIPMiddleware,
  checkIPRoute,
  getWhitelistedIPs,
  isIPWhitelisted,
};
