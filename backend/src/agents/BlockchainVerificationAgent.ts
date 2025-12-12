// Blockchain Verification Agent - Manifest Integrity Verification
// Verifies deployment manifests against blockchain records every 30 minutes
// Alerts admins if manifest tampering is detected

import path from "path";
import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { ProjectIntegrityClient } from "../blockchain/contractInteraction";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

export class BlockchainVerificationAgent extends BaseAgent {
  private integrityClient?: ProjectIntegrityClient;

  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "BlockchainVerificationAgent",
      enabled: true,
      schedule: "*/30 * * * *",
      retryAttempts: 3,
      timeout: 120000,
      priority: "high",
      description: "Verifies deployment manifest integrity against blockchain",
    };
    super(config, context);

    if (process.env.CONTRACT_ADDRESS && process.env.BLOCKCHAIN_RPC_URL) {
      try {
        this.integrityClient = new ProjectIntegrityClient(
          process.env.BLOCKCHAIN_RPC_URL,
          process.env.CONTRACT_ADDRESS,
          process.env.DEPLOYER_PRIVATE_KEY
        );
        this.context.logger.info("BlockchainVerificationAgent initialized");
      } catch (error) {
        this.context.logger.error("Failed to initialize blockchain client", error);
      }
    }
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;

    try {
      if (!this.integrityClient) {
        return {
          success: false,
          message: "Blockchain client not initialized",
          data: { reason: "Missing CONTRACT_ADDRESS or BLOCKCHAIN_RPC_URL" },
          metrics: { itemsProcessed: 0, errors: 1, duration: 0 },
        };
      }

      const startTime = Date.now();
      const manifestPath = path.join(process.cwd(), "package.json");
      const localHash = await ProjectIntegrityClient.computeFileHash(manifestPath);
      itemsProcessed++;

      const verificationResult = await this.integrityClient.verifyManifest(localHash);
      itemsProcessed++;

      await this.context.prisma.blockchain_verifications.create({
        data: {
          id: `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          manifest_hash: localHash,
          version: verificationResult.version || "1.0",
          status: verificationResult.isValid ? "VERIFIED" : "FAILED",
          blockchain: "Polygon",
          tx_hash: verificationResult.isValid ? "verified" : null,
          confirmed_at: new Date(),
        },
      });
      itemsProcessed++;

      await SafePrisma.create("audit_logs", {
        userId: null,
        action: verificationResult.isValid ? "BLOCKCHAIN_VERIFY_SUCCESS" : "BLOCKCHAIN_VERIFY_FAIL",
        resourceType: "blockchain",
        resourceId: localHash,
        ipAddress: "127.0.0.1",
        userAgent: "BlockchainVerificationAgent",
        metadata: {
          agent: this.config.name,
          manifest_hash: localHash,
          verified: verificationResult.isValid,
        },
      });
      itemsProcessed++;

      if (!verificationResult.isValid) {
        this.context.logger.error("SECURITY ALERT: Manifest verification failed!", { localHash });

        if (this.context.io) {
          const admins = await this.context.prisma.users.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
          });

          admins.forEach((admin) => {
            this.context.io?.to(`user-${admin.id}`).emit("security:alert", {
              type: "critical",
              agent: this.config.name,
              title: "Manifest Tampering Detected",
              message: "Deployment manifest does not match blockchain record",
              timestamp: new Date(),
            });
          });
        }

        return {
          success: false,
          message: "Manifest verification FAILED",
          data: { localHash, verified: false },
          metrics: {
            itemsProcessed,
            errors: errors + 1,
            duration: Date.now() - startTime,
          },
        };
      }

      if (this.context.io) {
        this.context.io.emit("system:status", {
          type: "info",
          agent: this.config.name,
          message: "Manifest integrity verified",
          timestamp: new Date(),
        });
      }

      return {
        success: true,
        message: "Manifest verification successful",
        data: { localHash, verified: true },
        metrics: { itemsProcessed, errors, duration: Date.now() - startTime },
      };
    } catch (error: any) {
      this.context.logger.error("BlockchainVerificationAgent failed", error);
      return {
        success: false,
        message: error.message || "Verification failed",
        data: { error: error.message },
        metrics: { itemsProcessed, errors: errors + 1, duration: 0 },
      };
    }
  }

  async storeManifestHash(version: string): Promise<{ success: boolean; txHash?: string }> {
    try {
      if (!this.integrityClient) throw new Error("Blockchain client not initialized");

      const manifestPath = path.join(process.cwd(), "package.json");
      const hash = await ProjectIntegrityClient.computeFileHash(manifestPath);
      const result = await this.integrityClient.storeManifestHash(hash, version);

      await this.context.prisma.blockchain_verifications.create({
        data: {
          id: `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          manifest_hash: hash,
          version: version,
          status: "VERIFIED",
          blockchain: "Polygon",
          tx_hash: result.txHash,
          confirmed_at: new Date(),
          record_id: result.recordId,
        },
      });

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false };
    }
  }
}
