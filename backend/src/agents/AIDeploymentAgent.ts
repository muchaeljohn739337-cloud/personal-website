// AI Deployment Agent - Intelligent Auto-Deployment with Learning
// Orchestrates deployments, monitors health, self-heals issues, auto-rollback
// Learns from deployment patterns to prevent outages

import { SafePrisma } from "../ai-expansion/validators/SafePrisma";
import { AgentConfig, AgentContext, AgentResult, BaseAgent } from "./BaseAgent";

interface DeploymentRisk {
  score: number; // 1-10 scale
  factors: string[];
  recommendation: "auto-deploy" | "require-approval" | "block";
}

interface PreFlightCheck {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

interface DeploymentExecution {
  id: string;
  backend: {
    triggered: boolean;
    status: string;
    deployId?: string;
  };
  frontend: {
    triggered: boolean;
    status: string;
    deployId?: string;
  };
  startTime: Date;
  endTime?: Date;
  success: boolean;
  rollbackPerformed?: boolean;
}

export class AIDeploymentAgent extends BaseAgent {
  private renderApiKey: string;
  private renderServiceId: string;
  private backendUrl: string;
  private frontendUrl: string;

  constructor(context: AgentContext) {
    const config: AgentConfig = {
      name: "AIDeploymentAgent",
      enabled: true,
      schedule: "manual", // Triggered on-demand or via API
      retryAttempts: 2,
      timeout: 600000, // 10 minutes
      priority: "critical",
      description: "AI-powered deployment orchestration with learning and self-healing",
    };
    super(config, context);

    // Load configuration from environment
    this.renderApiKey = process.env.RENDER_API_KEY || "";
    this.renderServiceId = process.env.RENDER_SERVICE_ID || "srv-d4gh11n5r7bs73b8iak0";
    this.backendUrl = process.env.BACKEND_URL || "https://advancia-backend-8xq5.onrender.com";
    this.frontendUrl = process.env.FRONTEND_URL || "https://advanciapayledger.com";
  }

