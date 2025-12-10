/**
 * Supabase Query Wrappers
 * Reusable functions for common database operations with error handling
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
 * Note: Tables should be in 'api' schema for Supabase API access
 * The Supabase client automatically uses the api schema when configured
 */
export async function queryTable<T = unknown>(
  tableName: string,
  options: QueryOptions = {}
): Promise<QueryResult<T>> {
  try {
    // Supabase client will use api schema if configured in Supabase Dashboard
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
    const { data, error } = await supabase
      .from(tableName)
      .insert(record as never)
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
export async function deleteRecord(
  tableName: string,
  id: string
): Promise<{ error: Error | null }> {
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
