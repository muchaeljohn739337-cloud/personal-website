const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

async function comprehensiveTest() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
  };

  console.log("🚀 Starting comprehensive R2 integration test...\n");

  // Test 1: Database Connection
  console.log("1️⃣ Testing database connection...");
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    results.tests.databaseConnection = {
      status: "✅ SUCCESS",
      message: "Database connected",
    };

    // Test uploaded_files table
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'uploaded_files'
      ) as exists
    `;

    if (tableExists[0].exists) {
      results.tests.uploadedFilesTable = {
        status: "✅ SUCCESS",
        message: "uploaded_files table exists",
      };

      // Get table info
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'uploaded_files'
        ORDER BY ordinal_position
      `;

      const recordCount =
        await prisma.$queryRaw`SELECT COUNT(*) as count FROM uploaded_files`;
      results.tests.tableStructure = {
        status: "✅ SUCCESS",
        columns: columns.length,
        records: parseInt(recordCount[0].count),
      };
    } else {
      results.tests.uploadedFilesTable = {
        status: "❌ FAILED",
        message: "uploaded_files table missing",
      };
    }
  } catch (error) {
    results.tests.databaseConnection = {
      status: "❌ FAILED",
      message: error.message,
    };
  }

  // Test 2: File Upload Preparation
  console.log("2️⃣ Testing file upload preparation...");
  const testFilePath = path.join(__dirname, "test-document.txt");

  if (!fs.existsSync(testFilePath)) {
    fs.writeFileSync(
      testFilePath,
      "Test document for R2 storage integration.\nCreated: " +
        new Date().toISOString()
    );
    results.tests.testFile = {
      status: "✅ SUCCESS",
      message: "Test file created",
    };
  } else {
    results.tests.testFile = {
      status: "✅ SUCCESS",
      message: "Test file exists",
    };
  }

  // Test 3: R2 Service Import
  console.log("3️⃣ Testing R2 service import...");
  try {
    const { uploadToR2 } = require("./backend/src/services/r2Storage");
    results.tests.r2Service = {
      status: "✅ SUCCESS",
      message: "R2 service imported",
    };
  } catch (error) {
    results.tests.r2Service = { status: "❌ FAILED", message: error.message };
  }

  // Test 4: Environment Variables
  console.log("4️⃣ Testing environment variables...");
  const requiredEnvVars = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
  ];
  const envStatus = {};

  requiredEnvVars.forEach((varName) => {
    envStatus[varName] = process.env[varName] ? "✅ Set" : "❌ Missing";
  });

  results.tests.environmentVars = envStatus;

  // Test 5: API Endpoint Check
  console.log("5️⃣ Testing API endpoint availability...");
  try {
    const axios = require("axios");
    const response = await axios.get("http://localhost:4000/api/files", {
      headers: { Authorization: "Bearer test-token" },
      timeout: 5000,
    });
    results.tests.apiEndpoint = {
      status: "✅ SUCCESS",
      message: `Status: ${response.status}`,
    };
  } catch (error) {
    if (error.response) {
      results.tests.apiEndpoint = {
        status: "⚠️ AUTH ISSUE",
        message: `Status: ${error.response.status} - ${
          error.response.data?.error || "Auth required"
        }`,
      };
    } else {
      results.tests.apiEndpoint = {
        status: "❌ FAILED",
        message: "Server not responding",
      };
    }
  }

  await prisma.$disconnect();

  // Write results to file
  const resultsPath = path.join(__dirname, "test-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Display summary
  console.log("\n📋 Test Results Summary:");
  Object.entries(results.tests).forEach(([test, result]) => {
    console.log(`${result.status} ${test}`);
  });

  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);

  return results;
}

comprehensiveTest().catch(console.error);
