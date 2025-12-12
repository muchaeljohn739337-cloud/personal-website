import request from "supertest";
import app from "./test-app";
import { seedTestDatabase, cleanTestDatabase } from "./seed-test-db";
import prisma from "../src/prismaClient";
import bcrypt from "bcryptjs";

// Mock Prisma client to avoid real database calls during tests
jest.mock("../src/prismaClient", () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock bcrypt for password hashing
jest.mock("bcryptjs");

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("successfully registers a new user (pending approval)", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        passwordHash: "hashed-password",
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");

      const response = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", "dev-api-key-123")
        .send({
          email: "test@example.com",
          password: "SecurePassword123!",
          username: "testuser",
          firstName: "Test",
          lastName: "User",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Registration submitted. Awaiting admin approval."
      );
      expect(response.body).toHaveProperty("status", "pending_approval");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        username: "testuser",
      });
    });

    it("rejects registration with missing email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", "dev-api-key-123")
        .send({
          password: "SecurePassword123!",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("rejects registration with weak password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", "dev-api-key-123")
        .send({
          email: "test@example.com",
          password: "weak",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("at least 6 characters");
    });

    it("rejects duplicate user registration", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: "existing-user",
        email: "test@example.com",
      });

      const response = await request(app)
        .post("/api/auth/register")
        .set("x-api-key", "dev-api-key-123")
        .send({
          email: "test@example.com",
          password: "SecurePassword123!",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    it("successfully logs in with valid credentials", async () => {
      const mockUser = {
        id: "test-user-id",
        email: "test@example.com",
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        passwordHash: "hashed-password",
        usdBalance: "100.00",
        active: true,
        emailVerified: true,
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", "dev-api-key-123")
        .send({
          email: "test@example.com",
          password: "SecurePassword123!",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Login successful");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        email: "test@example.com",
        username: "testuser",
      });
    });

    it("rejects login with invalid credentials", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: "test-user-id",
        passwordHash: "hashed-password",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", "dev-api-key-123")
        .send({
          email: "test@example.com",
          password: "WrongPassword!",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain("Invalid credentials");
    });

    it("rejects login for non-existent user", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", "dev-api-key-123")
        .send({
          email: "nonexistent@example.com",
          password: "SecurePassword123!",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain("Invalid credentials");
    });

    it("rejects login without credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("x-api-key", "dev-api-key-123")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });
});
