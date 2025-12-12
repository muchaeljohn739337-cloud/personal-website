import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../prismaClient";

export interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  type: string;
  active?: boolean;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token and check account status
 */
export const authenticateToken = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && typeof authHeader === "string" ? authHeader.split(" ")[1] : undefined;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
    
    // Check if account is active in database
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { active: true, role: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    if (user.active === false) {
      return res.status(403).json({ error: "Account disabled" });
    }
    
    // Update payload with fresh role from database
    payload.role = user.role;
    payload.active = user.active;
    
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const isAdmin = req.user.role === "ADMIN";

  if (!isAdmin) {
    return res.status(403).json({
      error: "Access denied: Admin privileges required",
      message: "You do not have permission to access this resource",
    });
  }

  next();
};

/**
 * Flexible role-based access middleware
 * Usage: allowRoles("ADMIN", "STAFF")
 */
export const allowRoles = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: `This resource requires one of the following roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Middleware to restrict regular users from backend access
 */
export const restrictBackendAccess = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  // Allow public routes
  const publicRoutes = ["/health", "/auth/send-otp", "/auth/verify-otp", "/auth/forgot-password", "/auth/reset-password"];
  if (publicRoutes.some((route) => req.path.startsWith(route))) {
    return next();
  }

  // Require authentication for all other routes
  const authHeader = req.headers["authorization"];
  const token = authHeader && typeof authHeader === "string" ? authHeader.split(" ")[1] : undefined;

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "Backend access requires authentication",
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JWTPayload;
    req.user = payload;

    // Admin routes require admin role
    if (req.path.startsWith("/admin")) {
      return requireAdmin(req, res, next);
    }

    // Regular authenticated users can proceed
    next();
  } catch (error) {
    return res.status(403).json({
      error: "Invalid token",
      message: "Your session has expired. Please login again.",
    });
  }
};

/**
 * Middleware to log admin actions
 */
export const logAdminAction = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  if (req.user) {
    console.log(`[ADMIN ACTION] ${req.method} ${req.path}`, {
      admin: req.user.email,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }
  next();
};
