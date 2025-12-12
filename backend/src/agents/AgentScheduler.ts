import cron from "node-cron";
import { BaseAgent } from "./BaseAgent";

export class AgentScheduler {
  private agents: BaseAgent[];

  constructor(agents: BaseAgent[]) {
    this.agents = agents;
  }

  scheduleAll(cronPattern = "*/5 * * * *") {
    this.agents.forEach((agent) => {
      cron.schedule(cronPattern, async () => {
        try {
          await agent.run();
        } catch (err) {
          console.error(`Agent ${agent.getName()} failed:`, err);
        }
      });
    });
  }

  getAgentMetadata() {
    return this.agents.map((a) => a.metadata);
  }

  async runAllOnce() {
    for (const agent of this.agents) {
      try {
        await agent.run();
      } catch (err) {
        console.error(`Agent ${agent.getName()} failed:`, err);
      }
    }
  }
}
