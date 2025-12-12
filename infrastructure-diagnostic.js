#!/usr/bin/env node

// INFRASTRUCTURE DIAGNOSTIC & FIX SCRIPT
// Comprehensive analysis and resolution of production deployment issues

const https = require("https");
const { URL } = require("url");
const { execSync } = require("child_process");

console.log("\n🔧 INFRASTRUCTURE DIAGNOSTIC & FIX - ADVANCIA PAY LEDGER");
console.log("=".repeat(70));
console.log("Date:", new Date().toISOString());
console.log("=".repeat(70));

// Infrastructure Issues to Address
const ISSUES = {
  RENDER_BACKEND_404: {
    name: "Render Backend 404 Error",
    url: "https://advancia-backend-upnrf.onrender.com",
    description: "Backend service returning 404 on direct access",
    status: "UNKNOWN",
    fixes: [
      "Check Render service status and logs",
      "Verify build configuration and environment variables",
      "Check if service is suspended due to inactivity",
      "Verify database connectivity",
      "Check application startup logs",
    ],
  },
  CUSTOM_FRONTEND_522: {
    name: "Custom Frontend 522 Error",
    url: "https://advanciapayledger.com",
    description: "Cloudflare 522 connection timeout to origin",
    status: "UNKNOWN",
    fixes: [
      "Check Vercel deployment status",
      "Verify DNS configuration for custom domain",
      "Check Cloudflare DNS settings",
      "Verify SSL certificate status",
      "Check Vercel domain configuration",
    ],
  },
  CUSTOM_API_502: {
    name: "Custom API 502 Error",
    url: "https://api.advanciapayledger.com",
    description: "Bad gateway error on custom API domain",
    status: "UNKNOWN",
    fixes: [
      "Check Render custom domain configuration",
      "Verify DNS settings for API subdomain",
      "Check SSL certificate for custom domain",
      "Verify Render service is running",
      "Check load balancer configuration",
    ],
  },
  SSL_CERTIFICATES: {
    name: "SSL Certificate Issues",
    description: "SSL certificates not validating properly",
    status: "UNKNOWN",
    fixes: [
      "Check Let's Encrypt certificate status",
      "Verify domain ownership in hosting platforms",
      "Check DNS CAA records",
      "Verify certificate renewal process",
      "Check mixed content issues",
    ],
  },
};

