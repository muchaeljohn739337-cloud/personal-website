# 💳 Stripe Payment Integration Guide

Complete guide for testing and using the Stripe payment system in your SaaS platform.

## 🎯 Features Implemented

### ✅ Core Payment Features

- **Checkout Sessions**: Create secure payment sessions with Stripe Checkout
- **Payment Processing**: Handle card payments with automatic balance updates
- **Refund System**: Admin and user refund workflows with email notifications
- **Webhook Integration**: Real-time payment event handling
- **Email Notifications**: Automatic payment and refund confirmations
- **Transaction Tracking**: Complete audit trail of all payment activities

### ✅ Webhook Events Handled

- `checkout.session.completed` - Payment successful
- `payment_intent.succeeded` - Payment processed successfully
- `payment_intent.failed` - Payment failed (logged and notified)
- `charge.refunded` - Refund processed

---

## 🚀 Quick Start

### 1. Get Your Stripe Keys

#### Test Mode (Development)

1. Sign up at https://stripe.com
2. Go to **Developers → API Keys**
3. Copy your **Publishable key** (starts with `pk_test_`)
4. Copy your **Secret key** (starts with `sk_test_`)

#### Test Cards

Use these test cards in test mode:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- Any future expiry date, any 3-digit CVC

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY="sk_test_51xxxxxxxxxxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_test_51xxxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"

# Email for notifications
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

### 3. Test Stripe Configuration

```bash
npm run ts-node src/scripts/test-stripe-integration.ts
```

Expected output:

```
✅ STRIPE_SECRET_KEY found
✅ STRIPE_WEBHOOK_SECRET configured
✅ Stripe client initialized
✅ Successfully connected to Stripe API
```

---

## 📡 Webhook Setup

### Local Development (Using Stripe CLI)

1. **Install Stripe CLI**

   ```bash
   # Windows (PowerShell)
   scoop install stripe

   # Mac
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe**

   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**

   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```

4. **Copy the webhook signing secret**

   ```
   Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

   Add this to your `.env`:

   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxx"
   ```

5. **Test webhook**

   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Production Setup

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/payments/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `charge.refunded`
5. Copy the **Signing secret** to your `.env`

---

## 🔌 API Endpoints

### 1. Create Checkout Session

**POST** `/api/payments/checkout-session`

Creates a Stripe Checkout session for payment processing.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 50.0,
  "currency": "usd",
  "metadata": {
    "purpose": "account_topup"
  }
}
```

**Response:**

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "id": "cs_test_..."
}
```

**Usage Example:**

```typescript
const response = await fetch("http://localhost:4000/api/payments/checkout-session", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    amount: 50.0,
    currency: "usd",
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

---

### 2. Get Session Details

**GET** `/api/payments/session/:id`

Retrieve details of a checkout session.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response:**

```json
{
  "id": "cs_test_...",
  "amount_total": 5000,
  "currency": "usd",
  "status": "complete",
  "payment_status": "paid",
  "metadata": {
    "userId": "user-123"
  }
}
```

---

### 3. User Request Refund

**POST** `/api/payments/refund-request`

Allow users to request refunds (requires admin approval).

**Headers:**

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "paymentId": "pi_xxxxxxxxxxxxxxxxxxxxx",
  "reason": "Product not as described"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Refund request submitted. An admin will review your request.",
  "requestId": "pi_xxxxxxxxxxxxxxxxxxxxx"
}
```

---

### 4. Admin Process Refund

**POST** `/api/payments/admin/refund/:paymentId`

Process a refund for a payment (admin only).

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "amount": 25.0,
  "reason": "requested_by_customer"
}
```

**Response:**

```json
{
  "success": true,
  "refund": {
    "id": "re_xxxxxxxxxxxxxxxxxxxxx",
    "amount": 2500,
    "status": "succeeded"
  },
  "message": "Refunded $25.00 to user@example.com"
}
```

**Refund Reasons:**

- `duplicate` - Duplicate charge
- `fraudulent` - Fraudulent transaction
- `requested_by_customer` - Customer requested refund

---

### 5. Admin List Payments

**GET** `/api/payments/admin/payments?limit=10&starting_after=pi_xxx`

List recent payments (admin only).

**Headers:**

```
Authorization: Bearer <admin-jwt-token>
```

**Query Parameters:**

- `limit` (optional): Number of payments to return (default: 10)
- `starting_after` (optional): Payment ID for pagination

**Response:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "pi_xxxxxxxxxxxxxxxxxxxxx",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded",
      "created": 1638360000
    }
  ],
  "has_more": true
}
```

