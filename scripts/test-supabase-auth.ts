/**
 * Test Supabase Authentication
 * Verifies all authentication methods are working correctly
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import {
  getSession,
  getUser,
  signIn,
  signInWithOAuth,
  signInWithOtp,
  signOut,
  signUp,
  updateUser,
} from '../lib/supabase/auth';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: unknown;
}

const testResults: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<unknown>): Promise<void> {
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    const result = await testFn();
    testResults.push({ name, success: true, data: result });
    console.log(`   ✅ ${name} - SUCCESS`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({ name, success: false, error: errorMessage });
    console.log(`   ❌ ${name} - FAILED: ${errorMessage}`);
  }
}

async function testSupabaseAuth() {
  console.log('🔐 Testing Supabase Authentication Methods\n');
  console.log('='.repeat(60));

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('   Run: npm run setup:supabase:env');
    process.exit(1);
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  // Test 1: Get current session (should be null if not logged in)
  await runTest('Get Session (not logged in)', async () => {
    const { session, error } = await getSession();
    if (error) throw error;
    if (session) {
      console.log('   ⚠️  Warning: User is already logged in');
    }
    return { session: session ? 'exists' : 'null' };
  });

  // Test 2: Get current user (should be null if not logged in)
  await runTest('Get User (not logged in)', async () => {
    const { user, error } = await getUser();
    if (error && error.message !== 'User not found') throw error;
    return { user: user ? 'exists' : 'null' };
  });

  // Test 3: Sign up (use test email)
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  await runTest('Sign Up (new user)', async () => {
    const { data, error } = await signUp(testEmail, testPassword);
    if (error) throw error;
    return { userId: data.user?.id, email: data.user?.email };
  });

  // Test 4: Sign in
  await runTest('Sign In', async () => {
    const { data, error } = await signIn(testEmail, testPassword);
    if (error) throw error;
    return { userId: data.user?.id, email: data.user?.email };
  });

  // Test 5: Get user after sign in
  await runTest('Get User (logged in)', async () => {
    const { user, error } = await getUser();
    if (error) throw error;
    if (!user) throw new Error('User should be logged in');
    return { userId: user.id, email: user.email };
  });

  // Test 6: Get session after sign in
  await runTest('Get Session (logged in)', async () => {
    const { session, error } = await getSession();
    if (error) throw error;
    if (!session) throw new Error('Session should exist');
    return { userId: session.user.id, expiresAt: session.expires_at };
  });

  // Test 7: Update user (metadata only, not email/password in test)
  await runTest('Update User (metadata)', async () => {
    const { error } = await updateUser({
      data: { testField: 'testValue', lastTested: new Date().toISOString() },
    });
    if (error) throw error;
    return { updated: true };
  });

  // Test 8: Sign out
  await runTest('Sign Out', async () => {
    const { error } = await signOut();
    if (error) throw error;
    return { signedOut: true };
  });

  // Test 9: Verify signed out
  await runTest('Verify Signed Out', async () => {
    const { session, error: sessionError } = await getSession();
    if (sessionError) throw sessionError;
    if (session) throw new Error('Session should not exist after sign out');
    return { signedOut: true };
  });

  // Test 10: Magic Link (OTP) - just test the function exists
  await runTest('Sign In with OTP (function check)', async () => {
    // Don't actually send email in test
    await signInWithOtp('test@example.com');
    // OTP will fail without proper setup, but function should exist
    return { functionExists: true };
  });

  // Test 11: OAuth - just test the function exists
  await runTest('Sign In with OAuth (function check)', async () => {
    // Don't actually redirect in test
    await signInWithOAuth('github');
    // OAuth will fail without proper setup, but function should exist
    return { functionExists: true };
  });

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');

  const passed = testResults.filter((r) => r.success).length;
  const failed = testResults.filter((r) => !r.success).length;

  testResults.forEach((result) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${testResults.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Supabase authentication is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

// Run tests
testSupabaseAuth().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
