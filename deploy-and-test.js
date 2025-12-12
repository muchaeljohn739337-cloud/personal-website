#!/usr/bin/env node

/**
 * Cloudflare Pages Deployment and KV Testing Script
 * Handles deployment and testing of KV storage functionality
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class CloudflareDeployer {
  constructor() {
    this.projectName = "advancia-platform";
    this.frontendDir = path.join(__dirname, "frontend");
  }

  log(message, status = "INFO") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${status}: ${message}`);
  }

  // Check if wrangler is authenticated
  checkAuth() {
    try {
      this.log("Checking Wrangler authentication...");
      const result = execSync("npx wrangler whoami", {
        encoding: "utf8",
        cwd: this.frontendDir,
      });
      this.log("✅ Wrangler authenticated", "SUCCESS");
      return true;
    } catch (error) {
      this.log(`❌ Wrangler authentication failed: ${error.message}`, "ERROR");
      this.log("Please run: npx wrangler auth login", "INFO");
      return false;
    }
  }

  // Deploy to Cloudflare Pages
  deploy() {
    try {
      this.log("Starting Cloudflare Pages deployment...");

      const deployCommand = `npx wrangler pages deploy . --project-name ${this.projectName} --compatibility-date 2024-01-01`;
      this.log(`Running: ${deployCommand}`);

      const result = execSync(deployCommand, {
        encoding: "utf8",
        cwd: this.frontendDir,
        stdio: "inherit",
      });

      this.log("✅ Deployment completed successfully", "SUCCESS");
      return true;
    } catch (error) {
      this.log(`❌ Deployment failed: ${error.message}`, "ERROR");
      return false;
    }
  }

  // Test KV functionality
  async testKV() {
    const https = require("https");

    this.log("Testing KV functionality on deployed site...");

    const testUrl = `https://${this.projectName}.workers.dev/functions/test-kv`;

    return new Promise((resolve) => {
      const postData = JSON.stringify({ action: "test" });

      const options = {
        hostname: `${this.projectName}.workers.dev`,
        port: 443,
        path: "/functions/test-kv",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          "User-Agent": "KV-Test-Script/1.0",
        },
      };

      const req = https.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          try {
            const response = JSON.parse(body);
            if (res.statusCode === 200 && response.success) {
              this.log("✅ KV test successful", "SUCCESS");
              resolve(true);
            } else {
              this.log(
                `❌ KV test failed: ${response.error || "Unknown error"}`,
                "ERROR"
              );
              resolve(false);
            }
          } catch (e) {
            this.log(`❌ KV test failed: Invalid response`, "ERROR");
            resolve(false);
          }
        });
      });

      req.on("error", (err) => {
        this.log(`❌ KV test connection failed: ${err.message}`, "ERROR");
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  }

  // Run full deployment and testing
  async runFullProcess() {
    console.log("🚀 Starting Cloudflare Pages Deployment and Testing\n");

    // Check authentication
    if (!this.checkAuth()) {
      console.log("\n❌ Please authenticate with Wrangler first:");
      console.log("   npx wrangler auth login");
      return false;
    }

    // Deploy
    console.log("\n📦 Deploying to Cloudflare Pages...");
    const deploySuccess = this.deploy();

    if (!deploySuccess) {
      console.log("\n❌ Deployment failed. Please check the errors above.");
      return false;
    }

    // Wait for deployment to propagate
    console.log("\n⏳ Waiting for deployment to propagate (30 seconds)...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    // Test KV functionality
    console.log("\n🧪 Testing KV functionality...");
    const testSuccess = await this.testKV();

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT SUMMARY:");
    console.log("=".repeat(60));
    console.log(`✅ Deployment: ${deploySuccess ? "SUCCESS" : "FAILED"}`);
    console.log(`✅ KV Testing: ${testSuccess ? "SUCCESS" : "FAILED"}`);

    if (deploySuccess && testSuccess) {
      console.log("\n🎉 ALL TESTS PASSED!");
      console.log(
        `🌐 Your site is live at: https://${this.projectName}.workers.dev`
      );
      console.log(
        "🔗 Test KV functions at: https://${this.projectName}.workers.dev/functions/test-kv"
      );
    } else {
      console.log("\n⚠️  Some issues detected. Check the errors above.");
      console.log("🔍 Troubleshooting:");
      console.log("   - Check Cloudflare dashboard for deployment status");
      console.log("   - Verify KV namespace binding");
      console.log("   - Check Pages Functions logs");
    }

    console.log("=".repeat(60));

    return deploySuccess && testSuccess;
  }
}

// Run the deployment and testing
const deployer = new CloudflareDeployer();
deployer.runFullProcess().catch((error) => {
  console.error("💥 Deployment process failed:", error.message);
  process.exit(1);
});
