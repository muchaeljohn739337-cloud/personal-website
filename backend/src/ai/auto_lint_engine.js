// ═══════════════════════════════════════════════════════════════
// AUTO-LINT ENGINE - Markdown & Code Quality Automation
// ═══════════════════════════════════════════════════════════════
// Purpose: Auto-fix MD036, formatting issues, and code quality
// Features: Bare URL detection, heading fixes, spacing, list formatting

const fs = require("fs").promises;
const path = require("path");
const { EventEmitter } = require("events");

class AutoLintEngine extends EventEmitter {
  constructor() {
    super();
    this.fixLog = [];
    this.rules = this.loadLintRules();
    this.stats = {
      filesScanned: 0,
      violationsFound: 0,
      violationsFixed: 0,
      filesModified: 0,
    };
  }

  /**
   * Load all lint rules (MD001-MD053)
   */
  loadLintRules() {
    return {
      MD036: {
        name: "no-bare-urls",
        description: "URLs must be in proper Markdown link format",
        severity: "error",
        fix: (content) => this.fixBareUrls(content),
      },
      MD001: {
        name: "heading-increment",
        description: "Heading levels should increment by one level at a time",
        severity: "warning",
        fix: (content) => this.fixHeadingLevels(content),
      },
      MD009: {
        name: "no-trailing-spaces",
        description: "Trailing spaces",
        severity: "warning",
        fix: (content) => this.fixTrailingSpaces(content),
      },
      MD012: {
        name: "no-multiple-blanks",
        description: "Multiple consecutive blank lines",
        severity: "warning",
        fix: (content) => this.fixMultipleBlanks(content),
      },
      MD022: {
        name: "blanks-around-headings",
        description: "Headings should be surrounded by blank lines",
        severity: "warning",
        fix: (content) => this.fixBlanksAroundHeadings(content),
      },
      MD030: {
        name: "list-marker-space",
        description: "Spaces after list markers",
        severity: "warning",
        fix: (content) => this.fixListMarkerSpaces(content),
      },
    };
  }

  /**
   * MD036: Fix bare URLs by converting to [text](url) format
   */
  fixBareUrls(content) {
    const fixes = [];

    // Regex to detect bare URLs (not already in [text](url) format)
    const urlRegex = /(?<!\]\()(?<!\()(https?:\/\/[^\s<>\)]+)(?!\))/g;

    let match;
    let fixedContent = content;
    let offset = 0;

    while ((match = urlRegex.exec(content)) !== null) {
      const url = match[1];
      const startPos = match.index + offset;

      // Skip if URL is already in code block or inline code
      const beforeUrl = content.substring(0, match.index);
      const codeBlockCount = (beforeUrl.match(/```/g) || []).length;
      const inlineCodeCount = (beforeUrl.match(/`/g) || []).length;

      if (codeBlockCount % 2 === 1 || inlineCodeCount % 2 === 1) {
        continue; // Skip URLs in code
      }

      // Generate readable link text from URL
      let linkText = this.generateLinkText(url);

      // Replace bare URL with [text](url)
      const replacement = `[${linkText}](${url})`;
      fixedContent =
        fixedContent.substring(0, startPos) +
        replacement +
        fixedContent.substring(startPos + url.length);

      offset += replacement.length - url.length;

      fixes.push({
        rule: "MD036",
        line: this.getLineNumber(content, match.index),
        original: url,
        fixed: replacement,
        description: "Converted bare URL to Markdown link",
      });
    }

