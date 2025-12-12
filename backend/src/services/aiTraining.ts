import crypto from "crypto";
import { Decimal } from "decimal.js";
import * as fs from "fs";
import * as path from "path";
import prisma from "../prismaClient";

interface TrainingMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  samples: number;
}

export async function trainBotDetectionModel(
  adminId: string
): Promise<{ success: boolean; metrics: TrainingMetrics; modelId: string }> {
  try {
    const trainingData = await prisma.ai_training_data.findMany({
      where: {
        verifiedBy: { not: null },
      },
      take: 10000,
      orderBy: { createdAt: "desc" },
    });

    if (trainingData.length < 100) {
      throw new Error("Insufficient training data. Need at least 100 samples.");
    }

    const weights: Record<string, number> = {};
    let totalSamples = 0;
    let correctPredictions = 0;
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const sample of trainingData) {
      const features = sample.features as any;
      const label = sample.label ? 1 : 0;

      for (const [key, value] of Object.entries(features)) {
        if (typeof value === "number" || typeof value === "boolean") {
          const numValue = typeof value === "boolean" ? (value ? 1 : 0) : value;
          if (!weights[key]) weights[key] = 0;
          weights[key] += numValue * (label - 0.5) * 0.01;
        }
      }

      let prediction = 0;
      for (const [key, value] of Object.entries(features)) {
        if (weights[key]) {
          const numValue = typeof value === "boolean" ? (value ? 1 : 0) : (value as number);
          prediction += numValue * weights[key];
        }
      }
      const predictedLabel = prediction > 0 ? 1 : 0;

      if (predictedLabel === label) correctPredictions++;
      if (predictedLabel === 1 && label === 1) truePositives++;
      if (predictedLabel === 1 && label === 0) falsePositives++;
      if (predictedLabel === 0 && label === 1) falseNegatives++;

      totalSamples++;
    }

    for (const key in weights) {
      weights[key] = weights[key] / totalSamples;
    }

    const accuracy = correctPredictions / totalSamples;
    const precision = truePositives / (truePositives + falsePositives || 1);
    const recall = truePositives / (truePositives + falseNegatives || 1);
    const f1Score = (2 * precision * recall) / (precision + recall || 1);

    const metrics: TrainingMetrics = {
      accuracy,
      precision,
      recall,
      f1Score,
      samples: totalSamples,
    };

    const modelDir = path.join(__dirname, "../../models");
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }

    const modelData = {
      version: `v${Date.now()}`,
      weights,
      metrics,
      trainedAt: new Date().toISOString(),
      trainedBy: adminId,
    };

    const modelPath = path.join(modelDir, "bot_detection_model.json");
    fs.writeFileSync(modelPath, JSON.stringify(modelData, null, 2));

    const model = await prisma.ai_models.create({
      data: {
        id: crypto.randomUUID(),
        name: "Bot Detection Model",
        version: modelData.version,
        modelType: "bot_detection",
        accuracy: new Decimal(accuracy),
        precision: new Decimal(precision),
        recall: new Decimal(recall),
        f1Score: new Decimal(f1Score),
        trainingSamples: totalSamples,
        modelPath: modelPath,
        isActive: false,
        trainedBy: adminId,
        trainedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      metrics,
      modelId: model.id,
    };
  } catch (error: any) {
    console.error("[AI Training] Error:", error);
    throw error;
  }
}

export async function verifyTrainingData(dataId: string, label: boolean, adminId: string) {
  await prisma.ai_training_data.update({
    where: { id: dataId },
    data: {
      label,
      verifiedBy: adminId,
      verifiedAt: new Date(),
    },
  });
}

export async function getTrainingStats() {
  const total = await prisma.ai_training_data.count();
  const verified = await prisma.ai_training_data.count({
    where: { verifiedBy: { not: null } },
  });
  const bots = await prisma.ai_training_data.count({
    where: { label: true, verifiedBy: { not: null } },
  });
  const humans = await prisma.ai_training_data.count({
    where: { label: false, verifiedBy: { not: null } },
  });

  return {
    total,
    verified,
    bots,
    humans,
    verificationRate: total > 0 ? verified / total : 0,
  };
}
