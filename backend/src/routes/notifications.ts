/**
 * Notifications API Routes (Stub for testing)
 * TODO: Implement full notification system logic
 */

import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Get user notifications
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    // Stub: Return empty notifications array
    res.json([]);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.patch(
  "/:id/read",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Stub: Return success
      res.json({
        success: true,
        id,
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to update notification" });
    }
  }
);

export default router;
