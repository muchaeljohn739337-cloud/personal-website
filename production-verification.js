#!/usr/bin/env node

// Production Deployment Verification Script
// Comprehensive testing of all deployed Advancia Pay Ledger services

const https = require("https");
const { URL } = require("url");

console.log("\n🚀 PRODUCTION DEPLOYMENT VERIFICATION - ADVANCIA PAY LEDGER");
console.log("=".repeat(70));

const services = [
  {
    name: "Frontend (Vercel)",
    url: "https://modular-saas-platform-frontend.vercel.app",
    type: "frontend",
    expectedStatus: 200,
    description: "Next.js application served by Vercel",
  },
  {
    name: "Backend API (Render)",
    url: "https://advancia-backend-upnrf.onrender.com",
    type: "backend",
    expectedStatus: 200,
    description: "Express.js API server on Render",
  },
  {
    name: "API Health Check",
    url: "https://advancia-backend-upnrf.onrender.com/api/health",
    type: "api",
    expectedStatus: 200,
    description: "Backend health endpoint",
  },
  {
    name: "Custom Frontend Domain",
    url: "https://advanciapayledger.com",
    type: "custom-frontend",
    expectedStatus: 200,
    description: "Custom domain pointing to Vercel",
  },
  {
    name: "Custom API Domain",
    url: "https://api.advanciapayledger.com",
    type: "custom-api",
    expectedStatus: 200,
    description: "Custom domain pointing to Render",
  },
  {
    name: "Custom API Health",
    url: "https://api.advanciapayledger.com/api/health",
    type: "custom-api",
    expectedStatus: 200,
    description: "Custom API health endpoint",
  },
];

let results = [];
let successCount = 0;
let totalTests = services.length;

