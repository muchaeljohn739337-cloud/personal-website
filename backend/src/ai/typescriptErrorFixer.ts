import { exec } from "child_process";
import * as path from "path";
import { promisify } from "util";
import { guardianAI } from "./guardian_integration";

const execAsync = promisify(exec);

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  severity: "error" | "warning";
}

interface ErrorFix {
  error: TypeScriptError;
  suggestedFix: string;
  autoFixable: boolean;
  confidence: number;
}

interface RateLimitState {
  fixes: number;
  lastReset: number;
}

class TypeScriptErrorFixer {
  private isRunning: boolean = false;
  private lastCheck: Date = new Date();
  private rateLimitState: RateLimitState = {
    fixes: 0,
    lastReset: Date.now(),
  };
  private readonly MAX_FIXES_PER_MINUTE = 10;
  private readonly RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

  constructor() {
    console.log("🔧 TypeScript Error Fixer initialized");
  }

  /**
   * Rate limiting to prevent infinite fix loops
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Reset counter if window expired
    if (now - this.rateLimitState.lastReset > this.RATE_LIMIT_WINDOW_MS) {
      this.rateLimitState.fixes = 0;
      this.rateLimitState.lastReset = now;
    }

    if (this.rateLimitState.fixes >= this.MAX_FIXES_PER_MINUTE) {
      console.warn("⚠️ TypeScript Error Fixer rate limit reached. Waiting...");
      return false;
    }

    return true;
  }

  private incrementRateLimit(): void {
    this.rateLimitState.fixes++;
  }

  /**
   * Run TypeScript compiler to detect errors
   */
  async detectErrors(): Promise<TypeScriptError[]> {
    try {
      const { stdout, stderr } = await execAsync(
        "npx tsc --noEmit --pretty false",
        { cwd: path.join(__dirname, "../..") }
      );

      // Parse TypeScript compiler output
      const errors: TypeScriptError[] = [];
      const lines = (stdout + stderr).split("\n");

      for (const line of lines) {
        // Match pattern: src/file.ts(123,45): error TS1234: message
        const match = line.match(
          /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/
        );

        if (match) {
          errors.push({
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            severity: match[4] as "error" | "warning",
            code: `TS${match[5]}`,
            message: match[6],
          });
        }
      }

      this.lastCheck = new Date();
      return errors;
    } catch (error: any) {
      // TypeScript exits with code 1 when errors are found
      if (error.stdout || error.stderr) {
        return this.parseCompilerOutput(error.stdout + error.stderr);
      }
      console.error("Failed to run TypeScript compiler:", error);
      return [];
    }
  }

