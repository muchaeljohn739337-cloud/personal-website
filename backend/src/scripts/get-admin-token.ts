/**
 * Get Admin Token Script
 * Helps administrators quickly get a JWT token for testing
 */

import axios from "axios";
import * as readline from "readline";

const API_BASE_URL = process.env.API_URL || "http://localhost:4000";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getAdminToken(): Promise<void> {
  console.log("🔐 Admin Token Generator\n");
  console.log("This will help you get a JWT token for admin operations.\n");

  try {
    // Get credentials
    const email = await question("Admin Email (default: admin@example.com): ");
    const password = await question("Admin Password: ");

    const adminEmail = email.trim() || "admin@example.com";

    console.log("\n🔄 Authenticating...\n");

    // Login
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, {
      email: adminEmail,
      password: password.trim(),
    });

    const { token, user } = response.data;

    console.log("✅ Authentication successful!\n");
    console.log("=".repeat(80));
    console.log("📋 USER INFO:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    console.log("\n🔑 JWT TOKEN:");
    console.log(`   ${token}`);
    console.log("=".repeat(80));
    console.log("\n📝 USAGE EXAMPLES:\n");
    console.log("PowerShell:");
    console.log(`$token = "${token}"`);
    console.log("\nTest Security:");
    console.log('Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/dashboard" `');
    console.log('  -Headers @{ "Authorization" = "Bearer $token" }');
    console.log("\nView Blacklist:");
    console.log('Invoke-RestMethod -Uri "http://localhost:4000/api/admin/security-management/ip/blacklist" `');
    console.log('  -Headers @{ "Authorization" = "Bearer $token" }');
    console.log("\n⚠️  IMPORTANT: Keep this token secure! It has admin privileges.\n");
  } catch (error: any) {
    console.error("\n❌ Authentication failed:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data.error || "Unknown error"}`);

      if (error.response.status === 401) {
        console.error("\n💡 Tips:");
        console.error("   - Check your password is correct");
        console.error("   - Ensure the admin account exists");
        console.error("   - Run: npm run db:seed to create admin account");
      }
    } else {
      console.error(`   ${error.message}`);
      console.error("\n💡 Tips:");
      console.error("   - Ensure the server is running (npm run dev)");
      console.error("   - Check API_URL is correct");
    }
  } finally {
    rl.close();
  }
}

// Run
getAdminToken();
