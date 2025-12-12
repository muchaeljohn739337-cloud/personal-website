import crypto from "crypto";
import { ethers } from "ethers";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// In-memory nonce storage (use Redis in production)
interface NonceData {
  nonce: string;
  expiresAt: number;
  attempts: number;
}

const nonceStore = new Map<string, NonceData>();

/**
 * Generate a cryptographically secure random nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Verify Ethereum signature using ethers.js
 * @param message - The original message that was signed
 * @param signature - The signature from the wallet
 * @param expectedAddress - The wallet address that should have signed
 */
export function verifySignature(message: string, signature: string, expectedAddress: string): boolean {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Store nonce with expiration
 */
export function storeNonce(walletAddress: string, nonce: string): void {
  const normalizedAddress = walletAddress.toLowerCase();
  nonceStore.set(normalizedAddress, {
    nonce,
    expiresAt: Date.now() + NONCE_EXPIRY_MS,
    attempts: 0,
  });

  // Cleanup expired nonces periodically
  setTimeout(() => {
    const stored = nonceStore.get(normalizedAddress);
    if (stored && Date.now() > stored.expiresAt) {
      nonceStore.delete(normalizedAddress);
    }
  }, NONCE_EXPIRY_MS);
}

/**
 * Validate and consume nonce
 */
export function validateNonce(walletAddress: string, nonce: string): boolean {
  const normalizedAddress = walletAddress.toLowerCase();
  const stored = nonceStore.get(normalizedAddress);

  if (!stored) {
    console.error("Nonce not found for address:", normalizedAddress);
    return false;
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    nonceStore.delete(normalizedAddress);
    console.error("Nonce expired for address:", normalizedAddress);
    return false;
  }

  // Check nonce match
  if (stored.nonce !== nonce) {
    stored.attempts += 1;

    // Rate limiting: max 3 attempts
    if (stored.attempts >= 3) {
      nonceStore.delete(normalizedAddress);
      console.error("Max nonce attempts exceeded for:", normalizedAddress);
    }
    return false;
  }

  // Consume nonce (one-time use)
  nonceStore.delete(normalizedAddress);
  return true;
}

/**
 * Middleware: Authenticate Web3 wallet signature
 */
export async function authenticateWeb3(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      res.status(400).json({
        error: "Missing required fields: walletAddress, signature, message",
      });
      return;
    }

    // Validate Ethereum address format
    if (!ethers.utils.isAddress(walletAddress)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    // Extract nonce from message
    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
    if (!nonceMatch) {
      res.status(400).json({ error: "Invalid message format: nonce not found" });
      return;
    }
    const nonce = nonceMatch[1];

    // Validate nonce
    if (!validateNonce(walletAddress, nonce)) {
      res.status(401).json({ error: "Invalid or expired nonce" });
      return;
    }

    // Verify signature
    if (!verifySignature(message, signature, walletAddress)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Find or create user
    let user = await prisma.users.findUnique({
      where: { ethWalletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      // Auto-create user for new wallet
      const userId = crypto.randomUUID();
      user = await prisma.users.create({
        data: {
          id: userId,
          email: `${walletAddress.toLowerCase()}@web3.local`,
          username: `user_${walletAddress.slice(2, 10)}`,
          ethWalletAddress: walletAddress.toLowerCase(),
          passwordHash: "", // No password for Web3-only accounts
          role: "USER", // Default role enum
          emailVerified: true, // Web3 wallets are verified by signature
          updatedAt: new Date(),
        },
      });

      console.log("✅ New Web3 user created:", user.id);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role || "USER",
        ethWalletAddress: user.ethWalletAddress,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Attach user to request
    (req as any).user = user;
    (req as any).token = token;

    next();
  } catch (error) {
    console.error("Web3 authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Generate JWT token for Web3 user
 */
export function generateWeb3Token(user: any): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role || "USER",
      ethWalletAddress: user.ethWalletAddress,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

/**
 * Middleware: Require Web3 authentication with specific role
 */
export function requireWeb3Role(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        res.status(401).json({ error: "No authentication token provided" });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (!decoded.ethWalletAddress) {
        res.status(403).json({ error: "Not a Web3 authenticated session" });
        return;
      }

      if (!allowedRoles.includes(decoded.role)) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      // Attach decoded user to request
      (req as any).user = decoded;
      next();
    } catch (error) {
      console.error("Web3 role verification error:", error);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

/**
 * Rate limiting for nonce generation
 */
const nonceRateLimits = new Map<string, number[]>();

export function checkNonceRateLimit(walletAddress: string): boolean {
  const normalizedAddress = walletAddress.toLowerCase();
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // Max 10 nonce requests per minute

  let requests = nonceRateLimits.get(normalizedAddress) || [];

  // Filter out old requests outside the window
  requests = requests.filter((timestamp) => now - timestamp < windowMs);

  if (requests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  requests.push(now);
  nonceRateLimits.set(normalizedAddress, requests);

  // Cleanup old entries periodically
  if (Math.random() < 0.01) {
    for (const [addr, timestamps] of nonceRateLimits.entries()) {
      const filtered = timestamps.filter((ts) => now - ts < windowMs);
      if (filtered.length === 0) {
        nonceRateLimits.delete(addr);
      } else {
        nonceRateLimits.set(addr, filtered);
      }
    }
  }

  return true;
}

/**
 * Create SIWE (Sign-In with Ethereum) compliant message
 */
export function createSIWEMessage(domain: string, walletAddress: string, nonce: string, chainId: number = 1): string {
  const issuedAt = new Date().toISOString();

  return `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

Sign in with Ethereum to the app.

URI: https://${domain}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

/**
 * Middleware: Link Web3 wallet to existing account
 */
export async function linkWalletToAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, walletAddress, signature, message } = req.body;

    if (!userId || !walletAddress || !signature || !message) {
      res.status(400).json({
        error: "Missing required fields",
      });
      return;
    }

    // Validate address
    if (!ethers.utils.isAddress(walletAddress)) {
      res.status(400).json({ error: "Invalid Ethereum address" });
      return;
    }

    // Extract and validate nonce
    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
    if (!nonceMatch || !validateNonce(walletAddress, nonceMatch[1])) {
      res.status(401).json({ error: "Invalid or expired nonce" });
      return;
    }

    // Verify signature
    if (!verifySignature(message, signature, walletAddress)) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Check if wallet already linked
    const existingWallet = await prisma.users.findUnique({
      where: { ethWalletAddress: walletAddress.toLowerCase() },
    });

    if (existingWallet && existingWallet.id !== userId) {
      res.status(409).json({ error: "Wallet already linked to another account" });
      return;
    }

    // Link wallet to user
    const user = await prisma.users.update({
      where: { id: userId },
      data: { ethWalletAddress: walletAddress.toLowerCase() },
    });

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Wallet linking error:", error);
    res.status(500).json({ error: "Failed to link wallet" });
  }
}