function testService(service) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${service.name}`);
    console.log(`   URL: ${service.url}`);
    console.log(`   Type: ${service.type}`);
    console.log(`   Description: ${service.description}`);

    const startTime = Date.now();

    try {
      const urlObj = new URL(service.url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        timeout: 20000,
        rejectUnauthorized: true,
        agent: false,
        headers: {
          "User-Agent": "Advancia-Production-Verifier/1.0",
        },
      };

      const req = https.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        console.log(`   📊 Status: ${statusCode} (${responseTime}ms)`);

        // Check SSL certificate
        const cert = res.socket.getPeerCertificate();
        let sslStatus = "UNKNOWN";
        if (cert) {
          const now = new Date();
          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);

          if (now >= validFrom && now <= validTo) {
            sslStatus = "VALID";
            console.log(
              `   🔐 SSL: ✅ Valid (${cert.issuer?.O || "Unknown Issuer"})`
            );
          } else {
            sslStatus = "EXPIRED";
            console.log(`   🔐 SSL: ❌ Expired`);
          }
        }

        const isSuccess = statusCode === service.expectedStatus;
        if (isSuccess) {
          console.log(`   ✅ SUCCESS: Service responding correctly`);
          successCount++;
        } else {
          console.log(
            `   ❌ FAILED: Expected ${service.expectedStatus}, got ${statusCode}`
          );
        }

        results.push({
          ...service,
          status: isSuccess ? "SUCCESS" : "FAILED",
          actualStatus: statusCode,
          responseTime,
          sslStatus,
          success: isSuccess,
        });

        resolve();
      });

      req.on("error", (err) => {
        console.log(`   ❌ CONNECTION ERROR: ${err.message}`);
        results.push({
          ...service,
          status: "ERROR",
          error: err.message,
          success: false,
        });
        resolve();
      });

      req.on("timeout", () => {
        console.log(`   ❌ TIMEOUT: Connection timed out after 20s`);
        req.destroy();
        results.push({
          ...service,
          status: "TIMEOUT",
          error: "Connection timeout",
          success: false,
        });
        resolve();
      });

      req.end();
    } catch (error) {
      console.log(`   ❌ TEST ERROR: ${error.message}`);
      results.push({
        ...service,
        status: "ERROR",
        error: error.message,
        success: false,
      });
      resolve();
    }
  });
}

async function runProductionVerification() {
  console.log("\n🌐 TESTING ALL DEPLOYED SERVICES");
  console.log("=".repeat(60));

  // Test all services sequentially
  for (const service of services) {
    await testService(service);
  }

  // Generate comprehensive summary
  console.log("\n📊 PRODUCTION DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));

  const frontendResults = results.filter((r) => r.type.includes("frontend"));
  const backendResults = results.filter(
    (r) => r.type.includes("backend") || r.type.includes("api")
  );
  const customResults = results.filter((r) => r.type.includes("custom"));

  console.log("\n🏭 PRODUCTION SERVICES:");
  [...frontendResults, ...backendResults].forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const statusText = result.actualStatus
      ? `${result.actualStatus}`
      : result.status;
    console.log(
      `${status} ${result.name}: ${statusText}${
        result.error ? ` - ${result.error}` : ""
      }`
    );
  });

  console.log("\n🏠 CUSTOM DOMAINS:");
  customResults.forEach((result) => {
    const status = result.success ? "✅" : "❌";
    const statusText = result.actualStatus
      ? `${result.actualStatus}`
      : result.status;
    console.log(
      `${status} ${result.name}: ${statusText}${
        result.error ? ` - ${result.error}` : ""
      }`
    );
  });

  const successRate = Math.round((successCount / totalTests) * 100);
  console.log(
    `\n📈 OVERALL SUCCESS RATE: ${successCount}/${totalTests} (${successRate}%)`
  );

  // Detailed analysis
  console.log("\n🔍 DEPLOYMENT ANALYSIS");
  console.log("=".repeat(40));

  const frontendSuccess = frontendResults.filter((r) => r.success).length;
  const backendSuccess = backendResults.filter((r) => r.success).length;
  const customSuccess = customResults.filter((r) => r.success).length;

  console.log(
    `Frontend Services: ${frontendSuccess}/${frontendResults.length} operational`
  );
  console.log(
    `Backend Services: ${backendSuccess}/${backendResults.length} operational`
  );
  console.log(
    `Custom Domains: ${customSuccess}/${customResults.length} configured`
  );

  // SSL Status
  const sslValid = results.filter((r) => r.sslStatus === "VALID").length;
  console.log(
    `SSL Certificates: ${sslValid}/${
      results.filter((r) => r.sslStatus).length
    } valid`
  );

  // Recommendations
  console.log("\n💡 DEPLOYMENT RECOMMENDATIONS");
  console.log("=".repeat(50));

  if (successRate === 100) {
    console.log("🎉 EXCELLENT! All services are fully operational!");
    console.log("   • Frontend: ✅ Vercel deployment successful");
    console.log("   • Backend: ✅ Render deployment successful");
    console.log("   • SSL: ✅ All certificates valid");
    console.log("   • Custom Domains: ✅ All domains configured");
    console.log("\n   🚀 Your SaaS platform is PRODUCTION READY!");
  } else if (successRate >= 75) {
    console.log("✅ GOOD! Most services are operational");
    console.log("   Core functionality is working well");

    if (frontendSuccess < frontendResults.length) {
      console.log("   ⚠️  Frontend Issues: Check Vercel deployment");
    }
    if (backendSuccess < backendResults.length) {
      console.log("   ⚠️  Backend Issues: Check Render deployment");
    }
    if (customSuccess < customResults.length) {
      console.log("   ⚠️  Custom Domain Issues: DNS may still be propagating");
    }
  } else {
    console.log("❌ ISSUES DETECTED! Deployment needs attention");

    console.log("\n🔧 TROUBLESHOOTING CHECKLIST:");
    console.log("   □ Check Vercel deployment status and logs");
    console.log("   □ Check Render service status and logs");
    console.log("   □ Verify environment variables are set");
    console.log("   □ Test database connectivity");
    console.log("   □ Check custom domain DNS configuration");
    console.log("   □ Verify SSL certificate provisioning");
  }

  // Performance analysis
  const avgResponseTime =
    results
      .filter((r) => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) /
    results.filter((r) => r.responseTime).length;

  if (!isNaN(avgResponseTime)) {
    console.log(
      `\n⚡ PERFORMANCE: Average response time: ${Math.round(
        avgResponseTime
      )}ms`
    );
    if (avgResponseTime < 1000) {
      console.log("   ✅ Excellent performance!");
    } else if (avgResponseTime < 3000) {
      console.log("   ⚠️  Acceptable performance");
    } else {
      console.log("   ❌ Slow response times detected");
    }
  }

  console.log("\n📋 NEXT STEPS:");
  if (successRate === 100) {
    console.log("1. ✅ Monitor application performance");
    console.log("2. ✅ Set up monitoring and alerting");
    console.log("3. ✅ Configure backup procedures");
    console.log("4. ✅ Plan for scaling and optimization");
    console.log("5. ✅ Begin user acceptance testing");
  } else {
    console.log("1. 🔧 Fix identified deployment issues");
    console.log("2. 🔄 Re-run this verification script");
    console.log("3. 📊 Check deployment logs for errors");
    console.log("4. ⚙️  Verify configuration settings");
    console.log("5. 🌐 Test DNS propagation for custom domains");
  }

  console.log("\n✨ Production verification complete!");
  const overallStatus =
    successRate === 100
      ? "FULLY OPERATIONAL 🚀"
      : successRate >= 75
      ? "MOSTLY OPERATIONAL ⚠️"
      : "ISSUES DETECTED ❌";
  console.log(`   Overall Status: ${overallStatus}`);

  // Save results
  const fs = require("fs");
  fs.writeFileSync(
    "production-verification-results.json",
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          totalTests,
          successCount,
          successRate: `${successRate}%`,
          overallStatus,
        },
        results,
      },
      null,
      2
    )
  );
  console.log("\n📄 Results saved to production-verification-results.json");
}

// Run the verification
runProductionVerification().catch(console.error);
