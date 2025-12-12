import express from "express";
import cors from "cors";
import { securityHeaders } from "../src/middleware/security";
import { config } from "../src/config";
import authRouter from "../src/routes/auth";
import transactionsRouter from "../src/routes/transactions";
import tokensRouter from "../src/routes/tokens";
import rewardsRouter from "../src/routes/rewards";
import supportRouter from "../src/routes/support";
import systemRouter from "../src/routes/system";
import paymentsRouter from "../src/routes/payments";
import adminUsersRouter from "../src/routes/users";
import analyticsRouter from "../src/routes/analytics";
import aiAnalyticsRouter from "../src/routes/aiAnalytics";
import chatRouter from "../src/routes/chat";
import withdrawalsRouter from "../src/routes/withdrawals";
import healthRouter from "../src/routes/health";

// Create test app with routes
const app = express();

// Global security headers first
app.use(securityHeaders);

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "advancia-backend",
    version: "1.0.0",
  });
});

// Register all routes (matching production index.ts)
app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/support", supportRouter);
app.use("/api/system", systemRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminUsersRouter);
app.use("/api/admin/analytics", analyticsRouter);
app.use("/api/ai-analytics", aiAnalyticsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/withdrawals", withdrawalsRouter);

export default app;
