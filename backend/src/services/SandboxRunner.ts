/**
 * Sandbox Runner Service
 *
 * Provides Docker-based isolated environments for testing AI-proposed code changes
 * Features:
 * - Ephemeral containers with 10-minute timeout
 * - Git branch isolation
 * - Automated test execution
 * - Resource limits and security constraints
 * - Automatic cleanup
 */

import { PrismaClient } from "@prisma/client";
import Docker from "dockerode";
import * as fs from "fs";
import * as path from "path";

const docker = new Docker();
const prisma = new PrismaClient();

interface SandboxConfig {
  baseImage?: string;
  memoryLimit?: number; // MB
  cpuLimit?: number; // CPU shares
  timeout?: number; // seconds
  networkMode?: "none" | "bridge" | "host";
}

interface SandboxJob {
  id: string;
  branchName: string;
  codeChanges: Array<{
    file: string;
    changes: string;
    type: "create" | "update" | "delete";
  }>;
  testCommand?: string;
  timeout: number;
  createdAt: Date;
}

interface SandboxResult {
  jobId: string;
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  testsPassed: boolean;
  duration: number; // seconds
  error?: string;
  containerLogs?: string;
}

export class SandboxRunner {
  private activeJobs: Map<string, { containerId: string; timeoutId: NodeJS.Timeout }> = new Map();
  private defaultConfig: SandboxConfig = {
    baseImage: "node:18-alpine",
    memoryLimit: 512, // 512MB
    cpuLimit: 1024, // 1 CPU share
    timeout: 600, // 10 minutes
    networkMode: "none", // No network access for security
  };

  constructor(config?: Partial<SandboxConfig>) {
    if (config) {
      this.defaultConfig = { ...this.defaultConfig, ...config };
    }
  }

  /**
   * Initialize sandbox runner and verify Docker availability
   */
  async initialize(): Promise<void> {
    try {
      await docker.ping();
      console.log("✅ [SANDBOX] Docker daemon connected");

      // Pull base image if not present
      await this.ensureBaseImage();

      console.log("✅ [SANDBOX] Sandbox Runner initialized");
    } catch (error) {
      console.error("❌ [SANDBOX] Failed to initialize:", error);
      throw new Error("Docker daemon not available. Ensure Docker is running.");
    }
  }

  /**
   * Ensure base image is available
   */
  private async ensureBaseImage(): Promise<void> {
    try {
      const images = await docker.listImages({
        filters: { reference: [this.defaultConfig.baseImage!] },
      });

      if (images.length === 0) {
        console.log(`📦 [SANDBOX] Pulling base image: ${this.defaultConfig.baseImage}`);
        await this.pullImage(this.defaultConfig.baseImage!);
      }
    } catch (error) {
      console.error("❌ [SANDBOX] Failed to ensure base image:", error);
    }
  }

