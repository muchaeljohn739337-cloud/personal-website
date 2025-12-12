import { Router } from "express";
import { Server } from "socket.io";
import Stripe from "stripe";
import { config } from "../config";
import { aiRateLimiter } from "../middleware/aiRateLimiter";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";
import { emailService } from "../services/EmailService";

const router = Router();

let io: Server | null = null;
export const setPaymentsSocketIO = (ioServer: Server) => {
  io = ioServer;
};

const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;

// Quick health endpoint to verify Stripe wiring
router.get("/health", (req, res) => {
  return res.json({ stripeConfigured: Boolean(stripeClient) });
});

// Create a Checkout Session, requiring auth; attach userId to metadata server-side
router.post("/checkout-session", authenticateToken as any, aiRateLimiter("stripe"), async (req: any, res) => {
  if (!stripeClient) {
    return res.status(503).json({
      error: "Stripe is not configured. Please provide STRIPE_SECRET_KEY.",
    });
  }

  const { amount, currency = "usd", metadata } = req.body || {};
  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "A positive amount is required." });
  }

  try {
    const userId = req.user?.userId;
    const mergedMetadata = {
      ...(metadata ?? {}),
      ...(userId ? { userId } : {}),
    } as Record<string, string>;
    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: Math.round(Number(amount) * 100),
            product_data: { name: "Account Top-Up" },
          },
          quantity: 1,
        },
      ],
      metadata: mergedMetadata,
      success_url: `${config.frontendUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/payments/cancel`,
    });

    return res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error("Stripe checkout session error", error);
    return res.status(500).json({ error: "Unable to create checkout session." });
  }
});

// Retrieve a Checkout Session by id for the authenticated user
router.get("/session/:id", authenticateToken as any, async (req: any, res) => {
  if (!stripeClient) {
    return res.status(503).json({ error: "Stripe is not configured." });
  }
  const sessionId = req.params.id;
  if (!sessionId) return res.status(400).json({ error: "session id required" });

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    const metaUserId = (session.metadata?.userId as string) || undefined;
    if (metaUserId && metaUserId !== req.user?.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json({
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata || {},
    });
  } catch (err: any) {
    console.error("Error retrieving session", err?.message || err);
    return res.status(404).json({ error: "Session not found" });
  }
});

// Admin: List payments
router.get("/admin/payments", authenticateToken as any, requireAdmin as any, async (req: any, res) => {
  if (!stripeClient) return res.status(503).json({ error: "Stripe not configured" });

  try {
    const { limit = 10, starting_after } = req.query;

    const payments = await stripeClient.paymentIntents.list({
      limit: Number(limit),
      starting_after: starting_after as string,
    });

    return res.json(payments);
  } catch (error) {
    console.error("Admin payments list error", error);
    return res.status(500).json({ error: "Failed to list payments" });
  }
});

// User: Request refund (creates request for admin approval)
router.post("/refund-request", authenticateToken as any, aiRateLimiter("stripe"), async (req: any, res) => {
  try {
    const { paymentId, reason } = req.body;
    const userId = req.user?.userId;

    if (!paymentId || !reason) {
      return res.status(400).json({ error: "Payment ID and reason are required" });
    }

    // Verify payment belongs to user
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId,
        description: {
          contains: paymentId,
        },
        type: "credit",
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Check if refund already requested
    const existingRequest = await prisma.audit_logs.findFirst({
      where: {
        userId,
        action: "REFUND_REQUESTED",
        resourceId: paymentId,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Refund already requested for this payment" });
    }

    // Create refund request audit log
    await prisma.audit_logs.create({
      data: {
        action: "REFUND_REQUESTED",
        userId,
        resourceType: "PAYMENT",
        resourceId: paymentId,
        changes: JSON.stringify({
          amount: transaction.amount,
          reason,
          requestedAt: new Date().toISOString(),
        }),
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "Unknown",
      },
    });

    return res.json({
      success: true,
      message: "Refund request submitted. An admin will review your request.",
      requestId: paymentId,
    });
  } catch (error: any) {
    console.error("Refund request error", error);
    return res.status(500).json({
      error: "Failed to submit refund request",
      details: error.message,
    });
  }
});

// Admin: Refund payment
router.post("/admin/refund/:paymentId", authenticateToken as any, requireAdmin as any, async (req: any, res) => {
  if (!stripeClient) return res.status(503).json({ error: "Stripe not configured" });

  try {
    const { reason, amount: refundAmount } = req.body || {};
    const paymentId = req.params.paymentId;

    // Retrieve payment details first
    const payment = await stripeClient.paymentIntents.retrieve(paymentId);
    const userId = payment.metadata?.userId;

    if (!userId) {
      return res.status(400).json({ error: "No user associated with this payment" });
    }

    // Get user details for email notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true, usdBalance: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create refund (partial or full)
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentId,
    };

    if (refundAmount && refundAmount > 0) {
      refundParams.amount = Math.round(Number(refundAmount) * 100); // Convert to cents
    }

    if (reason) {
      refundParams.reason = reason as Stripe.RefundCreateParams.Reason;
    }

    const refund = await stripeClient.refunds.create(refundParams);
    const refundAmountUSD = Number(refund.amount) / 100;

    // Update user balance and create refund transaction
    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          usdBalance: {
            decrement: refundAmountUSD,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "debit",
          amount: refundAmountUSD.toString(),
          description: `Refund - ${reason || "Admin initiated"} - Payment ${payment.id}`,
          status: "COMPLETED",
          metadata: JSON.stringify({
            refundId: refund.id,
            originalPaymentId: paymentId,
            reason: reason || "No reason provided",
            adminId: req.user?.userId,
          }),
        },
      });

      // Log to audit
      await tx.audit_logs.create({
        data: {
          action: "PAYMENT_REFUNDED",
          userId: req.user?.userId,
          resourceType: "PAYMENT",
          resourceId: paymentId,
          changes: JSON.stringify({
            refundId: refund.id,
            amount: refundAmountUSD,
            reason,
          }),
          ipAddress: req.ip || "127.0.0.1",
          userAgent: req.headers["user-agent"] || "Unknown",
        },
      });
    });

    // Emit socket event
    if (io) {
      io.to(`user-${userId}`).emit("transaction-created", {
        type: "DEBIT",
        amount: refundAmountUSD,
        reason: "refund",
      });
    }

    // Send email notification
    try {
      await emailService.sendTransactionNotification(user.email, {
        name: user.username || "User",
        transactionType: "Refund",
        amount: refundAmountUSD.toFixed(2),
        currency: "USD",
        date: new Date().toLocaleString(),
        status: "success",
      });
    } catch (emailError) {
      console.error("Failed to send refund email:", emailError);
      // Don't fail the refund if email fails
    }

    return res.json({
      success: true,
      refund,
      message: `Refunded $${refundAmountUSD.toFixed(2)} to ${user.email}`,
    });
  } catch (error: any) {
    console.error("Admin refund error", error);
    return res.status(500).json({
      error: "Failed to process refund",
      details: error.message,
    });
  }
});