---

### 6. Check Payment Health

**GET** `/api/payments/health`

Check if Stripe is configured properly.

**Response:**

```json
{
  "stripeConfigured": true
}
```

---

## 🔔 Webhook Handler

### Endpoint

**POST** `/api/payments/webhook`

This endpoint receives events from Stripe. It's automatically called by Stripe - you don't need to call it manually.

### How It Works

1. **Stripe sends event** → Your webhook endpoint
2. **Signature verification** → Ensures request is from Stripe
3. **Event processing** → Updates database and user balance
4. **Email notification** → Sends confirmation to user
5. **Socket.io broadcast** → Real-time update to frontend

### Events Processed

#### `checkout.session.completed`

- Credits user's balance
- Creates transaction record
- Logs to audit trail
- Sends payment confirmation email
- Emits socket.io event

#### `payment_intent.succeeded`

- Logs successful payment
- Can be used for additional processing

#### `payment_intent.failed`

- Logs failed payment
- Notifies user via socket.io
- Records error details

#### `charge.refunded`

- Logs refund details
- Used for tracking purposes

---

## 🧪 Testing Guide

### Test Payment Flow (End-to-End)

1. **Start your backend**

   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (separate terminal)

   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```

3. **Create a checkout session**

   ```bash
   curl -X POST http://localhost:4000/api/payments/checkout-session \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"amount": 50, "currency": "usd"}'
   ```

4. **Open the checkout URL** in your browser
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry, any CVC

5. **Complete payment**
   - Check backend logs for webhook event
   - Check database for updated balance
   - Check email for payment confirmation

### Test Refund Flow

1. **Get a payment intent ID** from a completed payment

2. **Request refund as admin**

   ```bash
   curl -X POST http://localhost:4000/api/payments/admin/refund/pi_xxxxx \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "requested_by_customer"}'
   ```

3. **Verify**
   - Check user's balance is decremented
   - Check transaction record created
   - Check email sent to user
   - Check Stripe dashboard for refund

### Test Webhook Manually

Trigger test events with Stripe CLI:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test refund
stripe trigger charge.refunded
```

---

## 📊 Payment Flow Diagram

```
User                    Backend                 Stripe                  Email
  │                       │                       │                       │
  ├─ Request Payment ────>│                       │                       │
  │                       ├─ Create Session ─────>│                       │
  │                       │<─ Session URL ────────┤                       │
  │<─ Redirect URL ───────┤                       │                       │
  │                       │                       │                       │
  ├─ Enter Card Details ─────────────────────────>│                       │
  │                       │                       │                       │
  │                       │<─ Webhook Event ──────┤                       │
  │                       ├─ Verify Signature     │                       │
  │                       ├─ Update Balance       │                       │
  │                       ├─ Create Transaction   │                       │
  │                       ├─ Send Email ──────────────────────────────────>│
  │<─ Success Page ───────┤                       │                       │
  │                       │                       │                       │
```

---

## 🔒 Security Best Practices

### 1. Webhook Signature Verification

Always verify webhook signatures to prevent fake events:

```typescript
const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
```

**Never skip this step in production!**

### 2. Server-Side Amount Validation

Never trust amounts from the client. Calculate prices server-side:

```typescript
// ❌ Bad - trusts client
const amount = req.body.amount;

// ✅ Good - calculates server-side
const amount = calculatePrice(req.body.productId);
```

### 3. User Association

Always attach `userId` to metadata server-side:

```typescript
const session = await stripe.checkout.sessions.create({
  metadata: {
    userId: req.user.userId, // From JWT token
  },
});
```

### 4. HTTPS Only in Production

Webhooks must use HTTPS in production:

- ❌ `http://api.yourdomain.com/webhook`
- ✅ `https://api.yourdomain.com/webhook`

### 5. Idempotency

Stripe requests should be idempotent. Handle duplicate webhooks:

