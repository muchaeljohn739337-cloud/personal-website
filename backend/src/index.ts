import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import path from "path";
import { Server as SocketIOServer } from "socket.io";
import agentRoutes from "./agents/routes";
import { getAgentScheduler } from "./agents/scheduler";
import { autoRemember } from "./ai/autoRemember";
import { initializeMultiBrainAgent, multiBrainAgent } from "./ai/prisma/multiBrainAgent";
import { initializePrismaSolver } from "./ai/prisma/prismaSolverCore";
import { recordCleanupAI } from "./ai/recordCleanupAI";
import { surveillanceAI } from "./ai/surveillanceAI";
import app from "./app";
import { config } from "./config";
import { activityLogger } from "./middleware/activityLogger";
import { cloudflareMiddleware } from "./middleware/cloudflare";
import { applySecurityMiddleware, forceHTTPS } from "./middleware/httpsEnforcement";
import { initializeIPTables, ipFilterMiddleware } from "./middleware/ipFilter";
import { checkIPRoute, ipWhitelistMiddleware } from "./middleware/ipWhitelist";
import {
  initializeSecretProtection,
  protectConsoleLogs,
  secretProtectionMiddleware,
} from "./middleware/secretProtection";
import { rateLimit, validateInput } from "./middleware/security";
import { requireTailscaleAccess } from "./middleware/tailscale";
import { requireTailscale } from "./middleware/tailscaleAuth";
import prisma from "./prismaClient";
import adminRouter from "./routes/admin";
import adminLedgerRouter, { setAdminLedgerSocketIO } from "./routes/admin-ledger";
import adminAIRouter from "./routes/adminAI";
import adminDoctorsRouter from "./routes/adminDoctors";
import adminSecurityRouter from "./routes/adminSecurity";
import adminSecurityManagementRouter from "./routes/adminSecurityManagement";
import aiAnalyticsRouter from "./routes/aiAnalytics";
import aiSolverRouter from "./routes/aiSolver";
import aiTrainingRouter from "./routes/aiTraining";
import analyticsRouter from "./routes/analytics";
import authRouter from "./routes/auth";
import authAdminRouter, { activeSessions, setBroadcastSessions as setAuthBroadcast } from "./routes/authAdmin";
import botCheckRouter from "./routes/botCheck";
import chatRouter, { setChatSocketIO } from "./routes/chat";
import momAIRouter from "./routes/mom-ai";
import sandboxRouter from "./routes/sandbox";
import securityAdminRouter from "./routes/security-admin";
import siemRouter from "./routes/siem";
import tailscaleAdminRouter from "./routes/tailscale-admin";
import totpRouter from "./routes/totp";
import web3AuthRouter from "./routes/web3-auth";
import { activateShield, initializeShield } from "./security/comprehensive-shield";
import { sandboxRunner } from "./services/SandboxRunner";
// AI system imports for initialization
import { aiCore } from "./ai-core";
import { copilotService } from "./ai/copilot/CopilotService";
import { connectMongoDB } from "./mongoClient";
import aiGeneratorRouter, { setAIGeneratorSocketIO } from "./routes/ai-generator";
import aiWorkflowsRouter from "./routes/ai-workflows";
import aiWorkersRouter, { setAIWorkersSocketIO } from "./routes/aiWorkers";
import blogRouter from "./routes/blog";
import consultationRouter from "./routes/consultation";
import copilotRouter, { setCopilotSocketIO } from "./routes/copilot";
import cryptoRouter, { setCryptoSocketIO } from "./routes/crypto";
import debitCardRouter, { setDebitCardSocketIO } from "./routes/debitCard";
import deploymentRouter from "./routes/deployment";
import exchangeRouter from "./routes/exchange";
import filesRouter from "./routes/files";
import googleAuthRouter from "./routes/google-auth";
import governanceRouter from "./routes/governance";
import healthRouter from "./routes/health";
import healthReadingsRouter from "./routes/health-readings";
import internalRouter from "./routes/internal";
import ipBlocksRouter from "./routes/ipBlocks";
import jobsRouter from "./routes/jobs";
import markdownFixerRouter from "./routes/markdownFixer";
import marketingRouter from "./routes/marketing";
import medbedsRouter, { setMedbedsSocketIO } from "./routes/medbeds";
import oalRouter, { setOALSocketIO } from "./routes/oal";
import paymentsRouter, { handleStripeWebhook, setPaymentsSocketIO } from "./routes/payments";
import projectRouter from "./routes/project";
import rewardsRouter, { setRewardSocketIO } from "./routes/rewards";
import rpaRouter, { setRPASocketIO } from "./routes/rpa";
import securityLevelRouter from "./routes/securityLevel";
import seoRouter from "./routes/seo";
import sessionsRouter, { setBroadcastSessions as setSessionsBroadcast } from "./routes/sessions";
import socialMediaRouter from "./routes/socialMedia";
import subscribersRouter from "./routes/subscribers";
import supportRouter, { setSupportSocketIO } from "./routes/support";
import systemRouter from "./routes/system";
import tokensRouter, { setTokenSocketIO } from "./routes/tokens";
import transactionsRouter, { setTransactionSocketIO } from "./routes/transactions";
import adminUsersRouter, { setAdminUsersSocketIO } from "./routes/users";
import vaultRouter, { setVaultSocketIO } from "./routes/vault";
import withdrawalsRouter, { setWithdrawalSocketIO } from "./routes/withdrawals";
import { jobService } from "./services/JobService";
import { setSocketIO as setNotificationSocket } from "./services/notificationService";
import { initSentry } from "./utils/sentry";
// import { registerAllWorkers } from "./workers"; // Temporarily disabled - TS compilation errors
// Load environment variables
dotenv.config();

