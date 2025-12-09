/**
 * Supabase Database Management
 * Provides utilities for managing database schema, tables, functions, triggers, etc.
 * Reference: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  throw new Error('Missing Supabase key environment variable');
}

/**
 * Create Supabase client for database operations
 */
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================================
// SCHEMA VISUALIZATION
// =============================================================================

export interface SchemaInfo {
  tables: string[];
  functions: string[];
  triggers: string[];
  indexes: string[];
  policies: string[];
  roles: string[];
  extensions: string[];
  enumeratedTypes: string[];
}

/**
 * Get comprehensive database schema information
 * Access via Supabase Dashboard: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
 */
export async function getSchemaInfo(): Promise<SchemaInfo> {
  const info: SchemaInfo = {
    tables: [],
    functions: [],
    triggers: [],
    indexes: [],
    policies: [],
    roles: [],
    extensions: [],
    enumeratedTypes: [],
  };

  try {
    // Note: Full schema inspection requires direct database access via SQL
    // This is a placeholder - use Supabase Dashboard or SQL Editor for full schema
    console.log('💡 For full schema visualization:');
    console.log('   1. Go to Supabase Dashboard → Database → Tables');
    console.log('   2. Use Prisma Studio: npm run prisma:studio');
    console.log('   3. Use SQL Editor in Supabase Dashboard');
  } catch (error) {
    console.error('[Database] Error fetching schema info:', error);
  }

  return info;
}

// =============================================================================
// TABLES MANAGEMENT
// =============================================================================

/**
 * Query a table
 */
export async function queryTable<T = unknown>(
  tableName: string,
  options?: {
    select?: string;
    filter?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  }
) {
  let query = supabase.from(tableName).select(options?.select || '*');

  if (options?.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  return { data: data as T[], error };
}

/**
 * Insert into a table
 */
export async function insertIntoTable<T = unknown>(tableName: string, data: T | T[]) {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data as never)
    .select();

  return { data: result as T[], error };
}

/**
 * Update a table
 */
export async function updateTable<T = unknown>(
  tableName: string,
  filter: Record<string, unknown>,
  updates: Partial<T>
) {
  let query = supabase.from(tableName).update(updates as never);

  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query.select();

  return { data: data as T[], error };
}

/**
 * Delete from a table
 */
export async function deleteFromTable(tableName: string, filter: Record<string, unknown>) {
  let query = supabase.from(tableName).delete();

  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query;

  return { data, error };
}

// =============================================================================
// FUNCTIONS MANAGEMENT
// =============================================================================

/**
 * Call a database function
 */
export async function callFunction<T = unknown>(
  functionName: string,
  params?: Record<string, unknown>
) {
  const { data, error } = await supabase.rpc(functionName, params || {});

  return { data: data as T, error };
}

// =============================================================================
// REAL-TIME SUBSCRIPTIONS
// =============================================================================

/**
 * Subscribe to table changes
 */
export function subscribeToTable(
  tableName: string,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: Record<string, unknown>;
    old?: Record<string, unknown>;
  }) => void,
  filter?: string
) {
  const channel = supabase
    .channel(`${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: filter,
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as Record<string, unknown>,
          old: payload.old as Record<string, unknown>,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// =============================================================================
// DATABASE COMPONENTS ACCESS
// =============================================================================

/**
 * Access database components via Supabase Dashboard:
 * - Tables: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/editor
 * - Functions: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/functions
 * - Triggers: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/triggers
 * - Indexes: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/indexes
 * - Policies: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/policies
 * - Extensions: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/extensions
 * - Types: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/types
 */

export const DASHBOARD_URLS = {
  base: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi',
  tables: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/editor',
  functions: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/functions',
  triggers: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/triggers',
  indexes: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/indexes',
  policies: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/auth/policies',
  extensions: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/extensions',
  types: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/database/types',
  storage: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/storage/files',
  integrations: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations',
  vault: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets',
} as const;
