/**
 * Supabase Auto-Setup Script
 * Automatically configures Supabase for SaaS application
 * Detects environment and sets up all required components
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

interface SetupResult {
  step: string;
  success: boolean;
  message: string;
  details?: string[];
}

const results: SetupResult[] = [];

function logResult(step: string, success: boolean, message: string, details?: string[]) {
  results.push({ step, success, message, details });
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${step}: ${message}`);
  if (details) {
    details.forEach((detail) => console.log(`   - ${detail}`));
  }
}

// =============================================================================
// 1. DETECT PROJECT ENVIRONMENT
// =============================================================================

function detectEnvironment() {
  console.log('🔍 Detecting Project Environment...\n');

  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    logResult('Environment Detection', false, 'package.json not found');
    process.exit(1);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  const projectType = packageJson.dependencies?.next ? 'Next.js' : 'Node.js';
  const packageManager = existsSync(join(process.cwd(), 'yarn.lock')) ? 'yarn' : 'npm';
  const hasTypeScript = existsSync(join(process.cwd(), 'tsconfig.json'));

  logResult('Environment Detection', true, 'Project detected', [
    `Type: ${projectType}`,
    `Package Manager: ${packageManager}`,
    `TypeScript: ${hasTypeScript ? 'Yes' : 'No'}`,
    `Node Version: ${process.version}`,
  ]);

  return { projectType, packageManager, hasTypeScript, packageJson };
}

// =============================================================================
// 2. INSTALL REQUIRED LIBRARIES
// =============================================================================

function installLibraries(packageManager: string) {
  console.log('\n📦 Installing Supabase Libraries...\n');

  const requiredPackages = ['@supabase/supabase-js', '@supabase/ssr'];
  const missingPackages: string[] = [];

  requiredPackages.forEach((pkg) => {
    try {
      execSync(`${packageManager} list ${pkg}`, { stdio: 'ignore' });
    } catch {
      missingPackages.push(pkg);
    }
  });

  if (missingPackages.length > 0) {
    try {
      const installCmd = packageManager === 'yarn' ? 'yarn add' : 'npm install';
      execSync(`${installCmd} ${missingPackages.join(' ')}`, { stdio: 'inherit' });
      logResult('Library Installation', true, 'Installed missing packages', missingPackages);
    } catch (error) {
      logResult('Library Installation', false, 'Failed to install packages', [
        error instanceof Error ? error.message : String(error),
      ]);
    }
  } else {
    logResult(
      'Library Installation',
      true,
      'All required packages already installed',
      requiredPackages
    );
  }
}

// =============================================================================
// 3. INITIALIZE SUPABASE
// =============================================================================

function initializeSupabase() {
  console.log('\n🔧 Initializing Supabase...\n');

  const supabaseDir = join(process.cwd(), 'supabase');
  const configPath = join(supabaseDir, 'config.toml');

  if (existsSync(configPath)) {
    logResult('Supabase Init', true, 'Supabase already initialized', [`Config: ${configPath}`]);
    return;
  }

  try {
    // Check if supabase CLI is installed
    execSync('supabase --version', { stdio: 'ignore' });

    // Initialize Supabase
    execSync('supabase init', { stdio: 'inherit', cwd: process.cwd() });
    logResult('Supabase Init', true, 'Supabase initialized successfully');
  } catch (error) {
    logResult('Supabase Init', false, 'Supabase CLI not installed or init failed', [
      'Install: npm install -g supabase',
      'Or use Supabase Dashboard for remote setup',
      error instanceof Error ? error.message : String(error),
    ]);
  }
}

// =============================================================================
// 4. SETUP VAULT / SECRETS
// =============================================================================

function setupVault() {
  console.log('\n🔐 Setting up Vault / Secrets...\n');

  const envLocalPath = join(process.cwd(), '.env.local');
  const envExamplePath = join(process.cwd(), 'env.example');

  // Check required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing: string[] = [];
  const present: string[] = [];

  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    logResult('Vault Setup', false, 'Missing environment variables', [
      ...missing.map((v) => `- ${v}`),
      'Set these in .env.local or Supabase Dashboard Vault',
    ]);
  } else {
    logResult('Vault Setup', true, 'All required variables present', present);
  }

  // Create .env.local if it doesn't exist
  if (!existsSync(envLocalPath) && existsSync(envExamplePath)) {
    try {
      const exampleContent = readFileSync(envExamplePath, 'utf-8');
      writeFileSync(envLocalPath, exampleContent);
      logResult('Vault Setup', true, 'Created .env.local from env.example');
    } catch (error) {
      logResult('Vault Setup', false, 'Failed to create .env.local', [
        error instanceof Error ? error.message : String(error),
      ]);
    }
  }

  // Instructions for Vault
  console.log('\n💡 Vault Secrets Setup:');
  console.log(
    '   1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets'
  );
  console.log('   2. Store sensitive keys in Vault');
  console.log("   3. Access via SQL: SELECT vault.get_secret('secret_name');");
}

// =============================================================================
// 5. CONFIGURE AUTHENTICATION
// =============================================================================

function configureAuthentication() {
  console.log('\n🔑 Configuring Authentication...\n');

  // Check if auth utilities exist
  const authPath = join(process.cwd(), 'lib', 'supabase', 'auth.ts');
  const exists = existsSync(authPath);

  if (exists) {
    logResult('Authentication', true, 'Auth utilities already configured', [
      'File: lib/supabase/auth.ts',
      'Methods: signUp, signIn, signInWithOtp, signInWithOAuth, etc.',
    ]);
  } else {
    logResult('Authentication', false, 'Auth utilities not found', ['Create lib/supabase/auth.ts']);
  }

  // Instructions for auth providers
  console.log('\n💡 Authentication Provider Setup:');
  console.log(
    '   1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/providers'
  );
  console.log('   2. Enable Email/Password (default)');
  console.log('   3. Enable OAuth providers (Google, GitHub, etc.)');
  console.log('   4. Configure redirect URLs');
}

// =============================================================================
// 6. CONFIGURE STORAGE
// =============================================================================

function configureStorage() {
  console.log('\n📦 Configuring Storage...\n');

  const storagePath = join(process.cwd(), 'lib', 'storage', 'supabase.ts');
  const exists = existsSync(storagePath);

  if (exists) {
    logResult('Storage', true, 'Storage utilities already configured', [
      'File: lib/storage/supabase.ts',
      'Buckets: blog-images, user-avatars, workspace-assets, ai-outputs, documents',
    ]);
  } else {
    logResult('Storage', false, 'Storage utilities not found');
  }

  // Storage buckets to create
  const buckets = [
    { name: 'user-avatars', public: true },
    { name: 'blog-images', public: true },
    { name: 'workspace-assets', public: false },
    { name: 'ai-outputs', public: false },
    { name: 'documents', public: false },
  ];

  console.log('\n💡 Storage Buckets Setup:');
  console.log(
    '   1. Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files'
  );
  buckets.forEach((bucket) => {
    console.log(`   2. Create bucket: ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });
}

// =============================================================================
// 7. GENERATE WRAPPER FUNCTIONS
// =============================================================================

function generateWrappers() {
  console.log('\n🛠️  Generating Wrapper Functions...\n');

  const wrappersDir = join(process.cwd(), 'lib', 'supabase', 'wrappers');

  if (!existsSync(wrappersDir)) {
    mkdirSync(wrappersDir, { recursive: true });
  }

  // Check existing wrappers
  const existingWrappers = [
    'lib/supabase/auth.ts',
    'lib/supabase/database.ts',
    'lib/supabase/admin-actions.ts',
    'lib/storage/supabase.ts',
  ];

  const found: string[] = [];
  existingWrappers.forEach((wrapper) => {
    if (existsSync(join(process.cwd(), wrapper))) {
      found.push(wrapper);
    }
  });

  logResult('Wrapper Functions', found.length > 0, `${found.length} wrapper(s) found`, found);

  // Create additional wrapper if needed
  const queriesWrapperPath = join(wrappersDir, 'queries.ts');
  if (!existsSync(queriesWrapperPath)) {
    const queriesWrapper = `/**
 * Supabase Query Wrappers
 * Reusable functions for common database operations
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface QueryOptions {
  select?: string;
  filter?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface QueryResult<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

/**
 * Generic query wrapper with error handling
 */
