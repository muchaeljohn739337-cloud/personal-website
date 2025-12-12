// Agent Scheduler - Orchestrates all RPA agents
// Initializes and schedules agent execution using node-cron

import { PrismaClient } from "@prisma/client";
import cron, { ScheduledTask } from "node-cron";
import { Server as SocketIOServer } from "socket.io";
import { AgentContext, AgentLogger, BaseAgent } from "./BaseAgent";

// Import all agents
import { AdminInsightAgent } from "./AdminInsightAgent";
import { AIBuilderAgent } from "./AIBuilderAgent";
import { AIDeploymentAgent } from "./AIDeploymentAgent";
import { BlockchainVerificationAgent } from "./BlockchainVerificationAgent";
import { BugFixAgent } from "./BugFixAgent";
import { CompliancePolicyAgent } from "./CompliancePolicyAgent";
import { CopilotAgent } from "./CopilotAgent";
import { CostOptimizationAgent } from "./CostOptimizationAgent";
import { CryptoRecoveryAgent } from "./CryptoRecoveryAgent";
import { DeployOrchestratorAgent } from "./DeployOrchestratorAgent";
import { MarketIntelligenceAgent } from "./MarketIntelligenceAgent";
import { MonitorAgent } from "./MonitorAgent";
import { ProjectPlannerAgent } from "./ProjectPlannerAgent";
import { SecurityFraudAgent } from "./SecurityFraudAgent";
import { SEOOptimizationAgent } from "./SEOOptimizationAgent";
import { SocialMediaAgent } from "./SocialMediaAgent";
import { SuggestionAgent } from "./SuggestionAgent";
import { TransactionAuditAgent } from "./TransactionAuditAgent";
import { UserSupportAgent } from "./UserSupportAgent";
import { VaultRotationAgent } from "./VaultRotationAgent";

