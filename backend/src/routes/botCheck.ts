import express from "express";
import { authenticateToken } from "../middleware/auth";
import { detectBot } from "../services/botDetection";
import { trackClick } from "../services/clickTracking";

const router = express.Router();

router.post("/verify", async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const result = await detectBot(req, userId);

    res.json({
      message: result.isBot ? "Possible bot detected" : "You are NOT a robot!",
      isRobot: result.isBot,
      confidence: result.confidence,
      riskScore: result.riskScore,
      method: result.method,
    });
  } catch (error: any) {
    console.error("[Bot Check] Error:", error);
    res.status(500).json({ error: "Failed to check bot status" });
  }
});

router.post("/track", authenticateToken as any, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const { eventName, metadata } = req.body;

    const result = await trackClick(
      req,
      eventName || "click",
      userId,
      metadata
    );

    res.json({
      success: true,
      clickId: result.clickId,
      isRobot: result.isRobot,
      confidence: result.confidence,
    });
  } catch (error: any) {
    console.error("[Click Track] Error:", error);
    res.status(500).json({ error: "Failed to track click" });
  }
});

export default router;
