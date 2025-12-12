/**
 * Vault Secret Migration Script
 * Automatically migrates sensitive secrets from .env to HashiCorp Vault
 * Provides 150% security by centralizing secret management
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { VaultService } from "../services/VaultService";

dotenv.config();

interface SecretConfig {
  envKey: string;
  vaultPath: string;
  vaultKey: string;
  required: boolean;
  description: string;
}

// Define which secrets should be migrated to Vault
const SECRETS_TO_MIGRATE: SecretConfig[] = [
  {
    envKey: "OPENAI_API_KEY",
    vaultPath: "secret/openai",
    vaultKey: "api_key",
    required: true,
    description: "OpenAI API key for AI features",
  },
  {
    envKey: "COPILOT_OPENAI_API_KEY",
    vaultPath: "secret/openai",
    vaultKey: "copilot_api_key",
    required: true,
    description: "OpenAI API key for Copilot features",
  },
  {
    envKey: "STRIPE_SECRET_KEY",
    vaultPath: "secret/stripe",
    vaultKey: "secret_key",
    required: true,
    description: "Stripe secret key for payment processing",
  },
  {
    envKey: "STRIPE_WEBHOOK_SECRET",
    vaultPath: "secret/stripe",
    vaultKey: "webhook_secret",
    required: true,
    description: "Stripe webhook signing secret",
  },
  {
    envKey: "SENDGRID_API_KEY",
    vaultPath: "secret/sendgrid",
    vaultKey: "api_key",
    required: false,
    description: "SendGrid API key for email delivery",
  },
  {
    envKey: "SMTP_PASS",
    vaultPath: "secret/smtp",
    vaultKey: "password",
    required: false,
    description: "SMTP server password for email fallback",
  },
  {
    envKey: "JWT_SECRET",
    vaultPath: "secret/jwt",
    vaultKey: "secret",
    required: true,
    description: "JWT signing secret for authentication",
  },
  {
    envKey: "DATABASE_URL",
    vaultPath: "secret/database",
    vaultKey: "url",
    required: true,
    description: "PostgreSQL connection string",
  },
  {
    envKey: "REDIS_URL",
    vaultPath: "secret/redis",
    vaultKey: "url",
    required: false,
    description: "Redis connection string for caching",
  },
  {
    envKey: "DISCORD_WEBHOOK_URL",
    vaultPath: "secret/alerts",
    vaultKey: "discord_webhook",
    required: false,
    description: "Discord webhook for admin notifications",
  },
  {
    envKey: "SLACK_WEBHOOK_URL",
    vaultPath: "secret/alerts",
    vaultKey: "slack_webhook",
    required: false,
    description: "Slack webhook for admin notifications",
  },
  {
    envKey: "GITHUB_TOKEN",
    vaultPath: "secret/github",
    vaultKey: "token",
    required: false,
    description: "GitHub personal access token",
  },
];

async function migrateSecrets(): Promise<void> {
  console.log("🔐 Starting secret migration to Vault...\n");

  const vaultService = VaultService.getInstance();
  const results: Array<{ secret: string; status: string; error?: string }> = [];

  // Check Vault connection
  try {
    await vaultService.getSecret("secret/test", "connection");
  } catch (error) {
    console.error("❌ Cannot connect to Vault. Please ensure Vault is running and VAULT_TOKEN is set.");
    console.error("Start Vault with: docker run --cap-add=IPC_LOCK -d --name=vault -p 8200:8200 vault:latest");
    process.exit(1);
  }

  console.log("✅ Connected to Vault successfully\n");

  // Migrate each secret
  for (const config of SECRETS_TO_MIGRATE) {
    const envValue = process.env[config.envKey];

    if (!envValue) {
      if (config.required) {
        console.warn(`⚠️  ${config.envKey} is required but not found in .env`);
        results.push({
          secret: config.envKey,
          status: "MISSING",
          error: "Required secret not found in environment",
        });
      } else {
        console.log(`⏭️  ${config.envKey} not found (optional, skipping)`);
        results.push({
          secret: config.envKey,
          status: "SKIPPED",
        });
      }
      continue;
    }

    try {
      // Store in Vault
      await vaultService.storeSecret(config.vaultPath, config.vaultKey, envValue);

      console.log(`✅ ${config.envKey} → Vault:${config.vaultPath}/${config.vaultKey}`);
      console.log(`   ${config.description}`);

      results.push({
        secret: config.envKey,
        status: "SUCCESS",
      });
    } catch (error) {
      console.error(`❌ Failed to migrate ${config.envKey}:`, error);
      results.push({
        secret: config.envKey,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Migration Summary\n");

  const successful = results.filter((r) => r.status === "SUCCESS").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  const missing = results.filter((r) => r.status === "MISSING").length;
  const skipped = results.filter((r) => r.status === "SKIPPED").length;

  console.log(`✅ Successfully migrated: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Missing required: ${missing}`);
  console.log(`⏭️  Skipped optional: ${skipped}`);

  if (failed > 0) {
    console.log("\n❌ Failed migrations:");
    results.filter((r) => r.status === "FAILED").forEach((r) => console.log(`   - ${r.secret}: ${r.error}`));
  }

  if (missing > 0) {
    console.log("\n⚠️  Missing required secrets:");
    results.filter((r) => r.status === "MISSING").forEach((r) => console.log(`   - ${r.secret}`));
  }

  // Generate updated .env file with Vault references
  if (successful > 0) {
    console.log("\n" + "=".repeat(60));
    console.log("📝 Generating updated .env file...\n");

    await generateUpdatedEnvFile(results);

    console.log("✅ Created .env.vault with Vault references");
    console.log("✅ Original .env backed up to .env.backup");
    console.log("\n⚠️  IMPORTANT: Review .env.vault and replace .env when ready");
    console.log("   The application will now fetch secrets from Vault instead of .env");
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Migration complete!\n");

  if (successful === SECRETS_TO_MIGRATE.filter((s) => s.required).length) {
    console.log("✅ All required secrets successfully migrated to Vault");
    console.log("🔐 Your secrets are now 150% secured!\n");
  }
}

async function generateUpdatedEnvFile(results: Array<{ secret: string; status: string }>): Promise<void> {
  const envPath = path.resolve(process.cwd(), ".env");
  const backupPath = path.resolve(process.cwd(), ".env.backup");
  const vaultEnvPath = path.resolve(process.cwd(), ".env.vault");

  // Backup original .env
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, backupPath);
  }

  // Read current .env
  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");

  // Track which secrets were migrated
  const migratedKeys = new Set(results.filter((r) => r.status === "SUCCESS").map((r) => r.secret));

  // Generate new .env content
  const newLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Keep comments and empty lines
    if (trimmed.startsWith("#") || trimmed === "") {
      newLines.push(line);
      continue;
    }

    // Check if this line contains a migrated secret
    const [key] = trimmed.split("=");

    if (migratedKeys.has(key?.trim())) {
      // Find the config for this secret
      const config = SECRETS_TO_MIGRATE.find((s) => s.envKey === key?.trim());

      if (config) {
        newLines.push(`# ${key} migrated to Vault:${config.vaultPath}/${config.vaultKey}`);
        newLines.push(`# ${config.description}`);
        newLines.push(`${key}=VAULT:${config.vaultPath}/${config.vaultKey}`);
      }
    } else {
      // Keep non-migrated variables as-is
      newLines.push(line);
    }
  }

  // Write new .env.vault file
  fs.writeFileSync(vaultEnvPath, newLines.join("\n"));
}

/**
 * Verify secrets can be read from Vault
 */
