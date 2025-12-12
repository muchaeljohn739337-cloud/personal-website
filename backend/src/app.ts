import express, { Request, Response } from "express";
import { securityHeaders } from "./middleware/security";
import cors from "cors";

// Initialize express app
const app = express();

// Global security headers first
app.use(securityHeaders);

// CORS is configured in index.ts where config is available (deferred)

// Register routes
// Route registration deferred to index.ts to ensure correct middleware order

// Health check route
app.get("/", (req: Request, res: Response) => res.send("Backend running ✅"));

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "advancia-backend",
    version: "1.0.0"
  });
});

export default app;