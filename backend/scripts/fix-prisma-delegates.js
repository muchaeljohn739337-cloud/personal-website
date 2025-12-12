// Automated script to fix all Prisma delegate name errors
const fs = require("fs");
const path = require("path");

// Mapping of incorrect delegate names to correct ones
const delegateMap = {
  "prisma.user.": "prisma.users.",
  "prisma.transaction.": "prisma.transactions.",
  "prisma.auditLog.": "prisma.audit_logs.",
  "prisma.cryptoOrder.": "prisma.crypto_orders.",
  "prisma.cryptoWithdrawal.": "prisma.crypto_withdrawals.",
  "prisma.tokenWallet.": "prisma.token_wallets.",
  "prisma.tokenTransaction.": "prisma.token_transactions.",
  "prisma.userTier.": "prisma.user_tiers.",
  "prisma.notification.": "prisma.notifications.",
  "prisma.reward.": "prisma.rewards.",
  "prisma.supportTicket.": "prisma.support_tickets.",
  "prisma.ipBlock.": "prisma.ip_blocks.",
  "prisma.systemStatus.": "prisma.system_status.",
  "prisma.userPreference.": "prisma.user_preferences.",
  "prisma.aISuggestion.": "prisma.ai_suggestions.",
  "prisma.blockchainVerification.": "prisma.blockchain_verifications.",
  "prisma.securityPatch.": "prisma.security_patches.",
  "prisma.pushSubscription.": "prisma.push_subscriptions.",
  "prisma.marketIntelligence.": "prisma.market_intelligence.",
  "prisma.crisisEvent.": "prisma.crisis_events.",

  // Context variations
  "this.context.prisma.user.": "this.context.prisma.users.",
  "this.context.prisma.transaction.": "this.context.prisma.transactions.",
  "this.context.prisma.auditLog.": "this.context.prisma.audit_logs.",
  "this.context.prisma.notification.": "this.context.prisma.notifications.",
  "this.context.prisma.cryptoOrder.": "this.context.prisma.crypto_orders.",
  "this.context.prisma.cryptoWithdrawal.":
    "this.context.prisma.crypto_withdrawals.",
  "this.context.prisma.userPreference.":
    "this.context.prisma.user_preferences.",
  "this.context.prisma.aISuggestion.": "this.context.prisma.ai_suggestions.",
  "this.context.prisma.blockchainVerification.":
    "this.context.prisma.blockchain_verifications.",
  "this.context.prisma.securityPatch.": "this.context.prisma.security_patches.",
  "this.context.prisma.marketIntelligence.":
    "this.context.prisma.market_intelligence.",
  "this.context.prisma.crisisEvent.": "this.context.prisma.crisis_events.",
};

function fixFileContent(content) {
  let fixed = content;
  let changeCount = 0;

  // Apply all delegate replacements
  for (const [wrong, correct] of Object.entries(delegateMap)) {
    const before = fixed;
    fixed = fixed.split(wrong).join(correct);
    if (fixed !== before) {
      const occurrences = (
        before.match(new RegExp(wrong.replace(/\./g, "\\."), "g")) || []
      ).length;
      changeCount += occurrences;
      console.log(`  Replaced ${occurrences}x: ${wrong} → ${correct}`);
    }
  }

  return { fixed, changeCount };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const { fixed, changeCount } = fixFileContent(content);

    if (changeCount > 0) {
      fs.writeFileSync(filePath, fixed, "utf8");
      console.log(`✓ Fixed ${filePath} (${changeCount} changes)`);
      return changeCount;
    }
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function walkDirectory(dir, filePattern = /\.ts$/) {
  const files = [];

  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          walk(fullPath);
        }
      } else if (entry.isFile() && filePattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function main() {
  console.log("🔧 Fixing Prisma delegate names...\n");

  const srcDir = path.join(__dirname, "..", "src");
  const tsFiles = walkDirectory(srcDir);

  console.log(`Found ${tsFiles.length} TypeScript files to process\n`);

  let totalChanges = 0;
  let filesModified = 0;

  for (const file of tsFiles) {
    const changes = processFile(file);
    if (changes > 0) {
      totalChanges += changes;
      filesModified++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total changes: ${totalChanges}`);
  console.log('\n💡 Run "npx tsc --skipLibCheck" to verify fixes');
}

main();
