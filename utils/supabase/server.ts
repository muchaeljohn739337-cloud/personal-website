import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
  );
}

/**
 * Create a Supabase client for Server Components, Server Actions, and Route Handlers
 * This client handles cookie management for authentication
 *
 * Usage (Recommended - matches Supabase docs):
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('table').select();
 *
 * Usage (Legacy - still supported):
 *   const cookieStore = await cookies();
 *   const supabase = createClient(cookieStore);
 */
export async function createClient(cookieStore?: ReturnType<typeof cookies>) {
  const store = cookieStore || (await cookies());
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return store.getAll();
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
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
