/**
 * Frontend E2E Test Seeding Setup
 * Seeds database before Playwright tests run
 */

import path from "path";
import { execSync } from "child_process";

/**
 * Global setup - seed database before all E2E tests
 */
export default async function globalSetup() {
  console.log("🌱 Seeding database for E2E tests...");

  try {
    // Wait a bit for backend server to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Call backend seeding endpoint
    const response = await fetch("http://localhost:4000/api/test/seed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-key": process.env.TEST_API_KEY || "test-key-for-e2e",
      },
    });

    if (!response.ok) {
      console.warn("⚠️  Database seeding endpoint not available");
      console.log("Using fallback seeding method...");

      // Fallback: run seeding script directly if endpoint not available
      execSync("npm run test:seed", {
        cwd: path.join(__dirname, "../../backend"),
        stdio: "inherit",
      });
    } else {
      const data = await response.json();
      console.log("✅ Database seeded:", data);
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    // Don't fail tests if seeding fails - tests should handle missing data gracefully
  }
}
