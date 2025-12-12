import { PrismaClient } from "@prisma/client";
import * as readline from "readline";

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function storeSMSPoolKey() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  SMS Pool API Key Storage");
  console.log("═══════════════════════════════════════════════════\n");

  try {
    const apiKey = await question("Enter your SMS Pool API Key: ");

    if (!apiKey || apiKey.trim().length === 0) {
      console.error("❌ API Key cannot be empty");
      process.exit(1);
    }

    // Store in VaultSecret table (encrypted by SafePrisma)
    await prisma.vaultSecret.upsert({
      where: { key: "smspool_api_key" },
      update: {
        value: apiKey.trim(),
        updatedAt: new Date(),
      },
      create: {
        key: "smspool_api_key",
        value: apiKey.trim(),
        description: "SMS Pool API Key for phone verification",
      },
    });

    console.log("\n✅ SMS Pool API Key stored securely in encrypted database");
    console.log("   The key is encrypted at rest using SafePrisma");
    console.log("   Access it via: getSMSPoolCredentials() function\n");
  } catch (error) {
    console.error("❌ Error storing SMS Pool API Key:", error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

storeSMSPoolKey();
