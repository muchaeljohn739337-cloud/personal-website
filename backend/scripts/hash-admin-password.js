// ============================================================
// Generate Hashed Admin Password
// ============================================================
// Run: node backend/scripts/hash-admin-password.js
// Then add the hash to your .env file as ADMIN_PASS
// ============================================================

const bcrypt = require("bcryptjs");

const plainPassword = process.argv[2] || "Admin@123";

async function hashPassword() {
  console.log("\n🔐 Hashing Admin Password...\n");

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  console.log("Plain Password:", plainPassword);
  console.log("\nHashed Password (copy to .env):");
  console.log("━".repeat(60));
  console.log(hash);
  console.log("━".repeat(60));

  console.log("\nAdd to backend/.env:");
  console.log(`ADMIN_PASS="${hash}"`);

  console.log("\n✅ Hash generated successfully!\n");

  // Test the hash
  const isValid = await bcrypt.compare(plainPassword, hash);
  console.log("Verification Test:", isValid ? "✅ PASS" : "❌ FAIL");
  console.log("");
}

hashPassword().catch(console.error);
