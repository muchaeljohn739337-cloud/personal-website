/**
 * Store SMS Pool credentials in HashiCorp Vault
 *
 * Usage:
 *   npx tsx scripts/store-smspool-in-vault.ts
 *
 * Prerequisites:
 *   - Admin user with Vault access
 *   - VAULT_ENABLED=true in .env
 *   - Valid VAULT_TOKEN in .env
 */

import dotenv from "dotenv";
import prisma from "../src/prismaClient";
import { VaultService } from "../src/services/VaultService";

dotenv.config();

async function storeSMSPoolCredentials() {
  try {
    console.log("🔐 Storing SMS Pool credentials in Vault...\n");

    // Get admin user
    const admin = await prisma.users.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    if (!admin) {
      throw new Error("No admin user found. Please create an admin user first.");
    }

    console.log(`✅ Found admin user: ${admin.email} (${admin.id})\n`);

    // Initialize Vault service
    const vaultService = new VaultService();

    // Get SMS Pool credentials from environment
    const smspoolApiKey = process.env.SMSPOOL_API_KEY;
    const smspoolServiceId = process.env.SMSPOOL_SERVICE_ID || "1";

    if (!smspoolApiKey) {
      throw new Error("SMSPOOL_API_KEY not found in .env file");
    }

    console.log("📝 Credentials found:");
    console.log(`   API Key: ${smspoolApiKey.substring(0, 20)}...`);
    console.log(`   Service ID: ${smspoolServiceId}\n`);

    // Store API Key in Vault
    await vaultService.createSecret(
      {
        key: "smspool_api_key",
        value: smspoolApiKey,
        metadata: {
          service: "SMS Pool",
          purpose: "Phone verification SMS",
          environment: process.env.NODE_ENV || "development",
          created_at: new Date().toISOString(),
        },
        rotationPolicy: {
          enabled: true,
          intervalDays: 90, // Rotate every 3 months
        },
      },
      admin.id
    );

    console.log("✅ Stored: smspool_api_key\n");

    // Store Service ID in Vault
    await vaultService.createSecret(
      {
        key: "smspool_service_id",
        value: smspoolServiceId,
        metadata: {
          service: "SMS Pool",
          purpose: "Service identifier for SMS Pool API",
          environment: process.env.NODE_ENV || "development",
          created_at: new Date().toISOString(),
        },
      },
      admin.id
    );

    console.log("✅ Stored: smspool_service_id\n");

    console.log("🎉 SMS Pool credentials successfully stored in Vault!");
    console.log("\n📋 Next steps:");
    console.log("   1. Remove SMSPOOL_API_KEY from .env (keep in .env.local for backup)");
    console.log("   2. Update RPA config to fetch from Vault");
    console.log("   3. Test SMS verification flow");
    console.log("   4. Monitor Vault audit logs\n");

    // Show audit log
    console.log("📊 Recent Vault activity:");
    const auditLogs = await prisma.vault_audit_logs.findMany({
      where: {
        user_id: admin.id,
        action: { in: ["create", "read"] },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
      select: {
        action: true,
        secret_key: true,
        success: true,
        timestamp: true,
      },
    });

    auditLogs.forEach((log) => {
      const status = log.success ? "✅" : "❌";
      console.log(`   ${status} ${log.action.toUpperCase()} ${log.secret_key} at ${log.timestamp.toISOString()}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error storing SMS Pool credentials:");
    console.error(error.message);

    if (error.message.includes("already exists")) {
      console.log("\n💡 Tip: Secret already exists. Use update or rotation instead.");
      console.log("   To update: Use VaultService.updateSecret()");
      console.log("   To rotate: Use VaultService.rotateSecret()");
    }

    if (process.env.VAULT_ENABLED !== "true") {
      console.log("\n💡 Tip: VAULT_ENABLED is not set to 'true' in .env");
      console.log("   Credentials are stored in encrypted database as fallback");
    }

    process.exit(1);
  }
}

// Run the script
storeSMSPoolCredentials();
