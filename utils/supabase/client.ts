import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
  );
}

/**
 * Create a Supabase client for Client Components
 * This client handles browser-based authentication
 */
export const createClient = () => {
  return createBrowserClient(supabaseUrl!, supabaseKey!);
};