// Initialize Sentry for error tracking and monitoring
initSentry();

// 🔒 SECURITY: Initialize secret protection system (MUST be early)
initializeSecretProtection();
protectConsoleLogs();

console.log("🛡️  150% Security Mode: Secret auto-correction enabled");

// Create HTTP server and attach Socket.IO
// Create server
const server = http.createServer(app);

// Trust proxy (needed when behind Cloudflare/NGINX for correct IPs and HTTPS)
app.set("trust proxy", 1);

// Cloudflare integration - MUST be first to properly extract real IPs
app.use(cloudflareMiddleware);

// 🔒 SECURITY: IP-based access control (blacklist enforcement)
app.use(ipFilterMiddleware);

// 🔒 SECURITY: Secret exposure prevention (auto-correction) - Disabled in development for testing
if (process.env.NODE_ENV !== "development") {
  app.use(secretProtectionMiddleware);
}

// SECURITY: Force HTTPS in production with HSTS and enhanced security headers
app.use(forceHTTPS);
app.use(applySecurityMiddleware);

// Configure CORS with allowed origins
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

// Stripe webhook MUST use raw body, so register it BEFORE express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

// JSON parser and common middlewares AFTER webhook
app.use(express.json());
app.use(validateInput);
app.use(activityLogger);

// 🛡️ SHIELD SECURITY SYSTEM - Multi-Layer Defense (MOM AI + DAD Admin Control)
// Disabled in development for testing
if (process.env.NODE_ENV !== "development") {
  app.use(activateShield());
}

app.use("/api", rateLimit({ windowMs: 60_000, maxRequests: 300 }));

// Health check endpoint (critical for production monitoring)
app.use("/api", healthRouter);

// IP check endpoint for debugging (shows real IP and whitelist status)
app.get("/api/check-ip", checkIPRoute);

// robots.txt - SEO & crawler control
app.get("/robots.txt", (req, res) => {
  const robotsTxt = `# Advancia Pay Ledger - Backend API
# https://advanciapay.com

User-agent: *

# Disallow all API endpoints from crawlers
Disallow: /api/
Disallow: /api/admin/
Disallow: /api/internal/
Disallow: /api/auth/
Disallow: /api/payments/
Disallow: /api/crypto/
Disallow: /api/vault/

# Allow health check for monitoring
Allow: /api/health

# Sitemap (served by frontend)
# Sitemap: https://advanciapay.com/sitemap.xml
`;
  res.type("text/plain").send(robotsTxt);
});

