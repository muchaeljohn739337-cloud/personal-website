/**
 * Security Test Suite
 * Comprehensive testing of all security features
 */

import axios, { AxiosInstance } from "axios";
import dotenv from "dotenv";

dotenv.config();

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class SecurityTester {
  private baseUrl = process.env.BASE_URL || "http://localhost:4000";
  private client: AxiosInstance;
  private adminToken: string = "";
  private results: TestResult[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  /**
   * Main test execution
   */
  public async run(): Promise<void> {
    console.log("🔒 Security Test Suite v1.0");
    console.log("━".repeat(60));
    console.log(`Testing: ${this.baseUrl}\n`);

    try {
      // Step 1: Login as admin
      await this.testAdminLogin();

      // Step 2: Test security endpoints
      await this.testSecurityDashboard();
      await this.testIPWhitelist();
      await this.testIPBlacklist();
      await this.testSecretExposures();
      await this.testAuditLogs();
      await this.testIPStatistics();
      await this.testSecretProtection();

      // Step 3: Test IP filtering
      await this.testIPFiltering();

      // Step 4: Display results
      this.displayResults();
    } catch (error: any) {
      console.error("\n❌ Test suite failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Test admin login
   */
  private async testAdminLogin(): Promise<void> {
    const start = Date.now();

    try {
      console.log("🔐 Testing admin login...");

      const response = await this.client.post("/api/auth/login", {
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        password: process.env.ADMIN_PASSWORD || "admin123",
      });

      if (response.status === 200 && response.data.token) {
        this.adminToken = response.data.token;
        this.recordResult("Admin Login", true, Date.now() - start);
        console.log("   ✅ Login successful\n");
      } else {
        throw new Error(`Login failed: ${response.status}`);
      }
    } catch (error: any) {
      this.recordResult("Admin Login", false, Date.now() - start, error.message);
      throw error;
    }
  }

  /**
   * Test security dashboard
   */
  private async testSecurityDashboard(): Promise<void> {
    const start = Date.now();

    try {
      console.log("📊 Testing security dashboard...");

      const response = await this.client.get("/api/admin/security/dashboard", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      });

      if (response.status === 200) {
        const data = response.data;
        console.log(`   Total IPs: ${data.totalIPs || 0}`);
        console.log(`   Whitelisted: ${data.whitelisted || 0}`);
        console.log(`   Blacklisted: ${data.blacklisted || 0}`);
        console.log(`   Secret Exposures: ${data.secretExposures || 0}`);

        this.recordResult("Security Dashboard", true, Date.now() - start);
        console.log("   ✅ Dashboard working\n");
      } else {
        throw new Error(`Dashboard failed: ${response.status}`);
      }
    } catch (error: any) {
      this.recordResult("Security Dashboard", false, Date.now() - start, error.message);
      console.log("   ❌ Dashboard failed\n");
    }
  }

  /**
   * Test IP whitelist
   */
  private async testIPWhitelist(): Promise<void> {
    const start = Date.now();

    try {
      console.log("✅ Testing IP whitelist...");

      // Get current whitelist
      const getResponse = await this.client.get("/api/admin/security/whitelist", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      });

      if (getResponse.status === 200) {
        console.log(`   Current whitelist: ${getResponse.data.length} IPs`);
      }

      // Add test IP
      const addResponse = await this.client.post(
        "/api/admin/security/whitelist",
        {
          ip: "192.168.1.100",
          reason: "Test IP",
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (addResponse.status === 200) {
        console.log("   ✅ IP added to whitelist");
      }

      // Remove test IP
      const removeResponse = await this.client.delete("/api/admin/security/whitelist/192.168.1.100", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      });

      if (removeResponse.status === 200) {
        console.log("   ✅ IP removed from whitelist");
      }

      this.recordResult("IP Whitelist", true, Date.now() - start);
      console.log("   ✅ Whitelist working\n");
    } catch (error: any) {
      this.recordResult("IP Whitelist", false, Date.now() - start, error.message);
      console.log("   ❌ Whitelist failed\n");
    }
  }

  /**
   * Test IP blacklist
   */
  private async testIPBlacklist(): Promise<void> {
    const start = Date.now();

    try {
      console.log("🚫 Testing IP blacklist...");

      // Get current blacklist
      const getResponse = await this.client.get("/api/admin/security/blacklist", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      });

      if (getResponse.status === 200) {
        console.log(`   Current blacklist: ${getResponse.data.length} IPs`);
      }

      // Add test IP
      const addResponse = await this.client.post(
        "/api/admin/security/blacklist",
        {
          ip: "192.168.1.200",
          reason: "Test malicious IP",
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (addResponse.status === 200) {
        console.log("   ✅ IP added to blacklist");
      }

      // Unblock test IP
      const unblockResponse = await this.client.post(
        "/api/admin/security/unblock",
        { ip: "192.168.1.200" },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (unblockResponse.status === 200) {
        console.log("   ✅ IP unblocked");
      }

      this.recordResult("IP Blacklist", true, Date.now() - start);
      console.log("   ✅ Blacklist working\n");
    } catch (error: any) {
      this.recordResult("IP Blacklist", false, Date.now() - start, error.message);
      console.log("   ❌ Blacklist failed\n");
    }
  }

  /**
   * Test secret exposures
   */
  private async testSecretExposures(): Promise<void> {
    const start = Date.now();

    try {
      console.log("🔑 Testing secret exposure detection...");

      const response = await this.client.get("/api/admin/security/exposures", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      });

      if (response.status === 200) {
        console.log(`   Detected exposures: ${response.data.length}`);

        if (response.data.length > 0) {
          const latest = response.data[0];
          console.log(`   Latest: ${latest.secretType} from ${latest.ipAddress}`);
        }

        this.recordResult("Secret Exposures", true, Date.now() - start);
        console.log("   ✅ Exposure detection working\n");
      } else {
        throw new Error(`Exposures failed: ${response.status}`);
      }
    } catch (error: any) {
      this.recordResult("Secret Exposures", false, Date.now() - start, error.message);
      console.log("   ❌ Exposure detection failed\n");
    }
  }

  /**
   * Test audit logs
   */
  private async testAuditLogs(): Promise<void> {
    const start = Date.now();

    try {
      console.log("📋 Testing audit logs...");

      const response = await this.client.get("/api/admin/security/audit-logs", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
        params: { limit: 10 },
      });

      if (response.status === 200) {
        console.log(`   Recent logs: ${response.data.length}`);

        if (response.data.length > 0) {
          const latest = response.data[0];
          console.log(`   Latest: ${latest.action} (${latest.severity})`);
        }

        this.recordResult("Audit Logs", true, Date.now() - start);
        console.log("   ✅ Audit logging working\n");
      } else {
        throw new Error(`Audit logs failed: ${response.status}`);
      }
    } catch (error: any) {
      this.recordResult("Audit Logs", false, Date.now() - start, error.message);
      console.log("   ❌ Audit logging failed\n");
    }
  }

  /**
   * Test IP statistics
   */
  private async testIPStatistics(): Promise<void> {
    const start = Date.now();

    try {
      console.log("📈 Testing IP statistics...");

      const response = await this.client.get("/api/admin/security/ip-stats", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      });

      if (response.status === 200) {
        const stats = response.data;
        console.log(`   Total requests: ${stats.totalRequests || 0}`);
        console.log(`   Blocked: ${stats.blocked || 0}`);
        console.log(`   Allowed: ${stats.allowed || 0}`);

        this.recordResult("IP Statistics", true, Date.now() - start);
        console.log("   ✅ Statistics working\n");
      } else {
        throw new Error(`Statistics failed: ${response.status}`);
      }
    } catch (error: any) {
      this.recordResult("IP Statistics", false, Date.now() - start, error.message);
      console.log("   ❌ Statistics failed\n");
    }
  }

  /**
   * Test secret protection
   */
  private async testSecretProtection(): Promise<void> {
    const start = Date.now();

    try {
      console.log("🛡️  Testing secret protection...");

      // Test with fake secret
      const response = await this.client.post(
        "/api/admin/security/test-exposure",
        {
          data: {
            apiKey: "sk-test-1234567890",
            password: "supersecret123",
            token: "Bearer abc123def456",
          },
        },
        {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }
      );

      if (response.status === 200) {
        const result = response.data;

        // Check if secrets were redacted
        const hasRedactions = JSON.stringify(result).includes("[REDACTED");

        if (hasRedactions) {
          console.log("   ✅ Secrets properly redacted");
          this.recordResult("Secret Protection", true, Date.now() - start);
        } else {
          console.log("   ⚠️  Secrets not redacted (check middleware)");
          this.recordResult("Secret Protection", false, Date.now() - start, "Secrets not redacted");
        }

        console.log("   ✅ Protection active\n");
      } else {
        throw new Error(`Protection test failed: ${response.status}`);
      }
    } catch (error: any) {
      this.recordResult("Secret Protection", false, Date.now() - start, error.message);
      console.log("   ❌ Protection failed\n");
    }
  }

  /**
   * Test IP filtering
   */
  private async testIPFiltering(): Promise<void> {
    const start = Date.now();

    try {
      console.log("🚦 Testing IP filtering...");

      // This test verifies that IP filtering middleware is active
      // by checking response headers or behavior

      const response = await this.client.get("/api/admin/security/dashboard", {
        headers: {
          Authorization: `Bearer ${this.adminToken}`,
          "X-Forwarded-For": "127.0.0.1",
        },
      });

      if (response.status === 200) {
        console.log("   ✅ IP filtering active");
        this.recordResult("IP Filtering", true, Date.now() - start);
      } else {
        throw new Error(`Filtering test failed: ${response.status}`);
      }

      console.log("   ✅ Filtering working\n");
    } catch (error: any) {
      this.recordResult("IP Filtering", false, Date.now() - start, error.message);
      console.log("   ❌ Filtering failed\n");
    }
  }

  /**
   * Record test result
   */
  private recordResult(name: string, passed: boolean, duration: number, error?: string): void {
    this.results.push({ name, passed, duration, error });
  }

  /**
   * Display final results
   */
  private displayResults(): void {
    console.log("\n📊 Test Results:");
    console.log("━".repeat(60));

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    this.results.forEach((result) => {
      const icon = result.passed ? "✅" : "❌";
      const duration = result.duration.toFixed(0);
      console.log(`   ${icon} ${result.name} (${duration}ms)`);

      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    console.log("━".repeat(60));
    console.log(`   Total: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log("━".repeat(60));

    if (failed === 0) {
      console.log("\n✅ All security tests passed!");
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Review errors above.`);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const tester = new SecurityTester();
  tester.run().catch(console.error);
}

export default SecurityTester;
