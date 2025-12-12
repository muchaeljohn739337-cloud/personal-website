# 💳 Payment Gateway Integration Guide

**Last Updated:** December 5, 2025  
**Status:** Services Created - Ready for API Keys

---

## 📊 Payment Gateways Overview

Your platform now supports **3 payment gateways**:

| Gateway            | Purpose            | Status           | Documentation                                       |
| ------------------ | ------------------ | ---------------- | --------------------------------------------------- |
| **Stripe**         | Credit/Debit Cards | ✅ Integrated    | [Stripe Docs](https://stripe.com/docs)              |
| **Crypto.com Pay** | Crypto Payments    | ✅ Service Ready | [Crypto.com Pay Docs](https://pay-docs.crypto.com/) |
| **Alchemy Pay**    | Fiat ↔ Crypto      | ✅ Service Ready | [Alchemy Pay Docs](https://docs.alchemypay.org/)    |

---

## 🔧 1. Crypto.com Pay Integration

### What is Crypto.com Pay?

Crypto.com Pay allows merchants to accept cryptocurrency payments (BTC, ETH, USDT, etc.) with instant settlement.

### Features Implemented

- ✅ Payment creation
- ✅ Payment status tracking
- ✅ Webhook verification
- ✅ Exchange rate queries
- ✅ Supported currencies list

### Setup Instructions

#### Step 1: Get API Credentials

1. Go to [Crypto.com Pay Merchant Portal](https://crypto.com/pay/merchant)
2. Sign up or log in
3. Navigate to **API Settings**
4. Generate API Key and Secret Key
5. Set up webhook URL: `https://api.advanciapayledger.com/api/webhooks/crypto-com`

#### Step 2: Add Environment Variables

**In Render Dashboard:**

```
CRYPTO_COM_API_KEY=your_api_key_here
CRYPTO_COM_SECRET_KEY=your_secret_key_here
CRYPTO_COM_WEBHOOK_SECRET=your_webhook_secret_here
```

**For Local Development** (backend/.env):

```bash
CRYPTO_COM_API_KEY="your_api_key_here"
CRYPTO_COM_SECRET_KEY="your_secret_key_here"
CRYPTO_COM_WEBHOOK_SECRET="your_webhook_secret_here"
```

#### Step 3: Test Integration

```bash
# Test in sandbox mode (default for development)
curl -X POST https://api.advanciapayledger.com/api/crypto-com/create-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "orderId": "ORDER-123"
  }'
```

### Service Usage Example

```typescript
import { cryptoComService } from "./services/cryptoComService";

// Create a payment
const payment = await cryptoComService.createPayment({
  amount: 100,
  currency: "USD",
  orderId: "ORDER-123",
  description: "Purchase of crypto tokens",
  returnUrl: "https://www.advanciapayledger.com/payment/success",
  cancelUrl: "https://www.advanciapayledger.com/payment/cancel",
});

// Get payment status
const status = await cryptoComService.getPayment(payment.paymentId);

// Get exchange rate
const rate = await cryptoComService.getExchangeRate("USD", "BTC");
```

---

## 🔧 2. Alchemy Pay Integration

### What is Alchemy Pay?

Alchemy Pay is a fiat-to-crypto payment gateway supporting 173+ countries with on-ramp and off-ramp services.

### Features Implemented

- ✅ On-ramp orders (Buy crypto with fiat)
- ✅ Off-ramp orders (Sell crypto for fiat)
- ✅ Order status tracking
- ✅ Webhook verification
- ✅ Exchange rate queries
- ✅ Supported currencies list

### Setup Instructions

#### Step 1: Get API Credentials

1. Go to [Alchemy Pay Merchant Portal](https://alchemypay.org/)
2. Sign up for merchant account
3. Complete KYC verification
4. Navigate to **Developer Settings**
5. Generate API Key, Secret Key, and get Merchant ID
6. Set up webhook URL: `https://api.advanciapayledger.com/api/webhooks/alchemy-pay`

#### Step 2: Add Environment Variables

**In Render Dashboard:**

```
ALCHEMY_PAY_API_KEY=your_api_key_here
ALCHEMY_PAY_SECRET_KEY=your_secret_key_here
ALCHEMY_PAY_MERCHANT_ID=your_merchant_id_here
ALCHEMY_PAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**For Local Development** (backend/.env):

```bash
ALCHEMY_PAY_API_KEY="your_api_key_here"
ALCHEMY_PAY_SECRET_KEY="your_secret_key_here"
ALCHEMY_PAY_MERCHANT_ID="your_merchant_id_here"
ALCHEMY_PAY_WEBHOOK_SECRET="your_webhook_secret_here"
```

#### Step 3: Test Integration

```bash
# Test on-ramp (buy crypto)
curl -X POST https://api.advanciapayledger.com/api/alchemy-pay/create-order \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantOrderNo": "ORDER-123",
    "orderAmount": 100,
    "orderCurrency": "USD",
    "cryptoCurrency": "USDT",
    "network": "TRC20"
  }'
```

### Service Usage Example

```typescript
import { alchemyPayService } from "./services/alchemyPayService";

// Create on-ramp order (buy crypto)
const order = await alchemyPayService.createOnRampOrder({
  merchantOrderNo: "ORDER-123",
  orderAmount: 100,
  orderCurrency: "USD",
  cryptoCurrency: "USDT",
  network: "TRC20",
  returnUrl: "https://www.advanciapayledger.com/payment/success",
  notifyUrl: "https://api.advanciapayledger.com/api/webhooks/alchemy-pay",
  email: "user@example.com",
});

// Query order status
const status = await alchemyPayService.queryOrder("ORDER-123");

// Get exchange rate
const rate = await alchemyPayService.getExchangeRate("USD", "USDT", "TRC20");

// Get supported currencies
const fiatCurrencies = await alchemyPayService.getSupportedFiatCurrencies();
const cryptoCurrencies = await alchemyPayService.getSupportedCryptoCurrencies();
```

---

## 🔧 3. Stripe Integration (Already Configured)

### Current Status

✅ Fully integrated and working

### Environment Variables

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Endpoints

- `POST /api/payments/create` - Create payment intent
- `POST /api/payments/webhook` - Handle Stripe webhooks
- `GET /api/payments/:id` - Get payment status

---

## 📋 Implementation Checklist

### For Crypto.com Pay

- [ ] Sign up for Crypto.com Pay merchant account
- [ ] Get API credentials (API Key, Secret Key)
- [ ] Add environment variables to Render
- [ ] Test payment creation in sandbox
- [ ] Set up webhook endpoint
- [ ] Test webhook verification
- [ ] Switch to production mode
- [ ] Update frontend to show Crypto.com Pay option

### For Alchemy Pay

- [ ] Sign up for Alchemy Pay merchant account
- [ ] Complete KYC verification
- [ ] Get API credentials (API Key, Secret Key, Merchant ID)
- [ ] Add environment variables to Render
- [ ] Test on-ramp order in sandbox
- [ ] Test off-ramp order in sandbox
- [ ] Set up webhook endpoint
- [ ] Test webhook verification
- [ ] Switch to production mode
- [ ] Update frontend to show Alchemy Pay option

---

## 🚀 Quick Start Commands

### Add to Render Environment Variables

```bash
# Crypto.com Pay
CRYPTO_COM_API_KEY=your_key
CRYPTO_COM_SECRET_KEY=your_secret
CRYPTO_COM_WEBHOOK_SECRET=your_webhook_secret

# Alchemy Pay
ALCHEMY_PAY_API_KEY=your_key
ALCHEMY_PAY_SECRET_KEY=your_secret
ALCHEMY_PAY_MERCHANT_ID=your_merchant_id
ALCHEMY_PAY_WEBHOOK_SECRET=your_webhook_secret
```

### Test Locally

```bash
# 1. Add to backend/.env
cp backend/.env.example backend/.env
# Edit .env and add your API keys

# 2. Start backend
cd backend
npm run dev

# 3. Test endpoints
curl http://localhost:4000/api/health
```

---

## 📊 Payment Flow Diagrams

### Crypto.com Pay Flow

```
User → Select Crypto Payment
     → Backend creates payment via Crypto.com API
     → User redirected to Crypto.com payment page
     → User completes payment
     → Crypto.com sends webhook to backend
     → Backend updates order status
     → User redirected to success page
```

### Alchemy Pay Flow

```
User → Select Buy/Sell Crypto
     → Backend creates order via Alchemy Pay API
     → User redirected to Alchemy Pay page
     → User completes KYC (if needed)
     → User completes payment
     → Alchemy Pay sends webhook to backend
     → Backend updates order status
     → User redirected to success page
```

---

## 🔐 Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Verify webhook signatures** - Both services provide signature verification
3. **Use HTTPS only** - All webhook URLs must use HTTPS
4. **Validate amounts** - Always verify payment amounts match order amounts
5. **Log all transactions** - Keep audit trail of all payment activities
6. **Handle errors gracefully** - Implement retry logic for failed API calls
7. **Test in sandbox first** - Always test with sandbox credentials before production

---

## 📞 Support & Documentation

### Crypto.com Pay

- **Documentation:** https://pay-docs.crypto.com/
- **Support:** support@crypto.com
- **Status Page:** https://status.crypto.com/

### Alchemy Pay

- **Documentation:** https://docs.alchemypay.org/
- **Support:** support@alchemypay.org
- **Telegram:** https://t.me/alchemypay

### Stripe

- **Documentation:** https://stripe.com/docs
- **Support:** https://support.stripe.com
- **Status Page:** https://status.stripe.com/

---

## ✅ Files Created

1. `/backend/src/services/cryptoComService.ts` - Crypto.com Pay integration
2. `/backend/src/services/alchemyPayService.ts` - Alchemy Pay integration
3. `/backend/.env.example` - Updated with payment gateway variables
4. `/render.yaml` - Updated with payment gateway environment variables

---

**🎉 Your payment gateways are ready! Just add your API keys and start accepting payments!**
