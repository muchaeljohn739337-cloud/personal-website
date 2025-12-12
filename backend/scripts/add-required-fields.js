// Add missing required fields to Prisma create operations
const fs = require("fs");
const path = require("path");

// Models that require explicit id and updatedAt
const requiresId = [
  "audit_logs",
  "notifications",
  "token_wallets",
  "token_transactions",
  "eth_activity",
  "crypto_withdrawals",
  "transactions",
  "ai_suggestions",
  "admin_transfers",
  "system_status",
  "support_tickets",
];

function addMissingFields(content) {
  let fixed = content;
  let changeCount = 0;

  // Pattern: .create({ without id: or updatedAt:
  // We'll look for .create({ followed by content that doesn't have id: or updatedAt:

  requiresId.forEach((model) => {
    const delegateName = model;

    // Match: prisma.MODEL.create({ ... }) or this.context.prisma.MODEL.create({ ... })
    // Look for creates that are missing id:
    const createRegex = new RegExp(
      `((?:prisma|this\\.context\\.prisma)\\.${delegateName}\\.create\\(\\{[^}]*?)\\n(\\s+)([^}]+?)\\n\\s*\\})`,
      "g"
    );

    fixed = fixed.replace(createRegex, (match, before, indent, fields, after) => {
      // Check if id: already exists
      if (!/\bid:\s*/.test(match)) {
        // Add id and updatedAt at the start of the object
        const cryptoImport = `(await import("crypto")).randomUUID?.() || \`\${Date.now()}\``;
        let replacement =
          before + `\n${indent}id: ${cryptoImport},\n${indent}updatedAt: new Date(),\n${indent}${fields}\n  }`;

        // For token_transactions, don't add updatedAt
        if (model === "token_transactions") {
          replacement = before + `\n${indent}id: ${cryptoImport},\n${indent}${fields}\n  }`;
        }

        changeCount++;
        console.log(`  Added id/updatedAt to ${model}.create()`);
        return replacement;
      }
      return match;
    });
  });

  return { fixed, changeCount };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const { fixed, changeCount } = addMissingFields(content);

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
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
            walk(fullPath);
          }
        } else if (entry.isFile() && filePattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  walk(dir);
  return files;
}

function main() {
  console.log("🔧 Adding missing required fields to .create() calls...\n");

  const srcDir = path.join(__dirname, "..", "src");
  const tsFiles = walkDirectory(srcDir);

  // Focus on files likely to have create operations
  const filesToProcess = tsFiles.filter(
    (f) => f.includes("agents") || f.includes("routes") || f.includes("ai-core") || f.includes("services")
  );

  console.log(`Found ${filesToProcess.length} files to process\n`);

  let totalChanges = 0;
  let filesModified = 0;

  for (const file of filesToProcess) {
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
