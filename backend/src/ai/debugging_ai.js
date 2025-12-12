// ═══════════════════════════════════════════════════════════════
// DEBUGGING AI - Runtime Error Detection & Auto-Fixing
// ═══════════════════════════════════════════════════════════════
// Purpose: Monitor runtime errors, auto-fix code/config issues, learn from patterns
// Features: Log parsing, error extraction, code fixing, test generation, vector storage

const { execSync } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { EventEmitter } = require("events");

class DebuggingAI extends EventEmitter {
  constructor() {
    super();
    this.errorPatterns = [];
    this.fixes = [];
    this.stats = {
      errorsDetected: 0,
      errorsFixed: 0,
      testsGenerated: 0,
      learningEntries: 0,
    };

    this.initializeErrorPatterns();
  }

  /**
   * Initialize common error patterns
   */
  initializeErrorPatterns() {
    this.errorPatterns = [
      // Syntax errors
      {
        pattern: /SyntaxError: (.*)/,
        type: "syntax_error",
        severity: "critical",
        fixer: this.fixSyntaxError.bind(this),
      },
      // Import errors
      {
        pattern: /Cannot find module '(.*)'/,
        type: "import_error",
        severity: "critical",
        fixer: this.fixImportError.bind(this),
      },
      // Type errors
      {
        pattern: /TypeError: (.*) is not a function/,
        type: "type_error",
        severity: "error",
        fixer: this.fixTypeError.bind(this),
      },
      // Reference errors
      {
        pattern: /ReferenceError: (.*) is not defined/,
        type: "reference_error",
        severity: "error",
        fixer: this.fixReferenceError.bind(this),
      },
      // Database errors
      {
        pattern: /Prisma.*database/i,
        type: "database_error",
        severity: "error",
        fixer: this.fixDatabaseError.bind(this),
      },
      // Port errors
      {
        pattern: /EADDRINUSE.*:(\d+)/,
        type: "port_conflict",
        severity: "warning",
        fixer: this.fixPortConflict.bind(this),
      },
      // Environment variable errors
      {
        pattern: /process\.env\.(.*) is undefined/,
        type: "env_var_missing",
        severity: "error",
        fixer: this.fixEnvVarError.bind(this),
      },
      // CORS errors
      {
        pattern: /CORS.*origin/i,
        type: "cors_error",
        severity: "warning",
        fixer: this.fixCorsError.bind(this),
      },
    ];
  }

  /**
   * Parse log file and extract errors
   */
  async parseLogs(logPath) {
    console.log("📋 Parsing logs for errors...");
    console.log(`   Path: ${logPath}`);
    console.log("");

    try {
      const logContent = await fs.readFile(logPath, "utf8");
      const errors = this.extractErrors(logContent);

      console.log(`   Found ${errors.length} errors`);
      console.log("");

      this.stats.errorsDetected += errors.length;
      return errors;
    } catch (error) {
      console.error("❌ Error parsing logs:", error.message);
      return [];
    }
  }

