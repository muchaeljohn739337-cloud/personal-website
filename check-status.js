#!/usr/bin/env node

// HTTP Status Check Script for Advancia Pay Ledger
// Tests if backend and frontend are responding with 200 status codes

const https = require("https");
const { URL } = require("url");

console.log("\n🌐 HTTP STATUS CHECK - ADVANCIA PAY LEDGER");
console.log("=".repeat(50));

// URLs to test
const urls = [
  {
    url: "https://modular-saas-platform-frontend.vercel.app",
    name: "Frontend (Vercel)",
    expected: 200,
  },
  {
    url: "https://advancia-backend-upnrf.onrender.com",
    name: "Backend (Render)",
    expected: 200,
  },
  {
    url: "https://advancia-backend-upnrf.onrender.com/api/health",
    name: "API Health (Render)",
    expected: 200,
  },
];

let results = [];
let successCount = 0;

function testEndpoint(url, name, expectedStatus) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Expected Status: ${expectedStatus}`);

    const startTime = Date.now();

    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        timeout: 15000,
        rejectUnauthorized: false, // Allow self-signed certificates for testing
        agent: false,
      };

      const req = https.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        console.log(`   📊 Status Code: ${statusCode} (${responseTime}ms)`);

        const isSuccess = statusCode === expectedStatus;
        if (isSuccess) {
          console.log(`   ✅ SUCCESS: Got expected ${expectedStatus}`);
          successCount++;
        } else {
          console.log(
            `   ❌ FAILED: Expected ${expectedStatus}, got ${statusCode}`
          );
        }

        results.push({
          name,
          url,
          expected: expectedStatus,
          actual: statusCode,
          success: isSuccess,
          responseTime,
        });

        resolve();
      });

      req.on("error", (err) => {
        console.log(`   ❌ ERROR: ${err.message}`);
        results.push({
          name,
          url,
          expected: expectedStatus,
          actual: null,
          success: false,
          error: err.message,
        });
        resolve();
      });

      req.on("timeout", () => {
        console.log(`   ❌ TIMEOUT: Connection timed out`);
        req.destroy();
        results.push({
          name,
          url,
          expected: expectedStatus,
          actual: null,
          success: false,
          error: "Connection timeout",
        });
        resolve();
      });

      req.end();
    } catch (error) {
      console.log(`   ❌ TEST ERROR: ${error.message}`);
      results.push({
        name,
        url,
        expected: expectedStatus,
        actual: null,
        success: false,
        error: error.message,
      });
      resolve();
    }
  });
}

async function runStatusChecks() {
  console.log("\n🚀 TESTING ALL ENDPOINTS");
  console.log("=".repeat(40));

  // Test all URLs sequentially
  for (const { url, name, expected } of urls) {
    await testEndpoint(url, name, expected);
  }

  // Generate summary
  console.log("\n📊 HTTP STATUS SUMMARY");
  console.log("=".repeat(40));

  results.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const statusText = result.actual ? `${result.actual}` : "ERROR";
    console.log(
      `${status} ${result.name}: ${statusText}${
        result.error ? ` (${result.error})` : ""
      }`
    );
  });

  const successRate =
    results.length > 0 ? Math.round((successCount / results.length) * 100) : 0;
  console.log(
    `\n📈 SUCCESS RATE: ${successCount}/${results.length} (${successRate}%)`
  );

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("=".repeat(30));

  const allSuccess = successCount === results.length;
  const frontendSuccess = results.find((r) =>
    r.name.includes("Frontend")
  )?.success;
  const backendSuccess = results.find((r) =>
    r.name.includes("Backend")
  )?.success;
  const apiSuccess = results.find((r) =>
    r.name.includes("API Health")
  )?.success;

  if (allSuccess) {
    console.log("🎉 ALL ENDPOINTS ARE RESPONDING CORRECTLY!");
    console.log("   • Frontend: ✅ Deployed and accessible");
    console.log("   • Backend: ✅ Running and responding");
    console.log("   • API Health: ✅ Backend services healthy");
    console.log("\n   Your application is fully operational! 🚀");
  } else {
    console.log("⚠️  SOME ENDPOINTS ARE NOT RESPONDING");

    if (!frontendSuccess) {
      console.log("   • Frontend Issue: Check Vercel deployment status");
      console.log("     - Verify build logs in Vercel dashboard");
      console.log("     - Check environment variables");
      console.log("     - Ensure domain is properly configured");
    }

    if (!backendSuccess) {
      console.log("   • Backend Issue: Check Render deployment status");
      console.log("     - Verify service is running in Render dashboard");
      console.log("     - Check application logs");
      console.log("     - Verify database connectivity");
    }

    if (!apiSuccess) {
      console.log("   • API Health Issue: Backend may have internal problems");
      console.log("     - Check backend logs for errors");
      console.log("     - Verify database connection");
      console.log("     - Check environment variables");
    }

    console.log("\n🔧 TROUBLESHOOTING STEPS:");
    console.log("1. Check deployment dashboards (Vercel/Render)");
    console.log("2. Review application logs");
    console.log("3. Verify environment variables are set");
    console.log("4. Test database connectivity");
    console.log("5. Check firewall/security settings");
  }

  console.log("\n✨ Status check complete!");
  const status = allSuccess
    ? "ALL GREEN ✅"
    : successRate >= 50
    ? "PARTIAL ⚠️"
    : "ISSUES DETECTED ❌";
  console.log(`   Overall Status: ${status}`);
}

// Run the checks
runStatusChecks().catch(console.error);
