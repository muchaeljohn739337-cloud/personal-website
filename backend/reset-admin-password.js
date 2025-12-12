const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log("🔐 Resetting admin password...");

    const newPassword = "Admin123!";
    const passwordHash = await bcrypt.hash(newPassword, 10);

    const admin = await prisma.users.updateMany({
      where: { role: "ADMIN" },
      data: { passwordHash },
    });

    console.log(`✅ Password reset for ${admin.count} admin user(s)`);
    console.log(`   New password: ${newPassword}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
