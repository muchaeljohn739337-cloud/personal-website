// Test setup file for Jest
// Jest globals are provided by @types/jest (added via tests/tsconfig.json)

import { PrismaClient } from "@prisma/client";

// Mock notification service before any imports that use it
jest.mock("../src/services/notificationService");

// Global test setup
beforeAll(async () => {
  console.log("🧪 Setting up test environment...");
});

afterAll(async () => {
  console.log("🧹 Cleaning up test environment...");
});

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/advancia_payledger?schema=public";
process.env.API_KEY = "dev-api-key-123";

// Global test utilities
global.console = {
  ...console,
  // Uncomment to suppress logs during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

export {};

// Export test utilities
export const testUtils = {
  createTestUser: () => ({
    email: "test@example.com",
    username: "testuser",
    password: "password123",
  }),

  createTestToken: () => "test-jwt-token",

  cleanDatabase: async (prisma: PrismaClient) => {
    // Add cleanup logic here when needed
    console.log("🗑️ Cleaning test database...");
  },
};
