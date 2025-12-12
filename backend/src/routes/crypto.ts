import { Decimal } from "decimal.js";
import { Router } from "express";
import { Server } from "socket.io";
import Stripe from "stripe";
import { config } from "../config";
import { aiRateLimiter } from "../middleware/aiRateLimiter";
import { authenticateToken } from "../middleware/auth";
import prisma from "../prismaClient";
import { cryptoPriceService } from "../services/cryptoPriceService";

const router = Router();

let io: Server | null = null;
export const setCryptoSocketIO = (ioServer: Server) => {
  io = ioServer;
};

const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

// Get crypto prices (real-time from CoinGecko API)
router.get("/prices", authenticateToken as any, async (req: any, res) => {
  try {
    const symbols = ["BTC", "ETH", "USDT", "LTC", "BNB", "SOL"];
    const prices = await cryptoPriceService.getPrices(symbols);

    // Convert to simple price object
    const priceMap: { [key: string]: number } = {};
    for (const [symbol, data] of Object.entries(prices)) {
      priceMap[symbol] = data.usd;
    }

    // Fallback to mock prices if API fails
    if (Object.keys(priceMap).length === 0) {
      console.warn("CoinGecko API failed, using fallback prices");
      return res.json({
        BTC: 45000,
        ETH: 2500,
        USDT: 1,
        LTC: 100,
        BNB: 300,
        SOL: 100,
        source: "fallback",
      });
    }

    return res.json({ ...priceMap, source: "coingecko" });
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return res.status(500).json({ error: "Failed to fetch prices" });
  }
});

// Get detailed market data for a specific crypto
router.get("/market/:symbol", authenticateToken as any, async (req: any, res) => {
  try {
    const { symbol } = req.params;
    const marketData = await cryptoPriceService.getMarketData(symbol);

    if (!marketData) {
      return res.status(404).json({ error: "Cryptocurrency not found" });
    }

    return res.json(marketData);
  } catch (error) {
    console.error("Error fetching market data:", error);
    return res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// POST /api/crypto/purchase - Create crypto purchase order
router.post("/purchase", authenticateToken as any, aiRateLimiter("crypto"), async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { cryptoType, usdAmount } = req.body;

    // Validate inputs
    if (!cryptoType || !["BTC", "ETH", "USDT", "TRUMP"].includes(cryptoType.toUpperCase())) {
      return res.status(400).json({
        error: "Invalid crypto type. Must be BTC, ETH, USDT, or TRUMP",
      });
    }

    const usd = parseFloat(usdAmount);
    if (isNaN(usd) || usd < 10) {
      return res.status(400).json({ error: "Minimum purchase amount is $10" });
    }

    // Get user balance
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { usdBalance: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userBalance = parseFloat(user.usdBalance.toString());
    if (userBalance < usd) {
      return res.status(400).json({ error: "Insufficient USD balance" });
    }

    // Get real-time crypto price
    const priceData = await cryptoPriceService.getPrice(cryptoType);

    if (!priceData) {
      return res.status(400).json({
        error: `Unable to fetch price for ${cryptoType}. Please try again.`,
      });
    }

    const exchangeRate = priceData.usd;
    const processingFee = usd * 0.025; // 2.5% fee
    const totalUsd = usd + processingFee;
    const cryptoAmount = usd / exchangeRate;

    // Get admin address from settings (or use default)
    // Note: cryptoAdminAddress field doesn't exist in schema, using fallback
    const adminAddress = "0x0000000000000000000000000000000000000000";

    // Create crypto order
    const order = await prisma.crypto_orders.create({
      data: {
        id: (await import("crypto")).randomUUID(),
        userId,
        cryptoType: cryptoType.toUpperCase(),
        usdAmount: new Decimal(usd),
        cryptoAmount: new Decimal(cryptoAmount),
        exchangeRate: new Decimal(exchangeRate),
        processingFee: new Decimal(processingFee),
        totalUsd: new Decimal(totalUsd),
        status: "PENDING",
        adminAddress,
        updatedAt: new Date(),
      },
    });

    // Deduct USD from user balance
    await prisma.users.update({
      where: { id: userId },
      data: {
        usdBalance: {
          decrement: totalUsd,
        },
      },
    });

    // Create transaction record
    await prisma.transactions.create({
      data: {
        id: (await import("crypto")).randomUUID(),
        userId,
        type: "debit",
        amount: new Decimal(totalUsd),
        description: `Crypto purchase: ${cryptoAmount} ${cryptoType.toUpperCase()}`,
        category: "crypto_purchase",
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });

    // Emit socket event
    if (io) {
      io.to(`user-${userId}`).emit("crypto-order-created", {
        orderId: order.id,
        cryptoType: order.cryptoType,
        cryptoAmount: order.cryptoAmount.toString(),
      });
    }

    return res.json({
      success: true,
      order: {
        id: order.id,
        cryptoType: order.cryptoType,
        cryptoAmount: order.cryptoAmount.toString(),
        usdAmount: order.usdAmount.toString(),
        exchangeRate: order.exchangeRate.toString(),
        processingFee: order.processingFee.toString(),
        totalUsd: order.totalUsd.toString(),
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Crypto purchase error:", error);
    return res.status(500).json({ error: error.message || "Failed to create crypto order" });
  }
});

// GET /api/crypto/orders - Get user's crypto orders
router.get("/orders", authenticateToken as any, aiRateLimiter("crypto"), async (req: any, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orders = await prisma.crypto_orders.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return res.json({
      orders: orders.map((o) => ({
        id: o.id,
        cryptoType: o.cryptoType,
        cryptoAmount: o.cryptoAmount.toString(),
        usdAmount: o.usdAmount.toString(),
        exchangeRate: o.exchangeRate.toString(),
        processingFee: o.processingFee.toString(),
        totalUsd: o.totalUsd.toString(),
        status: o.status,
        txHash: o.txHash,
        createdAt: o.createdAt,
        completedAt: o.completedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching crypto orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
