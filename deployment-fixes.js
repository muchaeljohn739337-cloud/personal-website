#!/usr/bin/env node

// DEPLOYMENT FIX AUTOMATION
// Automated fixes for common production deployment issues

const https = require("https");
const { URL } = require("url");
const { execSync } = require("child_process");

console.log("\n🔧 DEPLOYMENT FIX AUTOMATION - ADVANCIA PAY LEDGER");
console.log("=".repeat(70));
console.log("Date:", new Date().toISOString());
console.log("=".repeat(70));

// Automated Fixes
const AUTOMATED_FIXES = {
  checkRenderService: async () => {
    console.log("\n🔍 Checking Render Service Status...");

    try {
      // Test health endpoint
      const healthResult = await testEndpoint(
        "https://advancia-backend-upnrf.onrender.com/api/health"
      );
      if (healthResult.success) {
        console.log("✅ Render service is responding to health checks");
        return {
          status: "HEALTHY",
          message: "Service is running and responding",
        };
      }

      // Test root endpoint
      const rootResult = await testEndpoint(
        "https://advancia-backend-upnrf.onrender.com"
      );
      if (rootResult.statusCode === 404) {
        console.log("⚠️  Render service returns 404 on root path");
        console.log("   This is normal if no root route is defined");
        console.log("   Health endpoint should still work");

        if (healthResult.success) {
          return {
            status: "HEALTHY",
            message: "Service running, 404 on root is expected",
          };
        }
      }

      return { status: "ISSUES", message: "Service not responding properly" };
    } catch (error) {
      console.log("❌ Error checking Render service:", error.message);
      return { status: "ERROR", message: error.message };
    }
  },

  checkVercelDeployment: async () => {
    console.log("\n🔍 Checking Vercel Deployment Status...");

    try {
      const result = await testEndpoint(
        "https://modular-saas-platform-frontend.vercel.app"
      );
      if (result.success) {
        console.log("✅ Vercel deployment is healthy");
        return { status: "HEALTHY", message: "Frontend deployment is working" };
      } else {
        console.log("❌ Vercel deployment issues detected");
        return { status: "ISSUES", message: `Status: ${result.statusCode}` };
      }
    } catch (error) {
      console.log("❌ Error checking Vercel deployment:", error.message);
      return { status: "ERROR", message: error.message };
    }
  },

  checkCustomDomains: async () => {
    console.log("\n🔍 Checking Custom Domain Configuration...");

    const domains = [
      { url: "https://advanciapayledger.com", name: "Frontend Domain" },
      { url: "https://api.advanciapayledger.com", name: "API Domain" },
    ];

    const results = {};

    for (const domain of domains) {
      try {
        const result = await testEndpoint(domain.url);
        results[domain.name] = result;

        if (result.success) {
          console.log(`✅ ${domain.name}: Working (${result.statusCode})`);
        } else {
          console.log(`❌ ${domain.name}: Issues (${result.statusCode})`);
        }
      } catch (error) {
        console.log(`❌ ${domain.name}: Error - ${error.message}`);
        results[domain.name] = { success: false, error: error.message };
      }
    }

    return results;
  },

  generateFixCommands: () => {
    console.log("\n🔧 GENERATED FIX COMMANDS");
    console.log("=".repeat(50));

    console.log("\n# 1. Check Render Service Status");
    console.log(
      "curl -I https://advancia-backend-upnrf.onrender.com/api/health"
    );
    console.log("");
    console.log("# If 200 OK, service is running");
    console.log("# If suspended, go to Render dashboard and resume");

    console.log("\n# 2. Check Vercel Deployment");
    console.log("curl -I https://modular-saas-platform-frontend.vercel.app");
    console.log("");
    console.log("# Should return 200 OK");

    console.log("\n# 3. Test Custom Domains");
    console.log("curl -I https://advanciapayledger.com");
    console.log("curl -I https://api.advanciapayledger.com/api/health");

    console.log("\n# 4. Check DNS Propagation");
    console.log("nslookup advanciapayledger.com");
    console.log("nslookup api.advanciapayledger.com");

    console.log("\n# 5. SSL Certificate Check");
    console.log(
      'openssl s_client -connect advanciapayledger.com:443 < /dev/null 2>/dev/null | grep "Verify return code"'
    );

    console.log("\n# 6. Force Vercel Deployment (if needed)");
    console.log("cd frontend && npx vercel --prod --yes");

    console.log("\n# 7. Check Render Logs");
    console.log("# Go to Render dashboard > Service > Logs tab");
  },

  createMonitoringScript: () => {
    console.log("\n📊 CREATING MONITORING SCRIPT");
    console.log("=".repeat(50));

    const monitoringScript = `#!/usr/bin/env node

// Production Monitoring Script
// Continuous health checks for all services

const https = require('https');
const { URL } = require('url');

const SERVICES = [
  'https://modular-saas-platform-frontend.vercel.app',
  'https://advancia-backend-upnrf.onrender.com/api/health',
  'https://advanciapayledger.com',
  'https://api.advanciapayledger.com/api/health'
];

async function checkService(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 10000,
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        resolve({ url, status: res.statusCode, success: res.statusCode < 400 });
      });

      req.on('error', () => resolve({ url, status: 'ERROR', success: false }));
      req.on('timeout', () => resolve({ url, status: 'TIMEOUT', success: false }));
      req.end();
    } catch (error) {
      resolve({ url, status: 'ERROR', success: false });
    }
  });
}

async function monitor() {
  console.log(\`\\n📊 Production Monitoring - \${new Date().toISOString()}\`);

  for (const url of SERVICES) {
    const result = await checkService(url);
    const status = result.success ? '✅' : '❌';
    console.log(\`\${status} \${url}: \${result.status}\`);
  }
}

// Run monitoring
monitor().catch(console.error);
`;

    const fs = require("fs");
    fs.writeFileSync("production-monitor.js", monitoringScript);
    console.log("✅ Created production-monitor.js");
    console.log("   Run with: node production-monitor.js");
  },
};

