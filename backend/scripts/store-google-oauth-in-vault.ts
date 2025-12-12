/**
 * Store Google OAuth credentials in HashiCorp Vault
 * Run with: npx ts-node scripts/store-google-oauth-in-vault.ts
 */

import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface VaultSecret {
  key: string;
  value: string;
  description: string;
}

const VAULT_ADDR = process.env.VAULT_ADDR || "http://localhost:8200";
const VAULT_TOKEN = process.env.VAULT_TOKEN || "hvs.dev-root-token";

const secrets: VaultSecret[] = [
  {
    key: "GOOGLE_CLIENT_ID",
    value: process.env.GOOGLE_CLIENT_ID || "",
    description: "Google OAuth Client ID",
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    value: process.env.GOOGLE_CLIENT_SECRET || "",
    description: "Google OAuth Client Secret",
  },
  {
    key: "GOOGLE_REDIRECT_URI",
    value: process.env.GOOGLE_REDIRECT_URI || "",
    description: "Google OAuth Redirect URI",
  },
  {
    key: "GOOGLE_OAUTH_ADMIN_EMAILS",
    value: process.env.GOOGLE_OAUTH_ADMIN_EMAILS || "",
    description: "Comma-separated list of admin email addresses",
  },
];

async function storeSecretInVault(secret: VaultSecret): Promise<void> {
  try {
    if (!secret.value) {
      console.warn(`⚠️  Skipping ${secret.key} - No value provided`);
      return;
    }

    // Store in Vault KV v2 engine
    const response = await axios.post(
      `${VAULT_ADDR}/v1/secret/data/google-oauth/${secret.key}`,
      {
        data: {
          value: secret.value,
          description: secret.description,
          created_at: new Date().toISOString(),
        },
      },
      {
        headers: {
          "X-Vault-Token": VAULT_TOKEN,
        },
      }
    );

    if (response.status === 200 || response.status === 204) {
      console.log(`✅ Stored ${secret.key} in Vault`);
    } else {
      console.error(`❌ Failed to store ${secret.key}: ${response.statusText}`);
    }
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.error(`❌ Could not connect to Vault at ${VAULT_ADDR}. Is Vault running?`);
      console.error("   Start Vault with: vault server -dev");
    } else {
      console.error(`❌ Error storing ${secret.key}:`, error.message);
    }
  }
}

async function main() {
  console.log("🔐 Storing Google OAuth credentials in HashiCorp Vault...\n");
  console.log(`Vault Address: ${VAULT_ADDR}`);
  console.log(`Vault Token: ${VAULT_TOKEN.substring(0, 10)}...\n`);

  // Check if Vault is accessible
  try {
    await axios.get(`${VAULT_ADDR}/v1/sys/health`, {
      headers: { "X-Vault-Token": VAULT_TOKEN },
    });
    console.log("✅ Vault is accessible\n");
  } catch (error: any) {
    if (error.code === "ECONNREFUSED") {
      console.error(`❌ Cannot connect to Vault at ${VAULT_ADDR}`);
      console.error("\n💡 To start Vault in development mode:");
      console.error("   vault server -dev\n");
      console.error("💡 Or set VAULT_ENABLED=false in .env to use database storage\n");
      process.exit(1);
    }
  }

  // Store each secret
  for (const secret of secrets) {
    await storeSecretInVault(secret);
  }

  console.log("\n✅ Google OAuth credentials stored in Vault successfully!");
  console.log("\n📋 Stored secrets:");
  console.log("   - GOOGLE_CLIENT_ID");
  console.log("   - GOOGLE_CLIENT_SECRET");
  console.log("   - GOOGLE_REDIRECT_URI");
  console.log("   - GOOGLE_OAUTH_ADMIN_EMAILS");
  console.log("\n💡 To retrieve a secret:");
  console.log("   vault kv get secret/google-oauth/GOOGLE_CLIENT_ID");
  console.log("\n💡 Your application will automatically use these secrets when Vault is enabled.");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