// Simple logger implementation
const createLogger = (agentName: string): AgentLogger => ({
  info: (message: string, metadata?: any) => {
    console.log(`[${new Date().toISOString()}] [INFO] [${agentName}] ${message}`, metadata || "");
  },
  warn: (message: string, metadata?: any) => {
    console.warn(`[${new Date().toISOString()}] [WARN] [${agentName}] ${message}`, metadata || "");
  },
  error: (message: string, error?: any) => {
    console.error(`[${new Date().toISOString()}] [ERROR] [${agentName}] ${message}`, error || "");
  },
  debug: (message: string, metadata?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${agentName}] ${message}`, metadata || "");
    }
  },
});

export class AgentScheduler {
  private prisma: PrismaClient;
  private io?: SocketIOServer;
  private agents: BaseAgent[] = [];
  private tasks: ScheduledTask[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  initialize(): void {
    console.log("[AgentScheduler] Initializing RPA agents...");

    // Create agent context
    const createContext = (agentName: string): AgentContext => ({
      prisma: this.prisma,
      io: this.io,
      logger: createLogger(agentName),
    });

    // Initialize all agents
    const monitorAgent = new MonitorAgent(createContext("MonitorAgent"));
    const transactionAuditAgent = new TransactionAuditAgent(createContext("TransactionAuditAgent"));
    const cryptoRecoveryAgent = new CryptoRecoveryAgent(createContext("CryptoRecoveryAgent"));
    const userSupportAgent = new UserSupportAgent(createContext("UserSupportAgent"));
    const adminInsightAgent = new AdminInsightAgent(createContext("AdminInsightAgent"));
    const securityFraudAgent = new SecurityFraudAgent(createContext("SecurityFraudAgent"));
    const compliancePolicyAgent = new CompliancePolicyAgent(createContext("CompliancePolicyAgent"));
    const costOptimizationAgent = new CostOptimizationAgent(createContext("CostOptimizationAgent"));
    const deployOrchestratorAgent = new DeployOrchestratorAgent(createContext("DeployOrchestratorAgent"));
    const aiDeploymentAgent = new AIDeploymentAgent(createContext("AIDeploymentAgent"));
    const blockchainVerificationAgent = new BlockchainVerificationAgent(createContext("BlockchainVerificationAgent"));
    const marketIntelligenceAgent = new MarketIntelligenceAgent(createContext("MarketIntelligenceAgent"));
    const bugFixAgent = new BugFixAgent(createContext("BugFixAgent"));
    const suggestionAgent = new SuggestionAgent(createContext("SuggestionAgent"));
    const vaultRotationAgent = new VaultRotationAgent(createContext("VaultRotationAgent"));
    const copilotAgent = new CopilotAgent(createContext("CopilotAgent"));
    const aiBuilderAgent = new AIBuilderAgent(createContext("AIBuilderAgent"));
    const seoOptimizationAgent = new SEOOptimizationAgent(createContext("SEOOptimizationAgent"));
    const socialMediaAgent = new SocialMediaAgent(createContext("SocialMediaAgent"));
    const projectPlannerAgent = new ProjectPlannerAgent(createContext("ProjectPlannerAgent"));

    // Store agents for manual execution
    this.agents = [
      monitorAgent,
      transactionAuditAgent,
      cryptoRecoveryAgent,
      userSupportAgent,
      adminInsightAgent,
      securityFraudAgent,
      compliancePolicyAgent,
      costOptimizationAgent,
      deployOrchestratorAgent,
      aiDeploymentAgent,
      blockchainVerificationAgent,
      marketIntelligenceAgent,
      bugFixAgent,
      suggestionAgent,
      vaultRotationAgent,
      copilotAgent,
      aiBuilderAgent,
      seoOptimizationAgent,
      socialMediaAgent,
      projectPlannerAgent,
    ];

    // Schedule agents
    this.scheduleAgent(monitorAgent);
    this.scheduleAgent(transactionAuditAgent);
    this.scheduleAgent(cryptoRecoveryAgent);
    this.scheduleAgent(userSupportAgent);
    this.scheduleAgent(adminInsightAgent);
    this.scheduleAgent(securityFraudAgent);
    this.scheduleAgent(compliancePolicyAgent);
    this.scheduleAgent(costOptimizationAgent);
    this.scheduleAgent(deployOrchestratorAgent);
    this.scheduleAgent(aiDeploymentAgent);
    this.scheduleAgent(blockchainVerificationAgent);
    this.scheduleAgent(marketIntelligenceAgent);
    this.scheduleAgent(bugFixAgent);
    this.scheduleAgent(suggestionAgent);
    this.scheduleAgent(vaultRotationAgent);
    this.scheduleAgent(copilotAgent);
    this.scheduleAgent(seoOptimizationAgent); // Daily at 2 AM
    this.scheduleAgent(socialMediaAgent); // Every 30 minutes
    this.scheduleAgent(projectPlannerAgent); // Every 6 hours

    console.log(`[AgentScheduler] ${this.agents.length} agents initialized`);
  }

  private scheduleAgent(agent: BaseAgent): void {
    const config = agent.getConfig();

    if (!config.enabled) {
      console.log(`[AgentScheduler] ${config.name} is disabled, skipping`);
      return;
    }

    // Skip manual agents (triggered on-demand)
    if (config.schedule === "manual") {
      console.log(`[AgentScheduler] ${config.name} is manual, skipping schedule`);
      return;
    }

    const task = cron.schedule(
      config.schedule,
      async () => {
        try {
          const result = await agent.run();
          console.log(`[AgentScheduler] ${config.name} completed:`, result.message);
        } catch (error) {
          console.error(`[AgentScheduler] ${config.name} failed:`, error);
        }
      },
      {
        timezone: "UTC",
      }
    );

    this.tasks.push(task);
    console.log(`[AgentScheduler] Scheduled ${config.name}: ${config.schedule}`);
  }

  async executeAgent(agentName: string): Promise<any> {
    const agent = this.agents.find((a) => a.getConfig().name === agentName);

    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    return await agent.run();
  }

  getAgentStatus(): any[] {
    return this.agents.map((agent) => {
      const config = agent.getConfig();
      const lastRun = agent.getLastRun();
      const lastRunAt = agent.getLastRunAt();

      return {
        name: config.name,
        description: config.description ?? "",
        enabled: config.enabled,
        schedule: config.schedule,
        priority: config.priority,
        retryAttempts: config.retryAttempts,
        timeout: config.timeout,
        lastRunSuccessful: lastRun?.success ?? null,
        lastRunMessage: lastRun?.message ?? null,
        lastRunAt: lastRunAt ? lastRunAt.toISOString() : null,
      };
    });
  }

  getAgents(): BaseAgent[] {
    return this.agents;
  }

  stop(): void {
    console.log("[AgentScheduler] Stopping all agents...");
    this.tasks.forEach((task) => task.stop());
    console.log("[AgentScheduler] All agents stopped");
  }
}

// Singleton instance
let schedulerInstance: AgentScheduler | null = null;

export const getAgentScheduler = (prisma: PrismaClient): AgentScheduler => {
  if (!schedulerInstance) {
    schedulerInstance = new AgentScheduler(prisma);
  }
  return schedulerInstance;
};
