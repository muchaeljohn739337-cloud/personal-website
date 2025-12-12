# NOWPayments Webhook Configuration

**Last Updated:** 2025-01-27  
**Status:** ✅ **CONFIGURED**

---

## 🔐 Credentials

### API Configuration

- **API Key:** `TWWXH01-4AW4HTH-JM96V6J-41CFY66`
- **IPN Secret:** `37593f7f-637f-45a7-8c0f-5a49f78f915f`
- **IPN Key:** `3gUQThW57tkD+WDgPkJtHEo3GZGtitcr` (alternate/legacy, not used)

### Webhook Endpoint

- **URL:** `https://advanciapayledger.com/api/payments/nowpayments/webhook`
- **Method:** POST
- **Signature Header:** `x-nowpayments-sig`

---

## 📋 NOWPayments Dashboard Configuration

To configure the webhook in NOWPayments dashboard:

1. **Login to NOWPayments:** https://nowpayments.io/dashboard
2. **Navigate to:** Settings > IPN Settings
3. **Set IPN Callback URL:** `https://advanciapayledger.com/api/payments/nowpayments/webhook`
4. **Set IPN Secret:** `37593f7f-637f-45a7-8c0f-5a49f78f915f`
5. **Save Settings**

---

## 🔒 Webhook Security

### Signature Verification

The webhook uses HMAC-SHA512 signature verification:

```typescript
// Signature is verified using the IPN Secret
const hmac = crypto.createHmac('sha512', NOWPAYMENTS_IPN_SECRET);
hmac.update(JSON.stringify(JSON.parse(payload)));
const calculatedSignature = hmac.digest('hex');
```

### Security Features

- ✅ Signature verification on all webhook requests
- ✅ Returns 401 if signature is invalid
- ✅ Only processes valid webhook payloads
- ✅ Logs all webhook attempts for security auditing

---

## 📨 Webhook Events Handled

The webhook handler processes the following payment statuses:

- `waiting` → `WAITING`
- `confirming` → `CONFIRMING`
- `confirmed` → `CONFIRMED`
- `sending` → `SENDING`
- `partially_paid` → `PARTIALLY_PAID`
- `finished` → `FINISHED` (triggers token credit)
- `failed` → `FAILED`
- `refunded` → `REFUNDED`
- `expired` → `EXPIRED`

### Actions on `FINISHED` Status

- ✅ Updates payment status in database
- ✅ Credits user's token wallet (1 USD = 10 ADV tokens)
- ✅ Creates token transaction record
- ✅ Sends notification to user

---

## 🧪 Testing Webhook

### Test Webhook Locally (using ngrok or similar)

1. **Start local server:**

   ```bash
   npm run dev
   ```

2. **Expose local port (e.g., using ngrok):**

   ```bash
   ngrok http 3000
   ```

3. **Update webhook URL in NOWPayments dashboard:**
   - Use ngrok URL: `https://your-ngrok-url.ngrok.io/api/payments/nowpayments/webhook`

4. **Test payment:**
   - Create a test payment
   - Complete the payment
   - Check webhook logs in your terminal

### Verify Webhook is Working

1. **Check webhook logs:**
   - Look for: `NOWPayments webhook received:` in console
   - Verify signature validation passes

2. **Check database:**
   - Payment status should update
   - User tokens should be credited (if payment finished)

3. **Check NOWPayments dashboard:**
   - Webhook delivery status
   - Response codes (should be 200)

---

## 📝 Environment Variables

### Required Variables

```bash
NOWPAYMENTS_API_KEY=TWWXH01-4AW4HTH-JM96V6J-41CFY66
NOWPAYMENTS_IPN_SECRET=37593f7f-637f-45a7-8c0f-5a49f78f915f
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
```

### Production Setup

Make sure these are set in:

- ✅ Vercel Environment Variables
- ✅ `.env.local` (local development)
- ✅ GitHub Secrets (for CI/CD)

---

## 🔍 Webhook Payload Example

```json
{
  "payment_id": "12345678",
  "payment_status": "finished",
  "pay_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "price_amount": 100.00,
  "price_currency": "usd",
  "pay_amount": 0.0025,
  "actually_paid": 0.0025,
  "pay_currency": "btc",
  "order_id": "order_123",
  "order_description": "Token purchase - 100 USD",
  "outcome_amount": 100.00,
  "outcome_currency": "usd"
}
```

---

## 🚨 Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is correct:**
   - Must be `https://advanciapayledger.com/api/payments/nowpayments/webhook`
   - Must be accessible from internet (no localhost)

2. **Check IPN Secret matches:**
   - Dashboard IPN Secret must match environment variable
   - Secret: `37593f7f-637f-45a7-8c0f-5a49f78f915f`

3. **Check webhook endpoint is responding:**

   ```bash
   curl -X POST https://advanciapayledger.com/api/payments/nowpayments/webhook \
     -H "Content-Type: application/json" \
     -H "x-nowpayments-sig: test" \
     -d '{"test": "data"}'
   ```

### Signature Verification Failing

1. **Verify IPN Secret is correct:**
   - Check `.env.local` has correct value
   - Check Vercel environment variables

2. **Check signature header:**
   - Header name must be: `x-nowpayments-sig`
   - Signature format: hex-encoded HMAC-SHA512

3. **Check payload format:**
   - Must be valid JSON
   - Must match NOWPayments webhook payload structure

---

## ✅ Configuration Checklist

- [x] API Key configured
- [x] IPN Secret configured
- [x] Webhook URL set in NOWPayments dashboard
- [x] Webhook endpoint implemented
- [x] Signature verification working
- [x] Payment status mapping correct
- [x] Token credit logic implemented
- [x] Error handling in place
- [x] Logging enabled

**NOWPayments webhook is fully configured and ready to receive payment notifications!** 🎉
