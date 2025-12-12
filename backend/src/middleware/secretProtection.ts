/**
 * Secret Protection Middleware
 * Prevents accidental exposure of API keys, tokens, and sensitive data
 * Auto-corrects responses that contain secrets before sending to client
 */

import { NextFunction, Request, Response } from "express";

// Pattern matching for common secret formats
const SECRET_PATTERNS = [
  // OpenAI API keys
  /sk-[a-zA-Z0-9]{20,}/g,
  /sk-proj-[a-zA-Z0-9_]{20,}/g,

  // Stripe keys
  /sk_live_[a-zA-Z0-9]{24,}/g,
  /sk_test_[a-zA-Z0-9]{24,}/g,
  /pk_live_[a-zA-Z0-9]{24,}/g,
  /pk_test_[a-zA-Z0-9]{24,}/g,

  // Generic API keys
  /api[_-]?key[_-]?[a-zA-Z0-9]{20,}/gi,

  // JWT tokens (long base64 strings)
  /eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/g,

  // AWS keys
  /AKIA[0-9A-Z]{16}/g,

  // Private keys
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END (RSA |EC |OPENSSH )?PRIVATE KEY-----/g,

  // Email passwords and SMTP credentials
  /password["\s:=]+[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}/gi,

  // Database connection strings
  /postgres:\/\/[^:]+:[^@]+@[^\/]+\/[^\s"']+/gi,
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^\/]+/gi,

  // Discord/Slack webhooks
  /https:\/\/discord\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_-]+/g,
  /https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[a-zA-Z0-9]+/g,

  // SendGrid API keys
  /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,

  // Vault tokens
  /hvs\.[a-zA-Z0-9]{24,}/g,

  // GitHub tokens
  /gh[pousr]_[a-zA-Z0-9]{36,}/g,
];

// Known secrets from environment (loaded at startup)
const KNOWN_SECRETS = new Set<string>();

/**
 * Load known secrets from environment variables
 * Called once at application startup
 */
export function initializeSecretProtection(): void {
  const envVars = process.env;

  // Extract all secret-like environment variables
  const secretKeys = [
    "OPENAI_API_KEY",
    "COPILOT_OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "JWT_SECRET",
    "SENDGRID_API_KEY",
    "SMTP_PASS",
    "DATABASE_URL",
    "REDIS_URL",
    "DISCORD_WEBHOOK_URL",
    "SLACK_WEBHOOK_URL",
    "VAULT_TOKEN",
    "GITHUB_TOKEN",
  ];

  secretKeys.forEach((key) => {
    const value = envVars[key];
    if (value && value.length > 10) {
      KNOWN_SECRETS.add(value);

      // Also add partial matches (first 20 chars) for better detection
      if (value.length > 20) {
        KNOWN_SECRETS.add(value.substring(0, 20));
      }
    }
  });

  console.log(`🔒 Secret protection initialized with ${KNOWN_SECRETS.size} known secrets`);
}

/**
 * Replace secrets in text with redacted placeholders
 */
function redactSecrets(text: string): string {
  let redacted = text;

  // Replace known secrets
  KNOWN_SECRETS.forEach((secret) => {
    if (secret.length > 10) {
      // Create regex that matches the secret
      const secretRegex = new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const replacement = `[REDACTED_${secret.substring(0, 4).toUpperCase()}***]`;
      redacted = redacted.replace(secretRegex, replacement);
    }
  });

  // Replace pattern-matched secrets
  SECRET_PATTERNS.forEach((pattern) => {
    redacted = redacted.replace(pattern, (match) => {
      // Keep first few chars for debugging context
      const prefix = match.substring(0, Math.min(4, match.length));
      return `[REDACTED_${prefix}***]`;
    });
  });

  return redacted;
}

/**
 * Check if text contains any secrets
 */