export async function queryTable<T = unknown>(
  tableName: string,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  try {
    let query = supabase.from(tableName).select(options.select || '*', { count: 'exact' });

    // Apply filters
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true,
      });
    }

    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error: new Error(error.message), count: count || undefined };
    }

    return { data: data as T[], error: null, count: count || undefined };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Get single record by ID
 */
export async function getById<T = unknown>(
  tableName: string,
  id: string,
  select?: string
): Promise<QueryResult<T>> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(select || '*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: [data as T], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Insert record
 */
export async function insertRecord<T = unknown>(
  tableName: string,
  record: T
): Promise<QueryResult<T>> {
  try {
    const { data, error } = await supabase.from(tableName).insert(record as never).select();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T[], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Update record
 */
export async function updateRecord<T = unknown>(
  tableName: string,
  id: string,
  updates: Partial<T>
): Promise<QueryResult<T>> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .update(updates as never)
      .eq('id', id)
      .select();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as T[], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Delete record
 */
export async function deleteRecord(tableName: string, id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from(tableName).delete().eq('id', id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
`;

    writeFileSync(queriesWrapperPath, queriesWrapper);
    logResult('Wrapper Functions', true, 'Created queries wrapper', [
      'File: lib/supabase/wrappers/queries.ts',
    ]);
  }
}

// =============================================================================
// 8. SETUP API SCHEMA
// =============================================================================

function setupApiSchema() {
  console.log('\n🗄️  Setting up API Schema...\n');

  const sqlPath = join(process.cwd(), 'prisma', 'migrations', 'setup_api_schema.sql');
  const exists = existsSync(sqlPath);

  if (exists) {
    logResult('API Schema', true, 'API schema setup script found', [
      'File: prisma/migrations/setup_api_schema.sql',
      'Run: npm run setup:supabase:api:schema',
    ]);
  } else {
    logResult('API Schema', false, 'API schema setup script not found');
  }

  console.log('\n💡 API Schema Setup:');
  console.log('   1. Run: npm run setup:supabase:api:schema');
  console.log('   2. Follow SQL instructions in Supabase Dashboard');
  console.log('   3. Grant permissions to anon and authenticated roles');
  console.log('   4. See: SUPABASE_API_SCHEMA_SETUP.md');
}

// =============================================================================
// 9. OUTPUT SUMMARY
// =============================================================================

function outputSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUPABASE AUTO-SETUP SUMMARY');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  results.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.step}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      result.details.forEach((detail) => console.log(`   - ${detail}`));
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  console.log('='.repeat(60));

  console.log('\n📝 Next Steps:');
  console.log('   1. Set up API schema: npm run setup:supabase:api:schema');
  console.log('   2. Configure auth providers in Supabase Dashboard');
  console.log('   3. Create storage buckets in Supabase Dashboard');
  console.log('   4. Set up Vault secrets for sensitive keys');
  console.log('   5. Test authentication: npm run test:supabase:auth');
  console.log('   6. Deploy: npm run deploy:production');
  console.log('');

  console.log('🔗 Dashboard Links:');
  console.log('   - Project: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi');
  console.log(
    '   - Auth: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/providers'
  );
  console.log(
    '   - Storage: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files'
  );
  console.log(
    '   - Vault: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets'
  );
  console.log(
    '   - SQL Editor: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/sql/new'
  );
  console.log('');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('🚀 Supabase Auto-Setup for SaaS Application\n');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Detect environment
    const env = detectEnvironment();

    // 2. Install libraries
    installLibraries(env.packageManager);

    // 3. Initialize Supabase
    initializeSupabase();

    // 4. Setup Vault
    setupVault();

    // 5. Configure Authentication
    configureAuthentication();

    // 6. Configure Storage
    configureStorage();

    // 7. Generate Wrappers
    generateWrappers();

    // 8. Setup API Schema
    setupApiSchema();

    // 9. Output Summary
    outputSummary();
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