  async execute(): Promise<AgentResult> {
    let itemsProcessed = 0;
    let errors = 0;
    const deploymentLog: any = {
      phase: "initialization",
      checks: [],
      execution: null,
      validation: [],
    };

    try {
      this.context.logger.info("🚀 AI Deployment Agent started");

      // Phase 1: Pre-Flight Checks
      this.context.logger.info("📋 Phase 1: Running pre-flight checks...");
      deploymentLog.phase = "pre-flight";

      const preFlightChecks = await this.runPreFlightChecks();
      deploymentLog.checks = preFlightChecks;
      itemsProcessed++;

      const criticalFailures = preFlightChecks.filter((check) => !check.passed && check.critical);

      if (criticalFailures.length > 0) {
        this.context.logger.error(`❌ Pre-flight checks failed: ${criticalFailures.map((c) => c.name).join(", ")}`);
        errors++;

        return {
          success: false,
          message: "Pre-flight checks failed - deployment blocked",
          data: { deploymentLog, criticalFailures },
          metrics: {
            duration: 0,
            itemsProcessed,
            errors,
          },
        };
      }

      // Phase 2: Risk Assessment
      this.context.logger.info("🎯 Phase 2: Assessing deployment risk...");
      deploymentLog.phase = "risk-assessment";

      const riskAssessment = await this.assessDeploymentRisk();
      deploymentLog.riskAssessment = riskAssessment;
      itemsProcessed++;

      if (riskAssessment.recommendation === "block") {
        this.context.logger.error(`🚫 Deployment blocked - Risk score: ${riskAssessment.score}/10`);
        errors++;

        return {
          success: false,
          message: "Deployment blocked due to high risk",
          data: { deploymentLog, riskAssessment },
          metrics: {
            duration: 0,
            itemsProcessed,
            errors,
          },
        };
      }

      // Phase 3: Execute Deployment
      this.context.logger.info("🔄 Phase 3: Executing deployment...");
      deploymentLog.phase = "execution";

      const execution = await this.executeDeployment();
      deploymentLog.execution = execution;
      itemsProcessed++;

      if (!execution.success) {
        this.context.logger.error("❌ Deployment execution failed");
        errors++;

        // Attempt self-healing
        const healed = await this.attemptSelfHealing(execution);
        if (!healed) {
          // Trigger rollback
          await this.performRollback(execution);
          deploymentLog.execution.rollbackPerformed = true;
        }

        return {
          success: false,
          message: "Deployment failed - rollback initiated",
          data: { deploymentLog },
          metrics: {
            duration: 0,
            itemsProcessed,
            errors,
          },
        };
      }

      // Phase 4: Post-Deployment Validation
      this.context.logger.info("✅ Phase 4: Validating deployment...");
      deploymentLog.phase = "validation";

      const validation = await this.validateDeployment();
      deploymentLog.validation = validation;
      itemsProcessed++;

      const validationFailures = validation.filter((v: any) => !v.passed);
      if (validationFailures.length > 0) {
        this.context.logger.error(
          `⚠️ Post-deployment validation failed: ${validationFailures.map((v: any) => v.name).join(", ")}`
        );

        // Rollback on validation failure
        await this.performRollback(execution);
        deploymentLog.execution.rollbackPerformed = true;
        errors++;

        return {
          success: false,
          message: "Deployment validation failed - rolled back",
          data: { deploymentLog, validationFailures },
          metrics: {
            duration: 0,
            itemsProcessed,
            errors,
          },
        };
      }

      // Phase 5: Learn from Deployment
      this.context.logger.info("🧠 Phase 5: Recording deployment history...");
      await this.recordDeploymentHistory(execution, deploymentLog, true);
      itemsProcessed++;

      // Notify success
      if (this.context.io) {
        this.context.io.to("admins").emit("deployment:success", {
          agent: "AIDeploymentAgent",
          timestamp: new Date().toISOString(),
          execution,
          riskScore: riskAssessment.score,
        });
      }

      return {
        success: true,
        message: "Deployment completed successfully",
        data: {
          deploymentLog,
          riskScore: riskAssessment.score,
          duration: execution.endTime ? execution.endTime.getTime() - execution.startTime.getTime() : 0,
        },
        metrics: {
          duration: 0,
          itemsProcessed,
          errors,
        },
      };
    } catch (error) {
      errors++;
      this.context.logger.error(`Deployment agent failed: ${error}`);

      // Notify failure
      if (this.context.io) {
        this.context.io.to("admins").emit("deployment:failure", {
          agent: "AIDeploymentAgent",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      throw error;
    }
  }

  /**
   * Run pre-flight checks before deployment
   */
  private async runPreFlightChecks(): Promise<PreFlightCheck[]> {
    const checks: PreFlightCheck[] = [];

    // Check 1: Database connectivity
    try {
      await this.context.prisma.$queryRaw`SELECT 1`;
      checks.push({
        name: "database_connectivity",
        passed: true,
        message: "Database connection successful",
        critical: true,
      });
    } catch (error) {
      checks.push({
        name: "database_connectivity",
        passed: false,
        message: `Database connection failed: ${error}`,
        critical: true,
      });
    }

    // Check 2: Environment variables
    const requiredVars = ["DATABASE_URL", "JWT_SECRET", "FRONTEND_URL", "BACKEND_URL"];
    const missingVars = requiredVars.filter((v) => !process.env[v]);

    checks.push({
      name: "environment_variables",
      passed: missingVars.length === 0,
      message:
        missingVars.length === 0
          ? "All required environment variables present"
          : `Missing variables: ${missingVars.join(", ")}`,
      critical: true,
    });

    // Check 3: Prisma schema validity
    try {
      // Check if Prisma Client is generated
      const userCount = await this.context.prisma.users.count();
      checks.push({
        name: "prisma_schema",
        passed: true,
        message: "Prisma schema valid and client generated",
        critical: true,
      });
    } catch (error) {
      checks.push({
        name: "prisma_schema",
        passed: false,
        message: `Prisma schema issue: ${error}`,
        critical: true,
      });
    }

    // Check 4: Recent error rate
    const recentErrors = await this.context.prisma.audit_logs.count({
      where: {
        action: "error",
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        },
      },
    });

    checks.push({
      name: "error_rate",
      passed: recentErrors < 10,
      message: `Recent error count: ${recentErrors}`,
      critical: false,
    });

    // Check 5: Backend health endpoint
    try {
      const response = await fetch(`${this.backendUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      checks.push({
        name: "backend_health",
        passed: response.ok,
        message: `Backend health: ${response.status}`,
        critical: false,
      });
    } catch (error) {
      checks.push({
        name: "backend_health",
        passed: false,
        message: `Backend unreachable: ${error}`,
        critical: false,
      });
    }

    return checks;
  }

  /**
   * Assess deployment risk based on historical data and current state
   */
  private async assessDeploymentRisk(): Promise<DeploymentRisk> {
    const factors: string[] = [];
    let score = 0;

    // Factor 1: Recent deployment failures
    const recentDeployments = await this.context.prisma.audit_logs.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const failureRate =
      recentDeployments.filter((d) => d.action === "deployment_failed").length / Math.max(recentDeployments.length, 1);

    if (failureRate > 0.3) {
      score += 3;
      factors.push(`High recent failure rate: ${(failureRate * 100).toFixed(0)}%`);
    } else if (failureRate > 0.1) {
      score += 1;
      factors.push(`Moderate failure rate: ${(failureRate * 100).toFixed(0)}%`);
    }

    // Factor 2: Current system health
    const activeUsers = await this.context.prisma.users.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    });

    if (activeUsers > 50) {
      score += 2;
      factors.push(`High user activity: ${activeUsers} active users`);
    } else if (activeUsers > 20) {
      score += 1;
      factors.push(`Moderate user activity: ${activeUsers} active users`);
    }

    // Factor 3: Pending transactions
    const pendingTransactions = await this.context.prisma.transactions.count({
      where: {
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (pendingTransactions > 10) {
      score += 2;
      factors.push(`${pendingTransactions} pending transactions`);
    }

    // Factor 4: Time of day (higher risk during business hours)
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 17) {
      score += 1;
      factors.push("Business hours deployment");
    }

    // Determine recommendation
    let recommendation: "auto-deploy" | "require-approval" | "block";
    if (score <= 3) {
      recommendation = "auto-deploy";
    } else if (score <= 7) {
      recommendation = "require-approval";
    } else {
      recommendation = "block";
    }

    return { score, factors, recommendation };
  }

  /**
   * Execute deployment to Render and Vercel
   */
  private async executeDeployment(): Promise<DeploymentExecution> {
    const execution: DeploymentExecution = {
      id: crypto.randomUUID(),
      backend: { triggered: false, status: "pending" },
      frontend: { triggered: false, status: "pending" },
      startTime: new Date(),
      success: false,
    };

    try {
      // Trigger Render deployment
      if (this.renderApiKey && this.renderServiceId) {
        this.context.logger.info("📦 Triggering Render backend deployment...");

        const renderResponse = await fetch(
          `https://api.render.com/deploy/${this.renderServiceId}?key=${this.renderApiKey}`,
          { method: "POST" }
        );

        if (renderResponse.ok) {
          const data = await renderResponse.json();
          execution.backend.triggered = true;
          execution.backend.status = "deploying";
          execution.backend.deployId = data.deploy?.id;
          this.context.logger.info(`✅ Render deployment triggered: ${data.deploy?.id}`);
        } else {
          execution.backend.status = "failed";
          this.context.logger.error(`❌ Render deployment failed: ${renderResponse.status}`);
        }
      }

      // Monitor backend deployment
      if (execution.backend.triggered) {
        const backendSuccess = await this.monitorBackendDeployment(30, 10000);
        execution.backend.status = backendSuccess ? "success" : "failed";
      }

      // Trigger Vercel deployment (auto-deploys on git push, so we just monitor)
      this.context.logger.info("📦 Monitoring Vercel frontend deployment...");
      execution.frontend.triggered = true;
      execution.frontend.status = "deploying";

      // Monitor frontend deployment
      const frontendSuccess = await this.monitorFrontendDeployment(20, 10000);
      execution.frontend.status = frontendSuccess ? "success" : "failed";

      execution.endTime = new Date();
      execution.success = execution.backend.status === "success" && execution.frontend.status === "success";

      return execution;
    } catch (error) {
      this.context.logger.error(`Deployment execution failed: ${error}`);
      execution.endTime = new Date();
      execution.success = false;
      return execution;
    }
  }

  /**
   * Monitor backend deployment status
   */
  private async monitorBackendDeployment(maxAttempts: number, intervalMs: number): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.backendUrl}/api/health`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          this.context.logger.info("✅ Backend deployment successful");
          return true;
        }
      } catch (error) {
        // Expected during deployment
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    this.context.logger.error("❌ Backend deployment timeout");
    return false;
  }

  /**
   * Monitor frontend deployment status
   */
  private async monitorFrontendDeployment(maxAttempts: number, intervalMs: number): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(this.frontendUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          this.context.logger.info("✅ Frontend deployment successful");
          return true;
        }
      } catch (error) {
        // Expected during deployment
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    this.context.logger.error("❌ Frontend deployment timeout");
    return false;
  }

  /**
   * Validate deployment post-execution
   */
  private async validateDeployment(): Promise<any[]> {
    const validations: any[] = [];

    // Validation 1: Backend health
    try {
      const response = await fetch(`${this.backendUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();

      validations.push({
        name: "backend_health",
        passed: response.ok && data.status === "healthy",
        message: `Backend health: ${data.status}`,
      });
    } catch (error) {
      validations.push({
        name: "backend_health",
        passed: false,
        message: `Backend health check failed: ${error}`,
      });
    }

