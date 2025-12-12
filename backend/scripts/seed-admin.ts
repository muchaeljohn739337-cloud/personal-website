import bcrypt from "bcryptjs";
import crypto from "crypto";
import "dotenv/config";
import prisma from "../src/prismaClient";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@advanciapay.com";
  // nosemgrep: javascript.lang.security.audit.hardcoded-password
  // snyk-disable-next-line javascript/NoHardcodedPasswords
  // Default password for development - MUST be changed in production via SEED_ADMIN_PASSWORD env var
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const username = process.env.SEED_ADMIN_USERNAME || "admin";
  const firstName = "System";
  const lastName = "Admin";

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ Admin already exists: ${email}`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: {
      id: crypto.randomUUID(),
      email,
      username,
      passwordHash: hash,
      firstName,
      lastName,
      role: "ADMIN",
      active: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Admin created: ${user.email} (password: ${password})`);
}

main()
  .catch((e) => {
    console.error("Seed admin failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
