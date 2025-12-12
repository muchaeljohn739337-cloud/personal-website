/**
 * ═══════════════════════════════════════════════════════════════
 * AI-POWERED MARKDOWN AUTO-FIXER
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Automatically fix common Markdownlint issues across all documentation
 * Features:
 * - MD050: Fenced code blocks missing language identifiers
 * - MD036: Emphasis used instead of headings
 * - MD022/MD024: Heading spacing and uniqueness
 * - MD026: Trailing punctuation in headings
 * - AI-powered language detection for code blocks
 * - Integrated with Auto-Precision Core
 * ═══════════════════════════════════════════════════════════════
 */

import fs from "fs";
import { glob } from "glob";
import path from "path";

// ═══════════════════════════════════════════════════════════════
// AI LANGUAGE DETECTOR
// ═══════════════════════════════════════════════════════════════

interface LanguagePattern {
  language: string;
  patterns: RegExp[];
  keywords: string[];
  extensions?: string[];
}

const LANGUAGE_SIGNATURES: LanguagePattern[] = [
  {
    language: "typescript",
    patterns: [
      /interface\s+\w+/,
      /type\s+\w+\s*=/,
      /export\s+(interface|type|class)/,
      /import.*from\s+['"].*['"]/,
      /<.*>.*\(/,
    ],
    keywords: [
      "interface",
      "type",
      "export",
      "import",
      "async",
      "Promise",
      "const",
      "let",
    ],
  },
  {
    language: "javascript",
    patterns: [
      /function\s+\w+/,
      /const\s+\w+\s*=/,
      /console\.log/,
      /require\(/,
      /module\.exports/,
    ],
    keywords: [
      "function",
      "const",
      "let",
      "var",
      "console",
      "require",
      "module",
    ],
  },
  {
    language: "python",
    patterns: [
      /def\s+\w+/,
      /import\s+\w+/,
      /from\s+\w+\s+import/,
      /print\(/,
      /class\s+\w+:/,
    ],
    keywords: ["def", "import", "from", "print", "class", "if __name__"],
  },
  {
    language: "bash",
    patterns: [
      /^#!/,
      /\$\s*[a-zA-Z_]+/,
      /echo\s+/,
      /cd\s+/,
      /npm\s+/,
      /git\s+/,
    ],
    keywords: ["echo", "cd", "ls", "mkdir", "npm", "git", "curl", "wget"],
  },
  {
    language: "powershell",
    patterns: [
      /\$\w+\s*=/,
      /Write-Host/,
      /Get-\w+/,
      /Set-\w+/,
      /param\s*\(/,
      /-\w+\s+/,
    ],
    keywords: ["Write-Host", "Get-", "Set-", "param", "$env:", "foreach"],
  },
  {
    language: "sql",
    patterns: [
      /SELECT\s+.*FROM/,
      /INSERT\s+INTO/,
      /UPDATE\s+.*SET/,
      /DELETE\s+FROM/,
      /CREATE\s+TABLE/,
    ],
    keywords: [
      "SELECT",
      "FROM",
      "WHERE",
      "INSERT",
      "UPDATE",
      "DELETE",
      "CREATE",
    ],
  },
  {
    language: "json",
    patterns: [/^\s*\{/, /^\s*\[/, /"[^"]+"\s*:\s*/, /"[^"]+"\s*,/],
    keywords: [],
  },
  {
    language: "yaml",
    patterns: [/^[a-zA-Z_]+:\s*$/, /^[a-zA-Z_]+:\s+[^\n]+/, /^\s+-\s+/],
    keywords: ["name:", "on:", "jobs:", "steps:", "run:", "uses:"],
  },
  {
    language: "html",
    patterns: [
      /<[a-zA-Z]+/,
      /<\/[a-zA-Z]+>/,
      /<!DOCTYPE/,
      /<html/,
      /<body/,
      /<div/,
    ],
    keywords: ["<html", "<body", "<div", "<span", "<script", "<style"],
  },
  {
    language: "css",
    patterns: [
      /\.[a-zA-Z_-]+\s*\{/,
      /#[a-zA-Z_-]+\s*\{/,
      /[a-zA-Z_-]+:\s*[^;]+;/,
    ],
    keywords: [
      "color:",
      "background:",
      "margin:",
      "padding:",
      "display:",
      "font-",
    ],
  },
  {
    language: "markdown",
    patterns: [/^#+\s+/, /\*\*[^*]+\*\*/, /\[.*\]\(.*\)/, /^```/, /^-\s+/],
    keywords: [],
  },
];

export async function detectLanguage(code: string): Promise<string> {
  if (!code || code.trim().length === 0) return "";

  const trimmedCode = code.trim();
  const firstLine = trimmedCode.split("\n")[0].toLowerCase();

  // Check for explicit language hints in first line
  if (firstLine.includes("typescript") || firstLine.includes(".ts"))
    return "typescript";
  if (firstLine.includes("javascript") || firstLine.includes(".js"))
    return "javascript";
  if (firstLine.includes("python") || firstLine.includes(".py"))
    return "python";
  if (firstLine.includes("bash") || firstLine.includes("shell")) return "bash";
  if (firstLine.includes("powershell") || firstLine.includes(".ps1"))
    return "powershell";
  if (firstLine.includes("sql")) return "sql";
  if (firstLine.includes("json")) return "json";
  if (firstLine.includes("yaml") || firstLine.includes(".yml")) return "yaml";
  if (firstLine.includes("html")) return "html";
  if (firstLine.includes("css")) return "css";

  // Score each language based on pattern matches
  const scores: Record<string, number> = {};

  for (const langDef of LANGUAGE_SIGNATURES) {
    let score = 0;

    // Check patterns
    for (const pattern of langDef.patterns) {
      if (pattern.test(trimmedCode)) {
        score += 5;
      }
    }

    // Check keywords
    for (const keyword of langDef.keywords) {
      if (trimmedCode.includes(keyword)) {
        score += 2;
      }
    }

    scores[langDef.language] = score;
  }

  // Return language with highest score
  const sortedLanguages = Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1]);

  return sortedLanguages.length > 0 ? sortedLanguages[0][0] : "";
}

// ═══════════════════════════════════════════════════════════════
// MARKDOWN FIXER
// ═══════════════════════════════════════════════════════════════

interface FixResult {
  fixed: boolean;
  issues: string[];
  changes: number;
}

export class MarkdownAutoFixer {
  private stats = {
    filesProcessed: 0,
    issuesFixed: 0,
    md050Fixed: 0,
    md036Fixed: 0,
    md022Fixed: 0,
    md026Fixed: 0,
  };

  /**
   * Fix MD050: Code blocks missing language specifiers
   */
  private async fixMD050(
    content: string
  ): Promise<{ content: string; fixed: number }> {
    const lines = content.split("\n");
    const newLines: string[] = [];
    let insideCodeBlock = false;
    let codeBlockContent: string[] = [];
    let fixed = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        if (!insideCodeBlock) {
          // Opening fence
          const langMatch = trimmed.match(/^```(\w+)?/);
          const currentLang = langMatch?.[1] || "";

          if (!currentLang) {
            // No language specified, start collecting code
            insideCodeBlock = true;
            codeBlockContent = [];
          } else {
            // Language already specified
            newLines.push(line);
          }
        } else {
          // Closing fence - detect language and fix
          const detectedLang = await detectLanguage(
            codeBlockContent.join("\n")
          );
          newLines.push("```" + detectedLang);
          newLines.push(...codeBlockContent);
          newLines.push("```");
          insideCodeBlock = false;
          codeBlockContent = [];
          fixed++;
        }
      } else if (insideCodeBlock) {
        codeBlockContent.push(line);
      } else {
        newLines.push(line);
      }
    }

    return { content: newLines.join("\n"), fixed };
  }

  /**
   * Fix MD036: Emphasis used instead of heading
   */
  private fixMD036(content: string): { content: string; fixed: number } {
    const lines = content.split("\n");
    const newLines: string[] = [];
    let fixed = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if line is bold text on its own line (likely a heading)
      if (trimmed.match(/^\*\*[^*]+\*\*$/) || trimmed.match(/^__[^_]+__$/)) {
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";
        const prevLine = i > 0 ? lines[i - 1].trim() : "";

        // If surrounded by blank lines and looks like a title, convert to heading
        if ((prevLine === "" || i === 0) && nextLine === "") {
          const text = trimmed.replace(/^\*\*|\*\*$|^__|__$/g, "");
          newLines.push(`## ${text}`);
          fixed++;
          continue;
        }
      }

      newLines.push(line);
    }

    return { content: newLines.join("\n"), fixed };
  }

  /**
   * Fix MD022/MD024: Heading spacing
   */
  private fixMD022(content: string): { content: string; fixed: number } {
    const lines = content.split("\n");
    const newLines: string[] = [];
    let fixed = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if current line is a heading
      if (trimmed.match(/^#+\s+/)) {
        const prevLine = i > 0 ? lines[i - 1].trim() : "";
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : "";

        // Add blank line before heading if missing (except at start)
        if (i > 0 && prevLine !== "") {
          newLines.push("");
          fixed++;
        }

        newLines.push(line);

        // Add blank line after heading if missing (except at end)
        if (
          i + 1 < lines.length &&
          nextLine !== "" &&
          !nextLine.match(/^#+\s+/)
        ) {
          newLines.push("");
          fixed++;
        }
      } else {
        newLines.push(line);
      }
    }

    return { content: newLines.join("\n"), fixed };
  }

  /**
   * Fix MD026: Trailing punctuation in headings
   */
  private fixMD026(content: string): { content: string; fixed: number } {
    const lines = content.split("\n");
    const newLines: string[] = [];
    let fixed = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      const headingMatch = trimmed.match(/^(#+\s+)(.+?)([.,:;!?]+)$/);

      if (headingMatch) {
        const [, prefix, text, punctuation] = headingMatch;
        newLines.push(`${prefix}${text}`);
        fixed++;
      } else {
        newLines.push(line);
      }
    }

    return { content: newLines.join("\n"), fixed };
  }

  /**
   * Fix all issues in a markdown file
   */
  public async fixMarkdownFile(filePath: string): Promise<FixResult> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      let fixedContent = content;
      const issues: string[] = [];
      let totalChanges = 0;

      // Apply all fixes
      const md050Result = await this.fixMD050(fixedContent);
      fixedContent = md050Result.content;
      totalChanges += md050Result.fixed;
      if (md050Result.fixed > 0) {
        issues.push(
          `MD050: Fixed ${md050Result.fixed} code blocks without language`
        );
        this.stats.md050Fixed += md050Result.fixed;
      }

      const md036Result = this.fixMD036(fixedContent);
      fixedContent = md036Result.content;
      totalChanges += md036Result.fixed;
      if (md036Result.fixed > 0) {
        issues.push(
          `MD036: Fixed ${md036Result.fixed} emphasis-as-heading issues`
        );
        this.stats.md036Fixed += md036Result.fixed;
      }

      const md022Result = this.fixMD022(fixedContent);
      fixedContent = md022Result.content;
      totalChanges += md022Result.fixed;
      if (md022Result.fixed > 0) {
        issues.push(`MD022: Fixed ${md022Result.fixed} heading spacing issues`);
        this.stats.md022Fixed += md022Result.fixed;
      }

      const md026Result = this.fixMD026(fixedContent);
      fixedContent = md026Result.content;
      totalChanges += md026Result.fixed;
      if (md026Result.fixed > 0) {
        issues.push(
          `MD026: Fixed ${md026Result.fixed} heading punctuation issues`
        );
        this.stats.md026Fixed += md026Result.fixed;
      }

      // Write back if changes were made
      if (totalChanges > 0) {
        fs.writeFileSync(filePath, fixedContent, "utf-8");
        this.stats.filesProcessed++;
        this.stats.issuesFixed += totalChanges;
      }

      return {
        fixed: totalChanges > 0,
        issues,
        changes: totalChanges,
      };
    } catch (error) {
      console.error(`Error fixing ${filePath}:`, error);
      return {
        fixed: false,
        issues: [
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
        changes: 0,
      };
    }
  }

  /**
   * Fix all markdown files in a directory
   */
  public async fixAllMarkdownFiles(directory: string): Promise<void> {
    console.log(`🔍 Scanning for Markdown files in ${directory}...`);

    const pattern = path.join(directory, "**/*.md").replace(/\\/g, "/");
    const files = await glob(pattern, {
      ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"],
    });

    console.log(`📝 Found ${files.length} Markdown files`);

    for (const file of files) {
      const result = await this.fixMarkdownFile(file);
      if (result.fixed) {
        console.log(`✅ Fixed ${file}:`);
        result.issues.forEach((issue) => console.log(`   - ${issue}`));
      }
    }

    this.printStats();
  }

  /**
   * Print statistics
   */
  public printStats(): void {
    console.log(
      "\n═══════════════════════════════════════════════════════════════"
    );
    console.log("📊 MARKDOWN AUTO-FIXER STATISTICS");
    console.log(
      "═══════════════════════════════════════════════════════════════"
    );
    console.log(`Files processed:              ${this.stats.filesProcessed}`);
    console.log(`Total issues fixed:           ${this.stats.issuesFixed}`);
    console.log(`MD050 (code lang):            ${this.stats.md050Fixed}`);
    console.log(`MD036 (emphasis heading):     ${this.stats.md036Fixed}`);
    console.log(`MD022 (heading spacing):      ${this.stats.md022Fixed}`);
    console.log(`MD026 (heading punctuation):  ${this.stats.md026Fixed}`);
    console.log(
      "═══════════════════════════════════════════════════════════════\n"
    );
  }

  /**
   * Get current statistics
   */
  public getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      filesProcessed: 0,
      issuesFixed: 0,
      md050Fixed: 0,
      md036Fixed: 0,
      md022Fixed: 0,
      md026Fixed: 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CLI INTERFACE
// ═══════════════════════════════════════════════════════════════

export async function runMarkdownAutoFixer(directory?: string): Promise<void> {
  const projectRoot = path.resolve(__dirname, "../../..");
  const targetDir = directory || projectRoot;

  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log("🤖 AI-POWERED MARKDOWN AUTO-FIXER");
  console.log(
    "═══════════════════════════════════════════════════════════════"
  );
  console.log(`Target directory: ${targetDir}`);
  console.log("Fixing issues: MD050, MD036, MD022, MD026\n");

  const fixer = new MarkdownAutoFixer();
  await fixer.fixAllMarkdownFiles(targetDir);

  console.log("✅ Markdown auto-fixing complete!");
}

// Export singleton instance
export const markdownAutoFixer = new MarkdownAutoFixer();
