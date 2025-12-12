import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import prisma from "../prismaClient";

const router = express.Router();

// POST /api/exchange
router.post(
  "/",
  [
    body("fromCurrency").isString().notEmpty(),
    body("toCurrency").isString().notEmpty(),
    body("amount").isNumeric().isFloat({ gt: 0 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fromCurrency, toCurrency, amount } = req.body;

    try {
      // Simulate exchange rate retrieval (replace with actual logic)
      const exchangeRate = 1.2; // Example rate
      const exchangedAmount = amount * exchangeRate;

      // Log the exchange transaction (optional)
      const transaction = await prisma.exchangeTransaction.create({
        data: {
          fromCurrency,
          toCurrency,
          amount,
          exchangedAmount,
          exchangeRate,
        },
      });

      return res.status(200).json({
        success: true,
        exchangedAmount,
        exchangeRate,
        transaction_id: transaction.id,
      });
    } catch (error) {
      console.error("Error processing exchange:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
