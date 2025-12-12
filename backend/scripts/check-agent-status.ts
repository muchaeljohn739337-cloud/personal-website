// Agent Status Checker
// View the status and configuration of all agents

import { PrismaClient } from "@prisma/client";
import { getAgentScheduler } from "../src/agents/scheduler";

const prisma = new PrismaClient();

async function checkAgentStatus() {
  console.log("\n🤖 Agent Scheduler Status\n");

  const scheduler = getAgentScheduler(prisma);
  scheduler.initialize();

  try {
    const agentStatuses = scheduler.getAgentStatus();

    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log(`Total Agents: ${agentStatuses.length}`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );

    agentStatuses.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`);
      console.log(`   Priority: ${agent.priority}`);
      console.log(`   Schedule: ${agent.schedule}`);
      console.log(`   Description: ${agent.description}`);
      console.log(`   Enabled: ${agent.enabled ? "✅ Yes" : "❌ No"}`);
      if (agent.lastRunAt) {
        const statusEmoji = agent.lastRunSuccessful ? "✅" : "⚠️";
        console.log(
          `   Last Run: ${agent.lastRunAt} ${statusEmoji} ${
            agent.lastRunMessage ?? ""
          }`
        );
      } else {
        console.log("   Last Run: ❓ Never executed");
      }
      console.log("");
    });

    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log("\n💡 To execute an agent manually:");
    console.log("   npm run execute-agent <AgentName>\n");
  } catch (error) {
    console.error("\n❌ Failed to get agent status:");
    console.error(error);
    process.exit(1);
  } finally {
    scheduler.stop();
    await prisma.$disconnect();
  }
}

checkAgentStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