  private parseCompilerOutput(output: string): TypeScriptError[] {
    const errors: TypeScriptError[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      const match = line.match(
        /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/
      );

      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          severity: match[4] as "error" | "warning",
          code: `TS${match[5]}`,
          message: match[6],
        });
      }
    }

    return errors;
  }

  /**
   * Suggest fixes for TypeScript errors
   */
  async suggestFixes(errors: TypeScriptError[]): Promise<ErrorFix[]> {
    const fixes: ErrorFix[] = [];

    for (const error of errors) {
      const fix = await this.analyzeSingleError(error);
      if (fix) {
        fixes.push(fix);
      }
    }

    return fixes;
  }

  private async analyzeSingleError(
    error: TypeScriptError
  ): Promise<ErrorFix | null> {
    const patterns = [
      // Common TypeScript errors with auto-fix patterns
      {
        code: "TS2304",
        pattern: /Cannot find name '(.+)'/,
        fix: (match: RegExpMatchArray) =>
          `Import or declare '${match[1]}'. Check if the module is installed or the variable is defined.`,
        autoFixable: false,
        confidence: 0.7,
      },
      {
        code: "TS2345",
        pattern:
          /Argument of type '(.+)' is not assignable to parameter of type '(.+)'/,
        fix: (match: RegExpMatchArray) =>
          `Type mismatch: expected '${match[2]}' but got '${match[1]}'. Add type assertion or convert the value.`,
        autoFixable: false,
        confidence: 0.8,
      },
      {
        code: "TS2339",
        pattern: /Property '(.+)' does not exist on type '(.+)'/,
        fix: (match: RegExpMatchArray) =>
          `Property '${match[1]}' is missing from type '${match[2]}'. Check if property name is correct or update the interface.`,
        autoFixable: false,
        confidence: 0.7,
      },
      {
        code: "TS2307",
        pattern: /Cannot find module '(.+)'/,
        fix: (match: RegExpMatchArray) =>
          `Module '${match[1]}' not found. Run: npm install ${match[1]}`,
        autoFixable: true,
        confidence: 0.9,
      },
      {
        code: "TS2322",
        pattern: /Type '(.+)' is not assignable to type '(.+)'/,
        fix: (match: RegExpMatchArray) =>
          `Type incompatibility: '${match[1]}' cannot be assigned to '${match[2]}'. Add type casting or modify the value.`,
        autoFixable: false,
        confidence: 0.8,
      },
      {
        code: "TS7006",
        pattern: /Parameter '(.+)' implicitly has an 'any' type/,
        fix: (match: RegExpMatchArray) =>
          `Add explicit type annotation for parameter '${match[1]}'. Example: ${match[1]}: string`,
        autoFixable: true,
        confidence: 0.9,
      },
      {
        code: "TS2554",
        pattern: /Expected (\d+) arguments?, but got (\d+)/,
        fix: (match: RegExpMatchArray) =>
          `Function call has wrong number of arguments. Expected ${match[1]}, got ${match[2]}. Check function signature.`,
        autoFixable: false,
        confidence: 0.9,
      },
    ];

    for (const pattern of patterns) {
      if (error.code === pattern.code) {
        const match = error.message.match(pattern.pattern);
        if (match) {
          return {
            error,
            suggestedFix: pattern.fix(match),
            autoFixable: pattern.autoFixable,
            confidence: pattern.confidence,
          };
        }
      }
    }

    // Generic suggestion for unknown errors
    return {
      error,
      suggestedFix: `TypeScript error ${error.code}: ${error.message}. Check TypeScript documentation for details.`,
      autoFixable: false,
      confidence: 0.5,
    };
  }

  /**
   * Attempt to auto-fix simple errors
   */
  async applyAutoFix(fix: ErrorFix): Promise<boolean> {
    if (!fix.autoFixable) {
      return false;
    }

    if (!this.checkRateLimit()) {
      return false;
    }

    try {
      // Auto-fix for missing module (TS2307)
      if (fix.error.code === "TS2307") {
        const moduleMatch = fix.error.message.match(
          /Cannot find module '(.+)'/
        );
        if (moduleMatch) {
          const moduleName = moduleMatch[1];
          console.log(
            `🔧 Auto-fixing: Installing missing module ${moduleName}`
          );

          await execAsync(`npm install ${moduleName}`, {
            cwd: path.join(__dirname, "../.."),
          });

          this.incrementRateLimit();

          await guardianAI.logAction(
            "TypeScript Error Fixer",
            "auto_fix_applied",
            `Installed missing module: ${moduleName}`,
            { error: fix.error, moduleName }
          );

          return true;
        }
      }

      // Auto-fix for implicit any (TS7006)
      if (fix.error.code === "TS7006") {
        console.log(
          "🔧 Implicit 'any' type detected. Manual intervention required."
        );
        // This requires code modification - log for manual review
        await guardianAI.logAction(
          "TypeScript Error Fixer",
          "manual_fix_required",
          `Implicit any type in ${fix.error.file}:${fix.error.line}`,
          { error: fix.error, suggestion: fix.suggestedFix }
        );
      }

      return false;
    } catch (error) {
      console.error("Failed to apply auto-fix:", error);
      return false;
    }
  }

  /**
   * Run full error detection and fixing cycle
   */
  async run(): Promise<{
    totalErrors: number;
    fixesApplied: number;
    suggestions: ErrorFix[];
  }> {
    if (this.isRunning) {
      console.log("⚠️ TypeScript Error Fixer already running");
      return { totalErrors: 0, fixesApplied: 0, suggestions: [] };
    }

    this.isRunning = true;

    try {
      console.log("🔍 Running TypeScript error detection...");
      const errors = await this.detectErrors();

      if (errors.length === 0) {
        console.log("✅ No TypeScript errors found");
        return { totalErrors: 0, fixesApplied: 0, suggestions: [] };
      }

      console.log(`⚠️ Found ${errors.length} TypeScript errors`);

      // Get suggestions for all errors
      const fixes = await this.suggestFixes(errors);

      // Attempt auto-fixes
      let fixesApplied = 0;
      for (const fix of fixes) {
        if (fix.autoFixable && fix.confidence > 0.8) {
          const success = await this.applyAutoFix(fix);
          if (success) {
            fixesApplied++;
          }
        }
      }

      // Log to Guardian AI
      await guardianAI.logAction(
        "TypeScript Error Fixer",
        "scan_complete",
        `Found ${errors.length} errors, applied ${fixesApplied} auto-fixes`,
        {
          totalErrors: errors.length,
          fixesApplied,
          errorCodes: errors.map((e) => e.code),
        }
      );

      return {
        totalErrors: errors.length,
        fixesApplied,
        suggestions: fixes,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      rateLimit: {
        fixes: this.rateLimitState.fixes,
        maxPerMinute: this.MAX_FIXES_PER_MINUTE,
        resetIn: Math.max(
          0,
          this.RATE_LIMIT_WINDOW_MS -
            (Date.now() - this.rateLimitState.lastReset)
        ),
      },
    };
  }
}

// Export singleton instance
export const typescriptErrorFixer = new TypeScriptErrorFixer();
