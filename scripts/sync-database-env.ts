#!/usr/bin/env tsx
/**
 * Sync Database Environment Variables
 * Copies DATABASE_URL from .env to .env.local and fixes port for pooling
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function syncDatabaseEnv() {
  const envPath = join(process.cwd(), '.env');
  const envLocalPath = join(process.cwd(), '.env.local');

  if (!existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }

  console.log('📝 Reading .env file...\n');
  const envContent = readFileSync(envPath, 'utf-8');

  // Extract DATABASE_URL from .env
  const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (!dbUrlMatch) {
    console.error('❌ DATABASE_URL not found in .env');
    process.exit(1);
  }

  let dbUrl = dbUrlMatch[1].trim();
  console.log(`Found DATABASE_URL: ${dbUrl.replace(/:[^@]+@/, ':****@')}\n`);

  // Fix port for connection pooling (should be 6543)
  if (dbUrl.includes('pooler.supabase.com')) {
    // Replace port 5432 with 6543 for pooling
    dbUrl = dbUrl.replace(/:5432\//, ':6543/');

    // Add pgbouncer parameter if not present
    if (!dbUrl.includes('pgbouncer=true')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    console.log('✅ Updated to use connection pooling (port 6543)\n');
  }

  // Create DIRECT_URL (port 5432, no pgbouncer)
  let directUrl = dbUrl
    .replace(':6543/', ':5432/')
    .replace(/[?&]pgbouncer=true/, '')
    .replace(/[?&]sslmode=[^&]*/, '');

  // Ensure DIRECT_URL doesn't have pgbouncer
  if (directUrl.includes('?')) {
    directUrl = directUrl.split('?')[0];
  }

  // Read or create .env.local
  let envLocalContent = '';
  if (existsSync(envLocalPath)) {
    envLocalContent = readFileSync(envLocalPath, 'utf-8');
    console.log('📝 Reading existing .env.local...\n');
  } else {
    console.log('📝 Creating new .env.local...\n');
  }

  // Update or add DATABASE_URL
  const lines = envLocalContent.split('\n');
  let updated = false;
  let dbUrlLineIndex = -1;
  let directUrlLineIndex = -1;

  lines.forEach((line, index) => {
    if (line.startsWith('DATABASE_URL=')) {
      dbUrlLineIndex = index;
    }
    if (line.startsWith('DIRECT_URL=')) {
      directUrlLineIndex = index;
    }
  });

  // Update DATABASE_URL
  if (dbUrlLineIndex >= 0) {
    lines[dbUrlLineIndex] = `DATABASE_URL=${dbUrl}`;
    console.log('✅ Updated DATABASE_URL in .env.local');
  } else {
    // Add after last existing line or at end
    lines.push(`DATABASE_URL=${dbUrl}`);
    console.log('✅ Added DATABASE_URL to .env.local');
  }
  updated = true;

  // Update DIRECT_URL
  if (directUrlLineIndex >= 0) {
    lines[directUrlLineIndex] = `DIRECT_URL=${directUrl}`;
    console.log('✅ Updated DIRECT_URL in .env.local');
  } else {
    // Add after DATABASE_URL
    const dbIndex = lines.findIndex((l) => l.startsWith('DATABASE_URL='));
    if (dbIndex >= 0) {
      lines.splice(dbIndex + 1, 0, `DIRECT_URL=${directUrl}`);
    } else {
      lines.push(`DIRECT_URL=${directUrl}`);
    }
    console.log('✅ Added DIRECT_URL to .env.local');
  }

  if (updated) {
    writeFileSync(envLocalPath, lines.join('\n'), 'utf-8');
    console.log(`\n✅ Updated ${envLocalPath}\n`);
    console.log('💡 Connection strings:');
    console.log(`   DATABASE_URL: ${dbUrl.replace(/:[^@]+@/, ':****@')}`);
    console.log(`   DIRECT_URL: ${directUrl.replace(/:[^@]+@/, ':****@')}\n`);
    console.log('🚀 Next: Test connection with: npm run worker:check-db\n');
  }
}

syncDatabaseEnv();