// Webhook handler (to be mounted before express.json in index.ts)
export const handleStripeWebhook = async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];

  if (!stripeClient || !config.stripeWebhookSecret) {
    console.warn("Stripe webhook received but Stripe is not fully configured");
    return res.status(400).send("Webhook Error");
  }

  try {
    const rawBody: Buffer = Buffer.isBuffer(req.body)
      ? (req.body as Buffer)
      : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));

    const event = stripeClient.webhooks.constructEvent(rawBody, sig as string, config.stripeWebhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("No userId in session metadata", session.id);
          return res.status(400).send("Missing userId in metadata");
        }

        const amount = Number(session.amount_total) / 100;

        // Get user details for email
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, username: true },
        });

        // Begin transaction
        await prisma.$transaction(async (tx: any) => {
          // Credit user's balance
          await tx.user.update({
            where: { id: userId },
            data: {
              usdBalance: {
                increment: amount,
              },
            },
          });

          // Record the transaction
          await tx.transaction.create({
            data: {
              userId,
              type: "credit",
              amount: amount.toString(),
              description: `Stripe payment - Session ${session.id}`,
              status: "COMPLETED",
              metadata: JSON.stringify({
                sessionId: session.id,
                paymentStatus: session.payment_status,
              }),
            },
          });

          // Log to audit
          await tx.audit_logs.create({
            data: {
              action: "PAYMENT_COMPLETED",
              userId,
              resourceType: "PAYMENT",
              resourceId: session.id,
              changes: JSON.stringify({ amount, currency: session.currency }),
              ipAddress: "127.0.0.1",
              userAgent: "Stripe Webhook",
            },
          });
        });

        // Emit socket events
        if (io) {
          io.to(`user-${userId}`).emit("transaction-created", {
            type: "CREDIT",
            amount,
          });
        }

        // Send email notification
        if (user) {
          try {
            await emailService.sendTransactionNotification(user.email, {
              name: user.username || "User",
              transactionType: "Payment",
              amount: amount.toFixed(2),
              currency: session.currency?.toUpperCase() || "USD",
              date: new Date().toLocaleString(),
              status: "success",
            });
          } catch (emailError) {
            console.error("Failed to send payment confirmation email:", emailError);
          }
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`✅ Payment succeeded: ${paymentIntent.id} - Amount: ${paymentIntent.amount / 100}`);
        break;
      }

      case "payment_intent.failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata?.userId;

        console.error(`❌ Payment failed: ${paymentIntent.id}`);

        if (userId) {
          // Log failed payment
          await prisma.audit_logs.create({
            data: {
              action: "PAYMENT_FAILED",
              userId,
              resourceType: "PAYMENT",
              resourceId: paymentIntent.id,
              changes: JSON.stringify({
                amount: paymentIntent.amount / 100,
                error: paymentIntent.last_payment_error?.message || "Unknown error",
              }),
              ipAddress: "127.0.0.1",
              userAgent: "Stripe Webhook",
            },
          });

          // Emit socket event
          if (io) {
            io.to(`user-${userId}`).emit("payment-failed", {
              paymentId: paymentIntent.id,
              error: paymentIntent.last_payment_error?.message,
            });
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const refunds = charge.refunds?.data || [];

        console.log(`🔄 Charge refunded: ${charge.id}`);

        for (const refund of refunds) {
          console.log(`  Refund ${refund.id}: ${refund.amount / 100} ${refund.currency}`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send("Webhook Error");
  }
};

export default router;
