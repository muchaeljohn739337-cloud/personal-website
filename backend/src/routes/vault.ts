import express, { Response } from "express";
import { Server } from "socket.io";
import {
  authenticateToken,
  AuthRequest,
  requireAdmin,
} from "../middleware/auth";
import { vaultService } from "../services/VaultService";

const router = express.Router();

let ioRef: Server | null = null;

export const setVaultSocketIO = (io: Server) => {
  ioRef = io;
  console.log("✅ Socket.IO injected into vault routes");
};

// Helper function to emit audit events
const emitAuditEvent = (event: string, data: any) => {
  if (ioRef) {
    try {
      ioRef.to("admins").emit(event, data);
    } catch (error) {
      console.warn("⚠️  Failed to emit vault audit event:", error);
    }
  }
};

// POST /api/vault/mfa/setup - Setup MFA for admin
router.post(
  "/mfa/setup",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const result = await vaultService.setupMFA(userId);

      await vaultService.createAuditLog({
        userId,
        action: "MFA_SETUP",
        secretKey: "system",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
        mfaVerified: false,
      });

      console.log(`🔐 MFA setup completed for admin ${userId}`);

      res.json({
        success: true,
        data: {
          secret: result.secret,
          qrCode: result.qrCode,
          backupCodes: result.backupCodes,
        },
        message: "MFA setup successful. Scan QR code with authenticator app.",
      });
    } catch (error) {
      console.error("❌ MFA setup failed:", error);
      res.status(500).json({
        error: "MFA setup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/vault/secrets - Create or update secret (requires MFA)
router.post(
  "/secrets",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { key, value, metadata, rotationPolicy, mfaToken } = req.body;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        await vaultService.createAuditLog({
          userId,
          action: "CREATE_SECRET",
          secretKey: key,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          success: false,
          errorMessage: "MFA verification failed",
          mfaVerified: false,
        });

        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      // Validate input
      if (!key || !value) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Key and value are required",
        });
      }

      // Create secret
      await vaultService.createSecret(
        {
          key,
          value,
          metadata: metadata || { createdBy: userId },
          rotationPolicy,
        },
        userId
      );

      await vaultService.createAuditLog({
        userId,
        action: "CREATE_SECRET",
        secretKey: key,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
        mfaVerified: true,
      });

      emitAuditEvent("vault:secret-created", {
        key,
        userId,
        timestamp: new Date(),
      });

      console.log(`✅ Secret created by admin ${userId}: ${key}`);

      res.json({
        success: true,
        message: `Secret '${key}' created successfully`,
      });
    } catch (error) {
      console.error("❌ Failed to create secret:", error);

      await vaultService.createAuditLog({
        userId: req.user!.userId,
        action: "CREATE_SECRET",
        secretKey: req.body.key || "unknown",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        mfaVerified: true,
      });

      res.status(500).json({
        error: "Failed to create secret",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/vault/secrets - List all secrets (admin-only, requires MFA)
router.get(
  "/secrets",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const mfaToken = req.query.mfaToken as string;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        await vaultService.createAuditLog({
          userId,
          action: "LIST_SECRETS",
          secretKey: "all",
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          success: false,
          errorMessage: "MFA verification failed",
          mfaVerified: false,
        });

        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      const secrets = await vaultService.listSecrets();

      await vaultService.createAuditLog({
        userId,
        action: "LIST_SECRETS",
        secretKey: "all",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
        mfaVerified: true,
      });

      console.log(`📋 Admin ${userId} listed ${secrets.length} secrets`);

      res.json({
        success: true,
        data: secrets,
        count: secrets.length,
      });
    } catch (error) {
      console.error("❌ Failed to list secrets:", error);
      res.status(500).json({
        error: "Failed to list secrets",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/vault/secrets/:key - Get secret value (admin-only, requires MFA)
router.get(
  "/secrets/:key",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { key } = req.params;
      const mfaToken = req.query.mfaToken as string;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        await vaultService.createAuditLog({
          userId,
          action: "GET_SECRET",
          secretKey: key,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          success: false,
          errorMessage: "MFA verification failed",
          mfaVerified: false,
        });

        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      const value = await vaultService.getSecret(key);

      await vaultService.createAuditLog({
        userId,
        action: "GET_SECRET",
        secretKey: key,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
        mfaVerified: true,
      });

      emitAuditEvent("vault:secret-accessed", {
        key,
        userId,
        timestamp: new Date(),
      });

      console.log(`🔓 Admin ${userId} accessed secret: ${key}`);

      res.json({
        success: true,
        data: { key, value },
      });
    } catch (error) {
      console.error("❌ Failed to get secret:", error);

      await vaultService.createAuditLog({
        userId: req.user!.userId,
        action: "GET_SECRET",
        secretKey: req.params.key,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        mfaVerified: true,
      });

      res.status(500).json({
        error: "Failed to get secret",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// DELETE /api/vault/secrets/:key - Delete secret (requires MFA)
router.delete(
  "/secrets/:key",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { key } = req.params;
      const { mfaToken } = req.body;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        await vaultService.createAuditLog({
          userId,
          action: "DELETE_SECRET",
          secretKey: key,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          success: false,
          errorMessage: "MFA verification failed",
          mfaVerified: false,
        });

        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      await vaultService.deleteSecret(key);

      await vaultService.createAuditLog({
        userId,
        action: "DELETE_SECRET",
        secretKey: key,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
        mfaVerified: true,
      });

      emitAuditEvent("vault:secret-deleted", {
        key,
        userId,
        timestamp: new Date(),
      });

      console.log(`🗑️  Admin ${userId} deleted secret: ${key}`);

      res.json({
        success: true,
        message: `Secret '${key}' deleted successfully`,
      });
    } catch (error) {
      console.error("❌ Failed to delete secret:", error);

      await vaultService.createAuditLog({
        userId: req.user!.userId,
        action: "DELETE_SECRET",
        secretKey: req.params.key,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        mfaVerified: true,
      });

      res.status(500).json({
        error: "Failed to delete secret",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/vault/secrets/:key/rotate - Rotate secret (requires MFA)
router.post(
  "/secrets/:key/rotate",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { key } = req.params;
      const { mfaToken } = req.body;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        await vaultService.createAuditLog({
          userId,
          action: "ROTATE_SECRET",
          secretKey: key,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          success: false,
          errorMessage: "MFA verification failed",
          mfaVerified: false,
        });

        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      const newValue = await vaultService.rotateSecret(key, userId);

      await vaultService.createAuditLog({
        userId,
        action: "ROTATE_SECRET",
        secretKey: key,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
        mfaVerified: true,
      });

      emitAuditEvent("vault:secret-rotated", {
        key,
        userId,
        timestamp: new Date(),
      });

      console.log(`🔄 Admin ${userId} rotated secret: ${key}`);

      res.json({
        success: true,
        message: `Secret '${key}' rotated successfully`,
        data: { newValue },
      });
    } catch (error) {
      console.error("❌ Failed to rotate secret:", error);

      await vaultService.createAuditLog({
        userId: req.user!.userId,
        action: "ROTATE_SECRET",
        secretKey: req.params.key,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        mfaVerified: true,
      });

      res.status(500).json({
        error: "Failed to rotate secret",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// POST /api/vault/approle - Create AppRole for agent (requires MFA)
router.post(
  "/approle",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { name, policies, ttl, mfaToken } = req.body;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        await vaultService.createAuditLog({
          userId,
          action: "CREATE_APPROLE",
          secretKey: name,
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          success: false,
          errorMessage: "MFA verification failed",
          mfaVerified: false,
        });

        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      // Validate input
      if (!name || !policies || !ttl) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Name, policies, and ttl are required",
        });
      }

      const result = await vaultService.createAppRole(
        {
          name,
          policies: Array.isArray(policies) ? policies : [policies],
          ttl: Number(ttl),
        },
        userId
      );

      await vaultService.createAuditLog({
        userId,
        action: "CREATE_APPROLE",
        secretKey: name,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: true,
        mfaVerified: true,
      });

      emitAuditEvent("vault:approle-created", {
        name,
        userId,
        timestamp: new Date(),
      });

      console.log(`✅ Admin ${userId} created AppRole: ${name}`);

      res.json({
        success: true,
        message: `AppRole '${name}' created successfully`,
        data: result,
      });
    } catch (error) {
      console.error("❌ Failed to create AppRole:", error);

      await vaultService.createAuditLog({
        userId: req.user!.userId,
        action: "CREATE_APPROLE",
        secretKey: req.body.name || "unknown",
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        mfaVerified: true,
      });

      res.status(500).json({
        error: "Failed to create AppRole",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/vault/audit - Get audit logs (requires MFA)
router.get(
  "/audit",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const mfaToken = req.query.mfaToken as string;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      const logs = await vaultService.getAuditLogs(limit, offset);

      console.log(`📋 Admin ${userId} retrieved ${logs.length} audit logs`);

      res.json({
        success: true,
        data: logs,
        count: logs.length,
        pagination: { limit, offset },
      });
    } catch (error) {
      console.error("❌ Failed to get audit logs:", error);
      res.status(500).json({
        error: "Failed to get audit logs",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// GET /api/vault/rotation/check - Check secrets due for rotation
router.get(
  "/rotation/check",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const mfaToken = req.query.mfaToken as string;

      // Validate MFA token
      const mfaVerified = await vaultService.verifyMFA(userId, mfaToken);
      if (!mfaVerified) {
        return res.status(403).json({
          error: "MFA verification failed",
          message: "Invalid or expired MFA token",
        });
      }

      const secretsDue = await vaultService.getSecretsForRotation();

      console.log(
        `🔄 Admin ${userId} checked rotation - ${secretsDue.length} secrets due`
      );

      res.json({
        success: true,
        data: secretsDue,
        count: secretsDue.length,
      });
    } catch (error) {
      console.error("❌ Failed to check rotation:", error);
      res.status(500).json({
        error: "Failed to check rotation",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;
