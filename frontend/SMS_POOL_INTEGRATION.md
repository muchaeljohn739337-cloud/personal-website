# SMS Pool Integration Guide

Complete SMS verification implementation using [SMS Pool API](https://www.smspool.net/).

## 🚀 Quick Start

### 1. Get Your API Key

1. Sign up at [smspool.net](https://www.smspool.net/)
2. Navigate to your dashboard
3. Copy your API key

### 2. Configure Environment

Add to `.env.local`:

```bash
SMSPOOL_API_KEY=your_smspool_api_key_here
```

### 3. Test the Integration

Visit: `http://localhost:3000/verify-sms`

## 📁 File Structure

```
src/
├── lib/
│   └── smspool.ts                    # SMS Pool API service
├── app/
│   ├── api/
│   │   └── sms/
│   │       ├── verify/
│   │       │   └── route.ts          # Verification endpoints
│   │       └── config/
│   │           └── route.ts          # Configuration endpoints
│   └── verify-sms/
│       └── page.tsx                  # Demo page
└── components/
    └── SMSVerification.tsx           # React component
```

## 🛠️ Components

### 1. SMS Pool Service (`src/lib/smspool.ts`)

Core service for interacting with SMS Pool API.

**Methods:**

- `getCountries()` - List available countries
- `getServices(countryId)` - Get services for a country
- `orderNumber(params)` - Order a phone number
- `checkSMS(orderId)` - Check for received SMS
- `archiveOrder(orderId)` - Cancel/archive order
- `getBalance()` - Check account balance
- `extractOTP(message)` - Extract verification code

**Interfaces:**

```typescript
interface SMSPoolCountry {
  ID: string;
  name: string;
}

interface SMSPoolService {
  ID: string;
  name: string;
}

interface SMSPoolOrder {
  order_id: string;
  phone_number: string;
  status: string;
  expires_in: number;
}

interface SMSPoolMessage {
  status: number;
  message: string;
  full_sms: string;
}
```

### 2. API Routes

#### Verification Route (`/api/sms/verify`)

**POST** - Order a verification number

```typescript
// Request
{
  phoneNumber?: string;  // Optional, SMS Pool assigns if empty
  countryId: string;     // e.g., "US"
  serviceId: string;     // e.g., "any"
}

// Response
{
  success: true,
  orderId: "123456",
  phoneNumber: "+12345678901",
  expires: 120
}
```

**GET** - Check for received SMS

```typescript
// Query: ?orderId=123456

// Response (waiting)
{
  success: true,
  message: "Waiting for SMS..."
}

// Response (received)
{
  success: true,
  code: "123456",
  fullMessage: "Your verification code is 123456"
}
```

**DELETE** - Cancel order

```typescript
// Query: ?orderId=123456

// Response
{
  success: true,
  message: "Order cancelled"
}
```

#### Config Route (`/api/sms/config`)

**GET** - Retrieve configuration

```typescript
// Get countries
// Query: ?type=countries
{
  success: true,
  data: [{ ID: "US", name: "United States" }]
}

// Get services
// Query: ?type=services&countryId=US
{
  success: true,
  data: [{ ID: "any", name: "Any Service" }]
}

// Get balance
// Query: ?type=balance
{
  success: true,
  balance: 10.50
}
```

### 3. React Component (`SMSVerification.tsx`)

Fully featured UI component with auto-polling and state management.

**Props:**

```typescript
interface SMSVerificationProps {
  onSuccess?: (code: string) => void;
  onError?: (error: string) => void;
  countryId?: string; // Default: "US"
  serviceId?: string; // Default: "any"
}
```

**Features:**

- ✅ Auto-polling every 5 seconds
- ✅ 2-minute countdown timer
- ✅ Loading states
- ✅ Success/error handling
- ✅ Dark mode support
- ✅ Framer Motion animations
- ✅ Heroicons integration

**Usage:**

```tsx
import SMSVerification from "@/components/SMSVerification";

export default function MyPage() {
  const handleSuccess = (code: string) => {
    console.log("Verification code:", code);
    // Complete your auth flow here
  };

  return (
    <SMSVerification
      onSuccess={handleSuccess}
      onError={(error) => console.error(error)}
      countryId="US"
      serviceId="any"
    />
  );
}
```

## 🔄 Flow Diagram

```
User Action                 Component              API Route           SMS Pool
─────────────────────────────────────────────────────────────────────────────
Click "Order"           →   orderNumber()      →   POST /api/sms/verify
                                                    ├─ Validate params
                                                    └─ Call orderNumber()  →  Order number
                                                                          ←   Return orderId
                            ← Set orderId      ←   Return response
                            Start auto-poll

Auto-poll (5s)          →   checkForSMS()      →   GET /api/sms/verify
                                                    ├─ Validate orderId
                                                    └─ Call checkSMS()     →  Check messages
                                                                          ←   Return message
                            ← Update state     ←   Return code/waiting

Code received           →   Display code
                            Call onSuccess()

User cancels            →   cancelOrder()      →   DELETE /api/sms/verify
                                                    └─ Call archiveOrder() →  Archive order
                            Reset form
```

## 💡 Integration Examples

### Example 1: Two-Factor Authentication

```tsx
"use client";

import { useState } from "react";
import SMSVerification from "@/components/SMSVerification";

export default function TwoFactorAuth() {
  const [user, setUser] = useState(null);

  const enable2FA = async (code: string) => {
    const response = await fetch("/api/auth/enable-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (response.ok) {
      alert("2FA enabled successfully!");
    }
  };

  return (
    <div>
      <h1>Enable Two-Factor Authentication</h1>
      <SMSVerification onSuccess={enable2FA} countryId="US" serviceId="any" />
    </div>
  );
}
```

### Example 2: Registration Flow

```tsx
"use client";

import { useState } from "react";
import SMSVerification from "@/components/SMSVerification";

export default function Register() {
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");

  const verifyPhone = async (code: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, verificationCode: code }),
    });

    if (response.ok) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div>
      {step === "form" && (
        <form onSubmit={() => setStep("verify")}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <button type="submit">Continue</button>
        </form>
      )}

      {step === "verify" && (
        <SMSVerification
          onSuccess={verifyPhone}
          countryId="US"
          serviceId="any"
        />
      )}
    </div>
  );
}
```

### Example 3: Password Reset

```tsx
"use client";

import SMSVerification from "@/components/SMSVerification";

export default function ResetPassword() {
  const confirmReset = async (code: string) => {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (response.ok) {
      alert("Password reset confirmed!");
    }
  };

  return (
    <div>
      <h1>Confirm Password Reset</h1>
      <p>We'll send a verification code to your phone.</p>
      <SMSVerification
        onSuccess={confirmReset}
        countryId="US"
        serviceId="any"
      />
    </div>
  );
}
```

## 🔒 Security Best Practices

1. **Never expose API key in frontend**
   - ✅ Store in `.env.local`
   - ✅ Access only in API routes
   - ❌ Don't pass to client components

2. **Validate server-side**

   ```typescript
   // In your auth API route
   const isValidCode = verificationCode.match(/^\d{4,6}$/);
   if (!isValidCode) {
     return NextResponse.json({ error: "Invalid code" }, { status: 400 });
   }
   ```

3. **Rate limiting**

   ```typescript
   // Implement rate limiting for SMS orders
   const orderLimit = await checkRateLimit(userId);
   if (orderLimit.exceeded) {
     return NextResponse.json({ error: "Too many requests" }, { status: 429 });
   }
   ```

4. **Timeout orders**
   - Orders expire after 2 minutes
   - Auto-cleanup stale orders
   - Archive cancelled orders

5. **Log suspicious activity**
   ```typescript
   if (failedAttempts > 3) {
     await logSecurityEvent({
       type: "suspicious_verification",
       userId,
       timestamp: new Date(),
     });
   }
   ```

## 🧪 Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Visit: `http://localhost:3000/verify-sms`
3. Click "Order Verification Number"
4. Wait for SMS (5-30 seconds)
5. Verify code appears automatically

### API Testing

```bash
# Order a number
curl -X POST http://localhost:3000/api/sms/verify \
  -H "Content-Type: application/json" \
  -d '{"countryId":"US","serviceId":"any"}'

# Check for SMS
curl http://localhost:3000/api/sms/verify?orderId=123456

# Cancel order
curl -X DELETE http://localhost:3000/api/sms/verify?orderId=123456

# Get countries
curl http://localhost:3000/api/sms/config?type=countries

# Check balance
curl http://localhost:3000/api/sms/config?type=balance
```

## 📊 Monitoring

### Track Usage

```typescript
// In your analytics service
const trackSMSUsage = async (event: string, data: any) => {
  await analytics.track({
    event,
    properties: {
      ...data,
      timestamp: new Date(),
    },
  });
};

// Usage
await trackSMSUsage("sms_ordered", { countryId: "US", serviceId: "any" });
await trackSMSUsage("sms_received", { orderId, code });
await trackSMSUsage("sms_failed", { error: message });
```

### Cost Management

```typescript
// Check balance before ordering
const balance = await smsPool.getBalance();
if (balance.balance < 1.0) {
  await notifyAdmin("Low SMS Pool balance: $" + balance.balance);
}
```

## 🌍 Supported Countries

SMS Pool supports 180+ countries. Popular ones:

- 🇺🇸 United States (US)
- 🇬🇧 United Kingdom (GB)
- 🇨🇦 Canada (CA)
- 🇦🇺 Australia (AU)
- 🇩🇪 Germany (DE)
- 🇫🇷 France (FR)
- And many more...

Fetch full list: `GET /api/sms/config?type=countries`

## 💰 Pricing

SMS Pool charges per SMS received. Typical costs:

- US/CA/UK: $0.10 - $0.50 per SMS
- EU: $0.20 - $0.80 per SMS
- Other: $0.30 - $2.00 per SMS

Check real-time pricing: [smspool.net/pricing](https://www.smspool.net/pricing)

## 🐛 Troubleshooting

### "API key not found"

```bash
# Check .env.local
cat .env.local | grep SMSPOOL_API_KEY

# Restart dev server
npm run dev
```

### "No numbers available"

- Try different country/service combination
- Check SMS Pool status page
- Verify account balance

### "Order expired"

- Orders expire after 2 minutes
- SMS Pool may be delayed
- Try ordering again

### "Invalid order ID"

- Ensure orderId is stored correctly
- Check for typos
- Verify order hasn't been archived

## 📚 Resources

- [SMS Pool API Documentation](https://www.smspool.net/api)
- [SMS Pool Dashboard](https://www.smspool.net/dashboard)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Framer Motion Docs](https://www.framer.com/motion/)

## 📝 License

This integration is part of the Advancia Pay Ledger project.

## 🤝 Support

Need help? Contact:

- SMS Pool Support: support@smspool.net
- Project Issues: GitHub Issues

---

**Built with ❤️ using Next.js 14 and SMS Pool API**
