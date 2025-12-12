/**
 * Test script for Stripe integration
 * Validates Stripe configuration and webhook setup
 *
 * Usage:
 *   npm run ts-node src/scripts/test-stripe-integration.ts
 */

import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

async function testStripeIntegration() {
  console.log("\n🧪 Testing Stripe Integration...\n");

  // Test 1: Check configuration
  console.log("📋 Step 1: Checking Stripe configuration...");
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey) {
    console.log("   ❌ STRIPE_SECRET_KEY not configured");
    console.log("   Please add STRIPE_SECRET_KEY to your .env file");
    console.log("   Get your key from: https://dashboard.stripe.com/apikeys");
    return;
  }

  console.log(`   ✅ STRIPE_SECRET_KEY found (${secretKey.substring(0, 10)}...)`);

  if (!webhookSecret) {
    console.log("   ⚠️  STRIPE_WEBHOOK_SECRET not configured");
    console.log("   This is required for webhook verification");
    console.log("   Get your secret from: https://dashboard.stripe.com/webhooks");
  } else {
    console.log(`   ✅ STRIPE_WEBHOOK_SECRET configured (${webhookSecret.substring(0, 10)}...)`);
  }

  // Determine if using test or live mode
  const isTestMode = secretKey.startsWith("sk_test_");
  const mode = isTestMode ? "TEST" : "LIVE";
  console.log(`   Mode: ${mode} ${isTestMode ? "✅" : "⚠️  (PRODUCTION)"}`);

  // Test 2: Initialize Stripe client
  console.log("\n🔌 Step 2: Initializing Stripe client...");
  let stripe: Stripe;
  try {
    stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
    console.log("   ✅ Stripe client initialized");
  } catch (error: any) {
    console.log("   ❌ Failed to initialize Stripe:", error.message);
    return;
  }

  // Test 3: Verify API connection
  console.log("\n🌐 Step 3: Testing Stripe API connection...");
  try {
    const balance = await stripe.balance.retrieve();
    console.log("   ✅ Successfully connected to Stripe API");
    console.log(
      `   Available balance: ${balance.available.map((b) => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(", ")}`
    );
    console.log(
      `   Pending balance: ${balance.pending.map((b) => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(", ")}`
    );
  } catch (error: any) {
    console.log("   ❌ Failed to connect to Stripe API:", error.message);
    if (error.type === "StripeAuthenticationError") {
      console.log("   Invalid API key. Please check your STRIPE_SECRET_KEY.");
    }
    return;
  }

  // Test 4: List recent payments (test mode only)
  if (isTestMode) {
    console.log("\n💳 Step 4: Checking recent test payments...");
    try {
      const payments = await stripe.paymentIntents.list({ limit: 5 });
      console.log(`   ✅ Found ${payments.data.length} recent payment(s)`);

      if (payments.data.length > 0) {
        console.log("\n   Recent payments:");
        payments.data.forEach((payment, index) => {
          console.log(`   ${index + 1}. ${payment.id}`);
          console.log(`      Amount: ${payment.amount / 100} ${payment.currency.toUpperCase()}`);
          console.log(`      Status: ${payment.status}`);
          console.log(`      Created: ${new Date(payment.created * 1000).toLocaleString()}`);
        });
      } else {
        console.log("   No payments found. This is normal for new accounts.");
      }
    } catch (error: any) {
      console.log("   ⚠️  Could not retrieve payments:", error.message);
    }
  }

  // Test 5: Test webhook signature verification (if secret provided)
  if (webhookSecret) {
    console.log("\n🔐 Step 5: Testing webhook signature verification...");
    try {
      const payload = JSON.stringify({
        id: "evt_test",
        object: "event",
        type: "payment_intent.succeeded",
        data: { object: {} },
      });

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: webhookSecret,
      });

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      console.log("   ✅ Webhook signature verification working");
      console.log(`   Test event type: ${event.type}`);
    } catch (error: any) {
      console.log("   ❌ Webhook signature verification failed:", error.message);
      console.log("   Please verify your STRIPE_WEBHOOK_SECRET is correct");
    }
  }

  // Test 6: Check webhook endpoints
  console.log("\n📡 Step 6: Checking configured webhook endpoints...");
  try {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });
    console.log(`   ✅ Found ${endpoints.data.length} webhook endpoint(s)`);

    if (endpoints.data.length > 0) {
      console.log("\n   Configured endpoints:");
      endpoints.data.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.url}`);
        console.log(`      Status: ${endpoint.status}`);
        console.log(`      Events: ${endpoint.enabled_events.length} enabled`);
        if (endpoint.enabled_events.length <= 5) {
          console.log(`      Listening to: ${endpoint.enabled_events.join(", ")}`);
        }
      });
    } else {
      console.log("\n   ⚠️  No webhook endpoints configured");
      console.log("   Add one at: https://dashboard.stripe.com/webhooks");
      console.log(
        "   Recommended events: checkout.session.completed, payment_intent.succeeded, payment_intent.failed, charge.refunded"
      );
    }
  } catch (error: any) {
    console.log("   ⚠️  Could not retrieve webhooks:", error.message);
  }

  console.log("\n✅ Stripe integration test complete!\n");

  // Summary
  console.log("📊 Summary:");
  console.log(`   API Key: ${mode} mode`);
  console.log(`   Connection: ${secretKey ? "✅" : "❌"}`);
  console.log(`   Webhook Secret: ${webhookSecret ? "✅" : "⚠️  (optional but recommended)"}`);

  if (isTestMode) {
    console.log("\nℹ️  You are in TEST mode. Use test card: 4242 4242 4242 4242");
    console.log("   Expiry: Any future date, CVC: Any 3 digits");
  } else {
    console.log("\n⚠️  You are in LIVE mode. Real payments will be processed!");
  }
}

// Run tests
testStripeIntegration()
  .then(() => {
    console.log("Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
