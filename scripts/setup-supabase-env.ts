/**
 * Setup Supabase Environment Variables
 * Copies Supabase configuration from env.example to .env.local
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const envExamplePath = join(process.cwd(), 'env.example');
const envLocalPath = join(process.cwd(), '.env.local');

interface EnvVar {
  key: string;
  value: string;
  comment?: string;
}

function extractSupabaseVars(content: string): EnvVar[] {
  const vars: EnvVar[] = [];
  const lines = content.split('\n');
  let currentComment = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Capture comments
    if (line.startsWith('#') && !line.startsWith('# ')) {
      currentComment = line.substring(1).trim();
      continue;
    }

    // Extract Supabase variables
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_') || line.startsWith('SUPABASE_')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        vars.push({
          key,
          value,
          comment: currentComment || undefined,
        });
        currentComment = '';
      }
    }
  }

  return vars;
}

function setupSupabaseEnv() {
  console.log('🔧 Setting up Supabase environment variables...\n');

  // Check if env.example exists
  if (!existsSync(envExamplePath)) {
    console.error('❌ env.example not found!');
    process.exit(1);
  }

  // Read env.example
  const envExampleContent = readFileSync(envExamplePath, 'utf-8');
  const supabaseVars = extractSupabaseVars(envExampleContent);

  if (supabaseVars.length === 0) {
    console.error('❌ No Supabase variables found in env.example!');
    process.exit(1);
  }

  console.log(`📋 Found ${supabaseVars.length} Supabase variables:\n`);
  supabaseVars.forEach(({ key, value }) => {
    const displayValue = value.length > 50 ? `${value.substring(0, 50)}...` : value;
    console.log(`   ${key}=${displayValue}`);
  });

  // Read or create .env.local
  let envLocalContent = '';
  if (existsSync(envLocalPath)) {
    envLocalContent = readFileSync(envLocalPath, 'utf-8');
    console.log('\n✅ .env.local exists, updating Supabase variables...\n');
  } else {
    console.log('\n📝 Creating new .env.local file...\n');
  }

  // Update or add Supabase variables
  const lines = envLocalContent.split('\n');
  const updatedLines: string[] = [];
  const existingKeys = new Set<string>();

  // Process existing lines
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([^=]+)=/);
    if (match) {
      const key = match[1].trim();
      if (key.startsWith('NEXT_PUBLIC_SUPABASE_') || key.startsWith('SUPABASE_')) {
        existingKeys.add(key);
        // Skip this line, we'll add updated version later
        continue;
      }
    }
    updatedLines.push(line);
  }

  // Add Supabase section if not present
  if (!envLocalContent.includes('# Supabase')) {
    updatedLines.push('');
    updatedLines.push(
      '# =============================================================================='
    );
    updatedLines.push('# SUPABASE CONFIGURATION');
    updatedLines.push(
      '# =============================================================================='
    );
  }

  // Add updated Supabase variables
  supabaseVars.forEach(({ key, value, comment }) => {
    if (comment) {
      updatedLines.push(`# ${comment}`);
    }
    updatedLines.push(`${key}=${value}`);
    existingKeys.add(key);
  });

  // Write updated .env.local
  const updatedContent = updatedLines.join('\n');
  writeFileSync(envLocalPath, updatedContent, 'utf-8');

  console.log('✅ Supabase environment variables configured successfully!');
  console.log('\n📝 Updated .env.local with:');
  supabaseVars.forEach(({ key }) => {
    console.log(`   ✓ ${key}`);
  });

  console.log('\n💡 Next steps:');
  console.log('   1. Review .env.local to ensure all values are correct');
  console.log('   2. Add your DATABASE_URL with actual password');
  console.log('   3. Run: npm run test:supabase:auth');
  console.log(
    '   4. Access Supabase Dashboard: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi'
  );
}

setupSupabaseEnv();
