#!/usr/bin/env tsx
/**
 * Database Connection Check
 * Verifies database is accessible before starting worker
 */

import { prisma } from '../lib/prismaClient';

async function checkDatabase() {
  console.log('🔍 Checking database connection...\n');

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    console.log('✅ Database connection successful!');
    console.log(`   Latency: ${latency}ms\n`);

    // Check if agent_checkpoints table exists
    try {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'agent_checkpoints'
      `;

      if (result[0]?.count && Number(result[0].count) > 0) {
        console.log('✅ agent_checkpoints table exists');
      } else {
        console.log('⚠️  agent_checkpoints table not found');
        console.log('   Run: npm run prisma:migrate');
      }
    } catch (error) {
      console.log('⚠️  Could not verify agent_checkpoints table');
    }

    // Check if ai_jobs table exists
    try {
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'ai_jobs'
      `;

      if (result[0]?.count && Number(result[0].count) > 0) {
        console.log('✅ ai_jobs table exists\n');
      } else {
        console.log('⚠️  ai_jobs table not found\n');
      }
    } catch (error) {
      console.log('⚠️  Could not verify ai_jobs table\n');
    }

    console.log('✅ Database is ready for agent worker!\n');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    console.log('💡 Troubleshooting:');
    console.log('   1. Check DATABASE_URL in .env file');
    console.log('   2. Ensure database server is running');
    console.log('   3. Verify network connectivity');
    console.log('   4. Check database credentials\n');
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
