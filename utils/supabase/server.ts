import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
 * Create a Supabase client for Server Components, Server Actions, and Route Handlers
 * This client handles cookie management for authentication
 */
export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: {
            domain?: string;
            expires?: Date;
            httpOnly?: boolean;
            maxAge?: number;
            path?: string;
            sameSite?: 'strict' | 'lax' | 'none';
            secure?: boolean;
          };
        }>
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};