// Regular routes
app.use("/api/payments", paymentsRouter);
app.use("/api/crypto", cryptoRouter);
app.use("/api/debit-card", debitCardRouter);
app.use("/api/medbeds", medbedsRouter);
app.use("/api/support", supportRouter);
app.use("/api/admin/analytics", ipWhitelistMiddleware, analyticsRouter);
app.use("/api/ai-analytics", aiAnalyticsRouter);
app.use("/api/auth", authRouter);
app.use("/api/auth/totp", totpRouter); // TOTP/2FA Management
app.use("/api/auth/web3", web3AuthRouter); // Web3 Wallet Authentication (SIWE)
app.use("/api/auth/google", googleAuthRouter); // Google OAuth Authentication
app.use("/api/admin", ipWhitelistMiddleware, adminUsersRouter);
app.use("/api/admin", ipWhitelistMiddleware, adminRouter);
app.use("/api/admin/security", ipWhitelistMiddleware, adminSecurityRouter); // AI & Security Monitoring
app.use("/api/admin/shield", requireTailscale, securityAdminRouter); // SHIELD Security System Dashboard (Tailscale-protected)
app.use("/api/mom", momAIRouter); // Mom AI Core - Autonomous incident handling
app.use("/api/sandbox", sandboxRouter); // Sandbox Testing Environment
app.use("/api/siem", siemRouter); // SIEM Analytics & Threat Intelligence
app.use("/api/tailscale", tailscaleAdminRouter); // Tailscale VPN Admin Routes
app.use("/api/dad", requireTailscaleAccess, require("./routes/dad-console").default); // Dad Admin Console - Approval workflows & oversight (Tailscale VPN required)
app.use("/api/admin/security-management", ipWhitelistMiddleware, adminSecurityManagementRouter); // IP Whitelist/Blacklist & Secret Management
app.use("/api/admin/ai", ipWhitelistMiddleware, adminAIRouter); // AI System Monitoring & Management
app.use("/api/markdown-fixer", markdownFixerRouter); // AI-Powered Markdown Auto-Fixer
app.use("/api/ai-solver", aiSolverRouter); // Prisma AI Solver & Multi-Brain Agent
app.use("/api/ai-gateway", require("./routes/ai-gateway").default); // Unified AI Gateway - Claude, GPT, DeepSeek, Gemini, Llama, Cohere, Cloudflare
app.use("/api/transactions", transactionsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/consultation", consultationRouter);
app.use("/api/admin/doctors", adminDoctorsRouter);
app.use("/api/system", systemRouter);
app.use("/api/marketing", marketingRouter);
app.use("/api/subscribers", subscribersRouter);
app.use("/api/bot-check", botCheckRouter);
app.use("/api/ai-training", aiTrainingRouter);
app.use("/api/admin/security", securityLevelRouter);
app.use("/api/admin/ip-blocks", ipBlocksRouter);
app.use("/api/auth/admin", authAdminRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/oal", oalRouter);
app.use("/api/tokens", tokensRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/health-readings", healthReadingsRouter);
app.use("/api/rpa", rpaRouter);
app.use("/api/agents", agentRoutes);
app.use("/api/internal", internalRouter);
app.use("/api/files", filesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/governance", governanceRouter);
app.use("/api/ai-workers", aiWorkersRouter); // AI Worker Management System
app.use("/api/deployment", deploymentRouter); // AI Deployment Agent - Manual Trigger & Status
app.use("/api/vault", vaultRouter); // HashiCorp Vault Integration - Admin Secret Management
app.use("/api/copilot", copilotRouter); // AI Copilot - LLM-Powered Code Generation & Task Automation
app.use("/api/ai-generator", aiGeneratorRouter); // AI Generator - Text/Code/Image Generation with Multi-Model Support
app.use("/api/ai-workflows", aiWorkflowsRouter); // AI Core - Half Brain Cell Workflows & Task Automation
app.use("/api/blog", blogRouter); // Blog & CMS System with AI Content Generation
app.use("/api/seo", seoRouter); // SEO Automation & Sitemap Generation
app.use("/api/social-media", socialMediaRouter); // Multi-Channel Auto-Posting (Twitter, LinkedIn, Facebook)
app.use("/api/projects", projectRouter); // Project Management (Projects, Tasks, Sprints, Kanban)
app.use("/api/exchange", exchangeRouter);
app.use("/api/crypto/deposits", cryptoDepositsRouter); // Crypto Deposits - User-Facing API
app.use("/api/crypto/withdrawals", cryptoWithdrawalsRouter); // Crypto Withdrawals - User-Facing API
app.use("/api/crypto/admin", ipWhitelistMiddleware, cryptoAdminRouter); // Crypto Admin - Dad Console Approval
app.use("/api/admin/ledger", ipWhitelistMiddleware, adminLedgerRouter); // Admin Financial Ledger - Deductions, Credits, Adjustments

// Serve admin dashboard static files (must be after all API routes)
const publicPath = path.join(__dirname, "../../public");
app.use(express.static(publicPath));

// Catch-all route for SPA - serve index.html for any non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

const io = new SocketIOServer(server, {
  cors: {
    origin: config.allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection handling
// JWT auth for Socket.IO handshake
io.use(async (socket, next) => {
  try {
    const token = (socket.handshake.auth?.token as string) || (socket.handshake.query?.token as string);
    const guestSessionId =
      (socket.handshake.auth?.guestSessionId as string) || (socket.handshake.query?.guestSessionId as string);
    if (!token) {
      // Allow unauthenticated chat listeners for guest chat sessions
      if (guestSessionId && typeof guestSessionId === "string" && guestSessionId.length >= 6) {
        (socket as any).data = { guestSessionId };
        return next();
      }
      return next(new Error("Auth token or guestSessionId required"));
    }
    const cleaned = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const payload = jwt.verify(cleaned, config.jwtSecret) as {
      userId: string;
      email?: string;
    };
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, active: true },
    });
    if (!user || user.active === false) return next(new Error("Account disabled"));
    (socket as any).data = { userId: user.id, role: user.role };
    next();
  } catch (e) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const { userId, role, guestSessionId } = (socket as any).data || {};
  if (userId) socket.join(`user-${userId}`);
  if (role === "ADMIN") socket.join("admins");
  if (guestSessionId) socket.join(`chat-session-${guestSessionId}`);

  // Optional: clients may request to join again with validation
  socket.on("join-room", (reqUserId: string) => {
    if (reqUserId && reqUserId === userId) socket.join(`user-${userId}`);
  });

  // Broadcast session updates to admins
  socket.emit("sessions:update", activeSessions);
});

// Broadcast sessions update helper
export function broadcastSessions() {
  io.to("admins").emit("sessions:update", activeSessions);
}

// Inject Socket.IO into services/routers that need it
setNotificationSocket(io);
setTransactionSocketIO(io);
setAdminUsersSocketIO(io);
setDebitCardSocketIO(io);
setMedbedsSocketIO(io);
setCryptoSocketIO(io);
setCryptoDepositsSocketIO(io);
setCryptoWithdrawalsSocketIO(io);
setAdminLedgerSocketIO(io);
setRewardSocketIO(io);
setChatSocketIO(io);
setSupportSocketIO(io);
setPaymentsSocketIO(io);
setWithdrawalSocketIO(io);
setOALSocketIO(io);
setTokenSocketIO(io);
setRPASocketIO(io);
setAIWorkersSocketIO(io); // AI Workers real-time monitoring
setVaultSocketIO(io); // Vault secret management real-time audit
setCopilotSocketIO(io); // AI Copilot real-time streaming
setAIGeneratorSocketIO(io); // AI Generator real-time generation events

// Initialize AI systems
surveillanceAI.initialize(io);
recordCleanupAI.scheduleAutomaticCleanup();

// Initialize agent scheduler
const agentScheduler = getAgentScheduler(prisma);
agentScheduler.initialize();
agentScheduler.setSocketIO(io);

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Wire up session broadcasting
setAuthBroadcast(broadcastSessions);
setSessionsBroadcast(broadcastSessions);

// 404 handler for undefined routes (before error handler)
app.use(notFoundHandler);

// Global error handler (MUST be last middleware)
app.use(errorHandler);

// Start server with error handling
const PORT = config.port || Number(process.env.PORT) || 5000;

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("✅ PostgreSQL database connection successful");

    // Connect to MongoDB (optional - for analytics & logging)
    const mongoDb = await connectMongoDB();
    if (mongoDb) {
      console.log("✅ MongoDB connected (analytics & caching enabled)");
    } else {
      console.log("⚠️  MongoDB not configured (optional features disabled)");
    }

    // Initialize Auto-Precision Core
    const { initializeAutoPrecision } = require("./ai/auto_precision_integration");
    await initializeAutoPrecision();

    // Initialize Governance AI
    const { initializeGovernanceAI } = require("./ai/governance_integration");
    await initializeGovernanceAI();

    // Register all AI workers with the registry
    const { registerAllWorkers } = require("./ai/aiWorkerRegistry");
    registerAllWorkers();
    console.log("✅ AI Worker Registry initialized with all workers");

    // Initialize AI Generator models
    const { initializeClients } = require("./ai-engine/models");
    await initializeClients();
    console.log("✅ AI Generator models initialized");

    // Initialize Social Media worker
    const { initializeSocialMediaWorker } = require("./services/socialMediaService");
    initializeSocialMediaWorker();
    console.log("✅ Social Media worker initialized");

    // Initialize AI Copilot
    copilotService.initialize().catch((err) => {
      console.error("⚠️  Failed to initialize Copilot:", err);
    });

    // Initialize AI Core - Half Brain Cell System
    if (process.env.AI_ENABLED !== "false") {
      try {
        await aiCore.initialize();
        console.log("✅ AI Core (Half Brain Cell) system initialized");
      } catch (err) {
        console.error("⚠️  Failed to initialize AI Core:", err);
      }
    }

    // 🔒 SECURITY: Initialize IP whitelist/blacklist tables
    try {
      await initializeIPTables();
      console.log("✅ IP access control system initialized");
    } catch (err) {
      console.error("⚠️  Failed to initialize IP tables:", err);
    }

    // Initialize Job Queue System (BullMQ + Redis)
    try {
      await jobService.initialize();
      // registerAllWorkers(); // Temporarily disabled - TS compilation errors
      console.log("✅ Job queue system initialized (Redis + BullMQ)");
    } catch (err) {
      console.error("⚠️  Failed to initialize job queue system:", err);
      console.error("   Ensure Redis is running and environment variables are set");
    }

    // Start HTTP server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`   Environment: ${config.nodeEnv}`);
      console.log(`   Frontend URL: ${config.frontendUrl}`);
      console.log(`   🛡️  150% Security Mode: ACTIVE`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error("❌ Server error:", error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    console.error("   Check DATABASE_URL and ensure database is accessible");
    process.exit(1);
  }
}

startServer();

// Graceful shutdown for agents, Auto-Precision, Governance AI, and Surveillance AI
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: stopping services...");
  agentScheduler.stop();
  surveillanceAI.stop();

  const { shutdownAutoPrecision } = require("./ai/auto_precision_integration");
  await shutdownAutoPrecision();

  const { shutdownGovernanceAI } = require("./ai/governance_integration");
  await shutdownGovernanceAI();

  // Shutdown job queue system
  await jobService.shutdown();

  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: stopping services...");
  agentScheduler.stop();
  surveillanceAI.stop();

  const { shutdownAutoPrecision } = require("./ai/auto_precision_integration");
  await shutdownAutoPrecision();

  const { shutdownGovernanceAI } = require("./ai/governance_integration");
  await shutdownGovernanceAI();

  // Shutdown job queue system
  await jobService.shutdown();

  // Shutdown Prisma AI Solver and Multi-Brain Agent
  await multiBrainAgent.shutdown();
  await autoRemember.disconnect();

  // Shutdown AI Core system
  if (aiCore.isInitialized()) {
    await aiCore.shutdown();
  }

  process.exit(0);
});

// Initialize SHIELD security system with moderation
initializeShield().catch(console.error);

// Initialize Sandbox Runner
sandboxRunner.initialize().catch((error) => {
  console.warn("⚠️  Sandbox Runner initialization failed (Docker may not be available):", error.message);
});

// Initialize Mom AI Core
import { momAICore } from "./ai/mom-core";
momAICore.initialize().catch(console.error);

// Initialize Prisma AI Solver and Multi-Brain Agent
initializePrismaSolver().catch(console.error);
initializeMultiBrainAgent().catch(console.error);
