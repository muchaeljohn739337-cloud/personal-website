/**
 * ProjectIntegrity Smart Contract Interaction Layer
 * 
 * Provides Node.js/TypeScript interface to interact with the ProjectIntegrity contract
 * deployed on Polygon/Arbitrum/Optimism for manifest verification
 */

import { ethers } from "ethers";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Contract ABI (only the functions we need)
const PROJECT_INTEGRITY_ABI = [
  "function storeManifestHash(string memory _hash, string memory _version) public returns (uint256)",
  "function getLatestManifestHash() public view returns (string memory hash, uint256 timestamp, address uploader, string memory version)",
  "function verifyManifest(string memory _hash) public view returns (bool isValid)",
  "function getRecordCount() public view returns (uint256 count)",
  "function getRecord(uint256 _recordId) public view returns (string memory hash, uint256 timestamp, address uploader, string memory version, bool isRevoked)",
  "event ManifestStored(uint256 indexed recordId, string hash, uint256 timestamp, address indexed uploader, string version)"
];

export interface ManifestRecord {
  hash: string;
  timestamp: Date;
  uploader: string;
  version: string;
  isRevoked?: boolean;
}

export interface VerificationResult {
  isValid: boolean;
  storedHash?: string;
  timestamp?: Date;
  uploader?: string;
  version?: string;
  error?: string;
}

export class ProjectIntegrityClient {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private wallet?: ethers.Wallet;

  constructor(
    rpcUrl: string,
    contractAddress: string,
    privateKey?: string
  ) {
    // Connect to blockchain RPC
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Create contract instance (read-only by default)
    this.contract = new ethers.Contract(
      contractAddress,
      PROJECT_INTEGRITY_ABI,
      this.provider
    );

    // If private key provided, enable write operations
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = this.contract.connect(this.wallet) as ethers.Contract;
    }
  }

  /**
   * Compute SHA-256 hash of a file
   */
  static computeFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  }

  /**
   * Compute SHA-256 hash of a string/buffer
   */
  static computeHash(data: string | Buffer): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Store a new manifest hash on-chain
   */
  async storeManifestHash(
    hash: string,
    version: string
  ): Promise<{ recordId: number; txHash: string; blockNumber: number }> {
    if (!this.wallet) {
      throw new Error("Wallet not configured. Provide private key to enable writes.");
    }

    console.log(`[Blockchain] Storing manifest hash on-chain...`);
    console.log(`  Hash: ${hash}`);
    console.log(`  Version: ${version}`);

    try {
      const tx = await this.contract.storeManifestHash(hash, version);
      console.log(`[Blockchain] Transaction submitted: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[Blockchain] Transaction confirmed in block ${receipt.blockNumber}`);

      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === "ManifestStored";
        } catch {
          return false;
        }
      });

      let recordId = 0;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        recordId = Number(parsed?.args.recordId);
      }

      return {
        recordId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      console.error("[Blockchain] Failed to store manifest hash:", error);
      throw new Error(`Blockchain storage failed: ${error.message}`);
    }
  }

  /**
   * Get the latest non-revoked manifest record
   */
  async getLatestManifestHash(): Promise<ManifestRecord> {
    try {
      const [hash, timestamp, uploader, version] =
        await this.contract.getLatestManifestHash();

      return {
        hash,
        timestamp: new Date(Number(timestamp) * 1000),
        uploader,
        version,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch latest manifest: ${error.message}`);
    }
  }

  /**
   * Verify if a hash matches the latest on-chain record
   */
  async verifyManifest(hash: string): Promise<VerificationResult> {
    try {
      const isValid = await this.contract.verifyManifest(hash);

      if (isValid) {
        const latest = await this.getLatestManifestHash();
        return {
          isValid: true,
          storedHash: latest.hash,
          timestamp: latest.timestamp,
          uploader: latest.uploader,
          version: latest.version,
        };
      } else {
        return { isValid: false, error: "Hash mismatch" };
      }
    } catch (error: any) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Get total number of records
   */
  async getRecordCount(): Promise<number> {
    const count = await this.contract.getRecordCount();
    return Number(count);
  }

  /**
   * Get a specific record by ID
   */
  async getRecord(recordId: number): Promise<ManifestRecord> {
    try {
      const [hash, timestamp, uploader, version, isRevoked] =
        await this.contract.getRecord(recordId);

      return {
        hash,
        timestamp: new Date(Number(timestamp) * 1000),
        uploader,
        version,
        isRevoked,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch record ${recordId}: ${error.message}`);
    }
  }

  /**
   * Verify local manifest file against blockchain
   */
  async verifyLocalManifest(
    manifestPath: string
  ): Promise<VerificationResult> {
    const localHash = ProjectIntegrityClient.computeFileHash(manifestPath);
    console.log(`[Verification] Local manifest hash: ${localHash}`);
    return await this.verifyManifest(localHash);
  }
}

/**
 * Factory function to create client from environment variables
 */
export function createIntegrityClient(): ProjectIntegrityClient {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || "https://polygon-rpc.com";
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS environment variable not set");
  }

  return new ProjectIntegrityClient(rpcUrl, contractAddress, privateKey);
}
