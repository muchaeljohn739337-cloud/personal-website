/**
 * Google OAuth Authentication Routes
 * Handles Google Sign-In flow for admin and regular users
 */

import crypto from "crypto";
import express, { Request, Response } from "express";
import {
  checkGoogleAuthRateLimit,
  exchangeCodeForTokens,
  findOrCreateGoogleUser,
  generateGoogleJWT,
  getGoogleAuthUrl,
  requireGoogleAuth,
  verifyGoogleToken,
} from "../middleware/googleAuth";
import prisma from "../prismaClient";

const router = express.Router();

/**
 * POST /api/auth/google/init
 * Initialize Google OAuth flow
 */
router.post("/init", async (req: Request, res: Response) => {
  try {
    const { type } = req.body; // 'admin' or 'user'
    const clientIP = req.ip || req.socket.remoteAddress || "unknown";

    // Rate limiting
    if (!checkGoogleAuthRateLimit(clientIP)) {
      return res.status(429).json({
        error: "Too many authentication attempts",
        message: "Please try again later",
      });
    }

    // Generate state token for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        type: type || "user",
        timestamp: Date.now(),
        nonce: Math.random().toString(36),
      })
    ).toString("base64");

    const authUrl = getGoogleAuthUrl(state);

    res.json({
      success: true,
      authUrl,
      state,
    });
  } catch (error: any) {
    console.error("[Google Auth] Init error:", error);
    res.status(500).json({
      error: "Failed to initialize authentication",
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback (Google sends GET request with query params)
 */
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;
    const clientIP = req.ip || req.socket.remoteAddress || "unknown";

    // Debug: Log what Google sent
    console.log("Google OAuth Callback received:", {
      hasCode: !!code,
      hasState: !!state,
      error,
      error_description,
      queryParams: req.query,
    });

    // If Google sent an error
    if (error) {
      return res.status(400).json({
        error: "Google OAuth error",
        details: error_description || error,
        message: "Authentication failed",
      });
    }

    if (!code) {
      return res.status(400).json({
        error: "Missing authorization code",
        debug: req.query, // Show what was actually received
      });
    }

    // Rate limiting
    if (!checkGoogleAuthRateLimit(clientIP)) {
      return res.status(429).json({
        error: "Too many authentication attempts",
        message: "Please try again later",
      });
    }

    // Verify state token
    let stateData: any = {};
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch (e) {
      return res.status(400).json({
        error: "Invalid state parameter",
      });
    }

    // Exchange code for tokens
    const { userInfo, accessToken, refreshToken, expiryDate } = await exchangeCodeForTokens(code);

    if (!userInfo || !userInfo.email_verified) {
      return res.status(400).json({
        error: "Email not verified",
        message: "Please verify your Google account email",
      });
    }

    // Check if this is an admin login
    const isAdmin = stateData.type === "admin";

    // Find or create user
    const user = await findOrCreateGoogleUser(userInfo, isAdmin);

    // Verify admin access if required
    if (isAdmin && user.role !== "ADMIN") {
      // Log unauthorized admin attempt
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: "GOOGLE_ADMIN_ACCESS_DENIED",
          resourceType: "AUTH",
          resourceId: user.id,
          userId: user.id,
          metadata: {
            email: user.email,
            googleId: userInfo.sub,
          } as any,
          severity: "HIGH",
          ipAddress: clientIP,
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      return res.status(403).json({
        error: "Access denied",
        message: "Admin access required",
      });
    }

    // Check if TOTP is enabled - require 2FA even for Google OAuth
    if (user.totpEnabled && user.totpVerified) {
      const jwt = require("jsonwebtoken");
      const config = require("../config").config;
      
      // Generate temporary token for TOTP verification
      const tempToken = jwt.sign(
        { userId: user.id, email: user.email, requireTotp: true, provider: "google" },
        config.jwtSecret,
        { expiresIn: "5m" }
      );

      return res.json({
        success: false,
        status: "totp_required",
        message: "TOTP verification required",
        tempToken,
        userId: user.id,
      });
    }

    // Generate JWT token
    const token = generateGoogleJWT(user);

    // Log successful authentication
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "GOOGLE_LOGIN_SUCCESS",
        resourceType: "AUTH",
        resourceId: user.id,
        userId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
          type: stateData.type,
        } as any,
        severity: "LOW",
        ipAddress: clientIP,
        userAgent: req.get("user-agent") || "unknown",
      },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error: any) {
    console.error("[Google Auth] Callback error:", error);
    res.status(500).json({
      error: "Authentication failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/google/verify
 * Verify Google ID token (for frontend-initiated auth)
 */
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { idToken, type } = req.body;
    const clientIP = req.ip || req.socket.remoteAddress || "unknown";

    if (!idToken) {
      return res.status(400).json({
        error: "Missing ID token",
      });
    }

    // Rate limiting
    if (!checkGoogleAuthRateLimit(clientIP)) {
      return res.status(429).json({
        error: "Too many authentication attempts",
        message: "Please try again later",
      });
    }

    // Verify Google token
    const userInfo = await verifyGoogleToken(idToken);

    if (!userInfo || !userInfo.email_verified) {
      return res.status(400).json({
        error: "Invalid or unverified token",
      });
    }

    const isAdmin = type === "admin";

    // Find or create user
    const user = await findOrCreateGoogleUser(userInfo, isAdmin);

    // Verify admin access if required
    if (isAdmin && user.role !== "ADMIN") {
      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          action: "GOOGLE_ADMIN_ACCESS_DENIED",
          resourceType: "AUTH",
          resourceId: user.id,
          userId: user.id,
          metadata: {
            email: user.email,
            googleId: userInfo.sub,
          } as any,
          severity: "HIGH",
          ipAddress: clientIP,
          userAgent: req.get("user-agent") || "unknown",
        },
      });

      return res.status(403).json({
        error: "Access denied",
        message: "Admin access required",
      });
    }

    // Generate JWT token
    const token = generateGoogleJWT(user);

    // Log successful authentication
    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: "GOOGLE_LOGIN_SUCCESS",
        resourceType: "AUTH",
        resourceId: user.id,
        userId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
          method: "id_token",
        } as any,
        severity: "LOW",
        ipAddress: clientIP,
        userAgent: req.get("user-agent") || "unknown",
      },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error: any) {
    console.error("[Google Auth] Verify error:", error);
    res.status(500).json({
      error: "Authentication failed",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/google/link
 * Link Google account to existing user account
 */
router.post("/link", requireGoogleAuth, async (req: any, res: Response) => {
  try {
    const { idToken } = req.body;
    const userId = req.user.userId;

    if (!idToken) {
      return res.status(400).json({
        error: "Missing ID token",
      });
    }

    // Verify Google token
    const userInfo = await verifyGoogleToken(idToken);

    if (!userInfo) {
      return res.status(400).json({
        error: "Invalid Google token",
      });
    }

    // Check if Google ID is already linked
    const existingUser = await prisma.users.findFirst({
      where: { googleId: userInfo.sub },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        error: "Google account already linked to another user",
      });
    }

    // Link Google account
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        googleId: userInfo.sub,
        profilePicture: userInfo.picture,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Google account linked successfully",
      user: {
        id: user.id,
        email: user.email,
        googleId: user.googleId,
      },
    });
  } catch (error: any) {
    console.error("[Google Auth] Link error:", error);
    res.status(500).json({
      error: "Failed to link account",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/google/unlink
 * Unlink Google account from user account
 */
router.post("/unlink", requireGoogleAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    // Unlink Google account
    const user = await prisma.users.update({
      where: { id: userId },
      data: {
        googleId: null,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Google account unlinked successfully",
    });
  } catch (error: any) {
    console.error("[Google Auth] Unlink error:", error);
    res.status(500).json({
      error: "Failed to unlink account",
      message: error.message,
    });
  }
});

/**
 * GET /api/auth/google/status
 * Get Google authentication status
 */
router.get("/status", requireGoogleAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        googleId: true,
        role: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      success: true,
      linked: !!user.googleId,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error: any) {
    console.error("[Google Auth] Status error:", error);
    res.status(500).json({
      error: "Failed to get status",
      message: error.message,
    });
  }
});

/**
 * POST /api/auth/google/refresh
 * Refresh JWT token
 */
router.post("/refresh", requireGoogleAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.active) {
      return res.status(401).json({
        error: "User not found or inactive",
      });
    }

    // Generate new JWT token
    const token = generateGoogleJWT(user);

    res.json({
      success: true,
      token,
    });
  } catch (error: any) {
    console.error("[Google Auth] Refresh error:", error);
    res.status(500).json({
      error: "Failed to refresh token",
      message: error.message,
    });
  }
});

export default router;
