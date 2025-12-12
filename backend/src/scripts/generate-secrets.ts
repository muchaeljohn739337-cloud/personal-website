/**
 * Generate Production Secrets
 * Creates cryptographically secure secrets for production deployment
 * Outputs directly to console for manual .env update
 */

import crypto from "crypto";

/**
 * Generate a random string of specified length
 */
function generateRandomString(length: number): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

/**
 * Generate a base64 secret
 */
function generateBase64Secret(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64");
}

/**
 * Generate all production secrets
 */
function generateProductionSecrets(): void {
  console.log("=".repeat(80));
  console.log("🔐 PRODUCTION SECRETS GENERATOR");
  console.log("=".repeat(80));
  console.log("\n⚠️  IMPORTANT: These secrets are shown ONCE. Copy them immediately!\n");

  // JWT Secret (64 characters alphanumeric)
  const jwtSecret = generateRandomString(64);
  console.log("# JWT Authentication Secret (64 chars)");
  console.log(`JWT_SECRET=${jwtSecret}\n`);

  // Session Secret (32 characters)
  const sessionSecret = generateRandomString(32);
  console.log("# Session Secret (32 chars)");
  console.log(`SESSION_SECRET=${sessionSecret}\n`);

  // Encryption Key for sensitive data (32 bytes = 256-bit)
  const encryptionKey = generateBase64Secret(32);
  console.log("# Data Encryption Key (256-bit base64)");
  console.log(`ENCRYPTION_KEY=${encryptionKey}\n`);

  // Web Push VAPID Keys
  const vapidPublic = generateBase64Secret(65);
  const vapidPrivate = generateBase64Secret(32);
  console.log("# Web Push VAPID Keys");
  console.log(`VAPID_PUBLIC_KEY=${vapidPublic}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidPrivate}\n`);

  // API Internal Secret (for service-to-service auth)
  const internalApiSecret = generateRandomString(48);
  console.log("# Internal API Secret");
  console.log(`INTERNAL_API_SECRET=${internalApiSecret}\n`);

  // Webhook Secret (for validating incoming webhooks)
  const webhookSecret = generateRandomString(32);
  console.log("# Webhook Validation Secret");
  console.log(`WEBHOOK_SECRET=${webhookSecret}\n`);

  console.log("=".repeat(80));
  console.log("✅ Secrets generated successfully!\n");
  console.log("📋 Next Steps:");
  console.log("   1. Copy these values to your .env file");
  console.log("   2. NEVER commit these secrets to version control");
  console.log("   3. Store them securely (e.g., password manager, Vault)");
  console.log("   4. Rotate these secrets regularly (every 90 days recommended)");
  console.log("   5. Run: npm run migrate-to-vault (to store in HashiCorp Vault)");
  console.log("=".repeat(80));
  console.log("\n🔒 Security Tips:");
  console.log("   • Keep secrets in environment variables, not in code");
  console.log("   • Use different secrets for dev/staging/production");
  console.log("   • Enable secret scanning in your repository");
  console.log("   • Set up alerts for unauthorized access attempts");
  console.log("   • Regularly audit access logs for suspicious activity\n");
}

// Additional utilities
function generateAPIKey(prefix: string = "sk"): string {
  const random = generateRandomString(40);
  return `${prefix}_${random}`;
}

function generateVaultToken(): string {
  return `hvs.${generateRandomString(24)}`;
}

// Check if specific secret type is requested
const args = process.argv.slice(2);
const command = args[0];

if (command === "api-key") {
  const prefix = args[1] || "sk";
  console.log(`Generated API Key: ${generateAPIKey(prefix)}`);
} else if (command === "vault-token") {
  console.log(`Generated Vault Token: ${generateVaultToken()}`);
} else if (command === "jwt") {
  console.log(`Generated JWT Secret: ${generateRandomString(64)}`);
} else if (command === "password") {
  const length = parseInt(args[1]) || 32;
  console.log(`Generated Password (${length} chars): ${generateRandomString(length)}`);
} else {
  // Generate all secrets
  generateProductionSecrets();
}

// Usage instructions
if (command === "help" || command === "--help") {
  console.log(`
Usage:
  npm run generate-secrets              Generate all production secrets
  npm run generate-secrets api-key      Generate API key (default prefix: sk)
  npm run generate-secrets api-key pk   Generate API key with custom prefix
  npm run generate-secrets vault-token  Generate Vault token
  npm run generate-secrets jwt          Generate JWT secret only
  npm run generate-secrets password 24  Generate password (default: 32 chars)
  npm run generate-secrets help         Show this help message
  `);
}
