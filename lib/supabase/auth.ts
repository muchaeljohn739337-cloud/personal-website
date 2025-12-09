/**
 * Supabase Authentication Integration
 * Complete authentication system for managing users in your apps and websites
 * Reference: https://supabase.com/docs/guides/auth
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
 * Create Supabase admin client (requires service role key)
 * Use this for server-side admin operations only
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  return createClient(supabaseUrl!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================================================
// EMAIL/PASSWORD AUTHENTICATION
// =============================================================================

/**
 * Sign up a new user with email and password
 * After signup, all interactions using the Supabase JS client will be performed as "that user"
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign in existing user with email and password
 * After login, all interactions using the Supabase JS client will be performed as "that user"
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// =============================================================================
// MAGIC LINK / PASSWORDLESS AUTHENTICATION
// =============================================================================

/**
 * Log in with Magic Link via Email
 * Send a user a passwordless link which they can use to redeem an access_token
 * After they click the link, all interactions using the Supabase JS client will be performed as "that user"
 */
export async function signInWithOtp(email: string, options?: { redirectTo?: string }) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: options?.redirectTo,
    },
  });

  return { data, error };
}

// =============================================================================
// PHONE/SMS AUTHENTICATION
// =============================================================================

/**
 * Sign up with phone number and password
 * A phone number can be used instead of an email as a primary account confirmation mechanism
 * The user will receive a mobile OTP via SMS with which they can verify that they control the phone number
 * You must enter your own Twilio credentials on the auth settings page to enable SMS confirmations
 */
export async function signUpWithPhone(phone: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    phone,
    password,
  });

  return { data, error };
}

/**
 * Login via SMS OTP
 * SMS OTPs work like magic links, except you have to provide an interface for the user to verify the 6 digit number they receive
 * You must enter your own Twilio credentials on the auth settings page to enable SMS-based Logins
 */
export async function signInWithOtpPhone(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  return { data, error };
}

/**
 * Verify an SMS OTP
 * Once the user has received the OTP, have them enter it in a form and send it for verification
 * You must enter your own Twilio credentials on the auth settings page to enable SMS-based OTP verification
 */
export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  return { data, error };
}

/**
 * Verify an Email OTP
 * Verify the OTP sent via email magic link
 */
export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  return { data, error };
}

// =============================================================================
// OAUTH AUTHENTICATION
// =============================================================================

/**
 * Log in with Third Party OAuth
 * Users can log in with Third Party OAuth like Google, Facebook, GitHub, and more
 * You must first enable each of these in the Auth Providers settings
 * After they have logged in, all interactions using the Supabase JS client will be performed as "that user"
 * Generate your Client ID and secret from: Google, GitHub, GitLab, Facebook, Bitbucket
 */
export async function signInWithOAuth(
  provider: 'github' | 'google' | 'facebook' | 'gitlab' | 'bitbucket' | 'azure' | 'discord',
  options?: { redirectTo?: string }
) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: options?.redirectTo,
    },
  });

  return { data, error };
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * Get the JSON object for the logged in user
 */
export async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
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
 * Forgotten Password Email
 * Sends the user a log in link via email. Once logged in you should direct the user to a new password form.
 * And use "Update User" below to save the new password.
 */
export async function resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: options?.redirectTo,
  });

  return { data, error };
}

/**
 * Update User
 * Update the user with a new email or password. Each key (email, password, and data) is optional
 */
export async function updateUser(options: {
  email?: string;
  password?: string;
  data?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.auth.updateUser({
    email: options.email,
    password: options.password,
    data: options.data,
  });

  return { data, error };
}

/**
 * Sign out current user
 * After calling log out, all interactions using the Supabase JS client will be "anonymous"
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// =============================================================================
// ADMIN OPERATIONS (Server-side only)
// =============================================================================

/**
 * Send a User an Invite over Email
 * Send a user a passwordless link which they can use to sign up and log in.
 * After they have clicked the link, all interactions using the Supabase JS client will be performed as "that user"
 * This endpoint requires you use the service_role_key when initializing the client,
 * and should only be invoked from the server, never from the client.
 */
export async function inviteUserByEmail(email: string, options?: { redirectTo?: string }) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: options?.redirectTo,
  });

  return { data, error };
}
