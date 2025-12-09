#!/usr/bin/env tsx
/**
 * Verify Agent Worker Setup
 * Checks that all components are properly configured
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Verifying Agent Worker Setup...\n');

const checks: Array<{ name: string; status: boolean; message: string }> = [];

// Check 1: Worker file exists
const workerPath = path.join(__dirname, '../lib/agents/worker.ts');
checks.push({
  name: 'Worker Implementation',
  status: fs.existsSync(workerPath),
  message: workerPath,
});

// Check 2: Checkpoint manager exists
const checkpointPath = path.join(__dirname, '../lib/agents/checkpoint-manager.ts');
checks.push({
  name: 'Checkpoint Manager',
  status: fs.existsSync(checkpointPath),
  message: checkpointPath,
});

// Check 3: Job handlers exist
const handlersPath = path.join(__dirname, '../lib/agents/job-handlers.ts');
checks.push({
  name: 'Job Handlers',
  status: fs.existsSync(handlersPath),
  message: handlersPath,
});

// Check 4: API endpoints exist
const apiPaths = [
  '../app/api/agent-jobs/route.ts',
  '../app/api/agent-jobs/[jobId]/route.ts',
  '../app/api/admin/agent-checkpoints/route.ts',
  '../app/api/admin/agent-worker/route.ts',
  '../app/api/metrics/route.ts',
];

apiPaths.forEach((apiPath) => {
  const fullPath = path.join(__dirname, apiPath);
  checks.push({
    name: `API: ${path.basename(path.dirname(apiPath))}`,
    status: fs.existsSync(fullPath),
    message: apiPath,
  });
});

// Check 5: Admin UI exists
const adminUIPath = path.join(__dirname, '../app/(admin)/admin/agent-checkpoints/page.tsx');
checks.push({
  name: 'Admin UI',
  status: fs.existsSync(adminUIPath),
  message: adminUIPath,
});

// Check 6: Tests exist
const testPaths = ['../__tests__/agents/worker.test.ts', '../__tests__/agents/checkpoints.test.ts'];

testPaths.forEach((testPath) => {
  const fullPath = path.join(__dirname, testPath);
  checks.push({
    name: `Test: ${path.basename(testPath)}`,
    status: fs.existsSync(fullPath),
    message: testPath,
  });
});

// Check 7: Prometheus exporter exists
const metricsPath = path.join(__dirname, '../lib/monitoring/prometheus-exporter.ts');
checks.push({
  name: 'Prometheus Exporter',
  status: fs.existsSync(metricsPath),
  message: metricsPath,
});

// Display results
console.log('📋 Setup Verification Results:\n');

let allPassed = true;
checks.forEach((check) => {
  const icon = check.status ? '✅' : '❌';
  const status = check.status ? 'PASS' : 'FAIL';
  console.log(`${icon} ${check.name.padEnd(30)} ${status}`);
  if (!check.status) {
    allPassed = false;
    console.log(`   └─ Missing: ${check.message}`);
  }
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('✅ All checks passed! Agent Worker system is ready.\n');
  console.log('🚀 Next steps:');
  console.log('   1. Ensure database is running');
  console.log('   2. Run: npm run prisma:migrate');
  console.log('   3. Start worker: npm run worker:start');
  console.log('   4. Test: npm run worker:test');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please review the errors above.\n');
  process.exit(1);
}
