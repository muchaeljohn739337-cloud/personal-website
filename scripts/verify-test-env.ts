#!/usr/bin/env tsx
/**
 * Verify Test Environment Variables
 * Checks if all required test environment variables are set
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment files
const envFiles = ['.env.test.local', '.env.local', '.env'];
let loaded = false;

for (const file of envFiles) {
  const path = resolve(process.cwd(), file);
  if (existsSync(path)) {
    dotenv.config({ path });
    if (!loaded) {
      console.log(`📄 Loaded: ${file}`);
      loaded = true;
    }
  }
}

interface EnvVar {
  name: string;
  value: string | undefined;
  required: boolean;
  description: string;
}

const testVars: EnvVar[] = [
  {
    name: 'DATABASE_URL_TEST',
    value: process.env.DATABASE_URL_TEST,
    required: false,
    description: 'Test database connection URL',
  },
  {
    name: 'TEST_USER_EMAIL',
    value: process.env.TEST_USER_EMAIL,
    required: false,
    description: 'Test user email for E2E tests',
  },
  {
    name: 'TEST_USER_PASSWORD',
    value: process.env.TEST_USER_PASSWORD,
    required: false,
    description: 'Test user password for E2E tests',
  },
  {
    name: 'NODE_ENV',
    value: process.env.NODE_ENV,
    required: false,
    description: 'Node environment (should be "test" for tests)',
  },
];

console.log('🔍 Verifying test environment variables...\n');

let allGood = true;
const missing: string[] = [];
const present: string[] = [];

for (const envVar of testVars) {
  if (envVar.value) {
    const displayValue =
      envVar.name.includes('PASSWORD') || envVar.name.includes('SECRET')
        ? '****'
        : envVar.value.length > 50
          ? `${envVar.value.substring(0, 50)}...`
          : envVar.value;

    console.log(`✅ ${envVar.name}`);
    console.log(`   Value: ${displayValue}`);
    console.log(`   Description: ${envVar.description}`);
    present.push(envVar.name);
  } else {
    const status = envVar.required ? '❌' : '⚠️';
    console.log(`${status} ${envVar.name}`);
    console.log(`   Status: ${envVar.required ? 'REQUIRED - Missing!' : 'Optional - Not set'}`);
    console.log(`   Description: ${envVar.description}`);
    if (envVar.required) {
      missing.push(envVar.name);
      allGood = false;
    }
  }
  console.log('');
}

// Summary
console.log('📊 Summary:');
console.log(`   ✅ Present: ${present.length}/${testVars.length}`);
console.log(`   ${missing.length > 0 ? '❌' : '✅'} Missing: ${missing.length}`);

if (missing.length > 0) {
  console.log('\n⚠️  Missing required variables:');
  missing.forEach((name) => console.log(`   - ${name}`));
}

console.log('\n💡 Next Steps:');

if (missing.length > 0) {
  console.log('   1. Set missing required variables');
  console.log('   2. Create .env.test.local file (see env.example)');
  console.log('   3. Or set GitHub Secrets for CI/CD');
} else if (present.length === 0) {
  console.log('   1. Create .env.test.local file');
  console.log('   2. Copy from env.example');
  console.log('   3. Update with your test values');
  console.log('   4. Or use: bash scripts/setup-test-env.sh');
} else {
  console.log('   1. All variables are set!');
  console.log('   2. Run: npm run test:db (to test connection)');
  console.log('   3. Run: npm test (to run unit tests)');
}

console.log('');

// Exit with appropriate code
process.exit(allGood ? 0 : 1);
