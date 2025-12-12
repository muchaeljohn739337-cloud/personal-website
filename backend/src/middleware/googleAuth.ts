/**
 * Google OAuth Authentication Middleware
 * Handles Google Sign-In for admin and user authentication
 */

import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from "../prismaClient";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale?: string;
}

/**
 * Verify Google ID token
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo | null> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email!,
      email_verified: payload.email_verified!,
      name: payload.name!,
      given_name: payload.given_name!,
      family_name: payload.family_name!,
      picture: payload.picture!,
      locale: payload.locale,
    };
  } catch (error) {
    console.error("[Google Auth] Token verification failed:", error);
    return null;
  }
}

/**
 * Generate OAuth URL for Google Sign-In
 */
export function getGoogleAuthUrl(state?: string): string {
  const scopes = ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: state || "",
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    if (!tokens.id_token) {
      throw new Error("No ID token received");
    }

    const userInfo = await verifyGoogleToken(tokens.id_token);

    return {
      userInfo,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };
  } catch (error) {
    console.error("[Google Auth] Token exchange failed:", error);
    throw error;
  }
}

/**
 * Find or create user from Google profile
 */
export async function findOrCreateGoogleUser(googleUser: GoogleUserInfo, isAdmin: boolean = false): Promise<any> {
  try {
    // Check if user exists by Google ID
    let user = await prisma.users.findFirst({
      where: { googleId: googleUser.sub },
    });

    // If not found, check by email
    if (!user) {
      user = await prisma.users.findUnique({
        where: { email: googleUser.email },
      });

      // Link Google ID to existing account
      if (user) {
        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            emailVerified: googleUser.email_verified,
            profilePicture: googleUser.picture,
            updatedAt: new Date(),
          },
        });
      }
    }

    // Create new user if doesn't exist
    if (!user) {
      const [firstName, ...lastNameParts] = googleUser.name.split(" ");
      const lastName = lastNameParts.join(" ") || "";

      user = await prisma.users.create({
        data: {
          id: crypto.randomUUID(),
          username: googleUser.email.split("@")[0], // Use email prefix as username
          email: googleUser.email,
          passwordHash: "GOOGLE_OAUTH_NO_PASSWORD", // OAuth users don't need password
          googleId: googleUser.sub,
          firstName: firstName || googleUser.given_name,
          lastName: lastName || googleUser.family_name,
          profilePicture: googleUser.picture,
          emailVerified: googleUser.email_verified,
          role: isAdmin ? "ADMIN" : "USER",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(`[Google Auth] New user created: ${user.email} (${user.id})`);
    }

    return user;
  } catch (error) {
    console.error("[Google Auth] Error finding/creating user:", error);
    throw error;
  }
}

/**
 * Generate JWT token for Google-authenticated user
 */
export function generateGoogleJWT(user: any): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || "USER",
      googleId: user.googleId,
      type: "google",
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

/**
 * Middleware: Require Google authentication
 */
export async function requireGoogleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please sign in with Google",
      });
      return;
    }

    const payload = jwt.verify(token, config.jwtSecret) as any;

    // Verify it's a Google token
    if (payload.type !== "google") {
      res.status(401).json({
        error: "Invalid authentication method",
        message: "This endpoint requires Google authentication",
      });
      return;
    }

    // Verify user still exists and is active
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.active) {
      res.status(401).json({
        error: "Account not found or inactive",
      });
      return;
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Invalid or expired token",
      message: "Please sign in again",
    });
  }
}

/**
 * Middleware: Require Google admin authentication
 */
export async function requireGoogleAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      res.status(401).json({
        error: "Authentication required",
        message: "Please sign in with Google as admin",
      });
      return;
    }

    const payload = jwt.verify(token, config.jwtSecret) as any;

    // Verify admin role
    if (payload.role !== "ADMIN") {
      res.status(403).json({
        error: "Access denied",
        message: "Admin access required",
      });
      return;
    }

    // Verify user still exists and is active
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.active || user.role !== "ADMIN") {
      res.status(403).json({
        error: "Admin access denied",
      });
      return;
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Invalid or expired token",
      message: "Please sign in again",
    });
  }
}

/**
 * Rate limiting for Google auth
 */
const googleAuthAttempts = new Map<string, number[]>();

export function checkGoogleAuthRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;

  const attempts = googleAuthAttempts.get(identifier) || [];
  const recentAttempts = attempts.filter((time) => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return false;
  }

  recentAttempts.push(now);
  googleAuthAttempts.set(identifier, recentAttempts);

  return true;
}

/**
 * Clean up old rate limit entries
 */
setInterval(
  () => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    googleAuthAttempts.forEach((attempts, identifier) => {
      const recentAttempts = attempts.filter((time) => now - time < windowMs);
      if (recentAttempts.length === 0) {
        googleAuthAttempts.delete(identifier);
      } else {
        googleAuthAttempts.set(identifier, recentAttempts);
      }
    });
  },
  5 * 60 * 1000
); // Clean up every 5 minutes