```typescript
// Check if already processed
const existing = await prisma.transaction.findUnique({
  where: { stripeSessionId: session.id },
});

if (existing) {
  return res.json({ received: true }); // Already processed
}
```

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events

**Check 1: Webhook secret correct?**

```bash
# Verify in .env
echo $STRIPE_WEBHOOK_SECRET
```

**Check 2: Stripe CLI running?**

```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```

**Check 3: Backend logs**

```
Look for: "Webhook error:" or "Signature verification failed"
```

### Payment Not Updating Balance

**Check webhook logs:**

```typescript
// Should see in console:
✅ Payment succeeded: pi_xxxxx - Amount: 50.00
```

**Check database:**

```sql
SELECT * FROM transactions WHERE userId = 'your-user-id' ORDER BY createdAt DESC LIMIT 5;
```

**Check audit logs:**

```sql
SELECT * FROM audit_logs WHERE action = 'PAYMENT_COMPLETED' ORDER BY createdAt DESC LIMIT 5;
```

### Email Not Sending

**Check EmailService configuration:**

```bash
npm run ts-node src/scripts/test-email-service.ts
```

**Check logs:**

```
Look for: "[EmailService] ✅ Email sent" or errors
```

### Test Card Declined

Use the correct test cards:

- ✅ `4242 4242 4242 4242` - Success
- ❌ Don't use real card numbers in test mode

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **Payment Success Rate**

   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'COMPLETED') * 100.0 / COUNT(*) as success_rate
   FROM transactions
   WHERE type = 'credit' AND createdAt > NOW() - INTERVAL '7 days';
   ```

2. **Average Transaction Value**

   ```sql
   SELECT AVG(CAST(amount AS DECIMAL)) as avg_amount
   FROM transactions
   WHERE type = 'credit' AND status = 'COMPLETED';
   ```

3. **Refund Rate**

   ```sql
   SELECT
     COUNT(*) FILTER (WHERE type = 'debit' AND description LIKE '%Refund%') * 100.0 /
     COUNT(*) FILTER (WHERE type = 'credit') as refund_rate
   FROM transactions;
   ```

### Stripe Dashboard

Monitor in Stripe Dashboard:

- **Home**: Recent payments, disputes, refunds
- **Payments**: All payment intents
- **Customers**: Customer list and payment history
- **Developers → Logs**: Webhook event logs

---

## 🚀 Production Checklist

Before going live:

- [ ] Switch to live Stripe keys (`sk_live_` and `pk_live_`)
- [ ] Update webhook endpoint URL to production domain (HTTPS)
- [ ] Configure webhook secret from production webhook
- [ ] Test webhook signature verification
- [ ] Enable email notifications (SendGrid/SMTP configured)
- [ ] Set up monitoring and alerts
- [ ] Configure refund approval workflow
- [ ] Test full payment flow with real (small) amounts
- [ ] Review Stripe account settings (business info, branding)
- [ ] Set up 2FA on Stripe account
- [ ] Configure fraud prevention rules
- [ ] Set up automatic payout schedule
- [ ] Test dispute/chargeback workflow

---

## 📚 Additional Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Test Cards**: https://stripe.com/docs/testing
- **Webhook Events**: https://stripe.com/docs/api/events/types
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Best Practices**: https://stripe.com/docs/security/best-practices

---

## 💡 Tips & Tricks

### Use Metadata Effectively

Store useful information in payment metadata:

```typescript
metadata: {
  userId: user.id,
  orderId: order.id,
  subscriptionType: 'premium',
  referralCode: 'FRIEND20',
}
```

### Handle Currency Properly

Stripe uses smallest currency unit (cents for USD):

```typescript
// $50.00 = 5000 cents
const amountInCents = Math.round(amount * 100);
```

### Implement Retry Logic

Handle temporary Stripe API failures:

```typescript
const stripe = new Stripe(apiKey, {
  maxNetworkRetries: 3,
  timeout: 30000, // 30 seconds
});
```

### Log Everything

Comprehensive logging helps debug issues:

```typescript
console.log(`Payment ${paymentId}: ${status} - ${amount} ${currency}`);
```

---

**Need Help?** Check the logs, test with Stripe CLI, or review Stripe Dashboard → Developers → Logs for detailed event
information.
