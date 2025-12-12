import crypto from "crypto";
import { Router } from "express";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";

const router = Router();

/**
 * TOTP/2FA Management Routes
 * Implements RFC 6238 Time-Based One-Time Password
 */

// ============================================
// SETUP TOTP (Generate Secret & QR Code)
// ============================================
router.post("/setup", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, totpEnabled: true, totpSecret: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.totpEnabled) {
      return res.status(400).json({ 
        error: "TOTP already enabled",
        message: "Disable TOTP first before setting up again"
      });
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      name: `Advancia Pay (${user.email})`,
      issuer: "Advancia Pay Ledger",
      length: 32,
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Store secret (encrypted in production - add encryption later)
    await prisma.users.update({
      where: { id: userId },
      data: {
        totpSecret: secret.base32,
        totpEnabled: false, // Not enabled until verified
        totpVerified: false,
      },
    });

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url!);

    return res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      backupCodes, // Store these securely client-side
      manualEntry: secret.base32,
      message: "Scan QR code with authenticator app, then verify with a code",
    });
  } catch (error) {
    console.error("TOTP setup error:", error);
    return res.status(500).json({ error: "Failed to setup TOTP" });
  }
});

// ============================================
// VERIFY TOTP (Enable After Verification)
// ============================================
router.post("/verify", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "TOTP token required" });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true },
    });

    if (!user || !user.totpSecret) {
      return res.status(400).json({ error: "TOTP not set up" });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps (±60 seconds)
    });

    if (!verified) {
      return res.status(401).json({ 
        error: "Invalid TOTP code",
        message: "Code may have expired. Try a new code."
      });
    }

    // Enable TOTP
    await prisma.users.update({
      where: { id: userId },
      data: {
        totpEnabled: true,
        totpVerified: true,
      },
    });

    // Log security event
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "TOTP_ENABLED",
        resourceType: "AUTH",
        resourceId: userId,
        userId,
        metadata: { method: "totp" } as any,
        severity: "MEDIUM",
        ipAddress: req.ip || "unknown",
        userAgent: req.get("user-agent") || "unknown",
      },
    });

    return res.json({
      success: true,
      message: "TOTP enabled successfully",
    });
  } catch (error) {
    console.error("TOTP verify error:", error);
    return res.status(500).json({ error: "Failed to verify TOTP" });
  }
});

// ============================================
// VALIDATE TOTP (During Login)
// ============================================
router.post("/validate", async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "userId and token required" });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { totpSecret: true, totpEnabled: true, email: true },
    });

    if (!user || !user.totpSecret || !user.totpEnabled) {
      return res.status(400).json({ error: "TOTP not enabled for this user" });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) {
      // Log failed attempt
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: "TOTP_FAILED",
          resourceType: "AUTH",
          resourceId: userId,
          userId,
          metadata: { email: user.email } as any,
          severity: "HIGH",
          ipAddress: req.ip || "unknown",
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      return res.status(401).json({ 
        error: "Invalid TOTP code",
        message: "Incorrect code. Please try again or use a backup code."
      });
    }

    // Log successful validation
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "TOTP_VALIDATED",
        resourceType: "AUTH",
        resourceId: userId,
        userId,
        metadata: { email: user.email } as any,
        severity: "LOW",
        ipAddress: req.ip || "unknown",
        userAgent: req.get("user-agent") || "unknown",
      },
    });

    return res.json({
      success: true,
      message: "TOTP validated successfully",
    });
  } catch (error) {
    console.error("TOTP validate error:", error);
    return res.status(500).json({ error: "Failed to validate TOTP" });
  }
});

// ============================================
// DISABLE TOTP
// ============================================
router.post("/disable", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({ 
        error: "Password and TOTP token required to disable 2FA" 
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { passwordHash: true, totpSecret: true, totpEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify password
    const bcrypt = require("bcrypt");
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Verify TOTP token
    if (user.totpSecret && user.totpEnabled) {
      const verified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: "base32",
        token,
        window: 2,
      });

      if (!verified) {
        return res.status(401).json({ error: "Invalid TOTP code" });
      }
    }

    // Disable TOTP
    await prisma.users.update({
      where: { id: userId },
      data: {
        totpEnabled: false,
        totpVerified: false,
        totpSecret: null,
      },
    });

    // Log security event
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "TOTP_DISABLED",
        resourceType: "AUTH",
        resourceId: userId,
        userId,
        metadata: { method: "manual_disable" } as any,
        severity: "HIGH",
        ipAddress: req.ip || "unknown",
        userAgent: req.get("user-agent") || "unknown",
      },
    });

    return res.json({
      success: true,
      message: "TOTP disabled successfully",
    });
  } catch (error) {
    console.error("TOTP disable error:", error);
    return res.status(500).json({ error: "Failed to disable TOTP" });
  }
});

// ============================================
// GET TOTP STATUS
// ============================================
router.get("/status", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { totpEnabled: true, totpVerified: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      enabled: user.totpEnabled || false,
      verified: user.totpVerified || false,
    });
  } catch (error) {
    console.error("TOTP status error:", error);
    return res.status(500).json({ error: "Failed to get TOTP status" });
  }
});

export default router;
