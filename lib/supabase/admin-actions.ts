/**
 * Supabase Admin Actions Logging
 * Logs admin actions to Supabase admin_actions table
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
 * Create Supabase client with service role key for admin operations
 */
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AdminActionParams {
  admin_id: string;
  target_user_id?: string;
  action: string; // AdminActionType enum value
  resource_type?: string;
  resource_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an admin action to Supabase admin_actions table
 */
export async function logAdminActionToSupabase(params: AdminActionParams) {
  try {
    const { data, error } = await supabase.from('admin_actions').insert([
      {
        admin_id: params.admin_id,
        target_user_id: params.target_user_id || null,
        action: params.action,
        resource_type: params.resource_type || null,
        resource_id: params.resource_id || null,
        description: params.description,
        metadata: params.metadata || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
        created_at: new Date().toISOString(),
      },
    ]).select();

    if (error) {
      console.error('[Supabase Admin Actions] Error logging action:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Supabase Admin Actions] Exception logging action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get admin action logs from Supabase
 */
export async function getAdminLogsFromSupabase(options: {
  admin_id?: string;
  target_user_id?: string;
  action?: string;
  page?: number;
  limit?: number;
} = {}) {
  try {
    const { admin_id, target_user_id, action, page = 1, limit = 50 } = options;

    let query = supabase.from('admin_actions').select('*', { count: 'exact' });

    if (admin_id) {
      query = query.eq('admin_id', admin_id);
    }
    if (target_user_id) {
      query = query.eq('target_user_id', target_user_id);
    }
    if (action) {
      query = query.eq('action', action);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('[Supabase Admin Actions] Error fetching logs:', error);
      return { success: false, error, logs: [], total: 0 };
    }

    return {
      success: true,
      logs: data || [],
      total: count || 0,
      page,
      limit,
    };
  } catch (error) {
    console.error('[Supabase Admin Actions] Exception fetching logs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: [],
      total: 0,
    };
  }
}

/**
 * Subscribe to admin action changes (real-time)
 */
export function subscribeToAdminActions(
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: Record<string, unknown>;
    old?: Record<string, unknown>;
  }) => void,
  filters?: {
    admin_id?: string;
    target_user_id?: string;
    action?: string;
  }
) {
  const channel = supabase
    .channel('admin-actions-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'admin_actions',
        filter: filters
          ? Object.entries(filters)
              .map(([key, value]) => `${key}=eq.${value}`)
              .join(',')
          : undefined,
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

