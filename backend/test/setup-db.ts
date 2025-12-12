import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient({
  log: process.env.DEBUG ? ["query", "info", "warn", "error"] : [],
});

/**
 * Sets up the test database by applying migrations and cleaning existing data
 */
export async function setupTestDatabase() {
  // Ensure test environment is set
  process.env.NODE_ENV = "test";

  // Ensure test database URL is set and points to a test database
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl.includes("test")) {
    throw new Error('❌ DATABASE_URL must point to a test database (should include "test" in the name)');
  }

  try {
    console.log("🔄 Setting up test database...");
    console.log(`📝 Using database: ${dbUrl.split("@")[1] || dbUrl}`);

    // 1. Connect to the database
    await prisma.$connect();

    // 2. Drop and recreate the public schema
    console.log("🧹 Cleaning database...");
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prisma.$executeRaw`CREATE SCHEMA public`;
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO postgres`;
    await prisma.$executeRaw`GRANT ALL ON SCHEMA public TO public`;

    // 3. Apply all migrations
    console.log("🔄 Applying database migrations...");
    try {
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
          NODE_ENV: "test",
        },
      });
    } catch (migrateError) {
      console.error("❌ Failed to apply migrations:", migrateError);
      throw migrateError;
    }

    console.log("✅ Test database setup complete");
  } catch (error) {
    console.error("❌ Failed to setup test database:");
    console.error(error);
    throw error; // Re-throw to be handled by the test runner
  }
}

/**
 * Cleans the test database by truncating all tables and resetting sequences
 */
export async function cleanTestDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("cleanTestDatabase() can only be used in test environment");
  }

  try {
    // Get all tables in the public schema
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '_prisma_migrations'
    `;

    if (tables.length > 0) {
      // Disable all triggers temporarily
      await prisma.$executeRaw`SET session_replication_role = 'replica'`;

      // Truncate all tables
      const tableNames = tables.map((t) => `"${t.tablename}"`).join(", ");
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE`);

      // Reset all sequences
      const sequences = await prisma.$queryRaw<Array<{ sequence_name: string }>>`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
      `;

      for (const seq of sequences) {
        try {
          await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
        } catch (seqError) {
          console.warn(`⚠️ Could not reset sequence ${seq.sequence_name}:`, seqError);
        }
      }

      // Re-enable triggers
      await prisma.$executeRaw`SET session_replication_role = 'origin'`;

      console.log(`🧹 Cleaned ${tables.length} tables`);
    }
  } catch (error) {
    console.error("❌ Error cleaning test database:");
    console.error(error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupTestDatabase().catch(console.error);
}
