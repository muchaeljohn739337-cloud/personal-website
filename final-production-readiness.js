#!/usr/bin/env node

// FINAL PRODUCTION READINESS VERIFICATION
// Complete system validation for Advancia Pay Ledger SaaS Platform

const https = require("https");
const http = require("http");
const { URL } = require("url");

console.log("\n🎯 FINAL PRODUCTION READINESS VERIFICATION");
console.log("==========================================");
console.log("Advancia Pay Ledger - Complete System Validation");
console.log("Date:", new Date().toISOString());
console.log("==========================================\n");

const VERIFICATION_RESULTS = {
  timestamp: new Date().toISOString(),
  system: "Advancia Pay Ledger SaaS Platform",
  version: "1.0.0",
  tests: {},
  summary: {},
};

// Test Categories
const TEST_CATEGORIES = {
  INFRASTRUCTURE: "Infrastructure & Deployment",
  SECURITY: "Security & SSL",
  API_FUNCTIONALITY: "API Functionality",
  INTEGRATIONS: "External Integrations",
  PERFORMANCE: "Performance & Reliability",
};

// Production Endpoints to Test
const PRODUCTION_ENDPOINTS = [
  {
    name: "Frontend (Vercel)",
    url: "https://modular-saas-platform-frontend.vercel.app",
    category: TEST_CATEGORIES.INFRASTRUCTURE,
    expectedStatus: 200,
    type: "frontend",
  },
  {
    name: "Backend API (Render)",
    url: "https://advancia-backend-upnrf.onrender.com",
    category: TEST_CATEGORIES.INFRASTRUCTURE,
    expectedStatus: 200,
    type: "backend",
  },
  {
    name: "API Health Check",
    url: "https://advancia-backend-upnrf.onrender.com/api/health",
    category: TEST_CATEGORIES.API_FUNCTIONALITY,
    expectedStatus: 200,
    type: "api",
  },
  {
    name: "Custom Frontend Domain",
    url: "https://advanciapayledger.com",
    category: TEST_CATEGORIES.INFRASTRUCTURE,
    expectedStatus: 200,
    type: "custom-frontend",
  },
  {
    name: "Custom API Domain",
    url: "https://api.advanciapayledger.com",
    category: TEST_CATEGORIES.INFRASTRUCTURE,
    expectedStatus: 200,
    type: "custom-api",
  },
  {
    name: "Custom API Health",
    url: "https://api.advanciapayledger.com/api/health",
    category: TEST_CATEGORIES.API_FUNCTIONALITY,
    expectedStatus: 200,
    type: "custom-api",
  },
];

// API Functionality Tests
const API_TESTS = [
  {
    name: "User Registration",
    endpoint: "/api/auth/register",
    method: "POST",
    data: {
      email: `test${Date.now()}@verification.com`,
      password: "TestPass123!",
      firstName: "Verification",
      lastName: "Test",
      role: "user",
    },
    expectedStatus: 201,
    category: TEST_CATEGORIES.API_FUNCTIONALITY,
  },
  {
    name: "User Login",
    endpoint: "/api/auth/login",
    method: "POST",
    data: {
      email: "test@verification.com",
      password: "TestPass123!",
    },
    expectedStatus: 200,
    category: TEST_CATEGORIES.API_FUNCTIONALITY,
  },
  {
    name: "Admin Authentication",
    endpoint: "/api/auth/admin/login",
    method: "POST",
    data: {
      email: "admin@advancia.com",
      password: "Admin123!",
    },
    expectedStatus: 200,
    category: TEST_CATEGORIES.SECURITY,
  },
];

function makeHTTPRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
            responseTime: Date.now() - options.startTime,
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: Date.now() - options.startTime,
          });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testEndpoint(endpoint) {
  const startTime = Date.now();

  try {
    const urlObj = new URL(endpoint.url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: "GET",
      timeout: 15000,
      rejectUnauthorized: true,
      startTime,
    };

    const response = await makeHTTPRequest(options);

    // SSL Certificate validation
    const cert = response.socket?.getPeerCertificate();
    let sslValid = false;
    if (cert) {
      const now = new Date();
      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      sslValid = now >= validFrom && now <= validTo;
    }

    const result = {
      name: endpoint.name,
      url: endpoint.url,
      category: endpoint.category,
      type: endpoint.type,
      status: response.statusCode === endpoint.expectedStatus ? "PASS" : "FAIL",
      statusCode: response.statusCode,
      expectedStatus: endpoint.expectedStatus,
      responseTime: response.responseTime,
      sslValid,
      error: null,
    };

    return result;
  } catch (error) {
    return {
      name: endpoint.name,
      url: endpoint.url,
      category: endpoint.category,
      type: endpoint.type,
      status: "ERROR",
      statusCode: null,
      expectedStatus: endpoint.expectedStatus,
      responseTime: Date.now() - startTime,
      sslValid: false,
      error: error.message,
    };
  }
}

