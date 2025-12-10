/**
 * Agent Worker Initialization
 * Auto-starts the worker when the module is imported (if enabled)
 */

import { startWorker } from './worker';

// Only auto-start if explicitly enabled via environment variable
if (process.env.ENABLE_AGENT_WORKER === 'true') {
  console.log('[AgentWorker] Auto-starting worker...');
  startWorker({
    pollInterval: parseInt(process.env.AGENT_WORKER_POLL_INTERVAL || '5000', 10),
    maxConcurrentJobs: parseInt(process.env.AGENT_WORKER_MAX_JOBS || '3', 10),
    enableSentry: process.env.NODE_ENV === 'production',
  });
}
