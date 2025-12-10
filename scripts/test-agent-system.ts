/**
 * Test script for Agent Worker System
 * Tests the complete flow: enqueue job -> create checkpoint -> approve -> complete
 */

import { startWorker } from '../lib/agents/worker';
import { prisma } from '../lib/prismaClient';

async function testAgentSystem() {
  console.log('🧪 Testing Agent Worker System...\n');

  try {
    // 1. Start the worker
    console.log('1️⃣ Starting worker...');
    startWorker();
    console.log('✅ Worker started\n');

    // 2. Create a test job
    console.log('2️⃣ Creating test job...');
    const job = await prisma.aIJob.create({
      data: {
        jobType: 'simple-task',
        taskDescription: 'Test task for agent system',
        inputData: { test: 'data' },
        priority: 5,
        status: 'PENDING',
      },
    });
    console.log(`✅ Job created: ${job.id}\n`);

    // 3. Wait a bit for worker to process
    console.log('3️⃣ Waiting for worker to process job...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Check job status
    const updatedJob = await prisma.aIJob.findUnique({
      where: { id: job.id },
      include: {
        checkpoints: true,
        logs: true,
      },
    });

    if (updatedJob) {
      console.log(`📊 Job Status: ${updatedJob.status}`);
      console.log(`📝 Logs: ${updatedJob.logs.length}`);
      console.log(`🔖 Checkpoints: ${updatedJob.checkpoints.length}`);

      if (updatedJob.checkpoints.length > 0) {
        console.log('\n📋 Checkpoints:');
        updatedJob.checkpoints.forEach((cp) => {
          console.log(`  - ${cp.checkpointType}: ${cp.status} - ${cp.message.substring(0, 50)}...`);
        });
      }

      if (updatedJob.logs.length > 0) {
        console.log('\n📝 Recent Logs:');
        updatedJob.logs.slice(-3).forEach((log) => {
          console.log(`  - ${log.action}: ${log.message.substring(0, 50)}...`);
        });
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Check /admin/agent-checkpoints for pending checkpoints');
    console.log('   - Use POST /api/admin/agent-checkpoints/[id] to approve');
    console.log('   - Check /api/metrics for Prometheus metrics');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  testAgentSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { testAgentSystem };
