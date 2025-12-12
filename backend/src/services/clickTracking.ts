import crypto from "crypto";
import { Decimal } from "decimal.js";
import { Request } from "express";
import prisma from "../prismaClient";
import { detectBot } from "./botDetection";

export async function trackClick(
  req: Request,
  eventName: string,
  userId?: string,
  metadata?: any
) {
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

  const botResult = await detectBot(req, userId);

  const clickEvent = await prisma.click_events.create({
    data: {
      id: crypto.randomUUID(),
      userId: userId || null,
      eventName,
      ipAddress,
      userAgent,
      isRobot: botResult.isBot,
      confidence: botResult.confidence
        ? new Decimal(botResult.confidence)
        : null,
      metadata: metadata || {},
    },
  });

  return {
    clickId: clickEvent.id,
    isRobot: botResult.isBot,
    confidence: botResult.confidence,
    riskScore: botResult.riskScore,
  };
}