async function testEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        timeout: 10000,
        rejectUnauthorized: false,
      };

      const req = https.request(options, (res) => {
        resolve({
          statusCode: res.statusCode,
          success: res.statusCode === expectedStatus,
        });
      });

      req.on("error", (err) =>
        resolve({ statusCode: "ERROR", success: false, error: err.message })
      );
      req.on("timeout", () =>
        resolve({ statusCode: "TIMEOUT", success: false })
      );
      req.end();
    } catch (error) {
      resolve({ statusCode: "ERROR", success: false, error: error.message });
    }
  });
}

async function runAutomatedFixes() {
  console.log("\n🚀 RUNNING AUTOMATED DIAGNOSTICS & FIXES");
  console.log("=".repeat(50));

  // Run all automated checks
  const renderStatus = await AUTOMATED_FIXES.checkRenderService();
  const vercelStatus = await AUTOMATED_FIXES.checkVercelDeployment();
  const domainStatus = await AUTOMATED_FIXES.checkCustomDomains();

  console.log("\n📋 DIAGNOSTIC SUMMARY");
  console.log("=".repeat(50));

  console.log(
    "Render Backend:",
    renderStatus.status === "HEALTHY" ? "✅" : "❌",
    renderStatus.message
  );
  console.log(
    "Vercel Frontend:",
    vercelStatus.status === "HEALTHY" ? "✅" : "❌",
    vercelStatus.message
  );

  console.log("\nCustom Domains:");
  Object.entries(domainStatus).forEach(([domain, result]) => {
    const status = result.success ? "✅" : "❌";
    console.log(
      `   ${status} ${domain}: ${
        result.statusCode || result.error || "Unknown"
      }`
    );
  });

  // Generate fix commands
  AUTOMATED_FIXES.generateFixCommands();

  // Create monitoring script
  AUTOMATED_FIXES.createMonitoringScript();

  console.log("\n🎯 MANUAL FIXES REQUIRED");
  console.log("=".repeat(50));

  const manualFixes = [];

  if (renderStatus.status !== "HEALTHY") {
    manualFixes.push({
      service: "Render Backend",
      actions: [
        "Go to https://dashboard.render.com",
        'Find "advancia-backend-upnrf" service',
        'Check if status shows "Suspended"',
        'Click "Resume" if suspended',
        'Check "Logs" tab for errors',
        "Verify environment variables",
      ],
    });
  }

  if (vercelStatus.status !== "HEALTHY") {
    manualFixes.push({
      service: "Vercel Frontend",
      actions: [
        "Go to https://vercel.com/dashboard",
        "Find Advancia frontend project",
        "Check deployment status",
        "Go to Settings > Domains",
        "Verify domain configuration",
        "Check SSL certificate status",
      ],
    });
  }

  const failingDomains = Object.entries(domainStatus).filter(
    ([_, result]) => !result.success
  );
  if (failingDomains.length > 0) {
    manualFixes.push({
      service: "Custom Domains",
      actions: [
        "Check DNS settings point to correct services",
        "Verify domain ownership in Vercel/Render",
        "Wait for DNS propagation (24-48 hours)",
        "Check SSL certificate status",
        "Use DNS checker tools to verify",
      ],
    });
  }

  if (manualFixes.length === 0) {
    console.log("🎉 No manual fixes required! All automated checks passed.");
  } else {
    manualFixes.forEach((fix, index) => {
      console.log(`\n${index + 1}. ${fix.service} Issues:`);
      fix.actions.forEach((action) => console.log(`   • ${action}`));
    });
  }

  console.log("\n🔄 VERIFICATION STEPS");
  console.log("=".repeat(50));
  console.log("1. Run: node production-monitor.js (continuous monitoring)");
  console.log(
    "2. Run: node final-production-readiness.js (comprehensive test)"
  );
  console.log("3. Check all dashboard statuses");
  console.log("4. Test custom domains manually");

  console.log("\n📞 SUPPORT CONTACTS");
  console.log("=".repeat(50));
  console.log("• Render Support: https://docs.render.com/docs");
  console.log("• Vercel Support: https://vercel.com/docs");
  console.log("• DNS Issues: Contact domain registrar");

  console.log("\n✨ Automated fixes and diagnostics complete!");
  console.log("📄 Check production-monitor.js for ongoing monitoring.");

  // Save results
  const results = {
    timestamp: new Date().toISOString(),
    renderStatus,
    vercelStatus,
    domainStatus,
    manualFixesRequired: manualFixes.length,
    recommendations: manualFixes,
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployment-fix-results.json",
    JSON.stringify(results, null, 2)
  );

  console.log("\n📄 Results saved to: deployment-fix-results.json");
}

// Run the automated fixes
runAutomatedFixes().catch(console.error);
