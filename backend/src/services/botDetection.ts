import crypto from "crypto";
import { Decimal } from "decimal.js";
import { Request } from "express";
import * as fs from "fs";
import * as path from "path";
import prisma from "../prismaClient";

interface MLFeatures {
  userAgentLength: number;
  hasAcceptLanguage: boolean;
  hasAccept: boolean;
  hasReferer: boolean;
  ipReputation: number;
  clickVelocity: number;
  hasBotPattern: boolean;
  [key: string]: number | boolean;
}

let mlModel: any = null;
let modelLoaded = false;

async function loadMLModel() {
  if (modelLoaded && mlModel) return mlModel;

  try {
    const modelPath = path.join(__dirname, "../../models/bot_detection_model.json");
    if (fs.existsSync(modelPath)) {
      const modelData = fs.readFileSync(modelPath, "utf-8");
      mlModel = JSON.parse(modelData);
      modelLoaded = true;
      console.log("✅ ML Bot Detection Model loaded");
      return mlModel;
    }
  } catch (error) {
    console.warn("⚠️ ML model not found, using rule-based detection");
  }

  return null;
}

async function extractFeatures(req: Request, userId?: string): Promise<MLFeatures> {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

  const features: MLFeatures = {
    userAgentLength: userAgent.length,
    hasAcceptLanguage: !!req.headers["accept-language"],
    hasAccept: !!req.headers["accept"],
    hasReferer: !!req.headers["referer"],
    ipReputation: 0.5,
    clickVelocity: 0,
    hasBotPattern: false,
  };

  const recentBots = await prisma.bot_detections.count({
    where: {
      ipAddress,
      isBot: true,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  features.ipReputation = Math.min(recentBots / 10, 1.0);

  if (userId) {
    const recentClicks = await prisma.click_events.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });
    features.clickVelocity = recentClicks;
  }

  const botPatterns = ["bot", "crawler", "spider", "scraper", "headless"];
  const uaLower = userAgent.toLowerCase();
  features.hasBotPattern = botPatterns.some((p) => uaLower.includes(p));

  return features;
}

function predictWithML(features: MLFeatures, model: any): number {
  if (!model || !model.weights) {
    return 0.5;
  }

  let score = 0;
  const weights = model.weights || {};

  for (const [key, value] of Object.entries(features)) {
    if (typeof value === "number" && weights[key]) {
      score += value * weights[key];
    } else if (typeof value === "boolean" && weights[key]) {
      score += (value ? 1 : 0) * weights[key];
    }
  }

  const confidence = 1 / (1 + Math.exp(-score));
  return Math.max(0, Math.min(1, confidence));
}

async function ruleBasedDetection(
  req: Request,
  userId?: string
): Promise<{
  isBot: boolean;
  confidence: number;
  riskScore: number;
  signals: any;
}> {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

  const signals: any = {
    userAgentFlags: [],
    ipFlags: [],
    patternFlags: [],
  };

  let botScore = 0;
  let confidence = 0.5;

  const botPatterns = ["bot", "crawler", "spider", "scraper", "headless"];
  const uaLower = userAgent.toLowerCase();

  if (botPatterns.some((pattern) => uaLower.includes(pattern))) {
    botScore += 50;
    confidence = 0.95;
    signals.userAgentFlags.push("known_bot_pattern");
  }

  if (!req.headers["accept-language"]) {
    botScore += 10;
    signals.userAgentFlags.push("missing_accept_language");
  }

  if (!req.headers["accept"]) {
    botScore += 10;
    signals.userAgentFlags.push("missing_accept");
  }

  const recentBots = await prisma.bot_detections.count({
    where: {
      ipAddress,
      isBot: true,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (recentBots > 5) {
    botScore += 30;
    confidence = Math.max(confidence, 0.85);
    signals.ipFlags.push("repeated_bot_activity");
  }

  if (userId) {
    const recentClicks = await prisma.click_events.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentClicks > 20) {
      botScore += 20;
      signals.patternFlags.push("excessive_clicks");
    }
  }

  const isBot = botScore >= 50;
  const riskScore = Math.min(botScore, 100);

  return { isBot, confidence, riskScore, signals };
}

export async function detectBot(
  req: Request,
  userId?: string
): Promise<{
  isBot: boolean;
  confidence: number;
  riskScore: number;
  signals: any;
  method: string;
}> {
  const model = await loadMLModel();
  const features = await extractFeatures(req, userId);

  let result: {
    isBot: boolean;
    confidence: number;
    riskScore: number;
    signals: any;
    method: string;
  };

  if (model) {
    const mlConfidence = predictWithML(features, model);
    const isBot = mlConfidence > 0.7;
    const riskScore = mlConfidence * 100;

    result = {
      isBot,
      confidence: mlConfidence,
      riskScore,
      signals: { features, modelVersion: model.version },
      method: "ml",
    };
  } else {
    const ruleResult = await ruleBasedDetection(req, userId);
    result = {
      ...ruleResult,
      method: "rule-based",
    };
  }

  await prisma.bot_detections.create({
    data: {
      id: crypto.randomUUID(),
      userId: userId || null,
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "",
      isBot: result.isBot,
      confidence: new Decimal(result.confidence),
      riskScore: new Decimal(result.riskScore),
      signals: result.signals,
      action: result.isBot ? "flag" : "allow",
    },
  });

  await prisma.ai_training_data.create({
    data: {
      id: crypto.randomUUID(),
      userId: userId || null,
      ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      userAgent: req.headers["user-agent"] || "",
      features: features as any,
      label: result.isBot,
    },
  });

  return result;
}

export async function getBotRiskScore(userId: string): Promise<number> {
  const recent = await prisma.bot_detections.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return recent ? Number(recent.riskScore) : 0;
}