    return { content: fixedContent, fixes };
  }

  /**
   * Generate readable link text from URL
   */
  generateLinkText(url) {
    try {
      const urlObj = new URL(url);

      // Special cases for common domains
      if (urlObj.hostname.includes("github.com")) {
        const parts = urlObj.pathname.split("/").filter((p) => p);
        if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
      }

      if (urlObj.hostname.includes("docs.")) {
        return "Documentation";
      }

      if (urlObj.hostname.includes("api.")) {
        return "API Reference";
      }

      // Default: use hostname
      return urlObj.hostname.replace("www.", "");
    } catch (e) {
      return "Link";
    }
  }

  /**
   * MD001: Fix heading level increments
   */
  fixHeadingLevels(content) {
    const fixes = [];
    const lines = content.split("\n");
    let lastLevel = 0;
    let fixedLines = [...lines];

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const currentLevel = match[1].length;
        const text = match[2];

        // Check if level increment is valid
        if (currentLevel > lastLevel + 1) {
          const correctLevel = lastLevel + 1;
          const fixedLine = "#".repeat(correctLevel) + " " + text;
          fixedLines[i] = fixedLine;

          fixes.push({
            rule: "MD001",
            line: i + 1,
            original: lines[i],
            fixed: fixedLine,
            description: `Adjusted heading level from ${currentLevel} to ${correctLevel}`,
          });
        }

        lastLevel = currentLevel;
      }
    }

    return { content: fixedLines.join("\n"), fixes };
  }

  /**
   * MD009: Fix trailing spaces
   */
  fixTrailingSpaces(content) {
    const fixes = [];
    const lines = content.split("\n");
    const fixedLines = lines.map((line, i) => {
      if (line.match(/\s+$/)) {
        fixes.push({
          rule: "MD009",
          line: i + 1,
          original: line,
          fixed: line.trimEnd(),
          description: "Removed trailing spaces",
        });
        return line.trimEnd();
      }
      return line;
    });

    return { content: fixedLines.join("\n"), fixes };
  }

  /**
   * MD012: Fix multiple consecutive blank lines
   */
  fixMultipleBlanks(content) {
    const fixes = [];
    const fixedContent = content.replace(/\n{3,}/g, (match, offset) => {
      const lineNum = this.getLineNumber(content, offset);
      fixes.push({
        rule: "MD012",
        line: lineNum,
        original: `${match.length - 1} blank lines`,
        fixed: "1 blank line",
        description: "Reduced multiple blank lines to one",
      });
      return "\n\n";
    });

    return { content: fixedContent, fixes };
  }

  /**
   * MD022: Add blank lines around headings
   */
  fixBlanksAroundHeadings(content) {
    const fixes = [];
    const lines = content.split("\n");
    const fixedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const isHeading = lines[i].match(/^#{1,6}\s+/);

      if (isHeading) {
        // Add blank line before heading (except at start)
        if (i > 0 && lines[i - 1] !== "") {
          fixedLines.push("");
          fixes.push({
            rule: "MD022",
            line: i + 1,
            description: "Added blank line before heading",
          });
        }

        fixedLines.push(lines[i]);

        // Add blank line after heading (except at end)
        if (
          i < lines.length - 1 &&
          lines[i + 1] !== "" &&
          !lines[i + 1].match(/^#{1,6}\s+/)
        ) {
          fixedLines.push("");
          fixes.push({
            rule: "MD022",
            line: i + 1,
            description: "Added blank line after heading",
          });
        }
      } else {
        fixedLines.push(lines[i]);
      }
    }

    return { content: fixedLines.join("\n"), fixes };
  }

  /**
   * MD030: Fix list marker spaces
   */
  fixListMarkerSpaces(content) {
    const fixes = [];
    const lines = content.split("\n");
    const fixedLines = lines.map((line, i) => {
      // Check for list markers with incorrect spacing
      const match = line.match(/^(\s*)([-*+]|\d+\.)\s{2,}(.+)$/);
      if (match) {
        const indent = match[1];
        const marker = match[2];
        const text = match[3];
        const fixedLine = `${indent}${marker} ${text}`;

        fixes.push({
          rule: "MD030",
          line: i + 1,
          original: line,
          fixed: fixedLine,
          description: "Fixed list marker spacing",
        });

        return fixedLine;
      }
      return line;
    });

    return { content: fixedLines.join("\n"), fixes };
  }

  /**
   * Get line number from character offset
   */
  getLineNumber(content, offset) {
    return content.substring(0, offset).split("\n").length;
  }

  /**
   * Scan and fix all markdown files in directory
   */
  async scanDirectory(dirPath, options = {}) {
    const {
      recursive = true,
      dryRun = false,
      rules = Object.keys(this.rules),
    } = options;

    console.log(`🔍 Scanning directory: ${dirPath}`);
    console.log(`   Rules: ${rules.join(", ")}`);
    console.log(`   Dry-run: ${dryRun ? "YES" : "NO"}`);
    console.log("");

    const files = await this.findMarkdownFiles(dirPath, recursive);
    console.log(`📁 Found ${files.length} Markdown files`);
    console.log("");

    for (const file of files) {
      await this.lintFile(file, { dryRun, rules });
    }

    this.printSummary();
    return this.fixLog;
  }

  /**
   * Find all markdown files in directory
   */
  async findMarkdownFiles(dirPath, recursive) {
    const files = [];

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip node_modules, .git, etc.
      if (entry.name.startsWith(".") || entry.name === "node_modules") {
        continue;
      }

      if (entry.isDirectory() && recursive) {
        const subFiles = await this.findMarkdownFiles(fullPath, recursive);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Lint a single file
   */
  async lintFile(filePath, options = {}) {
    const { dryRun = false, rules = Object.keys(this.rules) } = options;

    this.stats.filesScanned++;

    const content = await fs.readFile(filePath, "utf8");
    const relativePath = path.relative(process.cwd(), filePath);

    let fixedContent = content;
    const fileFixes = [];

    // Apply each rule
    for (const ruleId of rules) {
      const rule = this.rules[ruleId];
      if (!rule) continue;

      const result = rule.fix(fixedContent);
      if (result.fixes.length > 0) {
        fixedContent = result.content;
        fileFixes.push(...result.fixes);
        this.stats.violationsFound += result.fixes.length;
      }
    }

    if (fileFixes.length > 0) {
      console.log(`📝 ${relativePath}`);
      console.log(`   Violations: ${fileFixes.length}`);

      for (const fix of fileFixes) {
        console.log(`   - Line ${fix.line}: ${fix.rule} - ${fix.description}`);
      }

      if (!dryRun) {
        await fs.writeFile(filePath, fixedContent, "utf8");
        this.stats.violationsFixed += fileFixes.length;
        this.stats.filesModified++;
        console.log(`   ✅ Fixed ${fileFixes.length} violations`);
      } else {
        console.log(`   ℹ️ Dry-run: Would fix ${fileFixes.length} violations`);
      }

      console.log("");

      this.fixLog.push({
        file: relativePath,
        fixes: fileFixes,
        timestamp: new Date().toISOString(),
      });

      this.emit("file_linted", {
        file: relativePath,
        fixes: fileFixes,
        dryRun,
      });
    }
  }

  /**
   * Print summary of all fixes
   */
  printSummary() {
    console.log("═══════════════════════════════════════════════════════");
    console.log("📊 LINT SUMMARY");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`Files scanned:       ${this.stats.filesScanned}`);
    console.log(`Files modified:      ${this.stats.filesModified}`);
    console.log(`Violations found:    ${this.stats.violationsFound}`);
    console.log(`Violations fixed:    ${this.stats.violationsFixed}`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("");
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      fixLog: this.fixLog,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear statistics and logs
   */
  reset() {
    this.fixLog = [];
    this.stats = {
      filesScanned: 0,
      violationsFound: 0,
      violationsFixed: 0,
      filesModified: 0,
    };
  }
}

module.exports = { AutoLintEngine };