async function testEndpoint(url, name, expectedStatus = 200) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   URL: ${url}`);

    const startTime = Date.now();

    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        timeout: 15000,
        rejectUnauthorized: false, // Allow testing even with SSL issues
        agent: false,
      };

      const req = https.request(options, (res) => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        console.log(`   📊 Status: ${statusCode} (${responseTime}ms)`);

        // Check SSL certificate
        const cert = res.socket?.getPeerCertificate();
        let sslInfo = "No SSL";
        if (cert) {
          const now = new Date();
          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const isValid = now >= validFrom && now <= validTo;

          sslInfo = `${isValid ? "✅" : "❌"} SSL (${
            cert.issuer?.CN || "Unknown"
          })`;
          console.log(`   🔐 SSL: ${sslInfo}`);
        }

        const result = {
          name,
          url,
          statusCode,
          expectedStatus,
          success: statusCode === expectedStatus,
          responseTime,
          sslValid:
            cert &&
            (() => {
              const now = new Date();
              const validFrom = new Date(cert.valid_from);
              const validTo = new Date(cert.valid_to);
              return now >= validFrom && now <= validTo;
            })(),
          error: null,
        };

        resolve(result);
      });

      req.on("error", (err) => {
        console.log(`   ❌ Error: ${err.message}`);
        resolve({
          name,
          url,
          statusCode: null,
          expectedStatus,
          success: false,
          responseTime: Date.now() - startTime,
          sslValid: false,
          error: err.message,
        });
      });

      req.on("timeout", () => {
        console.log(`   ❌ Timeout: Connection timed out`);
        req.destroy();
        resolve({
          name,
          url,
          statusCode: null,
          expectedStatus,
          success: false,
          responseTime: Date.now() - startTime,
          sslValid: false,
          error: "Connection timeout",
        });
      });

      req.end();
    } catch (error) {
      console.log(`   ❌ Test Error: ${error.message}`);
      resolve({
        name,
        url,
        statusCode: null,
        expectedStatus,
        success: false,
        responseTime: Date.now() - startTime,
        sslValid: false,
        error: error.message,
      });
    }
  });
}

async function diagnoseInfrastructure() {
  console.log("\n🔍 PHASE 1: INFRASTRUCTURE DIAGNOSTIC");
  console.log("=".repeat(50));

  const results = {};

  // Test all problematic endpoints
  const tests = [
    {
      key: "RENDER_BACKEND_404",
      url: ISSUES.RENDER_BACKEND_404.url,
      name: ISSUES.RENDER_BACKEND_404.name,
    },
    {
      key: "CUSTOM_FRONTEND_522",
      url: ISSUES.CUSTOM_FRONTEND_522.url,
      name: ISSUES.CUSTOM_FRONTEND_522.name,
    },
    {
      key: "CUSTOM_API_502",
      url: ISSUES.CUSTOM_API_502.url,
      name: ISSUES.CUSTOM_API_502.name,
    },
    {
      key: "VERCEL_FRONTEND",
      url: "https://modular-saas-platform-frontend.vercel.app",
      name: "Vercel Frontend (Working)",
    },
    {
      key: "CUSTOM_API_HEALTH",
      url: "https://api.advanciapayledger.com/api/health",
      name: "Custom API Health",
    },
  ];

  for (const test of tests) {
    const result = await testEndpoint(test.url, test.name);
    results[test.key] = result;

    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${test.name}: ${result.statusCode || "ERROR"}`);
  }

  console.log("\n🔧 PHASE 2: ISSUE ANALYSIS & RECOMMENDATIONS");
  console.log("=".repeat(50));

  // Analyze Render Backend Issue
  const renderResult = results.RENDER_BACKEND_404;
  console.log("\n📋 RENDER BACKEND ANALYSIS:");
  if (renderResult.statusCode === 404) {
    console.log("❌ Issue: Service returning 404 (Not Found)");
    console.log("🔧 Possible Causes:");
    console.log("   • Service may be suspended due to inactivity");
    console.log("   • Build failed or deployment incomplete");
    console.log("   • Environment variables not set correctly");
    console.log("   • Database connection issues");
    console.log("   • Application startup errors");

    console.log("\n💡 IMMEDIATE FIXES:");
    console.log("   1. Check Render Dashboard: https://dashboard.render.com");
    console.log(
      "   2. Verify service is not suspended (free tier suspends after inactivity)"
    );
    console.log("   3. Check deployment logs for errors");
    console.log("   4. Verify DATABASE_URL and other env vars");
    console.log("   5. Trigger manual deployment if needed");
  }

  // Analyze Custom Domain Issues
  const frontendResult = results.CUSTOM_FRONTEND_522;
  console.log("\n📋 CUSTOM FRONTEND DOMAIN ANALYSIS:");
  if (frontendResult.statusCode === 522) {
    console.log("❌ Issue: Cloudflare 522 Connection Timeout");
    console.log("🔧 Possible Causes:");
    console.log("   • Vercel deployment is down or unresponsive");
    console.log("   • DNS not properly configured");
    console.log("   • SSL certificate issues");
    console.log("   • Vercel domain not verified");

    console.log("\n💡 IMMEDIATE FIXES:");
    console.log("   1. Check Vercel deployment status");
    console.log("   2. Verify domain configuration in Vercel dashboard");
    console.log("   3. Check DNS settings (should point to Vercel)");
    console.log("   4. Verify SSL certificate status");
  }

  const apiResult = results.CUSTOM_API_502;
  console.log("\n📋 CUSTOM API DOMAIN ANALYSIS:");
  if (apiResult.statusCode === 502) {
    console.log("❌ Issue: Bad Gateway (502)");
    console.log("🔧 Possible Causes:");
    console.log("   • Render service is down");
    console.log("   • Custom domain not properly configured in Render");
    console.log("   • SSL certificate issues");
    console.log("   • Load balancer configuration problems");

    console.log("\n💡 IMMEDIATE FIXES:");
    console.log("   1. Check Render custom domain settings");
    console.log("   2. Verify DNS points to Render");
    console.log("   3. Check SSL certificate for subdomain");
    console.log("   4. Verify Render service is running");
  }

  // SSL Analysis
  console.log("\n📋 SSL CERTIFICATE ANALYSIS:");
  const sslResults = Object.values(results).filter(
    (r) => r.sslValid !== undefined
  );
  const validSSL = sslResults.filter((r) => r.sslValid).length;
  const totalSSL = sslResults.length;

  console.log(`SSL Status: ${validSSL}/${totalSSL} certificates valid`);

  if (validSSL < totalSSL) {
    console.log("❌ SSL Issues Detected");
    console.log("🔧 Possible Causes:");
    console.log("   • Let's Encrypt certificate not issued");
    console.log("   • Domain ownership not verified");
    console.log("   • DNS CAA records blocking issuance");
    console.log("   • Recent domain changes (propagation delay)");

    console.log("\n💡 IMMEDIATE FIXES:");
    console.log("   1. Check SSL status in Vercel/Render dashboards");
    console.log("   2. Verify domain ownership");
    console.log("   3. Wait for DNS propagation (24-48 hours)");
    console.log("   4. Check certificate authority settings");
  }

  console.log("\n🚀 PHASE 3: AUTOMATED FIXES");
  console.log("=".repeat(50));

  // Attempt automated fixes
  console.log("\n🔄 ATTEMPTING AUTOMATED DIAGNOSTICS...");

  try {
    // Check if we can access Render service info
    console.log("\n📡 Checking Render service accessibility...");
    const renderHealth = await testEndpoint(
      "https://advancia-backend-upnrf.onrender.com/api/health",
      "Render Health Check"
    );
    if (renderHealth.statusCode === 200) {
      console.log("✅ Render service is responding to health checks");
      console.log(
        "   This suggests the service is running but root path returns 404"
      );
      console.log("   → Check if your app has a root route defined");
    } else {
      console.log("❌ Render service health check failed");
      console.log("   → Service may be down or misconfigured");
    }

    // Check Vercel accessibility
    console.log("\n📡 Checking Vercel deployment...");
    const vercelResult = results.VERCEL_FRONTEND;
    if (vercelResult.success) {
      console.log("✅ Vercel deployment is working");
      console.log("   → Custom domain issue is likely DNS/configuration");
    } else {
      console.log("❌ Vercel deployment has issues");
      console.log("   → Check Vercel dashboard for deployment status");
    }
  } catch (error) {
    console.log("❌ Automated diagnostics failed:", error.message);
  }

  console.log("\n📋 FINAL ACTION PLAN");
  console.log("=".repeat(50));

  console.log("\n🎯 PRIORITY 1 - CRITICAL FIXES (Do these first):");
  console.log("1. 🔍 Check Render Dashboard: https://dashboard.render.com");
  console.log("   - Verify service is not suspended");
  console.log("   - Check deployment logs");
  console.log("   - Verify environment variables");

  console.log("\n2. 🔍 Check Vercel Dashboard: https://vercel.com/dashboard");
  console.log("   - Verify deployment status");
  console.log("   - Check domain configuration");
  console.log("   - Verify SSL certificate status");

  console.log("\n3. 🔍 DNS Configuration Check:");
  console.log("   - advanciapayledger.com should point to Vercel");
  console.log("   - api.advanciapayledger.com should point to Render");
  console.log("   - Use tools like dnschecker.org to verify");

  console.log("\n🎯 PRIORITY 2 - MONITORING & VERIFICATION:");
  console.log("1. Run this diagnostic script again after fixes");
  console.log("2. Use final-production-readiness.js for comprehensive testing");
  console.log("3. Monitor SSL certificate status");
  console.log("4. Set up uptime monitoring");

  console.log("\n🎯 PRIORITY 3 - PREVENTION:");
  console.log("1. Set up automated health checks");
  console.log("2. Configure deployment notifications");
  console.log("3. Implement rollback procedures");
  console.log("4. Document troubleshooting procedures");

  console.log("\n📞 SUPPORT RESOURCES:");
  console.log("• Render Support: https://docs.render.com/docs");
  console.log("• Vercel Support: https://vercel.com/docs");
  console.log("• Cloudflare DNS: https://developers.cloudflare.com/dns/");
  console.log("• SSL Checker: https://www.sslshopper.com/ssl-checker.html");

  console.log("\n✨ Infrastructure diagnostic complete!");
  console.log(
    "🔄 Re-run this script after implementing fixes to verify resolution."
  );

  // Save diagnostic results
  const diagnosticReport = {
    timestamp: new Date().toISOString(),
    issues: ISSUES,
    testResults: results,
    recommendations: {
      priority1: [
        "Check Render service status and logs",
        "Verify Vercel deployment and domain configuration",
        "Validate DNS settings for custom domains",
        "Check SSL certificate status",
      ],
      priority2: [
        "Re-run diagnostic script after fixes",
        "Use comprehensive production verification",
        "Set up monitoring and alerts",
        "Document troubleshooting procedures",
      ],
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    "infrastructure-diagnostic-report.json",
    JSON.stringify(diagnosticReport, null, 2)
  );

  console.log(
    "\n📄 Detailed diagnostic report saved to: infrastructure-diagnostic-report.json"
  );

  return diagnosticReport;
}

// Run the comprehensive diagnostic
diagnoseInfrastructure().catch(console.error);
