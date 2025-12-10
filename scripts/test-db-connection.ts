#!/usr/bin/env tsx
/**
 * Test Database Connection Script
 * Tests connection to the test database using DATABASE_URL_TEST
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.test.local') });
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

const DATABASE_URL_TEST =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  'postgresql://test:test@localhost:5432/test';

console.log('🧪 Testing database connection...');
console.log(`📊 Database URL: ${DATABASE_URL_TEST.replace(/:[^:@]+@/, ':****@')}`);
console.log('');

async function testConnection() {
  const pool = new Pool({
    connectionString: DATABASE_URL_TEST,
    // SSL configuration for cloud databases
    ssl:
      DATABASE_URL_TEST.includes('supabase') ||
      DATABASE_URL_TEST.includes('pooler') ||
      DATABASE_URL_TEST.includes('amazonaws')
        ? { rejectUnauthorized: false }
        : false,
  });

  const client = await pool.connect();

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const result = await client.query('SELECT 1 as test, version() as pg_version');
    console.log('   ✅ Connection successful!');
    console.log(`   📌 PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]}`);
    console.log('');

    // Test 2: Database name
    console.log('2️⃣ Checking database name...');
    const dbResult = await client.query('SELECT current_database() as db_name');
    console.log(`   ✅ Connected to database: ${dbResult.rows[0].db_name}`);
    console.log('');

    // Test 3: Check if Prisma tables exist (optional)
    console.log('3️⃣ Checking for Prisma migrations...');
    try {
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 5
      `);
      if (tablesResult.rows.length > 0) {
        console.log(`   ✅ Found ${tablesResult.rows.length} table(s) in database`);
        console.log(`   📋 Tables: ${tablesResult.rows.map((r) => r.table_name).join(', ')}`);
      } else {
        console.log('   ⚠️  No tables found (database may need migrations)');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check tables (this is okay for new databases)');
    }
    console.log('');

    console.log('✅ All tests passed! Database connection is working.');
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify DATABASE_URL_TEST is correct');
    console.error('   2. Ensure database is running');
    console.error('   3. Check network connectivity');
    console.error('   4. Verify credentials are correct');
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run test
testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