function containsSecrets(text: string): boolean {
  // Check known secrets
  for (const secret of KNOWN_SECRETS) {
    if (text.includes(secret)) {
      return true;
    }
  }

  // Check patterns
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Middleware to intercept responses and redact secrets
 */
export function secretProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Store original json and send methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override json method
  res.json = function (body: any): Response {
    try {
      const bodyString = JSON.stringify(body);

      if (containsSecrets(bodyString)) {
        console.warn("⚠️ SECRET EXPOSURE DETECTED AND AUTO-CORRECTED in JSON response");
        console.warn(`Request: ${req.method} ${req.path}`);
        console.warn(`IP: ${req.ip}`);

        // Log to database for audit
        logSecretExposureAttempt(req, "json_response", bodyString);

        // Redact secrets from response
        const redactedString = redactSecrets(bodyString);
        const redactedBody = JSON.parse(redactedString);

        return originalJson(redactedBody);
      }
    } catch (error) {
      console.error("Error in secret protection middleware:", error);
    }

    return originalJson(body);
  };

  // Override send method
  res.send = function (body: any): Response {
    try {
      if (typeof body === "string" && containsSecrets(body)) {
        console.warn("⚠️ SECRET EXPOSURE DETECTED AND AUTO-CORRECTED in text response");
        console.warn(`Request: ${req.method} ${req.path}`);
        console.warn(`IP: ${req.ip}`);

        // Log to database for audit
        logSecretExposureAttempt(req, "text_response", body);

        // Redact secrets
        const redactedBody = redactSecrets(body);
        return originalSend(redactedBody);
      }
    } catch (error) {
      console.error("Error in secret protection middleware:", error);
    }

    return originalSend(body);
  };

  next();
}

/**
 * Log secret exposure attempts to database for audit
 */
async function logSecretExposureAttempt(req: Request, exposureType: string, content: string): Promise<void> {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    await prisma.audit_logs.create({
      data: {
        userId: (req as any).userId || null,
        action: "SECRET_EXPOSURE_PREVENTED",
        resourceType: "SECURITY",
        resourceId: req.path,
        ipAddress: req.ip || "unknown",
        userAgent: req.get("user-agent") || "unknown",
        metadata: {
          exposure_type: exposureType,
          method: req.method,
          path: req.path,
          content_preview: content.substring(0, 100), // Store preview only
          redacted: true,
          auto_corrected: true,
        } as any,
        severity: "CRITICAL",
      },
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed to log secret exposure attempt:", error);
  }
}

/**
 * Console log interceptor to prevent secrets in logs
 */
export function protectConsoleLogs(): void {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = function (...args: any[]) {
    const redactedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return redactSecrets(arg);
      }
      if (typeof arg === "object") {
        return redactSecrets(JSON.stringify(arg));
      }
      return arg;
    });
    originalLog.apply(console, redactedArgs);
  };

  console.error = function (...args: any[]) {
    const redactedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return redactSecrets(arg);
      }
      if (typeof arg === "object" && arg !== null) {
        return redactSecrets(JSON.stringify(arg));
      }
      return arg;
    });
    originalError.apply(console, redactedArgs);
  };

  console.warn = function (...args: any[]) {
    const redactedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return redactSecrets(arg);
      }
      if (typeof arg === "object" && arg !== null) {
        return redactSecrets(JSON.stringify(arg));
      }
      return arg;
    });
    originalWarn.apply(console, redactedArgs);
  };

  console.info = function (...args: any[]) {
    const redactedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return redactSecrets(arg);
      }
      if (typeof arg === "object" && arg !== null) {
        return redactSecrets(JSON.stringify(arg));
      }
      return arg;
    });
    originalInfo.apply(console, redactedArgs);
  };

  console.log("🔒 Console log protection enabled");
}

/**
 * Utility function to manually redact secrets from any text
 */
export function sanitizeText(text: string): string {
  return redactSecrets(text);
}

/**
 * Check if a value is a secret
 */
export function isSecret(value: string): boolean {
  return containsSecrets(value);
}

export default {
  secretProtectionMiddleware,
  initializeSecretProtection,
  protectConsoleLogs,
  sanitizeText,
  isSecret,
};
