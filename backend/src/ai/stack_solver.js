// ═══════════════════════════════════════════════════════════════
// STACK SOLVER - Dependency & Configuration Auto-Fixer
// ═══════════════════════════════════════════════════════════════
// Purpose: Detect and fix missing dependencies, runtime errors, misconfigurations
// Features: Auto-install packages, version updates, Docker monitoring

const { execSync, spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { EventEmitter } = require("events");

class StackSolver extends EventEmitter {
  constructor() {
    super();
    this.fixes = [];
    this.stats = {
      errorsDetected: 0,
      errorsFixed: 0,
      packagesInstalled: 0,
      configsFixed: 0,
    };
  }

  /**
   * Analyze project for missing dependencies and errors
   */
  async analyzeProject(projectPath) {
    console.log("🔍 Analyzing project stack...");
    console.log(`   Path: ${projectPath}`);
    console.log("");

    const issues = [];

    // 1. Check package.json dependencies
    const packageIssues = await this.checkPackageDependencies(projectPath);
    issues.push(...packageIssues);

    // 2. Check TypeScript configuration
    const tsIssues = await this.checkTypeScriptConfig(projectPath);
    issues.push(...tsIssues);

    // 3. Check environment variables
    const envIssues = await this.checkEnvironmentVars(projectPath);
    issues.push(...envIssues);

    // 4. Check Docker configuration
    const dockerIssues = await this.checkDockerConfig(projectPath);
    issues.push(...dockerIssues);

    // 5. Check database connection
    const dbIssues = await this.checkDatabaseConfig(projectPath);
    issues.push(...dbIssues);

    this.stats.errorsDetected = issues.length;

    return issues;
  }

  /**
   * Check package.json for missing dependencies
   */
  async checkPackageDependencies(projectPath) {
    const issues = [];

    try {
      const packageJsonPath = path.join(projectPath, "package.json");
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf8")
      );

      // Common missing dependencies
      const requiredDeps = {
        express: "^4.18.0",
        "@prisma/client": "^5.0.0",
        "socket.io": "^4.6.0",
        cors: "^2.8.5",
        dotenv: "^16.0.0",
        jsonwebtoken: "^9.0.0",
      };

      const requiredDevDeps = {
        typescript: "^5.0.0",
        "@types/node": "^20.0.0",
        "@types/express": "^4.17.0",
        "ts-node": "^10.9.0",
        nodemon: "^3.0.0",
      };

      // Check dependencies
      for (const [pkg, version] of Object.entries(requiredDeps)) {
        if (!packageJson.dependencies?.[pkg]) {
          issues.push({
            type: "missing_dependency",
            severity: "error",
            package: pkg,
            version: version,
            location: "dependencies",
            fix: async () =>
              this.installPackage(projectPath, pkg, version, false),
          });
        }
      }

      // Check devDependencies
      for (const [pkg, version] of Object.entries(requiredDevDeps)) {
        if (!packageJson.devDependencies?.[pkg]) {
          issues.push({
            type: "missing_dev_dependency",
            severity: "warning",
            package: pkg,
            version: version,
            location: "devDependencies",
            fix: async () =>
              this.installPackage(projectPath, pkg, version, true),
          });
        }
      }

      // Check for version conflicts
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };
      for (const [pkg, version] of Object.entries(allDeps)) {
        if (version.includes("^") && !this.isValidVersion(version)) {
          issues.push({
            type: "invalid_version",
            severity: "warning",
            package: pkg,
            version: version,
            fix: async () => this.updatePackageVersion(projectPath, pkg),
          });
        }
      }
    } catch (error) {
      console.error("❌ Error checking package dependencies:", error.message);
    }

    return issues;
  }

  /**
   * Check TypeScript configuration
   */
  async checkTypeScriptConfig(projectPath) {
    const issues = [];

    try {
      const tsconfigPath = path.join(projectPath, "tsconfig.json");

      try {
        const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, "utf8"));

        // Check for recommended compiler options
        const recommendedOptions = {
          target: "ES2020",
          module: "commonjs",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        };

        for (const [option, value] of Object.entries(recommendedOptions)) {
          if (tsconfig.compilerOptions?.[option] !== value) {
            issues.push({
              type: "tsconfig_option",
              severity: "warning",
              option: option,
              expected: value,
              actual: tsconfig.compilerOptions?.[option],
              fix: async () => this.fixTsConfig(projectPath, option, value),
            });
          }
        }
      } catch (error) {
        if (error.code === "ENOENT") {
          issues.push({
            type: "missing_tsconfig",
            severity: "error",
            fix: async () => this.createTsConfig(projectPath),
          });
        }
      }
    } catch (error) {
      console.error("❌ Error checking TypeScript config:", error.message);
    }

    return issues;
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVars(projectPath) {
    const issues = [];

    try {
      const envPath = path.join(projectPath, ".env");
      const envExamplePath = path.join(projectPath, ".env.example");

      const requiredVars = [
        "DATABASE_URL",
        "JWT_SECRET",
        "PORT",
        "NODE_ENV",
        "FRONTEND_URL",
      ];

      try {
        const envContent = await fs.readFile(envPath, "utf8");
        const envVars = this.parseEnvFile(envContent);

        for (const varName of requiredVars) {
          if (!envVars[varName]) {
            issues.push({
              type: "missing_env_var",
              severity: "error",
              variable: varName,
              fix: async () => this.addEnvVar(projectPath, varName),
            });
          }
        }
      } catch (error) {
        if (error.code === "ENOENT") {
          issues.push({
            type: "missing_env_file",
            severity: "error",
            fix: async () => this.createEnvFile(projectPath),
          });
        }
      }
    } catch (error) {
      console.error("❌ Error checking environment vars:", error.message);
    }

    return issues;
  }

  /**
   * Check Docker configuration
   */
  async checkDockerConfig(projectPath) {
    const issues = [];

    try {
      const dockerfilePath = path.join(projectPath, "Dockerfile");
      const dockerComposePath = path.join(projectPath, "docker-compose.yml");
      const dockerignorePath = path.join(projectPath, ".dockerignore");

      // Check if Docker files exist
      try {
        await fs.access(dockerfilePath);
      } catch {
        issues.push({
          type: "missing_dockerfile",
          severity: "warning",
          fix: async () => this.createDockerfile(projectPath),
        });
      }

      try {
        await fs.access(dockerComposePath);
      } catch {
        issues.push({
          type: "missing_docker_compose",
          severity: "warning",
          fix: async () => this.createDockerCompose(projectPath),
        });
      }

      try {
        await fs.access(dockerignorePath);
      } catch {
        issues.push({
          type: "missing_dockerignore",
          severity: "info",
          fix: async () => this.createDockerignore(projectPath),
        });
      }

      // Check if Docker is installed
      let dockerInstalled = false;
      try {
        const dockerVersion = execSync("docker --version", {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        dockerInstalled = true;
        console.log(`   ℹ️  ${dockerVersion}`);
      } catch {
        issues.push({
          type: "docker_not_installed",
          severity: "error",
          message: "Docker is not installed",
          fix: null,
          suggestion: "Install Docker: https://docs.docker.com/get-docker/",
        });
        return issues; // No point checking daemon if Docker isn't installed
      }

      // Check Docker daemon
      if (dockerInstalled) {
        try {
          execSync("docker ps", { stdio: "ignore" });
          console.log("   ✅ Docker daemon is running");
        } catch {
          issues.push({
            type: "docker_daemon_not_running",
            severity: "warning",
            message: "Docker daemon is not running",
            fix: null,
            suggestion:
              "Start Docker Desktop (Windows/Mac) or run: sudo systemctl start docker (Linux)",
          });
        }
      }
    } catch (error) {
      console.error("❌ Error checking Docker config:", error.message);
    }

    return issues;
  }

  /**
   * Check database configuration
   */
  async checkDatabaseConfig(projectPath) {
    const issues = [];

    try {
      const prismaPath = path.join(projectPath, "prisma", "schema.prisma");

      try {
        await fs.access(prismaPath);

        // Check if Prisma client is generated
        const prismaClientPath = path.join(
          projectPath,
          "node_modules",
          ".prisma",
          "client"
        );
        try {
          await fs.access(prismaClientPath);
        } catch {
          issues.push({
            type: "prisma_client_not_generated",
            severity: "error",
            fix: async () => this.generatePrismaClient(projectPath),
          });
        }
      } catch {
        issues.push({
          type: "missing_prisma_schema",
          severity: "warning",
          message: "Prisma schema not found",
        });
      }
    } catch (error) {
      console.error("❌ Error checking database config:", error.message);
    }

    return issues;
  }

  /**
   * Auto-fix all detected issues
   */
  async autoFix(issues, options = {}) {
    const { dryRun = false } = options;

    console.log("🔧 Auto-fixing detected issues...");
    console.log(`   Issues: ${issues.length}`);
    console.log(`   Dry-run: ${dryRun ? "YES" : "NO"}`);
    console.log("");

    const fixResults = [];

    for (const issue of issues) {
      if (!issue.fix) {
        console.log(`⚠️  Cannot auto-fix: ${issue.type}`);
        if (issue.message) console.log(`   ${issue.message}`);
        continue;
      }

      try {
        console.log(`🔧 Fixing: ${issue.type}`);
        if (issue.package) console.log(`   Package: ${issue.package}`);
        if (issue.variable) console.log(`   Variable: ${issue.variable}`);

        if (!dryRun) {
          await issue.fix();
          this.stats.errorsFixed++;

          fixResults.push({
            type: issue.type,
            status: "success",
            timestamp: new Date().toISOString(),
          });

          console.log(`   ✅ Fixed`);
        } else {
          console.log(`   ℹ️ Dry-run: Would fix`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to fix: ${error.message}`);

        fixResults.push({
          type: issue.type,
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
   * Install NPM package
   */
  async installPackage(projectPath, packageName, version, isDev) {
    console.log(`   Installing ${packageName}@${version}...`);

    const flag = isDev ? "-D" : "-S";
    const command = `npm install ${flag} ${packageName}@${version}`;

    execSync(command, { cwd: projectPath, stdio: "inherit" });

    this.stats.packagesInstalled++;
    this.emit("package_installed", { package: packageName, version, isDev });
  }

  /**
   * Update package version
   */
  async updatePackageVersion(projectPath, packageName) {
    console.log(`   Updating ${packageName}...`);

    const command = `npm update ${packageName}`;
    execSync(command, { cwd: projectPath, stdio: "inherit" });
  }

  /**
   * Create tsconfig.json
   */
  async createTsConfig(projectPath) {
    const tsconfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        moduleResolution: "node",
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };

    await fs.writeFile(
      path.join(projectPath, "tsconfig.json"),
      JSON.stringify(tsconfig, null, 2),
      "utf8"
    );

    this.stats.configsFixed++;
  }

  /**
   * Fix tsconfig option
   */
  async fixTsConfig(projectPath, option, value) {
    const tsconfigPath = path.join(projectPath, "tsconfig.json");
    const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, "utf8"));

    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }

    tsconfig.compilerOptions[option] = value;

    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), "utf8");
    this.stats.configsFixed++;
  }

  /**
   * Create .env file
   */
  async createEnvFile(projectPath) {
    const envContent = `# Environment Variables
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key-change-this"
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
`;

    await fs.writeFile(path.join(projectPath, ".env"), envContent, "utf8");
    this.stats.configsFixed++;
  }

  /**
   * Add environment variable
   */
  async addEnvVar(projectPath, varName) {
    const envPath = path.join(projectPath, ".env");
    const defaultValues = {
      DATABASE_URL: "postgresql://user:password@localhost:5432/dbname",
      JWT_SECRET: "your-secret-key-change-this",
      PORT: "4000",
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:3000",
    };

    const value = defaultValues[varName] || "";
    const line = `${varName}="${value}"\n`;

    await fs.appendFile(envPath, line, "utf8");
  }

  /**
   * Generate Prisma client
   */
  async generatePrismaClient(projectPath) {
    console.log("   Generating Prisma client...");
    execSync("npx prisma generate", { cwd: projectPath, stdio: "inherit" });
  }

  /**
   * Create Dockerfile
   */
  async createDockerfile(projectPath) {
    const dockerfileContent = `# Multi-stage build for Node.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built files and dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 4000

# Start application
CMD ["node", "dist/index.js"]
`;

    await fs.writeFile(
      path.join(projectPath, "Dockerfile"),
      dockerfileContent,
      "utf8"
    );

    this.stats.configsFixed++;
    console.log("   ✅ Created Dockerfile");
  }

  /**
   * Create docker-compose.yml
   */
  async createDockerCompose(projectPath) {
    const dockerComposeContent = `version: '3.8'

services:
  # Backend API
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: advancia-api
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/advancia
      - JWT_SECRET=\${JWT_SECRET}
      - FRONTEND_URL=\${FRONTEND_URL}
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - advancia-network

  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: advancia-db
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=advancia
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - advancia-network

  # Redis Cache (optional)
  redis:
    image: redis:7-alpine
    container_name: advancia-redis
    ports:
      - "6379:6379"
    restart: unless-stopped
    networks:
      - advancia-network

networks:
  advancia-network:
    driver: bridge

volumes:
  postgres_data:
`;

    await fs.writeFile(
      path.join(projectPath, "docker-compose.yml"),
      dockerComposeContent,
      "utf8"
    );

    this.stats.configsFixed++;
    console.log("   ✅ Created docker-compose.yml");
  }

  /**
   * Create .dockerignore file
   */
  async createDockerignore(projectPath) {
    const dockerignoreContent = `# Dependencies
node_modules
npm-debug.log
yarn-error.log
package-lock.json
yarn.lock

# Build output
dist
build
.next
out

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Testing
coverage
.nyc_output

# Logs
logs
*.log

# Temporary files
tmp
temp
*.tmp

# Documentation
README.md
CHANGELOG.md
docs/
`;

    await fs.writeFile(
      path.join(projectPath, ".dockerignore"),
      dockerignoreContent,
      "utf8"
    );

    this.stats.configsFixed++;
    console.log("   ✅ Created .dockerignore");
  }

  /**
   * Parse .env file
   */
  parseEnvFile(content) {
    const vars = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        vars[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }

    return vars;
  }

  /**
   * Validate version string
   */
  isValidVersion(version) {
    return /^\^?\d+\.\d+\.\d+$/.test(version);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      fixes: this.fixes,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { StackSolver };
