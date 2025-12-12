import { RpaAgent1 } from "../../../src/agents/rpa/Agent1";

describe("RpaAgent1", () => {
  it("should run and update status", async () => {
    const agent = new RpaAgent1();
    await agent.run();
    expect(agent.metadata.status).toBe("success");
    expect(agent.metadata.lastRun).not.toBeNull();
    expect(agent.metadata.lastResult).toBeDefined();
  });
});