/**
 * Test Utilities - Helper functions for creating test data and managing test environment
 */

import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Create a new Prisma client instance for testing
const prisma = new PrismaClient({
  log: process.env.DEBUG_PRISMA ? ["query", "info", "warn", "error"] : [],
});

export { prisma };

interface TestUserData {
  email?: string;
  name?: string;
  password?: string;
  role?: "user" | "admin" | "doctor";
  emailVerified?: boolean;
}

interface TestUserResult {
  user: any;
  token: string;
  password: string;
}

/**
 * Create a test user with authentication token
 */
export async function createTestUser(userData: TestUserData = {}): Promise<TestUserResult> {
  const password = userData.password || "Test123!@#";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.users.create({
    data: {
      email: userData.email || `test-${Date.now()}@example.com`,
      username: userData.email?.split("@")[0] || `testuser${Date.now()}`,
      passwordHash: hashedPassword,
      firstName: userData.name?.split(" ")[0] || "Test",
      lastName: userData.name?.split(" ")[1] || "User",
      role: userData.role?.toUpperCase() || "USER",
      emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1d" }
  );

  return {
    user,
    token,
    password,
  };
}

/**
 * Create a test admin user
 */
export async function createTestAdmin(): Promise<TestUserResult> {
  return createTestUser({ role: "admin", email: `admin-${Date.now()}@example.com` });
}

/**
 * Create a test token wallet
 */
export async function createTestWallet(userId: string, tokenType: string = "ADVANCIA", balance: number = 1000) {
  const wallet = await prisma.token_wallets.create({
    data: {
      userId,
      tokenType,
      balance: new Decimal(balance),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return wallet;
}

/**
 * Create a test withdrawal request
 */
export async function createTestWithdrawal(
  userId: string,
  amount: number = 0.1,
  cryptoType: string = "BTC",
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" = "PENDING"
) {
  const withdrawal = await prisma.crypto_withdrawals.create({
    data: {
      userId,
      cryptoAmount: new Decimal(amount),
      cryptoType,
      status,
      withdrawalAddress: `test-destination-${Date.now()}`,
      usdEquivalent: new Decimal(amount * 50000), // Mock conversion
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return withdrawal;
}

/**
 * Create a test transaction
 */
export async function createTestTransaction(
  userId: string,
  amount: number = 100,
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" = "DEPOSIT",
  status: "PENDING" | "COMPLETED" | "FAILED" = "COMPLETED"
) {
  const transaction = await prisma.transactions.create({
    data: {
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      amount: new Decimal(amount),
      type,
      status,
      description: `Test ${type}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return transaction;
}

/**
 * Create a test crypto order
 */
export async function createTestCryptoOrder(
  userId: string,
  cryptoType: string = "BTC",
  cryptoAmount: number = 0.1,
  usdAmount: number = 5000
) {
  const exchangeRate = new Decimal(usdAmount / cryptoAmount);
  const processingFee = new Decimal(usdAmount * 0.025); // 2.5% fee
  const totalUsd = new Decimal(usdAmount).plus(processingFee);

  const order = await prisma.crypto_orders.create({
    data: {
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      cryptoType,
      cryptoAmount: new Decimal(cryptoAmount),
      usdAmount: new Decimal(usdAmount),
      exchangeRate,
      processingFee,
      totalUsd,
      adminAddress: `admin-${cryptoType}-address`,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return order;
}

/**
 * Helper to make authenticated requests
 */
export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Clean up test user and related data
 */
export async function cleanupTestUser(userId: string) {
  // Delete in order to respect foreign key constraints
  await prisma.crypto_withdrawals.deleteMany({ where: { userId } });
  await prisma.crypto_orders.deleteMany({ where: { userId } });
  await prisma.transactions.deleteMany({ where: { userId } });
  await prisma.token_wallets.deleteMany({ where: { userId } });
  await prisma.users.delete({ where: { id: userId } });
}

/**
 * Wait for a specified time (useful for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random email
 */
export function randomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
}

/**
 * Generate random wallet address
 */
export function randomWalletAddress(currency: string = "BTC"): string {
  return `${currency}-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
}
