/**
 * Supabase Integrations Management
 * Handles integrations, wrappers, and vault secrets
 * Reference:
 * - Integrations: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations?category=wrapper
 * - Vault Secrets: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets
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
 * Create Supabase client for integrations
 */
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================================
// INTEGRATIONS DASHBOARD URLS
// =============================================================================

export const INTEGRATIONS_URLS = {
  base: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations',
  wrappers:
    'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations?category=wrapper',
  postgresModules:
    'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations?category=postgres-module',
  vault: 'https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets',
} as const;

// =============================================================================
// INTEGRATIONS INFORMATION
// =============================================================================

/**
 * Available Integrations Categories:
 * - Wrappers: Extend your database with extensions and wrappers that add functionality
 * - Postgres Modules: Modules that add functionality to your database and connect to external services
 *
 * Access via Dashboard: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations
 */

export interface IntegrationInfo {
  name: string;
  category: 'wrapper' | 'postgres-module';
  description: string;
  installed: boolean;
}

/**
 * Get installed integrations
 * Note: Full integration management is done via Supabase Dashboard
 */
export async function getInstalledIntegrations(): Promise<IntegrationInfo[]> {
  // Note: Integration management is primarily done via Supabase Dashboard
  // This is a placeholder for future API support
  console.log('💡 Manage integrations via Supabase Dashboard:');
  console.log('   - Wrappers:', INTEGRATIONS_URLS.wrappers);
  console.log('   - Postgres Modules:', INTEGRATIONS_URLS.postgresModules);

  return [];
}

// =============================================================================
// VAULT SECRETS MANAGEMENT
// =============================================================================

/**
 * Vault Secrets
 * Store sensitive secrets securely in Supabase Vault
 * Access via Dashboard: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets
 *
 * Secrets are encrypted and can be accessed via SQL functions:
 * - vault.get_secret('secret_name')
 */

export interface VaultSecret {
  name: string;
  description?: string;
  value: string; // Only available when creating/updating
}

/**
 * Get vault secret (requires direct database access)
 * Note: Vault secrets are managed via Supabase Dashboard or SQL
 */
export async function getVaultSecret(secretName: string): Promise<string | null> {
  try {
    // Vault secrets are accessed via SQL functions
    // This requires direct database connection
    const { data, error } = await supabase.rpc('vault_get_secret', {
      secret_name: secretName,
    });

    if (error) {
      console.error('[Vault] Error getting secret:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('[Vault] Exception getting secret:', error);
    return null;
  }
}

/**
 * Instructions for managing vault secrets:
 *
 * 1. Via Supabase Dashboard:
 *    - Go to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets
 *    - Click "Create Secret"
 *    - Enter name and value
 *    - Save
 *
 * 2. Via SQL:
 *    - Go to SQL Editor in Supabase Dashboard
 *    - Run: SELECT vault.create_secret('secret_name', 'secret_value');
 *
 * 3. Access in code:
 *    - Use SQL function: SELECT vault.get_secret('secret_name');
 *    - Or use Supabase Dashboard to view secrets
 */

export const VAULT_MANAGEMENT_GUIDE = {
  dashboard: INTEGRATIONS_URLS.vault,
  createViaSQL: "SELECT vault.create_secret('secret_name', 'secret_value');",
  getViaSQL: "SELECT vault.get_secret('secret_name');",
  updateViaSQL: "SELECT vault.update_secret('secret_name', 'new_value');",
  deleteViaSQL: "SELECT vault.delete_secret('secret_name');",
} as const;
