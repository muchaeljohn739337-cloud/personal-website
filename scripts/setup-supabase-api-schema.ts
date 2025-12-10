/**
 * Setup Supabase API Schema
 * Creates api schema and sets up proper permissions for Supabase API access
 * Reference: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function setupApiSchema() {
  console.log('🔧 Setting up Supabase API Schema...\n');
  console.log('📋 Project:', supabaseUrl);
  console.log('');

  // Read SQL migration file
  const sqlPath = join(process.cwd(), 'prisma', 'migrations', 'setup_api_schema.sql');
  let sqlContent: string;

  try {
    sqlContent = readFileSync(sqlPath, 'utf-8');
  } catch (error) {
    console.error('❌ Could not read SQL migration file:', sqlPath);
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  console.log('📝 SQL Migration Script:');
  console.log('─'.repeat(60));
  console.log(sqlContent);
  console.log('─'.repeat(60));
  console.log('');

  console.log('💡 Instructions:');
  console.log('');
  console.log('1. Go to Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/sql/new');
  console.log('');
  console.log('2. Copy and paste the SQL script above into the SQL Editor');
  console.log('');
  console.log('3. Run the script to:');
  console.log('   - Create api schema');
  console.log('   - Grant permissions to anon and authenticated roles');
  console.log('   - Enable Row Level Security (RLS)');
  console.log('');
  console.log('4. Update Prisma schema to use api schema:');
  console.log('   - Add @@schema("api") to each model');
  console.log('   - Or set default schema in datasource');
  console.log('');
  console.log('5. Run Prisma migrations:');
  console.log('   npm run prisma:migrate');
  console.log('');
  console.log('6. Verify tables are in api schema:');
  console.log("   SELECT table_name FROM information_schema.tables WHERE table_schema = 'api';");
  console.log('');

  // List common tables that need to be in api schema
  const commonTables = [
    'User',
    'Wallet',
    'Transaction',
    'Payment',
    'Subscription',
    'Organization',
    'Workspace',
    'BlogPost',
    'Post',
    'Comment',
    'admin_actions',
  ];

  console.log('📊 Expected Tables in api schema:');
  commonTables.forEach((table) => {
    console.log(`   - ${table}`);
  });
  console.log('');

  console.log('✅ Setup instructions provided!');
  console.log('');
  console.log('⚠️  Important:');
  console.log('   - Run the SQL script in Supabase Dashboard SQL Editor');
  console.log('   - Update Prisma schema to use api schema');
  console.log('   - Re-run migrations to create tables in api schema');
  console.log('   - Update code to reference api schema tables');
}

setupApiSchema().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
