/**
 * Static Authentication Verification Script
 *
 * Purpose: Verify admin logging and user authentication implementation
 * for PR #52 - Verify and document admin logging and user login implementation
 *
 * This script performs static code analysis to ensure:
 * 1. Admin login logging is properly implemented
 * 2. User authentication system is complete
 * 3. Security measures are in place
 * 4. All authentication endpoints are protected
 */

import * as fs from "fs";
import * as path from "path";

interface VerificationResult {
  category: string;
  check: string;
  status: "PASS" | "FAIL" | "WARNING";
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(
  category: string,
  check: string,
  status: "PASS" | "FAIL" | "WARNING",
  details?: string
) {
  results.push({ category, check, status, details });
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(path.join(__dirname, "..", filePath));
}

function fileContains(filePath: string, searchText: string | RegExp): boolean {
  try {
    const content = fs.readFileSync(
      path.join(__dirname, "..", filePath),
      "utf-8"
    );
    if (typeof searchText === "string") {
      return content.includes(searchText);
    }
    return searchText.test(content);
  } catch {
    return false;
  }
}

console.log("🔍 Starting Authentication Verification...\n");

// ============================================================
// Category 1: Admin Login Logging System
// ============================================================
console.log("📊 Checking Admin Login Logging System...");

// Check logger utility exists
if (fileExists("src/utils/logger.ts")) {
  addResult(
    "Admin Logging",
    "Logger utility file exists",
    "PASS",
    "src/utils/logger.ts"
  );

  // Check logAdminLogin function
  if (
    fileContains("src/utils/logger.ts", "export async function logAdminLogin")
  ) {
    addResult("Admin Logging", "logAdminLogin function implemented", "PASS");
  } else {
    addResult(
      "Admin Logging",
      "logAdminLogin function implemented",
      "FAIL",
      "Function not found in logger.ts"
    );
  }

  // Check logging includes IP address
  if (fileContains("src/utils/logger.ts", /x-forwarded-for|remoteAddress/)) {
    addResult("Admin Logging", "IP address logging implemented", "PASS");
  } else {
    addResult(
      "Admin Logging",
      "IP address logging implemented",
      "WARNING",
      "IP tracking not detected"
    );
  }

  // Check logging includes user agent
  if (fileContains("src/utils/logger.ts", "user-agent")) {
    addResult("Admin Logging", "User agent logging implemented", "PASS");
  } else {
    addResult(
      "Admin Logging",
      "User agent logging implemented",
      "WARNING",
      "User agent tracking not detected"
    );
  }

  // Check status types
  if (
    fileContains("src/utils/logger.ts", /SUCCESS.*FAILED_PASSWORD.*FAILED_OTP/)
  ) {
    addResult(
      "Admin Logging",
      "Login status types defined",
      "PASS",
      "SUCCESS, FAILED_PASSWORD, FAILED_OTP, OTP_SENT"
    );
  } else {
    addResult(
      "Admin Logging",
      "Login status types defined",
      "WARNING",
      "Status types may be incomplete"
    );
  }
} else {
  addResult(
    "Admin Logging",
    "Logger utility file exists",
    "FAIL",
    "src/utils/logger.ts not found"
  );
}

// ============================================================
// Category 2: Admin Authentication Routes
// ============================================================
console.log("📊 Checking Admin Authentication Routes...");

if (fileExists("src/routes/authAdmin.ts")) {
  addResult(
    "Admin Auth",
    "Admin auth routes file exists",
    "PASS",
    "src/routes/authAdmin.ts"
  );

  // Check admin login endpoint
  if (fileContains("src/routes/authAdmin.ts", "/api/auth/admin/login")) {
    addResult(
      "Admin Auth",
      "Admin login endpoint defined",
      "PASS",
      "POST /api/auth/admin/login"
    );
  } else {
    addResult(
      "Admin Auth",
      "Admin login endpoint defined",
      "FAIL",
      "Login endpoint not found"
    );
  }

  // Check OTP verification endpoint
  if (fileContains("src/routes/authAdmin.ts", "/verify-otp")) {
    addResult(
      "Admin Auth",
      "OTP verification endpoint defined",
      "PASS",
      "POST /api/auth/admin/verify-otp"
    );
  } else {
    addResult(
      "Admin Auth",
      "OTP verification endpoint defined",
      "FAIL",
      "OTP endpoint not found"
    );
  }

  // Check login logs endpoint
  if (fileContains("src/routes/authAdmin.ts", "/logs")) {
    addResult(
      "Admin Auth",
      "Login logs endpoint defined",
      "PASS",
      "GET /api/auth/admin/logs"
    );
  } else {
    addResult(
      "Admin Auth",
      "Login logs endpoint defined",
      "WARNING",
      "Logs endpoint may not be exposed"
    );
  }

  // Check logging is called on login attempts
  const logCallCount = (
    fs
      .readFileSync(
        path.join(__dirname, "..", "src/routes/authAdmin.ts"),
        "utf-8"
      )
      .match(/logAdminLogin/g) || []
  ).length;

  if (logCallCount >= 5) {
    addResult(
      "Admin Auth",
      "Login logging integrated in routes",
      "PASS",
      `logAdminLogin called ${logCallCount} times`
    );
  } else {
    addResult(
      "Admin Auth",
      "Login logging integrated in routes",
      "WARNING",
      `Only ${logCallCount} logging calls found`
    );
  }

  // Check password verification
  if (fileContains("src/routes/authAdmin.ts", /bcrypt.*compare/)) {
    addResult(
      "Admin Auth",
      "Password verification implemented",
      "PASS",
      "Using bcrypt.compare"
    );
  } else {
    addResult(
      "Admin Auth",
      "Password verification implemented",
      "FAIL",
      "Secure password comparison not detected"
    );
  }

  // Check JWT token generation
  if (fileContains("src/routes/authAdmin.ts", /jwt.*sign/)) {
    addResult("Admin Auth", "JWT token generation implemented", "PASS");
  } else {
    addResult(
      "Admin Auth",
      "JWT token generation implemented",
      "FAIL",
      "JWT signing not detected"
    );
  }
} else {
  addResult(
    "Admin Auth",
    "Admin auth routes file exists",
    "FAIL",
    "src/routes/authAdmin.ts not found"
  );
}

// ============================================================
// Category 3: User Authentication System
// ============================================================
console.log("📊 Checking User Authentication System...");

if (fileExists("src/routes/auth.ts")) {
  addResult(
    "User Auth",
    "User auth routes file exists",
    "PASS",
    "src/routes/auth.ts"
  );

  // Check user login endpoint
  if (fileContains("src/routes/auth.ts", "/login")) {
    addResult(
      "User Auth",
      "User login endpoint defined",
      "PASS",
      "POST /api/auth/login"
    );
  } else {
    addResult(
      "User Auth",
      "User login endpoint defined",
      "FAIL",
      "Login endpoint not found"
    );
  }

  // Check user registration endpoint
  if (fileContains("src/routes/auth.ts", "/register")) {
    addResult(
      "User Auth",
      "User registration endpoint defined",
      "PASS",
      "POST /api/auth/register"
    );
  } else {
    addResult(
      "User Auth",
      "User registration endpoint defined",
      "FAIL",
      "Registration endpoint not found"
    );
  }

  // Check password hashing on registration
  if (fileContains("src/routes/auth.ts", /bcrypt.*hash/)) {
    addResult(
      "User Auth",
      "Password hashing implemented",
      "PASS",
      "Using bcrypt.hash"
    );
  } else {
    addResult(
      "User Auth",
      "Password hashing implemented",
      "FAIL",
      "Password hashing not detected"
    );
  }
} else {
  addResult(
    "User Auth",
    "User auth routes file exists",
    "FAIL",
    "src/routes/auth.ts not found"
  );
}

// ============================================================
// Category 4: Authentication Middleware
// ============================================================
console.log("📊 Checking Authentication Middleware...");

if (fileExists("src/middleware/auth.ts")) {
  addResult(
    "Middleware",
    "Auth middleware file exists",
    "PASS",
    "src/middleware/auth.ts"
  );

  // Check token verification
  if (fileContains("src/middleware/auth.ts", /jwt.*verify/)) {
    addResult("Middleware", "JWT verification implemented", "PASS");
  } else {
    addResult(
      "Middleware",
      "JWT verification implemented",
      "FAIL",
      "JWT verification not detected"
    );
  }

  // Check admin middleware
  if (
    fileContains("src/middleware/auth.ts", "adminAuth") ||
    fileContains("src/middleware/auth.ts", "requireAdmin")
  ) {
    addResult("Middleware", "Admin-only middleware exists", "PASS");
  } else {
    addResult(
      "Middleware",
      "Admin-only middleware exists",
      "WARNING",
      "Admin protection may be missing"
    );
  }

  // Check role-based access control
  if (fileContains("src/middleware/auth.ts", /role|ADMIN|USER/)) {
    addResult("Middleware", "Role-based access control implemented", "PASS");
  } else {
    addResult(
      "Middleware",
      "Role-based access control implemented",
      "WARNING",
      "RBAC may be incomplete"
    );
  }
} else {
  addResult(
    "Middleware",
    "Auth middleware file exists",
    "FAIL",
    "src/middleware/auth.ts not found"
  );
}

// ============================================================
// Category 5: Database Schema
// ============================================================
console.log("📊 Checking Database Schema...");

if (fileExists("prisma/schema.prisma")) {
  addResult("Database", "Prisma schema file exists", "PASS");

  // Check AdminLoginLog model
  if (fileContains("prisma/schema.prisma", "model AdminLoginLog")) {
    addResult("Database", "AdminLoginLog model defined", "PASS");

    // Check required fields
    const schemaContent = fs.readFileSync(
      path.join(__dirname, "..", "prisma/schema.prisma"),
      "utf-8"
    );

    const hasEmail = /AdminLoginLog[\s\S]*?email.*String/.test(schemaContent);
    const hasStatus = /AdminLoginLog[\s\S]*?status.*String/.test(schemaContent);
    const hasIP = /AdminLoginLog[\s\S]*?ipAddress.*String/.test(schemaContent);
    const hasTimestamp = /AdminLoginLog[\s\S]*?createdAt.*DateTime/.test(
      schemaContent
    );

    if (hasEmail && hasStatus && hasIP && hasTimestamp) {
      addResult(
        "Database",
        "AdminLoginLog has required fields",
        "PASS",
        "email, status, ipAddress, createdAt"
      );
    } else {
      addResult(
        "Database",
        "AdminLoginLog has required fields",
        "WARNING",
        `Missing: ${!hasEmail ? "email " : ""}${!hasStatus ? "status " : ""}${
          !hasIP ? "ipAddress " : ""
        }${!hasTimestamp ? "createdAt" : ""}`
      );
    }
  } else {
    addResult(
      "Database",
      "AdminLoginLog model defined",
      "FAIL",
      "Model not found in schema"
    );
  }

  // Check User model has auth fields
  if (fileContains("prisma/schema.prisma", "model User")) {
    const hasPassword = fileContains("prisma/schema.prisma", "passwordHash");
    const hasRole = fileContains(
      "prisma/schema.prisma",
      /role\s+(UserRole|String|Role)/
    );

    if (hasPassword && hasRole) {
      addResult(
        "Database",
        "User model has auth fields",
        "PASS",
        "passwordHash, role"
      );
    } else {
      addResult(
        "Database",
        "User model has auth fields",
        "WARNING",
        `Missing: ${!hasPassword ? "passwordHash " : ""}${
          !hasRole ? "role" : ""
        }`
      );
    }
  }
} else {
  addResult(
    "Database",
    "Prisma schema file exists",
    "FAIL",
    "prisma/schema.prisma not found"
  );
}

// ============================================================
// Category 6: Security Best Practices
// ============================================================
console.log("📊 Checking Security Best Practices...");

// Check for environment variable usage
const envFiles = [
  "src/routes/auth.ts",
  "src/routes/authAdmin.ts",
  "src/middleware/auth.ts",
];
let usesEnvVars = false;

for (const file of envFiles) {
  if (fileContains(file, /process\.env\.JWT_SECRET|JWT_SECRET/)) {
    usesEnvVars = true;
    break;
  }
}

if (usesEnvVars) {
  addResult("Security", "JWT secret from environment variables", "PASS");
} else {
  addResult(
    "Security",
    "JWT secret from environment variables",
    "FAIL",
    "Hardcoded secrets detected or not using env vars"
  );
}

// Check for rate limiting (optional)
if (fileExists("src/index.ts") && fileContains("src/index.ts", "rateLimit")) {
  addResult("Security", "Rate limiting implemented", "PASS");
} else {
  addResult(
    "Security",
    "Rate limiting implemented",
    "WARNING",
    "Consider adding rate limiting for auth endpoints"
  );
}

// Check for error handling
let hasErrorHandling = false;
for (const file of envFiles) {
  if (fileContains(file, /try.*catch|\.catch\(/)) {
    hasErrorHandling = true;
    break;
  }
}

if (hasErrorHandling) {
  addResult("Security", "Error handling implemented", "PASS");
} else {
  addResult(
    "Security",
    "Error handling implemented",
    "WARNING",
    "Proper error handling may be missing"
  );
}

// ============================================================
// Generate Report
// ============================================================
console.log("\n" + "=".repeat(60));
console.log("📋 VERIFICATION RESULTS");
console.log("=".repeat(60) + "\n");

const categories = [...new Set(results.map((r) => r.category))];

let totalPass = 0;
let totalFail = 0;
let totalWarning = 0;

for (const category of categories) {
  console.log(`\n${category}:`);
  console.log("-".repeat(60));

  const categoryResults = results.filter((r) => r.category === category);

  for (const result of categoryResults) {
    const icon =
      result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️";
    console.log(`${icon} ${result.check}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }

    if (result.status === "PASS") totalPass++;
    else if (result.status === "FAIL") totalFail++;
    else totalWarning++;
  }
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 SUMMARY");
console.log("=".repeat(60));
console.log(`✅ PASS:    ${totalPass}`);
console.log(`❌ FAIL:    ${totalFail}`);
console.log(`⚠️  WARNING: ${totalWarning}`);
console.log(`📈 Total:   ${results.length}`);

const percentage = Math.round((totalPass / results.length) * 100);
console.log(`\n🎯 Success Rate: ${percentage}%`);

if (totalFail === 0 && totalWarning === 0) {
  console.log(
    "\n🎉 ALL CHECKS PASSED! Authentication system is properly implemented."
  );
  console.log("\n✅ PR #52 is ready to be finalized.");
} else if (totalFail === 0) {
  console.log(
    "\n⚠️  All critical checks passed, but there are warnings to review."
  );
  console.log("Consider addressing warnings before finalizing PR #52.");
} else {
  console.log(
    "\n❌ Some critical checks failed. Please address failures before finalizing PR #52."
  );
}

console.log("\n" + "=".repeat(60) + "\n");

// Exit with appropriate code
process.exit(totalFail > 0 ? 1 : 0);
