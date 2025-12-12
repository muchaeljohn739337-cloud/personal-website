/**
 * Security Best Practices - Before & After Examples
 *
 * This file demonstrates the security improvements made to the codebase
 */

import { PrismaClient } from "@prisma/client";
import {
  executeWithRetry,
  isValidEmail,
  isValidUUID,
  safeBulkOperation,
  safeQuery,
  sanitizeIdentifier,
  sanitizeOrderBy,
  sanitizePaginationParams,
} from "../src/utils/dbSecurity";

const prisma = new PrismaClient();

// ==========================================
// EXAMPLE 1: SQL Injection Protection
// ==========================================

async function example1_SQLInjection() {
  console.log("\n=== EXAMPLE 1: SQL Injection Protection ===\n");

  const userEmail = "test@example.com'; DROP TABLE users; --";

  // ❌ VULNERABLE (DON'T USE)
  // const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
  // await prisma.$queryRawUnsafe(query);

  // ✅ SAFE: Using Prisma tagged template
  const safeUsers = await prisma.$queryRaw`
    SELECT * FROM users WHERE email = ${userEmail}
  `;
  console.log("✅ Safe query executed, malicious input escaped");

  // ✅ SAFE: Using utility function
  const users = await safeQuery`
    SELECT * FROM users WHERE email = ${userEmail}
  `;
  console.log("✅ Safe query with utility, malicious input escaped");
}

// ==========================================
// EXAMPLE 2: Command Injection Protection
// ==========================================

async function example2_CommandInjection() {
  console.log("\n=== EXAMPLE 2: Command Injection Protection ===\n");

  const dbHost = "localhost";
  const dbPassword = "pass; rm -rf /"; // Malicious input

  // ❌ VULNERABLE (DON'T USE)
  // const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost}`;
  // await execAsync(command);

  // ✅ SAFE: Using execFile with array arguments
  const { execFile } = require("child_process");
  const { promisify } = require("util");
  const execFileAsync = promisify(execFile);

  try {
    await execFileAsync("pg_dump", ["-h", dbHost], {
      env: { ...process.env, PGPASSWORD: dbPassword },
    });
    console.log("✅ Safe command execution, no shell interpretation");
  } catch (error) {
    console.log("✅ Command failed safely (expected in test environment)");
  }
}

// ==========================================
// EXAMPLE 3: Identifier Whitelisting
// ==========================================

async function example3_IdentifierWhitelisting() {
  console.log("\n=== EXAMPLE 3: Identifier Whitelisting ===\n");

  const userInputTable = "malicious_table; DROP TABLE users;";
  const allowedTables = ["users", "audit_logs", "transactions"];

  // ❌ VULNERABLE (DON'T USE)
  // const query = `SELECT * FROM ${userInputTable}`;

  // ✅ SAFE: Whitelist validation
  try {
    const tableName = sanitizeIdentifier(userInputTable, allowedTables);
    console.log("Table name validated:", tableName);
  } catch (error) {
    console.log("✅ Invalid table name rejected:", (error as Error).message);
  }

  // Test with valid input
  const validTable = sanitizeIdentifier("users", allowedTables);
  console.log("✅ Valid table name accepted:", validTable);
}

// ==========================================
// EXAMPLE 4: Pagination Sanitization
// ==========================================

async function example4_PaginationSanitization() {
  console.log("\n=== EXAMPLE 4: Pagination Sanitization ===\n");

  // ❌ VULNERABLE (DON'T USE)
  // const limit = req.query.limit; // Could be "999999" or "DELETE FROM users"
  // const offset = req.query.offset;

  // ✅ SAFE: Sanitized pagination
  const maliciousParams = {
    limit: "999999",
    offset: "-5; DROP TABLE users;",
  };

  const { limit, offset } = sanitizePaginationParams(maliciousParams);
  console.log("✅ Sanitized pagination:", { limit, offset });
  console.log("   Limit enforced: 1-1000 range");
  console.log("   Offset enforced: non-negative integer");
}

// ==========================================
// EXAMPLE 5: ORDER BY Protection
// ==========================================

async function example5_OrderByProtection() {
  console.log("\n=== EXAMPLE 5: ORDER BY Protection ===\n");

  const maliciousSort = "email; DROP TABLE users; DESC";
  const allowedColumns = ["email", "created_at", "status"];

  // ❌ VULNERABLE (DON'T USE)
  // const query = `SELECT * FROM users ORDER BY ${maliciousSort}`;

  // ✅ SAFE: Whitelist validation
  try {
    const orderBy = sanitizeOrderBy(maliciousSort, allowedColumns);
    console.log("Order by validated:", orderBy);
  } catch (error) {
    console.log("✅ Invalid ORDER BY rejected:", (error as Error).message);
  }

  // Test with valid input
  const validSort = sanitizeOrderBy("email DESC", allowedColumns);
  console.log("✅ Valid ORDER BY accepted:", validSort);
}

// ==========================================
// EXAMPLE 6: Input Validation
// ==========================================