async function verifyVaultSecrets(): Promise<void> {
  console.log("🔍 Verifying secrets in Vault...\n");

  const vaultService = VaultService.getInstance();
  const results: Array<{ path: string; key: string; status: string }> = [];

  for (const config of SECRETS_TO_MIGRATE) {
    try {
      const value = await vaultService.getSecret(config.vaultPath, config.vaultKey);

      if (value) {
        console.log(`✅ ${config.vaultPath}/${config.vaultKey} - Present`);
        results.push({ path: config.vaultPath, key: config.vaultKey, status: "OK" });
      } else {
        console.log(`⚠️  ${config.vaultPath}/${config.vaultKey} - Empty`);
        results.push({ path: config.vaultPath, key: config.vaultKey, status: "EMPTY" });
      }
    } catch (error) {
      console.log(`❌ ${config.vaultPath}/${config.vaultKey} - Not found`);
      results.push({ path: config.vaultPath, key: config.vaultKey, status: "MISSING" });
    }
  }

  const ok = results.filter((r) => r.status === "OK").length;
  const total = results.length;

  console.log(`\n📊 Verification: ${ok}/${total} secrets readable from Vault`);
}

// Main execution
const command = process.argv[2];

if (command === "verify") {
  verifyVaultSecrets()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Verification failed:", error);
      process.exit(1);
    });
} else {
  migrateSecrets()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
