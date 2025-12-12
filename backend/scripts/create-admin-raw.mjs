// Create admin user with pre-hashed password
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminId = "admin-vault-001";
const email = "admin@advanciapayledger.com";
const username = "admin";
// Pre-hashed password for "Admin123!" using bcrypt rounds=10
const passwordHash = "$2a$10$N9qo8uLOickgx2Z/Ms/0FeIX1RuYZtxGKVzBZVVmKm5xZ7KU8DGgK";

async function main() {
  try {
    console.log("🔐 Creating admin user...\n");

    // Try to find existing admin
    try {
      const existing = await prisma.$queryRawUnsafe("SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1");

      if (existing && existing.length > 0) {
        console.log(`✅ Admin already exists: ${existing[0].email} (${existing[0].id})\n`);
        return;
      }
    } catch (e) {
      // Continue if query fails
    }

    // Insert admin using raw SQL to bypass schema issues
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO users (
        id, email, username, passwordHash, firstName, lastName, role,
        active, emailVerified, emailVerifiedAt, termsAccepted, termsAcceptedAt,
        usdBalance, btcBalance, ethBalance, usdtBalance,
        createdAt, updatedAt, lastLogin
      ) VALUES (
        '${adminId}',
        '${email}',
        '${username}',
        '${passwordHash}',
        'System',
        'Admin',
        'ADMIN',
        1,
        1,
        datetime('now'),
        1,
        datetime('now'),
        0,
        0,
        0,
        0,
        datetime('now'),
        datetime('now'),
        NULL
      )
    `);

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: Admin123!`);
    console.log(`   ID: ${adminId}\n`);
    console.log("⚠️  IMPORTANT: Change the password after first login!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
