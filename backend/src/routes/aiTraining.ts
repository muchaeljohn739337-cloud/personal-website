import express from "express";
import { requireAdmin } from "../middleware/adminAuth";
import prisma from "../prismaClient";
import { getTrainingStats, trainBotDetectionModel, verifyTrainingData } from "../services/aiTraining";

const router = express.Router();

router.get("/stats", requireAdmin as any, async (req, res) => {
  try {
    const stats = await getTrainingStats();
    res.json(stats);
  } catch (error: any) {
    console.error("[AI Training Stats] Error:", error);
    res.status(500).json({ error: "Failed to get training stats" });
  }
});

router.get("/data", requireAdmin as any, async (req, res) => {
  try {
    const { page = 1, limit = 50, verified } = req.query;

    const where: any = {};
    if (verified === "true") {
      where.verifiedBy = { not: null };
    } else if (verified === "false") {
      where.verifiedBy = null;
    }

    const data = await prisma.ai_training_data.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.ai_training_data.count({ where });

    res.json({
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error("[AI Training Data] Error:", error);
    res.status(500).json({ error: "Failed to get training data" });
  }
});

router.post("/verify/:id", requireAdmin as any, async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;
    const adminId = (req as any).user?.userId;

    if (typeof label !== "boolean") {
      return res.status(400).json({ error: "Label must be boolean" });
    }

    await verifyTrainingData(id, label, adminId);

    res.json({ success: true, message: "Training data verified" });
  } catch (error: any) {
    console.error("[AI Training Verify] Error:", error);
    res.status(500).json({ error: "Failed to verify training data" });
  }
});

router.post("/train", requireAdmin as any, async (req, res) => {
  try {
    const adminId = (req as any).user?.userId;
    const result = await trainBotDetectionModel(adminId);

    res.json({
      message: "Model trained successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("[AI Training] Error:", error);
    res.status(500).json({
      error: "Failed to train model",
      message: error.message,
    });
  }
});

router.get("/models", requireAdmin as any, async (req, res) => {
  try {
    const models = await prisma.ai_models.findMany({
      where: { modelType: "bot_detection" },
      orderBy: { createdAt: "desc" },
    });

    res.json(models);
  } catch (error: any) {
    console.error("[AI Models] Error:", error);
    res.status(500).json({ error: "Failed to get models" });
  }
});

router.post("/models/:id/activate", requireAdmin as any, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ai_models.updateMany({
      where: { modelType: "bot_detection" },
      data: { isActive: false },
    });

    await prisma.ai_models.update({
      where: { id },
      data: { isActive: true },
    });

    res.json({ success: true, message: "Model activated" });
  } catch (error: any) {
    console.error("[AI Model Activate] Error:", error);
    res.status(500).json({ error: "Failed to activate model" });
  }
});

export default router;
