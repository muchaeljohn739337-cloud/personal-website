/**
 * Store Google OAuth credentials in encrypted database
 * This is a fallback when Vault is not available
 * Run with: npx ts-node scripts/store-google-oauth-in-db.ts
 */

import crypto from "crypto";
import * as dotenv from "dotenv";
import prisma from "../src/prismaClient";

dotenv.config();

// Encryption key from environment
const ENCRYPTION_KEY =
  process.env.VAULT_ENCRYPTION_KEY || "b87cdbbf9234eaa98251cb2a4483bc3bce0f7ede74bda0a03dc2d1f1687cbe88";

interface SecretData {
  key: string;
  value: string;
  metadata?: any;
}

const secrets: SecretData[] = [
  {
    key: "GOOGLE_CLIENT_ID",
    value: process.env.GOOGLE_CLIENT_ID || "",
    metadata: {
      description: "Google OAuth Client ID",
      provider: "Google Cloud Console",
      project: "ultimate-walker-478720-f2",
    },
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    value: process.env.GOOGLE_CLIENT_SECRET || "",
    metadata: {
      description: "Google OAuth Client Secret",
      provider: "Google Cloud Console",
      project: "ultimate-walker-478720-f2",
    },
  },
  {
    key: "GOOGLE_REDIRECT_URI",
    value: process.env.GOOGLE_REDIRECT_URI || "",
    metadata: {
      description: "Google OAuth Redirect URI",
      environment: process.env.NODE_ENV || "development",
    },
  },
  {
    key: "GOOGLE_OAUTH_ADMIN_EMAILS",
    value: process.env.GOOGLE_OAUTH_ADMIN_EMAILS || "",
    metadata: {
      description: "Comma-separated list of admin email addresses",
      count: (process.env.GOOGLE_OAUTH_ADMIN_EMAILS || "").split(",").length,
    },
  },
];

function encryptValue(value: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, "hex") as any;
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv as any);
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

async function storeSecretInDB(secret: SecretData): Promise<void> {
  try {
    if (!secret.value) {
      console.warn(`⚠️  Skipping ${secret.key} - No value provided`);
      return;
    }

    const { encrypted, iv } = encryptValue(secret.value);

    // Upsert secret in database
    await prisma.vault_secrets.upsert({
      where: { key: secret.key },
      update: {
        encrypted_value: encrypted,
        iv: iv,
        version: { increment: 1 },
        metadata: secret.metadata ? JSON.stringify(secret.metadata) : undefined,
        last_rotated: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        key: secret.key,
        encrypted_value: encrypted,
        iv: iv,
        version: 1,
        metadata: secret.metadata ? JSON.stringify(secret.metadata) : undefined,
        created_by: "system",
        rotationPolicy: "manual",
      },
    });

    console.log(`✅ Stored ${secret.key} in encrypted database`);
  } catch (error: any) {
    console.error(`❌ Error storing ${secret.key}:`, error.message);
  }
}

async function main() {
  console.log("🔐 Storing Google OAuth credentials in encrypted database...\n");
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Database: ${process.env.DATABASE_URL || "file:./dev.db"}\n`);

  // Store each secret
  for (const secret of secrets) {
    await storeSecretInDB(secret);
  }

  console.log("\n✅ Google OAuth credentials stored successfully!");
  console.log("\n📋 Stored secrets:");
  console.log("   - GOOGLE_CLIENT_ID");
  console.log("   - GOOGLE_CLIENT_SECRET");
  console.log("   - GOOGLE_REDIRECT_URI");
  console.log("   - GOOGLE_OAUTH_ADMIN_EMAILS");
  console.log("\n💡 These secrets are encrypted with AES-256-CBC");
  console.log("💡 Your application will automatically use these secrets");
  console.log("💡 To view secrets: SELECT key, version FROM vault_secrets;");

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
