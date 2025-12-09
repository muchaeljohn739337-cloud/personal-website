#!/usr/bin/env tsx
/**
 * Standalone Agent Worker Script
 * Run this script to start the agent worker as a separate process
 *
 * Usage:
 *   npm run worker:start
 *   or
 *   npx tsx scripts/start-agent-worker.ts
 */

import { getWorker, startWorker } from '../lib/agents/worker';

console.log('🚀 Starting Agent Worker...\n');

// Start the worker
startWorker({
  pollInterval: parseInt(process.env.AGENT_WORKER_POLL_INTERVAL || '5000', 10),
  maxConcurrentJobs: parseInt(process.env.AGENT_WORKER_MAX_JOBS || '3', 10),
  enableSentry: process.env.NODE_ENV === 'production',
});

const worker = getWorker();

// Log worker status
console.log('✅ Worker started successfully!\n');
console.log('📊 Worker Stats:');
console.log(JSON.stringify(worker.getStats(), null, 2));
console.log('\n💡 Worker is now processing jobs...');
console.log('   Press Ctrl+C to stop\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping worker...');
  worker.stop();
  console.log('✅ Worker stopped. Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping worker...');
  worker.stop();
  console.log('✅ Worker stopped. Goodbye!');
  process.exit(0);
});

// Keep the process alive
setInterval(() => {
  const stats = worker.getStats();
  if (stats.isRunning) {
    // Worker is healthy, do nothing
  }
}, 60000); // Check every minute
