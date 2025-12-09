/**
 * Supabase Authentication Integration
 * Provides authentication functions matching Supabase patterns
 */

import { createClient } from '@supabase/supabase-js';

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
 * Create Supabase client for authentication
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current user session
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
}

/**
 * Get current user
 */
export async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

