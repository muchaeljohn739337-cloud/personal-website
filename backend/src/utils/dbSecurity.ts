/**
 * Database Security Utilities
 *
 * CRITICAL: Always separate commands from user input to prevent SQL injection
 *
 * ✅ SAFE PATTERNS:
 * - Prisma tagged templates: prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`
 * - Parameterized queries with Prisma.sql: Prisma.sql`SELECT * FROM ${Prisma.raw(table)}`
 * - SafePrisma wrapper methods
 *
 * ❌ UNSAFE PATTERNS:
 * - String concatenation: `SELECT * FROM users WHERE id = '${userId}'`
 * - Template literals without tags: prisma.$queryRawUnsafe(`SELECT * FROM ${table}`)
 * - Raw shell commands with user input: exec(`psql -c "${userInput}"`)
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient();

/**
 * Execute safe raw SQL query with parameterized inputs
 * Uses Prisma's tagged template for automatic escaping
 */
export async function safeQuery<T = any>(query: TemplateStringsArray, ...values: any[]): Promise<T[]> {
  try {
    // Prisma automatically escapes values in tagged templates
    return await prisma.$queryRaw<T[]>(query, ...values);
  } catch (error) {
    logger.error("Safe query execution failed", {
      error,
      query: query.join("?"),
    });
    throw new Error("Database query failed");
  }
}

/**
 * Safely build dynamic table/column names using whitelist validation
 * NEVER allow user input directly as identifiers
 */
export function sanitizeIdentifier(identifier: string, allowedValues: string[]): string {
  if (!allowedValues.includes(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}. Must be one of: ${allowedValues.join(", ")}`);
  }
  return identifier;
}

/**
 * Validate and sanitize SQL LIMIT/OFFSET values
 */
export function sanitizePaginationParams(params: { limit?: number | string; offset?: number | string }): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(Math.max(1, parseInt(String(params.limit || 100))), 1000);
  const offset = Math.max(0, parseInt(String(params.offset || 0)));

  if (isNaN(limit) || isNaN(offset)) {
    throw new Error("Invalid pagination parameters");
  }

  return { limit, offset };
}

/**
 * Safely build ORDER BY clause with whitelist validation
 */
export function sanitizeOrderBy(
  orderBy: string,
  allowedColumns: string[],
  allowedDirections: string[] = ["ASC", "DESC"]
): string {
  const [column, direction = "ASC"] = orderBy.split(" ").map((s) => s.toUpperCase());

  const sanitizedColumn = sanitizeIdentifier(column.toLowerCase(), allowedColumns);
  const sanitizedDirection = sanitizeIdentifier(direction, allowedDirections);

  return `${sanitizedColumn} ${sanitizedDirection}`;
}

/**
 * Execute parameterized query with retry logic and timeout
 */
export async function executeWithRetry<T = any>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3,
  timeoutMs: number = 30000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout protection
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
      );

      return await Promise.race([queryFn(), timeoutPromise]);
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Query attempt ${attempt}/${maxRetries} failed`, { error });

      if (attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError || new Error("Query failed after retries");
}

/**
 * Safe bulk operations with transaction support
 */
export async function safeBulkOperation<T>(operations: Array<() => Promise<T>>, batchSize: number = 100): Promise<T[]> {
  const results: T[] = [];

  // Process in batches to avoid overwhelming database
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);

    try {
      // Use interactive transaction for regular Promises
      const batchResults = await prisma.$transaction(
        async (tx) => {
          const txResults: T[] = [];
          for (const op of batch) {
            txResults.push(await op());
          }
          return txResults;
        },
        {
          maxWait: 5000, // 5s max wait to acquire transaction
          timeout: 30000, // 30s transaction timeout
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        }
      );

      results.push(...batchResults);
    } catch (error) {
      logger.error(`Bulk operation batch ${i / batchSize + 1} failed`, {
        error,
      });
      throw error;
    }
  }

  return results;
}

/**
 * Database connection health check with detailed diagnostics
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Use safe tagged template
    await prisma.$queryRaw`SELECT 1 as health_check`;

    return {
      connected: true,
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate UUID format before database operations
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Example: Safe query with dynamic filtering
 *
 * USAGE:
 * const users = await safeQueryWithFilters('users', {
 *   filters: { status: 'active', role: 'admin' },
 *   orderBy: 'created_at DESC',
 *   limit: 50
 * });
 */
export async function safeQueryWithFilters(
  tableName: string,
  options: {
    filters?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  // Whitelist allowed tables
  const allowedTables = ["users", "audit_logs", "transactions", "notifications"];
  sanitizeIdentifier(tableName, allowedTables);

  // Sanitize pagination
  const { limit, offset } = sanitizePaginationParams({
    limit: options.limit,
    offset: options.offset,
  });

  // Build safe query using Prisma
  // In production, use Prisma's type-safe query builder instead of raw SQL
  const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1);

  try {
    // Use Prisma's type-safe methods
    return await (prisma as any)[tableName].findMany({
      where: options.filters || {},
      take: limit,
      skip: offset,
      orderBy: options.orderBy
        ? {
            [options.orderBy.split(" ")[0]]: options.orderBy.split(" ")[1]?.toLowerCase() || "asc",
          }
        : undefined,
    });
  } catch (error) {
    logger.error("Safe query with filters failed", {
      tableName,
      options,
      error,
    });
    throw new Error("Database query failed");
  }
}

export default {
  safeQuery,
  sanitizeIdentifier,
  sanitizePaginationParams,
  sanitizeOrderBy,
  executeWithRetry,
  safeBulkOperation,
  checkDatabaseHealth,
  isValidUUID,
  isValidEmail,
  safeQueryWithFilters,
};
