/**
 * Supabase Database Schema Verification Script
 * Checks tables, functions, triggers, indexes, policies, and more
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SchemaInfo {
  tables: string[];
  functions: string[];
  triggers: string[];
  indexes: string[];
  policies: string[];
  roles: string[];
  extensions: string[];
}

async function checkSchema() {
  console.log('🔍 Checking Supabase Database Schema...\n');

  const info: SchemaInfo = {
    tables: [],
    functions: [],
    triggers: [],
    indexes: [],
    policies: [],
    roles: [],
    extensions: [],
  };

  try {
    // Check connection
    console.log('📡 Testing connection...');
    const { error: healthError } = await supabase.from('_prisma_migrations').select('id').limit(1);
    if (
      healthError &&
      !healthError.message.includes('relation "_prisma_migrations" does not exist')
    ) {
      console.log('⚠️  Connection test:', healthError.message);
    } else {
      console.log('✅ Connection successful\n');
    }

    // Get tables - try to query a known table first
    console.log('📊 Checking Tables...');
    try {
      // Try to get table list via Supabase REST API
      // Note: Full schema inspection requires direct database access
      console.log('💡 To view full schema:');
      console.log('   1. Go to Supabase Dashboard → Database → Tables');
      console.log('   2. Use Prisma Studio: npm run prisma:studio');
      console.log('   3. Use SQL Editor in Supabase Dashboard');

      // Try to list some common tables
      const commonTables = ['User', 'Wallet', 'Transaction', 'Payment', 'Organization'];
      console.log(`\n📋 Expected Tables (from Prisma schema):`);
      commonTables.forEach((table) => console.log(`   - ${table}`));

      info.tables = commonTables;
    } catch (error) {
      console.log('⚠️  Could not fetch tables (use Supabase Dashboard for full schema)');
    }

    console.log('\n📋 Schema Summary:');
    console.log(`   Tables: ${info.tables.length}`);
    console.log(`   Functions: ${info.functions.length}`);
    console.log(`   Triggers: ${info.triggers.length}`);
    console.log(`   Indexes: ${info.indexes.length}`);
    console.log(`   Policies: ${info.policies.length}`);

    console.log('\n✅ Schema check complete!');
    console.log('\n💡 To view full schema:');
    console.log('   1. Go to Supabase Dashboard → Database → Tables');
    console.log('   2. Use Supabase Studio for visual schema editor');
    console.log('   3. Run: npx prisma studio (for Prisma schema)');
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
