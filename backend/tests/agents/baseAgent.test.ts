import type { PrismaClient } from "@prisma/client";
import {
  AgentConfig,
  AgentContext,
  AgentLogger,
  AgentResult,
  BaseAgent,
} from "../../src/agents/BaseAgent";
import { AgentScheduler } from "../../src/agents/scheduler";

const createMockLogger = (): AgentLogger => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

class StubAgent extends BaseAgent {
  private readonly executor: () => Promise<AgentResult>;

  constructor(
    executor: () => Promise<AgentResult>,
    context: AgentContext,
    configOverrides: Partial<AgentConfig> = {}
  ) {
    const baseConfig: AgentConfig = {
      name: "StubAgent",
      enabled: true,
      schedule: "* * * * *",
      retryAttempts: 0,
      timeout: 1000,
      priority: "low",
      description: "Stub agent for testing",
    };

    super({ ...baseConfig, ...configOverrides }, context);
    this.executor = executor;
  }

  protected execute(): Promise<AgentResult> {
    return this.executor();
  }
}

const createContext = (): AgentContext => ({
  prisma: {} as PrismaClient,
  io: undefined,
  logger: createMockLogger(),
});

describe("BaseAgent", () => {
  it("records successful execution metadata", async () => {
    const context = createContext();
    const agent = new StubAgent(
      async () => ({
        success: true,
        message: "All good",
        data: { value: 42 },
        metrics: { duration: 0, itemsProcessed: 3, errors: 0 },
      }),
      context,
      { name: "SuccessAgent" }
    );

    const result = await agent.run();

    expect(result.success).toBe(true);
    expect(result.message).toBe("All good");
    expect(result.metrics?.itemsProcessed).toBe(3);
    expect(result.metrics?.duration).toBeGreaterThanOrEqual(0);

    expect(agent.getLastRun()).toEqual(result);
    expect(agent.getLastRunAt()).toBeInstanceOf(Date);

    const infoCalls = (context.logger.info as jest.Mock).mock.calls;
    expect(infoCalls[0][0]).toContain("[SuccessAgent] Starting execution");
    expect(infoCalls[1][0]).toContain("[SuccessAgent] Completed in");
    expect(infoCalls[1][1]).toEqual(result);
  });

  it("captures failures and normalizes error results", async () => {
    const context = createContext();
    const failure = new Error("Boom");
    const agent = new StubAgent(
      async () => {
        throw failure;
      },
      context,
      { name: "FailureAgent" }
    );

    const result = await agent.run();

    expect(result.success).toBe(false);
    expect(result.message).toBe("Boom");
    expect(result.metrics?.errors).toBe(1);
    expect(result.metrics?.itemsProcessed).toBe(0);

    expect(agent.getLastRun()).toEqual(result);
    expect(agent.getLastRunAt()).toBeInstanceOf(Date);

    expect(context.logger.error).toHaveBeenCalledWith(
      expect.stringContaining("[FailureAgent] Failed"),
      failure
    );
  });
});

describe("AgentScheduler", () => {
  it("includes last run metadata in agent status", async () => {
    const scheduler = new AgentScheduler({} as PrismaClient);
    const context = createContext();
    const agent = new StubAgent(
      async () => ({
        success: true,
        message: "Executed",
        metrics: { duration: 0, itemsProcessed: 1, errors: 0 },
      }),
      context,
      { name: "MetadataAgent", description: "Metadata tracking" }
    );

    await agent.run();
    (scheduler as unknown as { agents: BaseAgent[] }).agents = [agent];

    const status = scheduler.getAgentStatus();

    expect(status).toHaveLength(1);
    expect(status[0]).toMatchObject({
      name: "MetadataAgent",
      description: "Metadata tracking",
      enabled: true,
      lastRunSuccessful: true,
      lastRunMessage: "Executed",
    });
    expect(status[0].lastRunAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
