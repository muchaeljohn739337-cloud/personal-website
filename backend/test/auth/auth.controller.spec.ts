/**
 * Auth Controller E2E Tests
 * Tests authentication endpoints: register, login, logout, token refresh
 */

import request from "supertest";
import prisma from "../../src/prismaClient";
import { getApp, resetDatabase } from "../setup";
import { createTestUser, randomEmail } from "../test-utils";

describe("Auth Controller (E2E)", () => {
  const app = getApp();

  beforeEach(async () => {
    await resetDatabase();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const userData = {
        email: randomEmail(),
        password: "Test123!@#",
        name: "Test User",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(201);

      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body).toHaveProperty("token");
    });

    it("should not register user with duplicate email", async () => {
      const userData = {
        email: randomEmail(),
        password: "Test123!@#",
        name: "Test User",
      };

      // First registration
      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Second registration with same email
      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should validate email format", async () => {
      const userData = {
        email: "invalid-email",
        password: "Test123!@#",
        name: "Test User",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should validate password strength", async () => {
      const userData = {
        email: randomEmail(),
        password: "weak",
        name: "Test User",
      };

      const response = await request(app).post("/api/auth/register").send(userData).expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser: any;
    const testPassword = "Test123!@#";

    beforeEach(async () => {
      const result = await createTestUser({ password: testPassword });
      testUser = result.user;
    });

    it("should login with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testUser.email);
    });

    it("should not login with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: testPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should not login with invalid password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should not login if email not verified", async () => {
      // Create unverified user
      const unverifiedUser = await createTestUser({
        email: randomEmail(),
        password: testPassword,
        emailVerified: false,
      });

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: unverifiedUser.user.email,
          password: testPassword,
        })
        .expect(403);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("verify");
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user info with valid token", async () => {
      const { user, token } = await createTestUser();

      const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);

      expect(response.body).toHaveProperty("id", user.id);
      expect(response.body).toHaveProperty("email", user.email);
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 401 without token", async () => {
      const response = await request(app).get("/api/auth/me").expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer invalid-token").expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const { token } = await createTestUser();

      const response = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`).expect(200);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should refresh token successfully", async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post("/api/auth/refresh-token")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body.token).not.toBe(token);
    });

    it("should not refresh with invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh-token")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /api/auth/request-password-reset", () => {
    it("should send password reset email", async () => {
      const { user } = await createTestUser();

      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: user.email })
        .expect(200);

      expect(response.body).toHaveProperty("message");

      // Verify reset token was created
      const updatedUser = await prisma.users.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser).toHaveProperty("resetPasswordToken");
      expect(updatedUser).toHaveProperty("resetPasswordExpires");
    });

    it("should handle non-existent email gracefully", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "nonexistent@example.com" })
        .expect(200);

      // Should not reveal if email exists
      expect(response.body).toHaveProperty("message");
    });
  });
});
