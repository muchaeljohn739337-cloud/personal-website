/**
 * Cloudflare Integration Middleware
 * Handles Cloudflare proxy headers, real IP detection, and security
 */

import { NextFunction, Request, Response } from "express";

// Cloudflare IP ranges (should be updated periodically)
// https://www.cloudflare.com/ips/
const CLOUDFLARE_IPV4_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];

const CLOUDFLARE_IPV6_RANGES = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

/**
 * Check if IP is within a CIDR range
 */
function ipInRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  return (ip2int(ip) & mask) === (ip2int(range) & mask);
}

function ip2int(ip: string): number {
  return ip.split(".").reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * Extract real client IP from Cloudflare headers
 */
export function getRealIP(req: Request): string {
  // Cloudflare passes the original IP in CF-Connecting-IP header
  const cfIP = req.headers["cf-connecting-ip"] as string;
  if (cfIP) {
    return cfIP;
  }

  // Fallback to X-Forwarded-For
  const xForwardedFor = req.headers["x-forwarded-for"] as string;
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Fallback to X-Real-IP
  const xRealIP = req.headers["x-real-ip"] as string;
  if (xRealIP) {
    return xRealIP;
  }

  // Finally use socket IP
  return req.socket.remoteAddress || "unknown";
}

/**
 * Verify request is coming from Cloudflare
 */
export function isFromCloudflare(ip: string): boolean {
  // Check IPv4 ranges
  for (const range of CLOUDFLARE_IPV4_RANGES) {
    try {
      if (ipInRange(ip, range)) {
        return true;
      }
    } catch (e) {
      // Skip invalid IPs
    }
  }

  // Check IPv6 ranges (basic check)
  if (ip.includes(":")) {
    for (const range of CLOUDFLARE_IPV6_RANGES) {
      if (ip.startsWith(range.split("::")[0])) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Cloudflare middleware - extracts real IP and adds Cloudflare metadata
 */
export function cloudflareMiddleware(req: Request, res: Response, next: NextFunction) {
  // Extract real client IP
  const realIP = getRealIP(req);
  req.clientIP = realIP;

  // Add Cloudflare metadata
  req.cloudflare = {
    ray: req.headers["cf-ray"] as string,
    country: req.headers["cf-ipcountry"] as string,
    connectingIP: req.headers["cf-connecting-ip"] as string,
    visitor: req.headers["cf-visitor"] as string,
    isFromCF: isFromCloudflare(req.socket.remoteAddress || ""),
  };

  // Log Cloudflare request for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Cloudflare] Request from ${realIP} | Ray: ${req.cloudflare.ray} | Country: ${req.cloudflare.country}`
    );
  }

  next();
}

/**
 * Enforce Cloudflare-only access (block direct IP access)
 */
export function cloudflareOnlyMiddleware(req: Request, res: Response, next: NextFunction) {
  const socketIP = req.socket.remoteAddress || "";

  if (!isFromCloudflare(socketIP)) {
    console.warn(`[Security] Direct IP access blocked: ${socketIP}`);
    return res.status(403).json({
      error: "Access Denied",
      message: "Direct IP access is not allowed. Please use the domain.",
      ray: req.cloudflare?.ray,
    });
  }

  next();
}

/**
 * Rate limiting with Cloudflare metadata
 */
export function cloudflareRateLimit(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.clientIP || getRealIP(req);
  const ray = req.cloudflare?.ray || "unknown";

  // Add rate limit headers
  res.setHeader("X-RateLimit-IP", clientIP);
  res.setHeader("CF-RAY", ray);

  // Rate limiting logic would go here (use express-rate-limit or custom)
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      clientIP?: string;
      cloudflare?: {
        ray?: string;
        country?: string;
        connectingIP?: string;
        visitor?: string;
        isFromCF?: boolean;
      };
    }
  }
}

export default {
  cloudflareMiddleware,
  cloudflareOnlyMiddleware,
  cloudflareRateLimit,
  getRealIP,
  isFromCloudflare,
};
