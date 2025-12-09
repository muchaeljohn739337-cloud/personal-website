#!/usr/bin/env tsx
/**
 * Fix Database Connection
 * Updates DATABASE_URL to use correct Supabase pooling port
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

function fixDatabaseConnection() {
  const envPath = join(process.cwd(), '.env');
  const envLocalPath = join(process.cwd(), '.env.local');

  // Check which file exists
  const filePath = existsSync(envLocalPath) ? envLocalPath : existsSync(envPath) ? envPath : null;

  if (!filePath) {
    console.error('❌ No .env or .env.local file found');
    console.log('💡 Create .env.local file with your DATABASE_URL');
    process.exit(1);
  }

  console.log(`📝 Reading ${filePath}...\n`);

  let content = readFileSync(filePath, 'utf-8');
  let updated = false;

  // Fix DATABASE_URL - should use port 6543 for pooling
  if (content.includes('DATABASE_URL=')) {
    const lines = content.split('\n');
    const updatedLines = lines.map((line) => {
      if (line.startsWith('DATABASE_URL=')) {
        let url = line.substring('DATABASE_URL='.length).trim();
        
        // Check if it's using wrong port or missing pooling
        if (url.includes(':5432/') && !url.includes('pooler')) {
          // Replace port 5432 with 6543 and add pgbouncer
          url = url.replace(':5432/', ':6543/');
          if (!url.includes('pgbouncer=true')) {
            url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
          }
          console.log('✅ Updated DATABASE_URL to use connection pooling (port 6543)');
          updated = true;
          return `DATABASE_URL=${url}`;
        } else if (url.includes('pooler.supabase.com') && !url.includes(':6543')) {
          // Fix if using pooler but wrong port
          url = url.replace(/:(\d+)\//, ':6543/');
          if (!url.includes('pgbouncer=true')) {
            url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
          }
          console.log('✅ Updated DATABASE_URL to use correct pooling port');
          updated = true;
          return `DATABASE_URL=${url}`;
        }
      }
      return line;
    });

    content = updatedLines.join('\n');
  }

  // Ensure DIRECT_URL exists for migrations
  if (!content.includes('DIRECT_URL=') && content.includes('DATABASE_URL=')) {
    const dbUrlMatch = content.match(/DATABASE_URL=(.+)/);
    if (dbUrlMatch) {
      let directUrl = dbUrlMatch[1]
        .replace(':6543/', ':5432/')
        .replace(/[?&]pgbouncer=true/, '')
        .replace(/[?&]sslmode=[^&]*/, '');
      
      // Add DIRECT_URL after DATABASE_URL
      content = content.replace(
        /(DATABASE_URL=.+)/,
        `$1\nDIRECT_URL=${directUrl}`
      );
      console.log('✅ Added DIRECT_URL for migrations');
      updated = true;
    }
  }

  if (updated) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`\n✅ Updated ${filePath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Verify DATABASE_URL uses port 6543 with ?pgbouncer=true');
    console.log('   2. Verify DIRECT_URL uses port 5432 (for migrations)');
    console.log('   3. Test connection: npm run worker:check-db\n');
  } else {
    console.log('✅ DATABASE_URL is already correctly configured\n');
  }
}

fixDatabaseConnection();

