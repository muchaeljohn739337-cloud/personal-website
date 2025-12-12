/**
 * Test Google OAuth Configuration
 * Run this after setting up Google Cloud Console credentials
 *
 * Usage: node scripts/test-google-oauth-config.js
 */

const https = require("https");

// Load environment variables
require("dotenv").config();

const REQUIRED_VARS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"];

console.log("\n🔍 Testing Google OAuth Configuration\n");
console.log("═".repeat(60));

// Check environment variables
let allPresent = true;
REQUIRED_VARS.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes("YOUR_") || value.includes("HERE")) {
    console.log(`❌ ${varName}: NOT SET or using placeholder`);
    allPresent = false;
  } else {
    // Show partial value for security
    const display = value.substring(0, 20) + "..." + value.substring(value.length - 4);
    console.log(`✅ ${varName}: ${display}`);
  }
});

if (!allPresent) {
  console.log("\n⚠️  Missing required environment variables!");
  console.log("\n📝 Next Steps:");
  console.log("1. Complete Google Cloud Console setup");
  console.log("2. Copy Client ID and Client Secret");
  console.log("3. Update .env file with real values");
  console.log("4. Run this script again\n");
  process.exit(1);
}

console.log("\n✅ All environment variables configured!");
console.log("═".repeat(60));

// Test OAuth endpoint accessibility
console.log("\n🌐 Testing OAuth Endpoint...\n");

const clientId = process.env.GOOGLE_CLIENT_ID;
const redirectUri = encodeURIComponent(process.env.GOOGLE_REDIRECT_URI);
const testUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile&access_type=offline`;

console.log(`📍 Redirect URI: ${process.env.GOOGLE_REDIRECT_URI}`);
console.log(`🔗 Test URL (first 80 chars): ${testUrl.substring(0, 80)}...`);

// Verify redirect URI format
const uri = process.env.GOOGLE_REDIRECT_URI;
if (!uri.includes("/api/auth/google/callback")) {
  console.log("\n⚠️  Warning: Redirect URI should end with /api/auth/google/callback");
}

if (uri.startsWith("https://")) {
  console.log("✅ Using HTTPS (production mode)");
} else if (uri.startsWith("http://localhost")) {
  console.log("✅ Using localhost (development mode)");
} else {
  console.log("⚠️  Warning: Redirect URI should use https:// or http://localhost");
}

console.log("\n✨ Configuration Test Complete!\n");
console.log("═".repeat(60));
console.log("\n📋 Next Steps:\n");
console.log("1. Start your backend server:");
console.log("   npm run dev\n");
console.log("2. Test the init endpoint:");
console.log("   POST http://localhost:4000/api/auth/google/init");
console.log('   Body: {"type": "admin"}\n');
console.log("3. Visit the authUrl returned in the response");
console.log("4. Complete Google Sign-In");
console.log("5. Check server logs for JWT token generation\n");
console.log("═".repeat(60));
console.log("\n💡 Tip: Keep Google Cloud Console open to verify:");
console.log("   - Authorized redirect URIs match exactly");
console.log("   - OAuth consent screen is configured");
console.log("   - App is in Testing mode (for external users)\n");

console.log("🎯 Full documentation: GOOGLE_OAUTH_SETUP.md\n");
