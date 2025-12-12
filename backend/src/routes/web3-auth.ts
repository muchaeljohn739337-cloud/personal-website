import { ethers } from "ethers";
import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  authenticateWeb3,
  checkNonceRateLimit,
  createSIWEMessage,
  generateNonce,
  generateWeb3Token,
  linkWalletToAccount,
  requireWeb3Role,
  storeNonce,
} from "../middleware/web3Auth";
import prisma from "../prismaClient";

const router: express.Router = express.Router();

/**
 * POST /api/auth/web3/nonce
 * Generate a nonce for wallet signature
 */
router.post(
  "/nonce",
  [
    body("walletAddress")
      .notEmpty()
      .withMessage("Wallet address is required")
      .custom((value) => {
        if (!ethers.utils.isAddress(value)) {
          throw new Error("Invalid Ethereum address");
        }
        return true;
      }),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { walletAddress } = req.body;

      // Rate limiting
      if (!checkNonceRateLimit(walletAddress)) {
        return res.status(429).json({
          error: "Too many nonce requests. Please try again later.",
        });
      }

      // Generate nonce
      const nonce = generateNonce();
      storeNonce(walletAddress, nonce);

      // Create SIWE compliant message
      const domain = req.headers.host || "localhost:3001";
      const message = createSIWEMessage(domain, walletAddress, nonce);

      res.json({
        nonce,
        message,
        expiresIn: 300, // 5 minutes in seconds
      });
    } catch (error) {
      console.error("Nonce generation error:", error);
      res.status(500).json({ error: "Failed to generate nonce" });
    }
  }
);

/**
 * POST /api/auth/web3/verify
 * Verify wallet signature and authenticate user
 */
router.post(
  "/verify",
  [
    body("walletAddress")
      .notEmpty()
      .withMessage("Wallet address is required")
      .custom((value) => {
        if (!ethers.utils.isAddress(value)) {
          throw new Error("Invalid Ethereum address");
        }
        return true;
      }),
    body("signature").notEmpty().withMessage("Signature is required"),
    body("message").notEmpty().withMessage("Message is required"),
  ],
  authenticateWeb3,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const token = (req as any).token;

      // Log authentication event
      await prisma.eth_activity.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          userId: user.id,
          address: user.ethWalletAddress || "",
          addressNormalized: (user.ethWalletAddress || "").toLowerCase(),
          type: "DEPOSIT", // Using existing enum value for login activity
          amountEth: 0,
          status: "completed",
          note: JSON.stringify({
            event: "web3_login",
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            timestamp: new Date().toISOString(),
          }),
        },
      });

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          ethWalletAddress: user.ethWalletAddress,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  }
);

/**
 * POST /api/auth/web3/link
 * Link Web3 wallet to existing user account
 */
router.post(
  "/link",
  [
    body("userId").isInt().withMessage("Valid user ID is required"),
    body("walletAddress")
      .notEmpty()
      .withMessage("Wallet address is required")
      .custom((value) => {
        if (!ethers.utils.isAddress(value)) {
          throw new Error("Invalid Ethereum address");
        }
        return true;
      }),
    body("signature").notEmpty().withMessage("Signature is required"),
    body("message").notEmpty().withMessage("Message is required"),
  ],
  linkWalletToAccount,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Log wallet linking event
      await prisma.eth_activity.create({
        data: {
          id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
          updatedAt: new Date(),
          userId: user.id,
          address: user.ethWalletAddress || "",
          addressNormalized: (user.ethWalletAddress || "").toLowerCase(),
          type: "DEPOSIT",
          amountEth: 0,
          status: "completed",
          note: JSON.stringify({
            event: "wallet_linked",
            ip: req.ip,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      res.json({
        success: true,
        message: "Wallet successfully linked to account",
        user: {
          id: user.id,
          email: user.email,
          ethWalletAddress: user.ethWalletAddress,
        },
      });
    } catch (error) {
      console.error("Wallet linking error:", error);
      res.status(500).json({ error: "Failed to link wallet" });
    }
  }
);

/**
 * POST /api/auth/web3/unlink
 * Unlink Web3 wallet from user account
 */
router.post("/unlink", requireWeb3Role(["user", "admin"]), async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    // Verify user owns this wallet
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.ethWalletAddress) {
      return res.status(404).json({ error: "No wallet linked to this account" });
    }

    // Unlink wallet
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { ethWalletAddress: null },
    });

    // Log unlinking event
    await prisma.eth_activity.create({
      data: {
        id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,
        updatedAt: new Date(),
        userId: user.id,
        address: user.ethWalletAddress || "",
        addressNormalized: (user.ethWalletAddress || "").toLowerCase(),
        type: "WITHDRAWAL",
        amountEth: 0,
        status: "completed",
        note: JSON.stringify({
          event: "wallet_unlinked",
          previousWallet: user.ethWalletAddress,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    res.json({
      success: true,
      message: "Wallet successfully unlinked",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        ethWalletAddress: updatedUser.ethWalletAddress,
      },
    });
  } catch (error) {
    console.error("Wallet unlinking error:", error);
    res.status(500).json({ error: "Failed to unlink wallet" });
  }
});

/**
 * GET /api/auth/web3/status
 * Get Web3 authentication status for current user
 */
router.get("/status", requireWeb3Role(["user", "admin"]), async (req: Request, res: Response) => {
  try {
    const { userId, ethWalletAddress } = (req as any).user;

    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get recent Web3 activity
    const recentActivity = await prisma.eth_activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Check if wallet has any crypto balances (if implemented)
    const wallets = await prisma.token_wallets.findMany({
      where: { userId: user.id },
    });

    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        ethWalletAddress: user.ethWalletAddress,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      web3: {
        walletAddress: ethWalletAddress,
        walletLinked: !!user.ethWalletAddress,
        hasTokenWallets: wallets.length > 0,
        tokenWallets: wallets.map((w: any) => ({
          tokenType: w.tokenType,
          balance: w.balance.toString(),
        })),
      },
      recentActivity: recentActivity.map((a: any) => ({
        type: a.type,
        timestamp: a.createdAt,
        note: a.note,
      })),
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to get Web3 status" });
  }
});

/**
 * GET /api/auth/web3/challenge/:walletAddress
 * Alternative endpoint: Get challenge for specific wallet
 */
router.get("/challenge/:walletAddress", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    // Validate address
    if (!ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }

    // Rate limiting
    if (!checkNonceRateLimit(walletAddress)) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    // Generate nonce and message
    const nonce = generateNonce();
    storeNonce(walletAddress, nonce);

    const domain = req.headers.host || "localhost:3001";
    const message = createSIWEMessage(domain, walletAddress, nonce);

    res.json({
      challenge: {
        nonce,
        message,
        expiresIn: 300,
      },
      instructions: {
        step1: "Sign the message with your Ethereum wallet",
        step2: "Send the signature to POST /api/auth/web3/verify",
        format: {
          walletAddress: "0x...",
          signature: "0x...",
          message: "The exact message provided above",
        },
      },
    });
  } catch (error) {
    console.error("Challenge generation error:", error);
    res.status(500).json({ error: "Failed to generate challenge" });
  }
});

/**
 * POST /api/auth/web3/refresh
 * Refresh JWT token for Web3 authenticated user
 */
router.post("/refresh", requireWeb3Role(["user", "admin"]), async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    // Get fresh user data
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.ethWalletAddress) {
      return res.status(404).json({ error: "User not found or wallet not linked" });
    }

    // Generate new token
    const newToken = generateWeb3Token(user);

    res.json({
      success: true,
      token: newToken,
      expiresIn: "24h",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

export default router;
