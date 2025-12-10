/**
 * Test Email Sending
 * Run with: npx ts-node scripts/test-email.ts
 */

import { sendVerificationEmail } from '../lib/email';

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');

  // Check environment variables
  console.log('Environment Variables:');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ Not set');
  console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || '❌ Not set');
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ Not set');
  console.log();

  // Test sending a verification email
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com', // Change this to your email to test
    name: 'Test User',
  };

  const testToken = 'test-verification-token-12345';

  try {
    console.log('📧 Attempting to send test verification email...');
    const result = await sendVerificationEmail(testUser, testToken);
    console.log('✅ Email sent successfully!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(error);
  }
}

testEmail()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