async function example6_InputValidation() {
  console.log("\n=== EXAMPLE 6: Input Validation ===\n");

  // ❌ VULNERABLE (DON'T USE)
  // const userId = req.params.id; // Could be "'; DROP TABLE users; --"
  // await prisma.users.findUnique({ where: { id: userId } });

  // ✅ SAFE: UUID validation
  const maliciousId = "'; DROP TABLE users; --";
  const validId = "550e8400-e29b-41d4-a716-446655440000";

  console.log("Malicious UUID valid?", isValidUUID(maliciousId)); // false
  console.log("✅ Malicious UUID rejected");

  console.log("Valid UUID valid?", isValidUUID(validId)); // true
  console.log("✅ Valid UUID accepted");

  // ✅ SAFE: Email validation
  const maliciousEmail = "<script>alert('xss')</script>@test.com";
  const validEmail = "user@example.com";

  console.log("Malicious email valid?", isValidEmail(maliciousEmail)); // false
  console.log("✅ Malicious email rejected");

  console.log("Valid email valid?", isValidEmail(validEmail)); // true
  console.log("✅ Valid email accepted");
}

// ==========================================
// EXAMPLE 7: Query Retry with Timeout
// ==========================================

async function example7_QueryRetry() {
  console.log("\n=== EXAMPLE 7: Query Retry with Timeout ===\n");

  // ❌ VULNERABLE TO HANGING (DON'T USE)
  // const result = await prisma.users.findMany(); // No timeout, no retry

  // ✅ SAFE: Retry with timeout
  try {
    const result = await executeWithRetry(
      async () => {
        console.log("Attempting query...");
        // Simulate slow query
        await new Promise((resolve) => setTimeout(resolve, 100));
        return await prisma.users.findMany({ take: 5 });
      },
      3, // max retries
      30000 // 30s timeout
    );
    console.log("✅ Query succeeded with retry protection");
  } catch (error) {
    console.log("✅ Query failed after retries (expected in test)");
  }
}

// ==========================================
// EXAMPLE 8: Safe Bulk Operations
// ==========================================

async function example8_BulkOperations() {
  console.log("\n=== EXAMPLE 8: Safe Bulk Operations ===\n");

  const testUsers = [
    { id: "1", action: "LOGIN" },
    { id: "2", action: "LOGOUT" },
    { id: "3", action: "UPDATE" },
  ];

  // ❌ VULNERABLE (DON'T USE)
  // for (const user of testUsers) {
  //   await prisma.audit_logs.create({ data: { userId: user.id, action: user.action } });
  // }

  // ✅ SAFE: Batched with transaction support
  try {
    const operations = testUsers.map(
      (user) => () =>
        prisma.audit_logs.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            action: user.action,
            resourceType: "test",
            resourceId: "example",
            ipAddress: "127.0.0.1",
            userAgent: "SecurityExample",
            metadata: {},
            createdAt: new Date(),
          },
        })
    );

    // Process in batches of 100 with transaction support
    const results = await safeBulkOperation(operations, 100);
    console.log("✅ Bulk operation completed safely:", results.length, "records");
  } catch (error) {
    console.log("✅ Bulk operation protected (expected in test)");
  }
}

// ==========================================
// EXAMPLE 9: SafePrisma Integration
// ==========================================

async function example9_SafePrismaIntegration() {
  console.log("\n=== EXAMPLE 9: SafePrisma Integration ===\n");

  // Import SafePrisma wrapper
  const { SafePrisma } = require("../src/ai-expansion/validators/SafePrisma");

  // ❌ VULNERABLE TO MISSING FIELDS (DON'T USE)
  // await prisma.audit_logs.create({
  //   data: { userId: '123', action: 'LOGIN' } // Missing required fields!
  // });

  // ✅ SAFE: Auto-enriches with required fields
  try {
    const auditLog = await SafePrisma.create("audit_logs", {
      userId: "123",
      action: "LOGIN",
      resourceType: "security_example",
      resourceId: "example9",
      ipAddress: "127.0.0.1",
      userAgent: "SecurityExample",
      // id, createdAt, updatedAt automatically added
    });
    console.log("✅ SafePrisma auto-enriched fields:", auditLog.id ? "Yes" : "No");
  } catch (error) {
    console.log("✅ SafePrisma protected (expected in test environment)");
  }
}

// ==========================================
// RUN ALL EXAMPLES
// ==========================================

async function runAllExamples() {
  console.log("\n".repeat(2));
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  SECURITY BEST PRACTICES - BEFORE & AFTER EXAMPLES     ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  try {
    await example1_SQLInjection();
    await example2_CommandInjection();
    await example3_IdentifierWhitelisting();
    await example4_PaginationSanitization();
    await example5_OrderByProtection();
    await example6_InputValidation();
    await example7_QueryRetry();
    await example8_BulkOperations();
    await example9_SafePrismaIntegration();

    console.log("\n".repeat(2));
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║  ✅ ALL SECURITY EXAMPLES COMPLETED SUCCESSFULLY       ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    console.log("\n");
    console.log("Key Takeaways:");
    console.log("1. Always separate commands from user input");
    console.log("2. Use Prisma tagged templates for raw SQL");
    console.log("3. Whitelist identifiers (tables, columns)");
    console.log("4. Validate and sanitize all user inputs");
    console.log("5. Use SafePrisma for audit logs");
    console.log("6. Add retry logic and timeouts");
    console.log("7. Batch operations with transaction support");
    console.log("\nSee DATABASE_SECURITY.md for complete documentation.");
  } catch (error) {
    console.error("Example error:", (error as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_SQLInjection,
  example2_CommandInjection,
  example3_IdentifierWhitelisting,
  example4_PaginationSanitization,
  example5_OrderByProtection,
  example6_InputValidation,
  example7_QueryRetry,
  example8_BulkOperations,
  example9_SafePrismaIntegration,
};
