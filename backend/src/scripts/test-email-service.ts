/**
 * Test script for EmailService
 * Tests email configuration and template rendering
 *
 * Usage:
 *   npm run ts-node src/scripts/test-email-service.ts
 *
 * Or with arguments:
 *   npm run ts-node src/scripts/test-email-service.ts -- --to=your-email@example.com
 */

import dotenv from "dotenv";
import { emailService } from "../services/EmailService";

dotenv.config();

async function testEmailService() {
  console.log("\n🧪 Testing Email Service Configuration...\n");

  // Test 1: Check configuration
  console.log("📋 Step 1: Checking email service configuration...");
  const config = await emailService.testConfiguration();

  console.log(`   SendGrid: ${config.sendgrid ? "✅ Configured" : "❌ Not configured"}`);
  console.log(`   SMTP:     ${config.smtp ? "✅ Configured" : "❌ Not configured"}`);

  if (!config.sendgrid && !config.smtp) {
    console.log("\n❌ No email service configured!");
    console.log("   Please set SENDGRID_API_KEY or SMTP credentials in .env file");
    console.log("   In development mode, emails will be logged to console instead.");
  }

  // Test 2: Test welcome email (in dev mode, just logs)
  console.log("\n📧 Step 2: Testing welcome email template...");
  try {
    const testEmail = process.argv.find((arg) => arg.startsWith("--to="))?.split("=")[1] || "test@example.com";

    await emailService.sendWelcomeEmail(testEmail, {
      name: "Test User",
      verificationUrl: "https://example.com/verify?token=test123",
    });

    console.log("   ✅ Welcome email sent successfully");
  } catch (error: any) {
    console.log("   ❌ Failed to send welcome email:", error.message);
  }

  // Test 3: Test verification email
  console.log("\n📧 Step 3: Testing verification email template...");
  try {
    const testEmail = process.argv.find((arg) => arg.startsWith("--to="))?.split("=")[1] || "test@example.com";

    await emailService.sendVerificationEmail(testEmail, {
      name: "Test User",
      verificationUrl: "https://example.com/verify?token=test456",
      expiresIn: "24 hours",
    });

    console.log("   ✅ Verification email sent successfully");
  } catch (error: any) {
    console.log("   ❌ Failed to send verification email:", error.message);
  }

  // Test 4: Test password reset email
  console.log("\n📧 Step 4: Testing password reset email template...");
  try {
    const testEmail = process.argv.find((arg) => arg.startsWith("--to="))?.split("=")[1] || "test@example.com";

    await emailService.sendPasswordResetEmail(testEmail, {
      name: "Test User",
      resetUrl: "https://example.com/reset?token=reset789",
      expiresIn: "1 hour",
    });

    console.log("   ✅ Password reset email sent successfully");
  } catch (error: any) {
    console.log("   ❌ Failed to send password reset email:", error.message);
  }

  // Test 5: Test transaction notification
  console.log("\n📧 Step 5: Testing transaction notification template...");
  try {
    const testEmail = process.argv.find((arg) => arg.startsWith("--to="))?.split("=")[1] || "test@example.com";

    await emailService.sendTransactionNotification(testEmail, {
      name: "Test User",
      transactionType: "Payment",
      amount: "49.99",
      currency: "USD",
      date: new Date().toLocaleString(),
      status: "success",
    });

    console.log("   ✅ Transaction notification sent successfully");
  } catch (error: any) {
    console.log("   ❌ Failed to send transaction notification:", error.message);
  }

  console.log("\n✅ Email service test complete!\n");

  if (process.env.NODE_ENV === "development" && !config.sendgrid && !config.smtp) {
    console.log("ℹ️  Note: In development mode without email credentials,");
    console.log("   emails are logged to console instead of being sent.");
  }
}

// Run tests
testEmailService()
  .then(() => {
    console.log("Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
