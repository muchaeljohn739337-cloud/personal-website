// Quick script to add id/updatedAt to specific create calls
const fs = require("fs");
const path = require("path");

const fixes = [
  // medbeds.ts - support_tickets.create
  {
    file: "src/routes/medbeds.ts",
    oldPattern: /userId: userId,\s+subject:/,
    newPattern:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n        updatedAt: new Date(),\n        userId: userId,\n        subject:',
  },
  // rewards.ts - user_tiers.create (line 152)
  {
    file: "src/routes/rewards.ts",
    search:
      'userId: userId,\n        currentTier: "Bronze",\n        points: 0,',
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n        updatedAt: new Date(),\n        userId: userId,\n        currentTier: "Bronze",\n        points: 0,',
  },
  // rewards.ts - user_tiers.create (line 205)
  {
    file: "src/routes/rewards.ts",
    search: "userId,\n        points: 0,",
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n        updatedAt: new Date(),\n        userId,\n        points: 0,',
  },
  // rewards.ts - rewards.create (line 243)
  {
    file: "src/routes/rewards.ts",
    search: 'userId: userId,\n          type: "BONUS",',
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n          userId: userId,\n          type: "BONUS",',
  },
  // rewards.ts - rewards.create (line 393)
  {
    file: "src/routes/rewards.ts",
    search: "userId: userId,\n          type: bonusType,",
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n          userId: userId,\n          type: bonusType,',
  },
  // rewards.ts - audit_logs.create (line 416)
  {
    file: "src/routes/rewards.ts",
    search: "userId: userId,\n          action: `REWARD_CLAIMED`,",
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n          updatedAt: new Date(),\n          userId: userId,\n          action: `REWARD_CLAIMED`,',
  },
  // rewards.ts - rewards.create (line 501)
  {
    file: "src/routes/rewards.ts",
    search:
      "userId: userId,\n            type: bonusType,\n            amount: bonusAmount",
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n            userId: userId,\n            type: bonusType,\n            amount: bonusAmount',
  },
  // rewards.ts - audit_logs.create (line 528)
  {
    file: "src/routes/rewards.ts",
    search: "userId: userId,\n          action: `REWARD_DISTRIBUTED`,",
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n          updatedAt: new Date(),\n          userId: userId,\n          action: `REWARD_DISTRIBUTED`,',
  },
  // rpaApproval.ts - audit_logs.create (line 336)
  {
    file: "src/routes/rpaApproval.ts",
    search: 'userId: "SYSTEM",\n          action: "RPA_AUTO_APPROVE",',
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n          updatedAt: new Date(),\n          userId: "SYSTEM",\n          action: "RPA_AUTO_APPROVE",',
  },
  // rpaApproval.ts - audit_logs.create (line 365)
  {
    file: "src/routes/rpaApproval.ts",
    search: 'userId: userId,\n          action: "RPA_KYC_AUTO_VERIFY",',
    replace:
      'id: (await import("crypto")).randomUUID?.() || `${Date.now()}`,\n          updatedAt: new Date(),\n          userId: userId,\n          action: "RPA_KYC_AUTO_VERIFY",',
  },
  // support.ts - support_tickets.create
  {
    file: "src/routes/support.ts",
    search: "id: crypto.randomUUID(),\n      userId,",
    replace:
      "id: crypto.randomUUID(),\n      updatedAt: new Date(),\n      userId,",
  },
];

function applyFix(filePath, search, replace) {
  try {
    const fullPath = path.join(__dirname, "..", filePath);
    let content = fs.readFileSync(fullPath, "utf8");

    if (content.includes(search)) {
      content = content.replace(search, replace);
      fs.writeFileSync(fullPath, content, "utf8");
      console.log(`✓ Fixed ${filePath}`);
      return true;
    } else {
      console.log(`⚠ Pattern not found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log("🔧 Adding missing id/updatedAt fields...\n");

  let fixed = 0;
  for (const fix of fixes) {
    if (fix.search && applyFix(fix.file, fix.search, fix.replace)) {
      fixed++;
    }
  }

  console.log(`\n✅ Fixed ${fixed}/${fixes.length} files`);
}

main();