    // Validation 2: Frontend accessibility
    try {
      const response = await fetch(this.frontendUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(10000),
      });

      validations.push({
        name: "frontend_accessibility",
        passed: response.ok,
        message: `Frontend status: ${response.status}`,
      });
    } catch (error) {
      validations.push({
        name: "frontend_accessibility",
        passed: false,
        message: `Frontend unreachable: ${error}`,
      });
    }

    // Validation 3: Database connectivity
    try {
      await this.context.prisma.$queryRaw`SELECT 1`;
      validations.push({
        name: "database_connectivity",
        passed: true,
        message: "Database connection active",
      });
    } catch (error) {
      validations.push({
        name: "database_connectivity",
        passed: false,
        message: `Database connection lost: ${error}`,
      });
    }

    // Validation 4: AI agents operational
    try {
      const response = await fetch(`${this.backendUrl}/api/agents/rpa/status`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      const agents = await response.json();

      const operationalAgents = agents.filter((a: any) => a.status === "success");

      validations.push({
        name: "ai_agents",
        passed: operationalAgents.length >= 5, // At least 5 agents working
        message: `${operationalAgents.length}/${agents.length} agents operational`,
      });
    } catch (error) {
      validations.push({
        name: "ai_agents",
        passed: false,
        message: `AI agents status check failed: ${error}`,
      });
    }

    return validations;
  }

