/**
 * Test application configuration
 * Sets environment variables FIRST, then imports routes
 * This prevents JWT secret decryption errors during test runs
 */

// ⚠️ CRITICAL: Set environment variables BEFORE any imports
// The config module evaluates JWT_SECRET on import, so we must set it first
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-minimum-32-characters-long-for-security-compliance";
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
process.env.API_KEY = "dev-api-key-123";
process.env.FRONTEND_URL = "http://localhost:3000";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_mock_key";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_mock";

// Now safe to import modules that depend on config
import express from "express";
import cors from "cors";
import { securityHeaders, validateInput } from "./middleware/security";

// Import routers (these are safe now that JWT_SECRET is set)
import authRouter from "./routes/auth";
import adminUsersRouter from "./routes/users";
import transactionsRouter from "./routes/transactions";
import aiAnalyticsRouter from "./routes/aiAnalytics";
import supportRouter from "./routes/support";
import adminRouter from "./routes/admin";
import rewardsRouter from "./routes/rewards";
import tokensRouter from "./routes/tokens";
import notificationsRouter from "./routes/notifications";

// Create minimal test app
const testApp = express();

// Middleware stack
testApp.use(securityHeaders);
testApp.use(cors({ origin: "*", credentials: true }));
testApp.use(express.json());
testApp.use(validateInput);

// Health check (required by tests)
testApp.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "advancia-test",
    version: "1.0.0",
  });
});

// Mount routers needed by integration tests
testApp.use("/api/auth", authRouter);
testApp.use("/api/users", adminUsersRouter);
testApp.use("/api/transactions", transactionsRouter);
testApp.use("/api/ai-analytics", aiAnalyticsRouter);
testApp.use("/api/support", supportRouter);
testApp.use("/api/admin", adminRouter);
testApp.use("/api/rewards", rewardsRouter);
testApp.use("/api/tokens", tokensRouter);
testApp.use("/api/notifications", notificationsRouter);

// 404 handler for debugging
testApp.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Test route not found: ${req.method} ${req.path}`,
  });
});

export default testApp;
