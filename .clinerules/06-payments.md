# Payment Integrations

## Brief Overview

Multi-provider payment system in `lib/payments/` for cards, subscriptions, and crypto.

## Available Providers

| Provider         | Use Case                | Key Functions                           |
| ---------------- | ----------------------- | --------------------------------------- |
| **Stripe**       | Cards, subscriptions    | `createOptimizedCheckoutSession()`      |
| **LemonSqueezy** | MoR for SaaS            | `createCheckout()`                      |
| **NowPayments**  | Crypto (BTC, ETH, etc.) | `createPayment()`                       |

## Adding Payment Flow

```typescript
// Always persist payment state in Prisma
import { prisma } from '@/lib/prismaClient';

// Stripe pattern
const session = await createOptimizedCheckoutSession({
  customerId,
  priceId,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
  organizationId,
});

// Crypto pattern
const payment = await createPayment({
  userId,
  priceAmount: 99.0,
  priceCurrency: 'usd',
  payCurrency: 'btc',
  orderId: `order_${Date.now()}`,
});
```

## Webhook Handlers

- Located in `app/api/webhooks/`
- Always verify signatures before processing
- Use environment variables for webhook secrets:
  - `STRIPE_WEBHOOK_SECRET`
  - `LEMONSQUEEZY_WEBHOOK_SECRET`
  - `NOWPAYMENTS_IPN_SECRET`

## Configuration Check

Use `getPaymentProviderConfig()` from `lib/env.ts` to verify which providers are enabled.