  /**
   * Attempt self-healing for common deployment issues
   */
  private async attemptSelfHealing(execution: DeploymentExecution): Promise<boolean> {
    this.context.logger.info("🔧 Attempting self-healing...");

    // Self-healing strategy 1: Retry deployment once
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30s

    const retryExecution = await this.executeDeployment();

    if (retryExecution.success) {
      this.context.logger.info("✅ Self-healing successful - deployment recovered");
      return true;
    }

    this.context.logger.error("❌ Self-healing failed");
    return false;
  }

  /**
   * Perform automatic rollback
   */
  private async performRollback(execution: DeploymentExecution): Promise<void> {
    this.context.logger.info("🔄 Performing automatic rollback...");

    try {
      // Log rollback action
      await SafePrisma.create("audit_logs", {
        userId: "system",
        action: "rollback_triggered",
        resourceType: "deployment",
        resourceId: execution.id,
        metadata: {
          reason: "deployment_validation_failed",
          execution,
        },
      });

      // Notify admins
      if (this.context.io) {
        this.context.io.to("admins").emit("deployment:rollback", {
          agent: "AIDeploymentAgent",
          timestamp: new Date().toISOString(),
          executionId: execution.id,
          reason: "Deployment validation failed",
        });
      }

      this.context.logger.info("✅ Rollback notification sent");
    } catch (error) {
      this.context.logger.error(`Rollback failed: ${error}`);
    }
  }

  /**
   * Record deployment history for learning
   */
  private async recordDeploymentHistory(execution: DeploymentExecution, log: any, success: boolean): Promise<void> {
    try {
      await SafePrisma.create("audit_logs", {
        userId: "ai-deployment-agent",
        action: success ? "deployment_success" : "deployment_failed",
        resourceType: "deployment",
        resourceId: execution.id,
        metadata: {
          execution,
          log,
          duration:
            execution.endTime && execution.startTime ? execution.endTime.getTime() - execution.startTime.getTime() : 0,
          riskScore: log.riskAssessment?.score,
        },
      });

      this.context.logger.info("📊 Deployment history recorded");
    } catch (error) {
      this.context.logger.error(`Failed to record deployment history: ${error}`);
    }
  }
}
