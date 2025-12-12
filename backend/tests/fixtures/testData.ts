import bcrypt from "bcryptjs";
import prisma from "../../src/prismaClient";
import { randomUUID } from "crypto";

// Test credentials constants
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "Admin123!@#";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "User123!@#";

export async function seedCompleteTestData() {
  console.log("🌱 Seeding test data...");
  
  // Ensure Prisma is connected
  await prisma.$connect();
  
  await cleanTestData();

  const adminPassword = await bcrypt.hash("Admin123!@#", 10);
  const admin = await prisma.users.create({
    data: {
      id: randomUUID(),
      email: "admin@test.com",
      username: "testadmin",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      emailVerified: true,
      active: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const userPassword = await bcrypt.hash("User123!@#", 10);
  const user = await prisma.users.create({
    data: {
      id: randomUUID(),
      email: "user@test.com",
      username: "testuser",
      passwordHash: userPassword,
      firstName: "Test",
      lastName: "User",
      role: "USER",
      emailVerified: true,
      active: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Test users created");
  
  // Keep connection open for tests
  // await prisma.$disconnect();
  
  return { admin, user };
}

export async function cleanTestData() {
  console.log("�� Cleaning test data...");

  try {
    const testUsers = await prisma.users.findMany({
      where: {
        email: {
          in: ["admin@test.com", "user@test.com"],
        },
      },
      select: { id: true },
    });

    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length === 0) {
      console.log("No test users found to clean");
      return;
    }

    await prisma.support_tickets.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    await prisma.user_tiers.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    await prisma.rewards.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    const wallets = await prisma.token_wallets.findMany({
      where: { userId: { in: testUserIds } },
      select: { id: true },
    });
    const walletIds = wallets.map((w) => w.id);

    if (walletIds.length > 0) {
      await prisma.token_transactions.deleteMany({
        where: { walletId: { in: walletIds } },
      });
    }

    await prisma.token_wallets.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    await prisma.transactions.deleteMany({
      where: { userId: { in: testUserIds } },
    });

    await prisma.users.deleteMany({
      where: { id: { in: testUserIds } },
    });

    console.log("✅ Test data cleaned");
  } catch (error) {
    console.error("❌ Error cleaning test data:", error);
  }
}

// ⚠️ TEST CREDENTIALS ONLY - NOT FOR PRODUCTION
export const TEST_CREDENTIALS = {
  admin: {
    email: "admin@test.com",
    password: TEST_ADMIN_PASSWORD,
    role: "ADMIN",
  },
  user: {
    email: "user@test.com",
    password: TEST_USER_PASSWORD,
    role: "USER",
  },
};
