import { Request } from "express";
import winston, { format } from "winston";
import { SENTRY_DSN } from "../config";
import prisma from "../prismaClient";

const { combine, timestamp, json, errors, prettyPrint } = winston.format;

// Create a Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    process.env.NODE_ENV === "development"
      ? format.combine(
          format.colorize(),
          format.printf(({ level, message, timestamp, ...meta }) => {
            return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""}`;
          })
        )
      : json()
  ),
  defaultMeta: { service: "modular-saas-backend" },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: "logs/exceptions.log",
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: "logs/rejections.log",
    }),
  ],
});

// Add Sentry for error tracking in production
if (process.env.NODE_ENV === "production" && SENTRY_DSN) {
  const Sentry = require("@sentry/node");

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });

  winstonLogger.on("error", (error) => {
    Sentry.captureException(error);
  });
}

/**
 * Backward compatible logger interface
 */
export const logger = {
  info: (message: string, metadata: any = {}) => {
    winstonLogger.info(message, metadata);
  },
  warn: (message: string, metadata: any = {}) => {
    winstonLogger.warn(message, metadata);
  },
  error: (message: string, error: any = {}) => {
    winstonLogger.error(message, { error });
  },
  debug: (message: string, metadata: any = {}) => {
    if (process.env.DEBUG) {
      winstonLogger.debug(message, metadata);
    }
  },
};

/**
 * Log admin login attempts for security auditing
 */
export async function logAdminLogin(
  req: Request,
  email: string,
  status: "SUCCESS" | "FAILED_PASSWORD" | "FAILED_OTP" | "OTP_SENT",
  phone?: string
): Promise<void> {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";
    const ipAddress = Array.isArray(ip) ? ip[0] : ip;

    // Log to database
    await prisma.admin_login_logs.create({
      data: {
        email,
        phone,
        status,
        ipAddress,
        userAgent,
      },
    });

    // Log to winston
    winstonLogger.info("Admin login attempt", {
      email,
      status,
      ipAddress,
      userAgent,
      tags: ["security", "authentication"],
    });
  } catch (error) {
    winstonLogger.error("Failed to log admin login attempt", { error });
    // Don't throw - logging shouldn't break the auth flow
  }
}