  /**
   * Pull Docker image
   */
  private pullImage(imageName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      docker.pull(imageName, (err: any, stream: any) => {
        if (err) return reject(err);

        docker.modem.followProgress(
          stream,
          (err: any, output: any) => {
            if (err) return reject(err);
            console.log(`✅ [SANDBOX] Image pulled: ${imageName}`);
            resolve();
          },
          (event: any) => {
            if (event.status) {
              console.log(`[SANDBOX] ${event.status}`);
            }
          }
        );
      });
    });
  }

  /**
   * Run code changes in isolated sandbox
   */
  async runSandbox(job: SandboxJob, config?: Partial<SandboxConfig>): Promise<SandboxResult> {
    const startTime = Date.now();
    const mergedConfig = { ...this.defaultConfig, ...config };
    let containerId: string | null = null;

    try {
      console.log(`🏗️  [SANDBOX] Starting job ${job.id}`);

      // Create temporary workspace
      const workspaceDir = await this.createWorkspace(job);

      // Create container
      const container = await this.createContainer(job, workspaceDir, mergedConfig);
      containerId = container.id;

      // Set timeout for auto-cleanup
      const timeoutId = setTimeout(async () => {
        console.warn(`⏰ [SANDBOX] Job ${job.id} timed out after ${mergedConfig.timeout}s`);
        await this.cleanupContainer(containerId!);
        this.activeJobs.delete(job.id);
      }, mergedConfig.timeout! * 1000);

      this.activeJobs.set(job.id, { containerId, timeoutId });

      // Start container
      await container.start();
      console.log(`▶️  [SANDBOX] Container started: ${containerId.substring(0, 12)}`);

      // Wait for container to finish
      const exitCode = await container.wait();

      // Clear timeout
      clearTimeout(timeoutId);
      this.activeJobs.delete(job.id);

      // Get logs
      const stdout = await this.getContainerLogs(container, "stdout");
      const stderr = await this.getContainerLogs(container, "stderr");

      // Determine success
      const success = exitCode.StatusCode === 0;
      const testsPassed = success && !stderr.toLowerCase().includes("error");

      const duration = Math.floor((Date.now() - startTime) / 1000);

      console.log(`${success ? "✅" : "❌"} [SANDBOX] Job ${job.id} completed in ${duration}s`);

      // Cleanup
      await this.cleanupContainer(containerId);
      await this.cleanupWorkspace(workspaceDir);

      // Log to database
      await this.logSandboxExecution(job, {
        jobId: job.id,
        success,
        exitCode: exitCode.StatusCode || 0,
        stdout,
        stderr,
        testsPassed,
        duration,
      });

      return {
        jobId: job.id,
        success,
        exitCode: exitCode.StatusCode || 0,
        stdout,
        stderr,
        testsPassed,
        duration,
      };
    } catch (error: any) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      console.error(`❌ [SANDBOX] Job ${job.id} failed:`, error.message);

      // Cleanup on error
      if (containerId) {
        await this.cleanupContainer(containerId);
      }

      return {
        jobId: job.id,
        success: false,
        exitCode: -1,
        stdout: "",
        stderr: error.message,
        testsPassed: false,
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Create temporary workspace with code changes
   */
  private async createWorkspace(job: SandboxJob): Promise<string> {
    const workspaceDir = path.join("/tmp", `sandbox-${job.id}`);

    // Create workspace directory
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }

    // Apply code changes
    for (const change of job.codeChanges) {
      const filePath = path.join(workspaceDir, change.file);
      const fileDir = path.dirname(filePath);

      // Ensure directory exists
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      if (change.type === "delete") {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        fs.writeFileSync(filePath, change.changes, "utf-8");
      }
    }

    // Create package.json if it doesn't exist
    const packageJsonPath = path.join(workspaceDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: `sandbox-${job.id}`,
        version: "1.0.0",
        scripts: {
          test: job.testCommand || "echo 'No tests specified'",
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    console.log(`📁 [SANDBOX] Workspace created: ${workspaceDir}`);
    return workspaceDir;
  }

  /**
   * Create Docker container with security constraints
   */
  private async createContainer(
    job: SandboxJob,
    workspaceDir: string,
    config: SandboxConfig
  ): Promise<Docker.Container> {
    const container = await docker.createContainer({
      Image: config.baseImage!,
      Cmd: ["/bin/sh", "-c", job.testCommand || "npm test"],
      WorkingDir: "/workspace",
      HostConfig: {
        Memory: config.memoryLimit! * 1024 * 1024, // Convert MB to bytes
        CpuShares: config.cpuLimit,
        NetworkMode: config.networkMode,
        Binds: [`${workspaceDir}:/workspace:ro`], // Read-only mount for security
        AutoRemove: false, // Manual cleanup to capture logs
        ReadonlyRootfs: false, // Allow writes to /tmp
        SecurityOpt: ["no-new-privileges"],
        CapDrop: ["ALL"], // Drop all Linux capabilities
      },
      Env: ["NODE_ENV=test", `SANDBOX_JOB_ID=${job.id}`],
      Labels: {
        "sandbox.job.id": job.id,
        "sandbox.branch": job.branchName,
        "sandbox.created": new Date().toISOString(),
      },
    });

    console.log(`🐳 [SANDBOX] Container created: ${container.id.substring(0, 12)}`);
    return container;
  }

  /**
   * Get container logs
   */
  private async getContainerLogs(container: Docker.Container, type: "stdout" | "stderr"): Promise<string> {
    try {
      const logs = await container.logs({
        stdout: type === "stdout",
        stderr: type === "stderr",
        follow: false,
      });

      return logs.toString("utf-8");
    } catch (error) {
      console.error(`❌ [SANDBOX] Failed to get ${type} logs:`, error);
      return "";
    }
  }

  /**
   * Cleanup container
   */
  private async cleanupContainer(containerId: string): Promise<void> {
    try {
      const container = docker.getContainer(containerId);

      // Stop container if running
      try {
        await container.stop({ t: 5 }); // 5 second grace period
      } catch (error: any) {
        if (!error.message.includes("is not running")) {
          console.warn(`⚠️  [SANDBOX] Error stopping container:`, error.message);
        }
      }

      // Remove container
      await container.remove({ force: true });
      console.log(`🗑️  [SANDBOX] Container cleaned up: ${containerId.substring(0, 12)}`);
    } catch (error: any) {
      console.error(`❌ [SANDBOX] Failed to cleanup container:`, error.message);
    }
  }

  /**
   * Cleanup workspace directory
   */
  private async cleanupWorkspace(workspaceDir: string): Promise<void> {
    try {
      if (fs.existsSync(workspaceDir)) {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
        console.log(`🗑️  [SANDBOX] Workspace cleaned up: ${workspaceDir}`);
      }
    } catch (error) {
      console.error(`❌ [SANDBOX] Failed to cleanup workspace:`, error);
    }
  }

  /**
   * Log sandbox execution to database
   */
  private async logSandboxExecution(job: SandboxJob, result: SandboxResult): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          id: `sandbox_${result.jobId}`,
          action: "SANDBOX_EXECUTION",
          userId: null,
          resourceType: "SANDBOX",
          resourceId: job.id,
          changes: JSON.stringify({
            branchName: job.branchName,
            filesChanged: job.codeChanges.length,
            testCommand: job.testCommand,
          }),
          metadata: JSON.stringify({
            success: result.success,
            exitCode: result.exitCode,
            testsPassed: result.testsPassed,
            duration: result.duration,
            stdout: result.stdout.substring(0, 1000), // Truncate for storage
            stderr: result.stderr.substring(0, 1000),
          }),
          ipAddress: "127.0.0.1",
          userAgent: "Sandbox Runner",
          severity: result.success ? "INFO" : "WARN",
        },
      });
    } catch (error) {
      console.error("❌ [SANDBOX] Failed to log execution:", error);
    }
  }

  /**
   * Cancel running sandbox job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      console.warn(`⚠️  [SANDBOX] Job ${jobId} not found or already completed`);
      return false;
    }

    clearTimeout(job.timeoutId);
    await this.cleanupContainer(job.containerId);
    this.activeJobs.delete(jobId);

    console.log(`🛑 [SANDBOX] Job ${jobId} cancelled`);
    return true;
  }

  /**
   * Get active jobs count
   */
  getActiveJobsCount(): number {
    return this.activeJobs.size;
  }

  /**
   * Get active job IDs
   */
  getActiveJobIds(): string[] {
    return Array.from(this.activeJobs.keys());
  }

  /**
   * Cleanup all active jobs (for graceful shutdown)
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 [SANDBOX] Cleaning up ${this.activeJobs.size} active jobs...`);

    const cleanupPromises = Array.from(this.activeJobs.entries()).map(async ([jobId, job]) => {
      clearTimeout(job.timeoutId);
      await this.cleanupContainer(job.containerId);
    });

    await Promise.all(cleanupPromises);
    this.activeJobs.clear();

    console.log("✅ [SANDBOX] All jobs cleaned up");
  }
}

// Singleton export
export const sandboxRunner = new SandboxRunner();
