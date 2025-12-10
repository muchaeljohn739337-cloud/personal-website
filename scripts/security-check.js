#!/usr/bin/env node

/**
 * Security Leakage Check
 * Scans for potential security issues and hardcoded secrets
 */

const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
};

let issues = [];

// Patterns to check
const dangerousPatterns = [
  {
    name: 'Hardcoded API Keys',
    pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"`](sk_|pk_|AIza|ghp_|gho_)[^'"`]+/i,
    severity: 'critical',
  },
  {
    name: 'Hardcoded Secrets',
    pattern: /(secret|password|token)\s*[:=]\s*['"`][^'"`]{10,}(?!['"`]\s*(?:#|$|\/\/|\/\*|\n))/i,
    severity: 'high',
    exclude: /(process\.env|your_|placeholder|example|test-|console\.log)/i,
  },
  {
    name: 'Database URLs with passwords',
    pattern: /postgresql:\/\/[^:]+:[^@]+@/,
    severity: 'high',
    exclude: /process\.env|your_|localhost|example/,
  },
  {
    name: 'AWS Credentials',
    pattern: /(AWS_ACCESS_KEY|AWS_SECRET)[\s=:]['"`][^'"`]+/i,
    severity: 'critical',
    exclude: /process\.env/,
  },
];

function walkDir(dir, fileList = []) {
  const ignoreDirs = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.vercel',
    'coverage',
    '.open-next',
    'test-results',
    'playwright-report',
  ];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx|json)$/.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Skip test files
    if (filePath.includes('test') || filePath.includes('__tests__')) {
      return;
    }

    dangerousPatterns.forEach(({ name, pattern, severity, exclude }) => {
      const matches = content.match(new RegExp(pattern, 'gi'));
      if (matches) {
        matches.forEach((match) => {
          if (!exclude || !exclude.test(match)) {
            const line = content.substring(0, content.indexOf(match)).split('\n').length;
            issues.push({
              file: filePath,
              issue: name,
              severity,
              match: match.substring(0, 50) + '...',
              line,
            });
          }
        });
      }
    });
  } catch (e) {
    // Skip files we can't read
  }
}

console.log('🔒 Running security check...\n');

const files = walkDir('.');
files.forEach(checkFile);

if (issues.length === 0) {
  console.log(`${colors.green}✅ No security issues found!${colors.reset}`);
  process.exit(0);
}

console.log(`${colors.red}❌ Found ${issues.length} potential security issue(s):${colors.reset}\n`);

const critical = issues.filter((i) => i.severity === 'critical');
const high = issues.filter((i) => i.severity === 'high');

if (critical.length > 0) {
  console.log(`${colors.red}🚨 CRITICAL ISSUES:${colors.reset}`);
  critical.forEach((issue) => {
    console.log(`  ${colors.red}●${colors.reset} ${issue.file}:${issue.line}`);
    console.log(`    ${issue.issue}: ${issue.match}`);
  });
  console.log();
}

if (high.length > 0) {
  console.log(`${colors.yellow}⚠️  HIGH SEVERITY:${colors.reset}`);
  high.forEach((issue) => {
    console.log(`  ${colors.yellow}●${colors.reset} ${issue.file}:${issue.line}`);
    console.log(`    ${issue.issue}: ${issue.match}`);
  });
}

process.exit(critical.length > 0 ? 1 : 0);
