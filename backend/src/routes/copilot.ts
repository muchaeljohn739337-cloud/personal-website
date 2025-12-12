/**
 * copilot.ts
 *
 * REST API endpoints for AI Copilot interactions.
 */

import express, { Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import { copilotService } from "../ai/copilot/CopilotService";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = express.Router();
let io: SocketServer | null = null;

export function setCopilotSocketIO(socketIO: SocketServer): void {
  io = socketIO;
  console.log("[CopilotRoutes] Socket.IO injected");
}

// POST /api/copilot/chat - Chat with Copilot
router.post(
  "/chat",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { message, sessionId } = req.body;
      const userId = req.user?.userId;

      if (!message || !userId) {
        return res.status(400).json({ error: "Message and userId required" });
      }

      const response = await copilotService.chat(userId, message, sessionId);

      if (io) {
        io.to(`user-${userId}`).emit("copilot:response", {
          response,
          sessionId,
        });
      }

      res.json({ response, sessionId: sessionId || "default" });
    } catch (error: any) {
      console.error("[CopilotRoutes] Chat error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/copilot/task - Generate and execute task
router.post(
  "/task",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { type, description } = req.body;
      const userId = req.user?.userId;

      if (!type || !description || !userId) {
        return res.status(400).json({ error: "Type and description required" });
      }

      const taskId = await copilotService.generateTask(type, description);

      if (io) {
        io.to(`user-${userId}`).emit("copilot:task-created", { taskId });
      }

      res.json({ taskId, message: "Task generated successfully" });
    } catch (error: any) {
      console.error("[CopilotRoutes] Task generation error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/copilot/task/:id - Get task status
router.get(
  "/task/:id",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const task = await copilotService.getTask(id);

      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      res.json(task);
    } catch (error: any) {
      console.error("[CopilotRoutes] Task retrieval error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/copilot/statistics - Admin statistics
router.get(
  "/statistics",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const stats = await copilotService.getStatistics();
      res.json(stats);
    } catch (error: any) {
      console.error("[CopilotRoutes] Statistics error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/copilot/history/:sessionId - Clear conversation history
router.delete(
  "/history/:sessionId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      copilotService.clearHistory(sessionId);
      res.json({ message: "History cleared" });
    } catch (error: any) {
      console.error("[CopilotRoutes] History clear error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