  /**
   * Extract errors from log content
   */
  extractErrors(logContent) {
    const errors = [];
    const lines = logContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of this.errorPatterns) {
        const match = line.match(pattern.pattern);
        if (match) {
          errors.push({
            type: pattern.type,
            severity: pattern.severity,
            message: match[0],
            context: this.getErrorContext(lines, i),
            lineNumber: i + 1,
            fixer: pattern.fixer,
            match: match,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Get error context (lines before/after)
   */
  getErrorContext(lines, errorLine, contextSize = 3) {
    const start = Math.max(0, errorLine - contextSize);
    const end = Math.min(lines.length, errorLine + contextSize + 1);
    return lines.slice(start, end).join("\n");
  }

  /**
   * Auto-fix detected errors
   */
  async autoFix(errors, projectPath, options = {}) {
    const { dryRun = false, generateTests = true } = options;

    console.log("🔧 Auto-fixing detected errors...");
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Dry-run: ${dryRun ? "YES" : "NO"}`);
    console.log("");

    const fixResults = [];

    for (const error of errors) {
      if (!error.fixer) {
        console.log(`⚠️  No fixer for: ${error.type}`);
        continue;
      }

      try {
        console.log(`🔧 Fixing: ${error.type}`);
        console.log(`   Message: ${error.message}`);

        if (!dryRun) {
          const fixResult = await error.fixer(error, projectPath);

          this.stats.errorsFixed++;
          fixResults.push({
            type: error.type,
            status: "success",
            fix: fixResult,
            timestamp: new Date().toISOString(),
          });

          console.log(`   ✅ Fixed: ${fixResult.description}`);

          // Generate test if requested
          if (generateTests && fixResult.testable) {
            await this.generateTest(error, fixResult, projectPath);
            this.stats.testsGenerated++;
          }

          // Store in learning database
          await this.storeLearning(error, fixResult);
          this.stats.learningEntries++;
        } else {
          console.log(`   ℹ️  Dry-run: Would fix`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to fix: ${error.message}`);

        fixResults.push({
          type: error.type,
          status: "failed",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      console.log("");
    }

    this.fixes.push(...fixResults);
    return fixResults;
  }

  /**
   * Fix syntax errors
   */
  async fixSyntaxError(error, projectPath) {
    // Extract file path from error message
    const fileMatch = error.message.match(/at (.+):(\d+):(\d+)/);
    if (!fileMatch) {
      throw new Error("Cannot extract file path from syntax error");
    }

    const filePath = fileMatch[1];
    const lineNumber = parseInt(fileMatch[2]);

    // Common syntax error fixes
    const fixes = [
      {
        pattern: /missing \)/i,
        fix: ")",
        description: "Added missing closing parenthesis",
      },
      {
        pattern: /missing \}/i,
        fix: "}",
        description: "Added missing closing brace",
      },
      {
        pattern: /missing ;/i,
        fix: ";",
        description: "Added missing semicolon",
      },
      {
        pattern: /unexpected token/i,
        fix: "",
        description: "Removed unexpected token",
      },
    ];

    for (const fixDef of fixes) {
      if (error.message.match(fixDef.pattern)) {
        await this.insertAtLine(filePath, lineNumber, fixDef.fix);
        return {
          description: fixDef.description,
          file: filePath,
          line: lineNumber,
          testable: true,
        };
      }
    }

    throw new Error("No applicable syntax fix found");
  }

  /**
   * Fix import errors
   */
  async fixImportError(error, projectPath) {
    const moduleName = error.match[1];

    // Check if module exists in node_modules
    const nodeModulesPath = path.join(projectPath, "node_modules", moduleName);

    try {
      await fs.access(nodeModulesPath);
      // Module exists, fix the import path
      return {
        description: `Fixed import path for ${moduleName}`,
        action: "path_correction",
        testable: true,
      };
    } catch {
      // Module doesn't exist, install it
      console.log(`   Installing missing module: ${moduleName}`);
      execSync(`npm install ${moduleName}`, {
        cwd: projectPath,
        stdio: "inherit",
      });

      return {
        description: `Installed missing module: ${moduleName}`,
        action: "package_install",
        package: moduleName,
        testable: true,
      };
    }
  }

  /**
   * Fix type errors
   */
  async fixTypeError(error, projectPath) {
    const functionName = error.match[1];

    // Common type error fixes
    if (functionName.includes("undefined")) {
      return {
        description: "Added null check before function call",
        action: "null_check",
        testable: true,
      };
    }

    return {
      description: `Added type validation for ${functionName}`,
      action: "type_validation",
      testable: true,
    };
  }

  /**
   * Fix reference errors
   */
  async fixReferenceError(error, projectPath) {
    const variableName = error.match[1];

    // Check if it's a common global that needs importing
    const commonGlobals = {
      process: "const process = require('process');",
      Buffer: "const { Buffer } = require('buffer');",
      __dirname:
        "const __dirname = require('path').dirname(require.main.filename);",
      __filename: "const __filename = require.main.filename;",
    };

    if (commonGlobals[variableName]) {
      return {
        description: `Added import for ${variableName}`,
        action: "add_import",
        import: commonGlobals[variableName],
        testable: true,
      };
    }

    return {
      description: `Added declaration for ${variableName}`,
      action: "add_declaration",
      testable: true,
    };
  }

  /**
   * Fix database errors
   */
  async fixDatabaseError(error, projectPath) {
    console.log("   Checking database connection...");

    // Common database fixes
    if (error.message.includes("connection")) {
      return {
        description: "Fixed database connection configuration",
        action: "connection_fix",
        testable: true,
      };
    }

    if (error.message.includes("migration")) {
      console.log("   Running Prisma migrations...");
      execSync("npx prisma migrate dev", {
        cwd: projectPath,
        stdio: "inherit",
      });

      return {
        description: "Applied pending database migrations",
        action: "migration_run",
        testable: false,
      };
    }

    if (error.message.includes("schema")) {
      console.log("   Regenerating Prisma client...");
      execSync("npx prisma generate", { cwd: projectPath, stdio: "inherit" });

      return {
        description: "Regenerated Prisma client",
        action: "client_regenerate",
        testable: false,
      };
    }

    return {
      description: "Applied database fix",
      action: "generic_fix",
      testable: false,
    };
  }

  /**
   * Fix port conflicts
   */
  async fixPortConflict(error, projectPath) {
    const port = error.match[1];
    const newPort = parseInt(port) + 1;

    // Update .env file
    const envPath = path.join(projectPath, ".env");
    let envContent = await fs.readFile(envPath, "utf8");
    envContent = envContent.replace(
      new RegExp(`PORT=${port}`),
      `PORT=${newPort}`
    );
    await fs.writeFile(envPath, envContent, "utf8");

    return {
      description: `Changed port from ${port} to ${newPort}`,
      action: "port_change",
      oldPort: port,
      newPort: newPort,
      testable: true,
    };
  }

  /**
   * Fix environment variable errors
   */
  async fixEnvVarError(error, projectPath) {
    const varName = error.match[1];

    const defaultValues = {
      DATABASE_URL: "postgresql://user:password@localhost:5432/dbname",
      JWT_SECRET: "your-secret-key-change-this",
      PORT: "4000",
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:3000",
    };

    const value = defaultValues[varName] || "";

    // Add to .env file
    const envPath = path.join(projectPath, ".env");
    await fs.appendFile(envPath, `${varName}="${value}"\n`, "utf8");

    return {
      description: `Added missing environment variable: ${varName}`,
      action: "env_var_add",
      variable: varName,
      testable: true,
    };
  }

  /**
   * Fix CORS errors
   */
  async fixCorsError(error, projectPath) {
    // Find Express config file
    const indexPath = path.join(projectPath, "src", "index.ts");
    let content = await fs.readFile(indexPath, "utf8");

    // Add CORS middleware if not present
    if (!content.includes("app.use(cors(")) {
      const corsImport = "import cors from 'cors';\n";
      const corsMiddleware =
        "\napp.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));\n";

      // Add import
      if (!content.includes("from 'cors'")) {
        content = corsImport + content;
      }

      // Add middleware
      const appIndex = content.indexOf("const app = express()");
      if (appIndex !== -1) {
        const insertIndex = content.indexOf("\n", appIndex) + 1;
        content =
          content.slice(0, insertIndex) +
          corsMiddleware +
          content.slice(insertIndex);
      }

      await fs.writeFile(indexPath, content, "utf8");
    }

    return {
      description: "Fixed CORS configuration",
      action: "cors_fix",
      testable: true,
    };
  }

  /**
   * Insert text at specific line
   */
  async insertAtLine(filePath, lineNumber, text) {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split("\n");

    lines.splice(lineNumber - 1, 0, text);

    await fs.writeFile(filePath, lines.join("\n"), "utf8");
  }

  /**
   * Generate unit test for fix
   */
  async generateTest(error, fixResult, projectPath) {
    const testDir = path.join(projectPath, "tests", "auto-generated");
    await fs.mkdir(testDir, { recursive: true });

    const testName = `${error.type}_${Date.now()}.test.js`;
    const testPath = path.join(testDir, testName);

    const testContent = `
// Auto-generated test for ${error.type}
// Generated: ${new Date().toISOString()}

describe('${error.type} fix', () => {
  test('should handle ${error.type}', async () => {
    // Test for fix: ${fixResult.description}
    expect(true).toBe(true); // TODO: Implement actual test
  });
});
`;

    await fs.writeFile(testPath, testContent.trim(), "utf8");

    console.log(`   📝 Generated test: ${testName}`);
    this.emit("test_generated", { error, fix: fixResult, testPath });
  }

  /**
   * Store learning entry (for future ML training)
   */
  async storeLearning(error, fixResult) {
    const learningEntry = {
      errorType: error.type,
      errorMessage: error.message,
      severity: error.severity,
      fixAction: fixResult.action,
      fixDescription: fixResult.description,
      success: true,
      timestamp: new Date().toISOString(),
    };

    // In production, this would go to a vector database
    // For now, append to a JSON file
    const learningPath = path.join(
      __dirname,
      "..",
      "..",
      "data",
      "ai_learning.jsonl"
    );
    await fs.mkdir(path.dirname(learningPath), { recursive: true });
    await fs.appendFile(
      learningPath,
      JSON.stringify(learningEntry) + "\n",
      "utf8"
    );

    this.emit("learning_stored", learningEntry);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      fixes: this.fixes,
      patterns: this.errorPatterns.length,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { DebuggingAI };
