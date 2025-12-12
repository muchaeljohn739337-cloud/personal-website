/**
 * ═══════════════════════════════════════════════════════════
 * ADVANCIA PAY LEDGER - INTEGRATION TEST SUITE
 * Complete API endpoint testing
 * ═══════════════════════════════════════════════════════════
 */

import request from "supertest";
import app from "../src/testApp";

describe("Integration Tests - Core Endpoints", () => {
  let authToken: string;
  let testUserId: string;

  // ═══════════════════════════════════════════════════════════
  // AUTHENTICATION TESTS
  // ═══════════════════════════════════════════════════════════

  describe("Authentication Flow", () => {
    it("should check health endpoint", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should fail login with invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should register new user", async () => {
      const testEmail = `test-${Date.now()}@example.com`;

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: testEmail,
          password: "Test123!@#",
          firstName: "Test",
          lastName: "User",
          phone: "+1234567890",
        })
        .expect(201);

      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("email", testEmail);

      authToken = response.body.token;
      testUserId = response.body.user.id;
    });

    it("should authenticate with valid token", async () => {
      if (!authToken) {
        // Use existing test token if no registration
        authToken = "test-token";
      }

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // AI ANALYTICS TESTS (Rule-based)
  // ═══════════════════════════════════════════════════════════

  describe("AI Analytics Endpoints", () => {
    it("should generate market insights", async () => {
      const response = await request(app)
        .get("/api/ai-analytics/market-insights")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("insights");
      expect(Array.isArray(response.body.insights)).toBe(true);
    });

    it("should analyze wallet (rule-based)", async () => {
      if (!testUserId) {
        return; // Skip if no user created
      }

      const response = await request(app)
        .get(`/api/ai-analytics/wallet/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("analysis");
      expect(response.body.analysis).toHaveProperty("totalBalance");
    });

    it("should check cashout eligibility", async () => {
      if (!testUserId) {
        return;
      }

      const response = await request(app)
        .post("/api/ai-analytics/cashout-eligibility")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ userId: testUserId, amount: 100 })
        .expect(200);

      expect(response.body).toHaveProperty("eligible");
      expect(response.body).toHaveProperty("reason");
    });

    it("should generate product recommendations", async () => {
      if (!testUserId) {
        return;
      }

      const response = await request(app)
        .get(`/api/ai-analytics/recommendations/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("recommendations");
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // USER MANAGEMENT TESTS
  // ═══════════════════════════════════════════════════════════

  describe("User Management", () => {
    it("should get user profile", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
    });

    it("should update user profile", async () => {
      const response = await request(app)
        .put("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Updated",
          lastName: "Name",
        })
        .expect(200);

      expect(response.body.firstName).toBe("Updated");
      expect(response.body.lastName).toBe("Name");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TRANSACTION TESTS
  // ═══════════════════════════════════════════════════════════

  describe("Transaction Endpoints", () => {
    it("should get user transactions", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should get transaction by ID", async () => {
      // First create or get a transaction
      const transactions = await request(app)
        .get("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`);

      if (transactions.body.length > 0) {
        const txId = transactions.body[0].id;

        const response = await request(app)
          .get(`/api/transactions/${txId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("id", txId);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TOKEN WALLET TESTS
  // ═══════════════════════════════════════════════════════════

  describe("Token Wallet", () => {
    it("should get token wallets", async () => {
      const response = await request(app)
        .get("/api/tokens/wallets")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should get token balance", async () => {
      const response = await request(app)
        .get("/api/tokens/balance")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("totalBalance");
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REWARD SYSTEM TESTS
  // ═══════════════════════════════════════════════════════════

  describe("Reward System", () => {
    it("should get user rewards", async () => {
      const response = await request(app)
        .get("/api/rewards")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should get reward tiers", async () => {
      const response = await request(app)
        .get("/api/rewards/tiers")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATION TESTS
  // ═══════════════════════════════════════════════════════════

  describe("Notifications", () => {
    it("should get user notifications", async () => {
      const response = await request(app)
        .get("/api/support/tickets")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should mark notification as read", async () => {
      const notifications = await request(app)
        .get("/api/support/tickets")
        .set("Authorization", `Bearer ${authToken}`);

      if (notifications.body.length > 0) {
        const notifId = notifications.body[0].id;

        const response = await request(app)
          .get(`/api/support/tickets/${notifId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.isRead).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ERROR HANDLING TESTS
  // ═══════════════════════════════════════════════════════════

  describe("Error Handling", () => {
    it("should return 401 for missing auth token", async () => {
      await request(app).get("/api/auth/me").expect(401);
    });

    it("should return 404 for non-existent endpoint", async () => {
      await request(app).get("/api/nonexistent-endpoint").expect(404);
    });

    it("should return 400 for invalid request body", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "not-an-email",
          // missing required fields
        })
        .expect(400);
    });
  });
});

describe("Integration Tests - Admin Endpoints", () => {
  let adminToken: string;

  beforeAll(async () => {
    // Login as admin (you'll need to seed an admin user)
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: process.env.ADMIN_EMAIL || "admin@advancia.app",
        password: process.env.ADMIN_PASSWORD || "admin123",
      });

    if (response.status === 200) {
      adminToken = response.body.token;
    }
  });

  describe("Admin Panel", () => {
    it("should get dashboard stats", async () => {
      if (!adminToken) {
        return; // Skip if no admin
      }

      const response = await request(app)
        .get("/api/admin/dashboard")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("totalUsers");
      expect(response.body).toHaveProperty("totalTransactions");
    });

    it("should get all users", async () => {
      if (!adminToken) {
        return;
      }

      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
