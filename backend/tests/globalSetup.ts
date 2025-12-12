import { seedCompleteTestData } from "./fixtures/testData";

/**
 * Global test setup - runs once before all test suites
 */
export default async function globalSetup() {
  console.log("\n🚀 Starting global test setup...\n");

  try {
    await seedCompleteTestData();
    console.log("\n✅ Global test setup complete!\n");
  } catch (error) {
    console.error("\n❌ Global test setup failed:", error);
    throw error;
  }
}
