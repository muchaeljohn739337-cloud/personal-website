#!/usr/bin/env node

// SSL Certificate Verification Script for Advancia Pay Ledger
// Tests HTTPS connections and SSL certificate validity

const https = require("https");
const { URL } = require("url");

console.log("\n🔒 SSL CERTIFICATE VERIFICATION - ADVANCIA PAY LEDGER");
console.log("=".repeat(60));

// Production URLs to test
const urls = [
  {
    url: "https://modular-saas-platform-frontend.vercel.app",
    name: "Frontend (Vercel)",
    type: "production",
  },
  {
    url: "https://advancia-backend-upnrf.onrender.com",
    name: "Backend (Render)",
    type: "production",
  },
  {
    url: "https://advancia-backend-upnrf.onrender.com/api/health",
    name: "API Health (Render)",
    type: "production",
  },
  {
    url: "https://advanciapayledger.com",
    name: "Custom Frontend",
    type: "custom",
  },
  {
    url: "https://api.advanciapayledger.com",
    name: "Custom API",
    type: "custom",
  },
  {
    url: "https://api.advanciapayledger.com/api/health",
    name: "Custom API Health",
    type: "custom",
  },
];

let results = [];
let successCount = 0;
let totalTests = 0;

function testSSL(url, name, type) {
  return new Promise((resolve) => {
    totalTests++;

    console.log(`\n🔍 Testing SSL for: ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Type: ${type}`);

    const startTime = Date.now();

    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        timeout: 10000,
        rejectUnauthorized: true,
        agent: false,
      };

      const req = https.request(options, (res) => {
        const responseTime = Date.now() - startTime;

        if (res.statusCode === 200) {
          console.log(`   ✅ HTTPS Connection: SUCCESS (${responseTime}ms)`);
          console.log(`   📊 Status Code: ${res.statusCode}`);

          // Check SSL certificate
          const cert = res.socket.getPeerCertificate();
          if (cert) {
            console.log(`   🔐 SSL Certificate Details:`);
            console.log(`      Subject: ${cert.subject?.CN || "N/A"}`);
            console.log(`      Issuer: ${cert.issuer?.CN || "N/A"}`);
            console.log(
              `      Valid From: ${new Date(
                cert.valid_from
              ).toLocaleDateString()}`
            );
            console.log(
              `      Valid To: ${new Date(cert.valid_to).toLocaleDateString()}`
            );

            // Check if certificate is valid
            const now = new Date();
            const validFrom = new Date(cert.valid_from);
            const validTo = new Date(cert.valid_to);

            if (now >= validFrom && now <= validTo) {
              console.log(`      ✅ Certificate is VALID`);
            } else {
              console.log(`      ❌ Certificate is EXPIRED or NOT YET VALID`);
            }

            // Check issuer (Let's Encrypt for automatic SSL)
            if (cert.issuer?.O?.includes("Let's Encrypt")) {
              console.log(`      ✅ Automatic SSL (Let's Encrypt)`);
            }
          }

          successCount++;
          results.push({
            name,
            type,
            status: "SUCCESS",
            url,
            statusCode: res.statusCode,
            responseTime,
            ssl: cert ? "VALID" : "UNKNOWN",
          });
        } else {
          console.log(
            `   ❌ HTTPS Connection: FAILED (Status: ${res.statusCode})`
          );
          results.push({
            name,
            type,
            status: "FAILED",
            url,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`,
          });
        }

        resolve();
      });

      req.on("error", (err) => {
        console.log(`   ❌ SSL Test Failed: ${err.message}`);
        results.push({
          name,
          type,
          status: "ERROR",
          url,
          error: err.message,
        });
        resolve();
      });

      req.on("timeout", () => {
        console.log(`   ❌ SSL Test Timeout`);
        req.destroy();
        results.push({
          name,
          type,
          status: "TIMEOUT",
          url,
          error: "Connection timeout",
        });
        resolve();
      });

      req.end();
    } catch (error) {
      console.log(`   ❌ SSL Test Error: ${error.message}`);
      results.push({
        name,
        type,
        status: "ERROR",
        url,
        error: error.message,
      });
      resolve();
    }
  });
}

async function runSSLTests() {
  console.log("\n🌐 TESTING ALL URLS");
  console.log("=".repeat(50));

  // Test all URLs sequentially
  for (const { url, name, type } of urls) {
    await testSSL(url, name, type);
  }

  // Generate summary
  console.log("\n📊 SSL CERTIFICATE VALIDATION SUMMARY");
  console.log("=".repeat(50));

  const productionResults = results.filter((r) => r.type === "production");
  const customResults = results.filter((r) => r.type === "custom");

  console.log("\n🏭 PRODUCTION URLS:");
  productionResults.forEach((result) => {
    const status =
      result.status === "SUCCESS"
        ? "✅"
        : result.status === "FAILED"
        ? "❌"
        : "⚠️";
    console.log(
      `${status} ${result.name}: ${result.status}${
        result.statusCode ? ` (${result.statusCode})` : ""
      }${result.error ? ` - ${result.error}` : ""}`
    );
  });

  console.log("\n🏠 CUSTOM DOMAIN URLS:");
  customResults.forEach((result) => {
    const status =
      result.status === "SUCCESS"
        ? "✅"
        : result.status === "FAILED"
        ? "❌"
        : "⚠️";
    console.log(
      `${status} ${result.name}: ${result.status}${
        result.statusCode ? ` (${result.statusCode})` : ""
      }${result.error ? ` - ${result.error}` : ""}`
    );
  });

  const successRate =
    totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0;
  console.log(
    `\n📈 SUCCESS RATE: ${successCount}/${totalTests} (${successRate}%)`
  );

  // Recommendations
  console.log("\n💡 SSL CERTIFICATE RECOMMENDATIONS");
  console.log("=".repeat(50));

  const productionSuccess = productionResults.filter(
    (r) => r.status === "SUCCESS"
  ).length;
  const customSuccess = customResults.filter(
    (r) => r.status === "SUCCESS"
  ).length;

  if (productionSuccess === productionResults.length) {
    console.log("✅ All production SSL certificates are working perfectly!");
    console.log("   • Vercel provides automatic SSL via Let's Encrypt");
    console.log("   • Render provides automatic SSL via Let's Encrypt");
  } else {
    console.log(
      "⚠️  Some production SSL certificates are not working properly"
    );
    console.log("   • Check Vercel and Render deployment status");
    console.log("   • Verify environment variables are set correctly");
  }

  if (customSuccess === customResults.length) {
    console.log("✅ Custom domain SSL certificates are active!");
    console.log("   • DNS propagation is complete");
    console.log("   • SSL certificates automatically provisioned");
  } else if (customSuccess > 0) {
    console.log("⚠️  Partial custom domain SSL configuration");
    console.log("   • Some custom domain tests passed");
    console.log("   • DNS may still be propagating for other domains");
  } else {
    console.log("ℹ️  Custom domain SSL not yet configured");
    console.log("   • DNS records may not be set up yet");
    console.log("   • DNS propagation takes 24-48 hours");
    console.log("   • SSL certificates are automatic once DNS is configured");
  }

  console.log("\n🔍 NEXT STEPS:");
  console.log("1. If custom domains aren't working, check DNS configuration");
  console.log("2. Wait 24-48 hours for DNS propagation if recently changed");
  console.log("3. Verify domain settings in Vercel and Render dashboards");
  console.log("4. Test SSL using online tools:");
  console.log("   • https://www.sslshopper.com/ssl-checker.html");
  console.log("   • https://www.whatsmydns.net/");

  console.log("\n✨ SSL verification complete!");
  const status =
    successRate >= 80
      ? "EXCELLENT"
      : successRate >= 50
      ? "GOOD"
      : "NEEDS ATTENTION";
  const color =
    successRate >= 80
      ? "\x1b[32m"
      : successRate >= 50
      ? "\x1b[33m"
      : "\x1b[31m";
  console.log(`   Current SSL Status: ${color}${status}\x1b[0m`);
}

// Run the tests
runSSLTests().catch(console.error);
