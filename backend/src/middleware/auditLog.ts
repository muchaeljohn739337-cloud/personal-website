import { NextFunction, Request, Response } from "express";
import prisma from "../prismaClient";

/**
 * Middleware to log admin actions to the audit log
 */
export async function logAdminAction(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user) {
      return next();
    }

    // Log the admin action
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        action: `${req.method} ${req.path}`,
        metadata: JSON.stringify({
          body: req.body,
          query: req.query,
          params: req.params,
        }),
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.get("user-agent") || "unknown",
      },
    });

    next();
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // Continue anyway - don't block the request
    next();
  }
}