async function testAPIEndpoint(test, baseUrl) {
  const startTime = Date.now();

  try {
    const urlObj = new URL(baseUrl);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: test.endpoint,
      method: test.method,
      timeout: 15000,
      rejectUnauthorized: true,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Advancia-Verification/1.0",
      },
      startTime,
    };

    const response = await makeHTTPRequest(options, test.data);

    const result = {
      name: test.name,
      endpoint: test.endpoint,
      category: test.category,
      status: response.statusCode === test.expectedStatus ? "PASS" : "FAIL",
      statusCode: response.statusCode,
      expectedStatus: test.expectedStatus,
      responseTime: response.responseTime,
      error: null,
    };

    return result;
  } catch (error) {
    return {
      name: test.name,
      endpoint: test.endpoint,
      category: test.category,
      status: "ERROR",
      statusCode: null,
      expectedStatus: test.expectedStatus,
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function runComprehensiveVerification() {
  console.log("🔍 PHASE 1: Infrastructure & SSL Verification");
  console.log("=".repeat(50));

  // Test all production endpoints
  const endpointResults = [];
  for (const endpoint of PRODUCTION_ENDPOINTS) {
    console.log(`\nTesting: ${endpoint.name}`);
    const result = await testEndpoint(endpoint);
    endpointResults.push(result);

    const status =
      result.status === "PASS" ? "✅" : result.status === "ERROR" ? "❌" : "⚠️";
    console.log(
      `${status} ${result.name}: ${result.status} (${result.responseTime}ms)`
    );
    if (result.sslValid !== undefined) {
      console.log(`   SSL: ${result.sslValid ? "✅ Valid" : "❌ Invalid"}`);
    }
  }

  console.log("\n🔍 PHASE 2: API Functionality Verification");
  console.log("=".repeat(50));

  // Test API endpoints
  const apiResults = [];
  const baseUrl = "https://advancia-backend-upnrf.onrender.com";

  for (const apiTest of API_TESTS) {
    console.log(`\nTesting: ${apiTest.name}`);
    const result = await testAPIEndpoint(apiTest, baseUrl);
    apiResults.push(result);

    const status =
      result.status === "PASS" ? "✅" : result.status === "ERROR" ? "❌" : "⚠️";
    console.log(
      `${status} ${result.name}: ${result.status} (${result.responseTime}ms)`
    );
  }

  // Analyze Results
  const allResults = [...endpointResults, ...apiResults];
  VERIFICATION_RESULTS.tests = allResults;

  console.log("\n📊 VERIFICATION SUMMARY");
  console.log("=".repeat(50));

  // Group by category
  const categoryResults = {};
  TEST_CATEGORIES_ORDER.forEach((category) => {
    categoryResults[category] = allResults.filter(
      (r) => r.category === category
    );
  });

  let totalTests = 0;
  let totalPassed = 0;

  Object.entries(categoryResults).forEach(([category, results]) => {
    if (results.length === 0) return;

    console.log(`\n${category}:`);
    results.forEach((result) => {
      totalTests++;
      if (result.status === "PASS") totalPassed++;

      const status =
        result.status === "PASS"
          ? "✅"
          : result.status === "ERROR"
          ? "❌"
          : "⚠️";
      const details = result.statusCode
        ? `(${result.statusCode})`
        : result.error
        ? `(${result.error})`
        : "";
      console.log(`   ${status} ${result.name}: ${result.status} ${details}`);
    });
  });

  const successRate = Math.round((totalPassed / totalTests) * 100);

  console.log(
    `\n📈 OVERALL SUCCESS RATE: ${totalPassed}/${totalTests} (${successRate}%)`
  );

  // Performance Analysis
  const avgResponseTime =
    allResults
      .filter((r) => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) /
    allResults.filter((r) => r.responseTime).length;

  console.log(`⚡ AVERAGE RESPONSE TIME: ${Math.round(avgResponseTime)}ms`);

  // SSL Status
  const sslValidCount = allResults.filter((r) => r.sslValid === true).length;
  const sslTotal = allResults.filter((r) => r.sslValid !== undefined).length;
  console.log(`🔐 SSL CERTIFICATES: ${sslValidCount}/${sslTotal} valid`);

  // Final Assessment
  console.log("\n🏆 FINAL PRODUCTION READINESS ASSESSMENT");
  console.log("=".repeat(50));

  let readinessLevel = "NOT READY";
  let readinessColor = "❌";
  let recommendations = [];

  if (successRate === 100) {
    readinessLevel = "FULLY PRODUCTION READY";
    readinessColor = "✅";
    recommendations = [
      "🎉 System is fully operational and production-ready!",
      "• Monitor performance and set up alerting",
      "• Configure backup procedures",
      "• Plan for scaling and optimization",
      "• Begin user acceptance testing",
    ];
  } else if (successRate >= 80) {
    readinessLevel = "MOSTLY READY WITH MINOR ISSUES";
    readinessColor = "⚠️";
    recommendations = [
      "• Address remaining connectivity issues",
      "• Verify SSL certificate configuration",
      "• Test custom domain DNS propagation",
      "• Check deployment logs for errors",
    ];
  } else if (successRate >= 50) {
    readinessLevel = "REQUIRES ATTENTION";
    readinessColor = "⚠️";
    recommendations = [
      "• Critical deployment issues detected",
      "• Check Vercel and Render deployment status",
      "• Verify environment variables",
      "• Test database connectivity",
      "• Review application logs",
    ];
  } else {
    readinessLevel = "NOT PRODUCTION READY";
    readinessColor = "❌";
    recommendations = [
      "• Major deployment failures detected",
      "• Do not proceed to production",
      "• Fix all critical infrastructure issues",
      "• Re-run deployment verification",
      "• Check all environment configurations",
    ];
  }

  console.log(`${readinessColor} READINESS LEVEL: ${readinessLevel}`);
  console.log(`Success Rate: ${successRate}%`);

  console.log("\n💡 RECOMMENDATIONS:");
  recommendations.forEach((rec) => console.log(`   ${rec}`));

  // Save comprehensive results
  VERIFICATION_RESULTS.summary = {
    totalTests,
    totalPassed,
    successRate: `${successRate}%`,
    averageResponseTime: `${Math.round(avgResponseTime)}ms`,
    sslValidCount,
    sslTotal,
    readinessLevel,
    readinessColor,
    recommendations,
  };

  const fs = require("fs");
  fs.writeFileSync(
    "final-production-readiness-report.json",
    JSON.stringify(VERIFICATION_RESULTS, null, 2)
  );

  console.log(
    "\n📄 Detailed results saved to: final-production-readiness-report.json"
  );

  console.log("\n✨ Production readiness verification complete!");
  console.log(`Final Status: ${readinessColor} ${readinessLevel}`);

  return VERIFICATION_RESULTS;
}

// Define category order for display
const TEST_CATEGORIES_ORDER = [
  TEST_CATEGORIES.INFRASTRUCTURE,
  TEST_CATEGORIES.SECURITY,
  TEST_CATEGORIES.API_FUNCTIONALITY,
  TEST_CATEGORIES.INTEGRATIONS,
  TEST_CATEGORIES.PERFORMANCE,
];

// Run the comprehensive verification
runComprehensiveVerification().catch(console.error);
