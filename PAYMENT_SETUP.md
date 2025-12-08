# Payment Providers Setup Guide

Complete guide for configuring all payment providers in the SaaS platform.

## Quick Reference

### Required Environment Variables by Provider

| Provider         | Required Variables                                        | Webhook Secret                | Status         |
| ---------------- | --------------------------------------------------------- | ----------------------------- | -------------- |
| **Stripe**       | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `STRIPE_WEBHOOK_SECRET`       | ✅ Recommended |
| **PayPal**       | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`                | `PAYPAL_WEBHOOK_ID`           | ✅ Recommended |
| **LemonSqueezy** | `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`           | `LEMONSQUEEZY_WEBHOOK_SECRET` | ✅ Recommended |
| **NOWPayments**  | `NOWPAYMENTS_API_KEY`                                     | `NOWPAYMENTS_IPN_SECRET`      | ✅ Crypto      |
| **Alchemy Pay**  | `ALCHEMY_PAY_APP_ID`, `ALCHEMY_PAY_APP_SECRET`            | -                             | ✅ Crypto      |

---

## 🚀 Quick Start

1. **Add to `.env.local`:**

```bash
# Stripe (Card Payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LemonSqueezy
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

2. **Test Configuration:**

Visit `/admin/tests` in your admin dashboard to verify all payment providers are configured correctly.

---

## 📋 Detailed Setup Instructions

### 1. Stripe (Card Payments)

**Best for:** Credit/debit card payments, subscriptions

**Setup:**

1. Create account: https://stripe.com/
2. Get API keys: Dashboard > Developers > API keys
3. Set webhook endpoint: `/api/stripe/webhook`
4. Copy webhook signing secret

**Required Variables:**

```bash
STRIPE_SECRET_KEY=sk_test_...  # Secret key (test or live)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Publishable key (starts with pk_)
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret
```

**Test Webhook Locally:**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

### 2. LemonSqueezy

**Best for:** Merchant of Record, SaaS subscriptions (handles VAT/taxes)

**Setup:**

1. Create account: https://www.lemonsqueezy.com/
2. Get API key: Settings > API > Generate API key
3. Get Store ID: Settings > Stores > Copy Store ID
4. Create webhook: Settings > Webhooks > Add webhook
5. Set endpoint: `/api/payments/lemonsqueezy/webhook`

**Required Variables:**

```bash
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

**Benefits:**

- ✅ Handles VAT/tax automatically
- ✅ Global compliance
- ✅ Merchant of Record (you don't handle taxes)

---

### 4. NOWPayments (Crypto)

**Best for:** Cryptocurrency payments

**Setup:**

1. Create account: https://nowpayments.io/
2. Get API key: Dashboard > API Settings
3. Set IPN webhook: Dashboard > IPN Settings
4. Endpoint: `/api/payments/nowpayments/webhook`

**Required Variables:**

```bash
NOWPAYMENTS_API_KEY=your_api_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret
```

**Supported Cryptocurrencies:**

- Bitcoin (BTC)
- Ethereum (ETH)
- USDT, USDC
- BNB, SOL, XRP, DOGE, LTC, MATIC

---

### 5. Alchemy Pay (Crypto On-Ramp)

**Best for:** Fiat-to-crypto conversion, buying crypto with cards

**Setup:**

1. Create account: https://alchemypay.org/
2. Apply for merchant account
3. Get credentials: Dashboard > API Settings

**Required Variables:**

```bash
ALCHEMY_PAY_API_URL=https://openapi.alchemypay.org
ALCHEMY_PAY_APP_ID=your_app_id
ALCHEMY_PAY_APP_SECRET=your_app_secret
```

**Features:**

- ✅ Buy crypto with credit cards
- ✅ Multiple fiat currencies
- ✅ Multiple crypto networks

---

## ✅ Verification

### Check Configuration in Code

```typescript
import { getPaymentProviderConfig } from '@/lib/env';

const config = getPaymentProviderConfig();
console.log(config.stripe.enabled); // true/false
console.log(config.paypal.enabled); // true/false
// etc.
```

### Admin Dashboard Test

Visit `/admin/tests?action=full` to see:

- ✅ Which providers are configured
- ✅ Missing environment variables
- ✅ Webhook configuration status

### API Health Check

```bash
GET /api/admin/tests?action=health
```

Response includes payment provider status:

```json
{
  "paymentProviders": {
    "configured": {
      "stripe": true,
      "paypal": true,
      "lemonsqueezy": false,
      "nowpayments": false,
      "alchemypay": false
    }
  }
}
```

---

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different keys** for development and production
3. **Rotate secrets** regularly (every 90 days)
4. **Use strong secrets** (64+ characters for JWT)
5. **Limit webhook access** by IP whitelisting when possible
6. **Verify webhook signatures** (already implemented)
7. **Use environment-specific keys** (test vs live)

---

## 🧪 Testing

### Test Payment Flow

1. **Stripe:** Use test cards (4242 4242 4242 4242)
2. **LemonSqueezy:** Test mode available in dashboard
4. **Crypto:** Use testnets or small amounts

### Test Webhooks Locally

**Stripe:**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**LemonSqueezy:**

- Test webhook delivery in dashboard
- Check logs: `/api/admin/logs`

---

## 📝 Webhook Endpoints

All webhook endpoints are automatically protected with signature verification:

| Provider     | Endpoint                             | Method |
| ------------ | ------------------------------------ | ------ |
| Stripe       | `/api/stripe/webhook`                | POST   |
| LemonSqueezy | `/api/payments/lemonsqueezy/webhook` | POST   |
| NOWPayments  | `/api/payments/nowpayments/webhook`  | POST   |
| Alchemy Pay  | `/api/payments/alchemypay/webhook`   | POST   |

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Payment provider not working**

- ✅ Check environment variables are set
- ✅ Verify webhook endpoint is accessible
- ✅ Check webhook signature verification
- ✅ Review logs in `/api/admin/logs`

**Issue: Webhook not receiving events**

- ✅ Verify webhook URL is correct
- ✅ Check webhook secret matches
- ✅ Ensure endpoint is publicly accessible (use ngrok for local)
- ✅ Check firewall/security group settings

**Issue: "Provider not configured" error**

- ✅ Run admin tests: `/admin/tests?action=tests`
- ✅ Check missing variables in response
- ✅ See `ENV_SETUP.md` for complete list

---

## 📚 Additional Resources

- **Complete Environment Setup:** See `ENV_SETUP.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Local Development:** See `LOCAL_DEVELOPMENT.md`

---

## 🎯 Recommended Setup

For a production SaaS platform, we recommend:

1. **Stripe** - Primary payment method (credit cards)
3. **LemonSqueezy** - For Merchant of Record (if needed)
4. **NOWPayments** - For cryptocurrency payments (optional)
5. **Alchemy Pay** - For crypto on-ramp (optional)

**Minimum Required:**

- ✅ At least ONE payment provider configured
- ✅ Stripe is recommended as primary

---

## 💡 Next Steps

After setting up payment providers:

1. ✅ Test all payment flows
2. ✅ Verify webhooks are working
3. ✅ Set up admin dashboard monitoring
4. ✅ Configure production environment variables
5. ✅ Set up monitoring/alerting for payment failures

---

**Need Help?** Check the admin dashboard `/admin` for system health and configuration status.
