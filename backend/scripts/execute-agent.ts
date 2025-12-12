// Manual Agent Execution Script
// Run specific agents on-demand for testing or emergency execution

import { PrismaClient } from "@prisma/client";
import { getAgentScheduler } from "../src/agents/scheduler";

const prisma = new PrismaClient();

async function executeAgent(agentName: string) {
  console.log(`\n🤖 Executing ${agentName}...\n`);
  
  const scheduler = getAgentScheduler(prisma);
  scheduler.initialize();
  
  try {
    const result = await scheduler.executeAgent(agentName);
    
    console.log("\n✅ Agent Execution Complete");
    console.log("═══════════════════════════════════════");
    console.log(`Agent: ${agentName}`);
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message}`);
    console.log(`Duration: ${result.metrics.duration}ms`);
    console.log(`Items Processed: ${result.metrics.itemsProcessed}`);
    
    if (result.data) {
      console.log("\nResult Data:");
      console.log(JSON.stringify(result.data, null, 2));
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log("\n⚠️  Errors:");
      result.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
  } catch (error) {
    console.error("\n❌ Agent Execution Failed:");
    console.error(error);
    process.exit(1);
  } finally {
    scheduler.stop();
    await prisma.$disconnect();
  }
}

// Get agent name from command line
const agentName = process.argv[2];

if (!agentName) {
  console.log("\n📋 Available Agents:");
  console.log("  - MonitorAgent");
  console.log("  - TransactionAuditAgent");
  console.log("  - CryptoRecoveryAgent");
  console.log("  - UserSupportAgent");
  console.log("  - AdminInsightAgent");
  console.log("  - SecurityFraudAgent");
  console.log("  - CompliancePolicyAgent");
  console.log("  - CostOptimizationAgent");
  console.log("  - DeployOrchestratorAgent");
  console.log("\n💡 Usage: npm run execute-agent MonitorAgent\n");
  process.exit(0);
}

executeAgent(agentName)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
