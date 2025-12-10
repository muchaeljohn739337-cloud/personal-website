#!/usr/bin/env tsx
/**
 * Setup Notes Table in Supabase
 * Creates the notes table and sets up RLS policies
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const envLocalPath = join(process.cwd(), '.env.local');
if (require('fs').existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL or DIRECT_URL not found in environment variables');
  console.error('   Please set DATABASE_URL or DIRECT_URL in .env.local');
  process.exit(1);
}

async function setupNotesTable() {
  console.log('📝 Setting up notes table in Supabase...\n');

  try {
    // Read SQL file
    const sqlPath = join(process.cwd(), 'prisma/migrations/create_notes_table.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL to execute:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    console.log('\n');

    // Use Prisma to execute SQL
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: DATABASE_URL,
        },
      },
    });

    // Execute SQL statements
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          // Ignore "already exists" errors
          if (error instanceof Error && error.message.includes('already exists')) {
            console.log('⚠️  Already exists:', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ Error:', error);
          }
        }
      }
    }

    console.log('\n✅ Notes table setup complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Visit: http://localhost:3000/notes');
    console.log('   2. You should see the sample notes\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error setting up notes table:', error);
    console.error('\n💡 You can also run the SQL manually in Supabase Dashboard:');
    console.error('   Go to: Database → SQL Editor\n');
    process.exit(1);
  }
}

setupNotesTable();
