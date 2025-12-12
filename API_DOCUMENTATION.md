# 📚 Advancia Payledger API Documentation

Complete API reference for the Advancia Payledger backend system.

**Base URL:** `https://api.advanciapayledger.com`  
**Local Development:** `http://localhost:4000`

**Version:** 1.0.0  
**Author:** mucha  
**Repository:** https://github.com/muchaeljohn739337-cloud/modular-saas-platform  
**License:** PRIVATE

---

## 🔐 Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Admin Endpoints

Admin endpoints require an additional admin role check. Use the `x-api-key` header for server-to-server calls:

```
x-api-key: <your-admin-api-key>
```

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [User Management](#user-management)
3. [Transactions](#transactions)
4. [Tokens & Wallets](#tokens--wallets)
5. [Rewards & Tiers](#rewards--tiers)
6. [Payments (Stripe)](#payments-stripe)
7. [Crypto Operations](#crypto-operations)
8. [Notifications](#notifications)
9. [Support](#support)
10. [Admin AI System](#admin-ai-system)
11. [System & Health](#system--health)
12. [Ethereum Gateway](#ethereum-gateway)

---

## 🔑 Authentication Endpoints

### `POST /api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1234567890" // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### `POST /api/auth/login`

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

---

### `POST /api/auth/send-otp`

Send email OTP for authentication (replaces SMS).

**Request Body:**

```json
{
  "email": "user@example.com",
  "phone": null // SMS removed for cost savings
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent via email",
  "expiresIn": 300 // seconds
}
```

---

### `POST /api/auth/verify-otp`

Verify email OTP.

**Request Body:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

### `POST /api/auth/setup-2fa`

Enable TOTP 2FA for account.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["code1", "code2", ...]
}
```

---

### `POST /api/auth/verify-2fa`

Verify TOTP 2FA token.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "token": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "2FA verified successfully"
}
```

---

## 👤 User Management

### `GET /api/users/profile`

Get current user profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "tier": "bronze",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### `PATCH /api/users/profile`

Update user profile.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Jane Doe",
  "phone": "+9876543210",
  "avatar": "https://..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

### `GET /api/users`

List all users (Admin only).

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `role` (string): Filter by role (user, admin, doctor)

**Response:**

```json
{
  "success": true,
  "users": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 💰 Transactions

### `GET /api/transactions`

Get user transactions.

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (number): Page number
- `limit` (number): Items per page
- `type` (string): Filter by type (deposit, withdrawal, transfer)
- `status` (string): Filter by status (pending, completed, failed)

**Response:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "type": "deposit",
      "amount": "100.00",
      "currency": "USD",
      "status": "completed",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### `POST /api/transactions/create`

Create a new transaction.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "type": "deposit",
  "amount": 100.0,
  "currency": "USD",
  "description": "Monthly savings"
}
```

**Response:**

```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "type": "deposit",
    "amount": "100.00",
    "status": "pending"
  }
}
```

---

## 🪙 Tokens & Wallets

### `GET /api/tokens/wallet`

Get user token wallet balance.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "wallet": {
    "balance": "1500.00",
    "pendingBalance": "50.00",
    "totalEarned": "2000.00",
    "totalSpent": "500.00"
  }
}
```

---

### `GET /api/tokens/transactions`

Get token transaction history.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "type": "earn",
      "amount": "10.00",
      "reason": "Daily login bonus",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/tokens/transfer`

Transfer tokens to another user.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "recipientId": 2,
  "amount": 50.0,
  "message": "Payment for services"
}
```

**Response:**

```json
{
  "success": true,
  "transaction": { ... }
}
```

---

## 🎁 Rewards & Tiers

### `GET /api/rewards`

Get user rewards summary.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "tier": "silver",
  "points": 1250,
  "nextTier": "gold",
  "pointsToNextTier": 250,
  "rewards": [
    {
      "id": 1,
      "name": "10% Cashback",
      "description": "On all transactions",
      "unlocked": true
    }
  ]
}
```

---

### `POST /api/rewards/claim`

Claim a reward.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "rewardId": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Reward claimed successfully",
  "reward": { ... }
}
```

---

## 💳 Payments (Stripe)

### `POST /api/payments/create-checkout-session`

Create Stripe checkout session.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "amount": 5000, // cents
  "currency": "usd",
  "description": "Premium subscription"
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

---

### `POST /api/payments/webhook`

Stripe webhook handler (raw body required).

**Headers:**

```
stripe-signature: t=...,v1=...
Content-Type: application/json
```

**Note:** This endpoint must be configured in your Stripe dashboard.

---

## 🔗 Crypto Operations

### `POST /api/crypto/deposit`

Initiate crypto deposit.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "cryptocurrency": "BTC",
  "amount": 0.01,
  "walletAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
}
```

**Response:**

```json
{
  "success": true,
  "deposit": {
    "id": 1,
    "depositAddress": "bc1q...",
    "amount": "0.01",
    "status": "pending"
  }
}
```

---

### `POST /api/crypto/withdraw`

Withdraw cryptocurrency.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "cryptocurrency": "BTC",
  "amount": 0.005,
  "destinationAddress": "bc1q..."
}
```

**Response:**

```json
{
  "success": true,
  "withdrawal": {
    "id": 1,
    "status": "pending",
    "txHash": null
  }
}
```

---

## 🔔 Notifications

### `GET /api/notifications`

Get user notifications.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "transaction",
      "title": "Payment received",
      "message": "You received $50.00",
      "read": false,
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### `PATCH /api/notifications/:id/read`

Mark notification as read.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### `POST /api/notifications/subscribe`

Subscribe to web push notifications.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Subscribed to push notifications"
}
```

---

## 🎧 Support

### `POST /api/support/ticket`

Create support ticket.

**Headers:**

```
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "subject": "Payment issue",
  "category": "payments",
  "priority": "high",
  "description": "My payment is stuck..."
}
```

**Response:**

```json
{
  "success": true,
  "ticket": {
    "id": 1,
    "ticketNumber": "TKT-2024-001",
    "status": "open"
  }
}
```

---

### `GET /api/support/tickets`

Get user support tickets.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "tickets": [
    {
      "id": 1,
      "ticketNumber": "TKT-2024-001",
      "subject": "Payment issue",
      "status": "open",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## 🤖 Admin AI System

### `GET /api/admin/ai/status`

Get unified AI system status (Admin only).

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Response:**

```json
{
  "success": true,
  "surveillance": {
    "running": true,
    "uptime": 3600,
    "lastCheck": "2024-01-01T12:00:00.000Z"
  },
  "cleanup": {
    "lastRun": "2024-01-01T02:00:00.000Z",
    "nextRun": "2024-01-02T02:00:00.000Z",
    "recordsDeleted": 1500
  },
  "orchestrator": {
    "workers": 12,
    "activeWorkers": 8,
    "queuedTasks": 5
  },
  "mapper": {
    "lastValidation": "2024-01-01T11:00:00.000Z",
    "issues": 0
  }
}
```

---

### `GET /api/admin/ai/cleanup/stats`

Get cleanup statistics.

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalCleanups": 30,
    "lastCleanup": "2024-01-01T02:00:00.000Z",
    "recordsDeleted": {
      "jobs": 500,
      "tasks": 800,
      "logs": 200
    }
  }
}
```

---

### `POST /api/admin/ai/cleanup/run`

Manually trigger cleanup (Admin only).

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Request Body:**

```json
{
  "dryRun": false,
  "retention": {
    "jobs": 90,
    "tasks": 60,
    "logs": 30
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "recordsDeleted": {
      "jobs": 50,
      "tasks": 120,
      "logs": 300
    },
    "duration": 2.5
  }
}
```

---

### `GET /api/admin/ai/tasks/stats`

Get task orchestrator statistics.

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalWorkers": 12,
    "activeWorkers": 8,
    "queuedTasks": 15,
    "completedToday": 1250,
    "failedToday": 5
  }
}
```

---

### `POST /api/admin/ai/tasks/submit`

Submit task to orchestrator.

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Request Body:**

```json
{
  "type": "email",
  "priority": "high",
  "data": {
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "taskId": "task-123",
  "status": "queued"
}
```

---

### `GET /api/admin/ai/surveillance/dashboard`

Get surveillance dashboard data.

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Response:**

```json
{
  "success": true,
  "metrics": {
    "cpu": { "usage": 45, "cores": 8 },
    "memory": { "used": 4096, "total": 16384, "percentage": 25 },
    "database": { "connections": 15, "maxConnections": 100 }
  },
  "recentAlerts": [ ... ]
}
```

---

## 🏥 System & Health

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "socket": "healthy"
  }
}
```

---

### `GET /api/system/cors-origins`

Get allowed CORS origins.

**Response:**

```json
{
  "success": true,
  "origins": [
    "https://advanciapayledger.com",
    "https://www.advanciapayledger.com",
    "http://localhost:3000"
  ]
}
```

---

## ⛓️ Ethereum Gateway

### `GET /api/ethereum/balance/:address`

Get Ethereum balance for address.

**Response:**

```json
{
  "success": true,
  "address": "0x...",
  "balance": "1.5",
  "balanceWei": "1500000000000000000"
}
```

---

### `POST /api/ethereum/send`

Send Ethereum transaction (Admin only).

**Headers:**

```
Authorization: Bearer <token>
x-api-key: <admin-key>
```

**Request Body:**

```json
{
  "to": "0x...",
  "amount": "0.1" // ETH
}
```

**Response:**

```json
{
  "success": true,
  "txHash": "0x...",
  "status": "pending"
}
```

---

## 🔒 Rate Limiting

All endpoints are rate-limited:

- **Default:** 100 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes per IP
- **Admin AI:** 50 requests per 15 minutes per IP

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704110400
```

---

## ❌ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... } // optional
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Invalid or missing authentication token
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid request data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

---

## 📦 SDK Examples

### JavaScript/TypeScript

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "https://api.advanciapayledger.com",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Get user profile
const { data } = await api.get("/api/users/profile");

// Create transaction
const tx = await api.post("/api/transactions/create", {
  type: "deposit",
  amount: 100.0,
});
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}'
}

# Get user profile
response = requests.get(
    'https://api.advanciapayledger.com/api/users/profile',
    headers=headers
)
user = response.json()
```

### cURL

```bash
# Get user profile
curl -X GET https://api.advanciapayledger.com/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create transaction
curl -X POST https://api.advanciapayledger.com/api/transactions/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"deposit","amount":100.00,"currency":"USD"}'
```

---

## 🚀 Production Deployment

**Production API:** `https://api.advanciapayledger.com`  
**Frontend:** `https://advanciapayledger.com`  
**Admin:** `https://admin.advanciapayledger.com`

### Environment Variables Required

See `backend/.env.example` for complete list:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing key
- `STRIPE_SECRET_KEY` - Stripe API key
- `EMAIL_USER` / `EMAIL_PASSWORD` - Gmail SMTP credentials
- `REDIS_URL` - Redis connection string
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - Web push keys

---

## 📞 Support

For API support, contact: **support@advanciapayledger.com**

---

**Documentation Version:** 1.0.0  
**Last Updated:** 2024-01-15  
**License:** PRIVATE - All Rights Reserved
