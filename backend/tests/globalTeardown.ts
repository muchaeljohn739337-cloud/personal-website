import { cleanTestData } from "./fixtures/testData";
import prisma from "../src/prismaClient";

/**
 * Global test teardown - runs once after all test suites
 */
export default async function globalTeardown() {
  console.log("\n🧹 Starting global test teardown...\n");

  try {
    await cleanTestData();
    await prisma.$disconnect();
    console.log("\n✅ Global test teardown complete!\n");
  } catch (error) {
    console.error("\n❌ Global test teardown failed:", error);
    throw error;
  }
}
