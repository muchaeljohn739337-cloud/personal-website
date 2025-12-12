# Google OAuth Authentication - Complete Guide

## Overview

Google OAuth authentication has been fully integrated to ensure **admins can never be locked out** by IP restrictions.
When an admin authenticates via Google, they receive a JWT token with `role: 'ADMIN'` which **automatically bypasses all
IP whitelist restrictions**.

## Key Features

✅ **Admin Lockout Prevention**: JWT with role=ADMIN bypasses IP whitelist (existing mechanism in `ipWhitelist.ts`) ✅
**Multiple Auth Methods**: Password, Web3 Wallet, and Google OAuth all work together ✅ **Automatic User Creation**: New
users created automatically on first Google Sign-In ✅ **Account Linking**: Link Google account to existing users ✅
**Rate Limiting**: 10 authentication attempts per 15 minutes per IP ✅ **Audit Logging**: All authentication attempts
logged to database ✅ **Profile Pictures**: Automatically synced from Google profile

## Architecture

### Files Created/Modified

1. **`src/middleware/googleAuth.ts`** (NEW - 320+ lines)
   - Core OAuth 2.0 functionality
   - Token verification with google-auth-library
   - User creation/linking logic
   - JWT generation with role support
   - Rate limiting and security

2. **`src/routes/google-auth.ts`** (NEW - 500+ lines)
   - 7 REST API endpoints for OAuth flow
   - Admin and user authentication
   - Account linking/unlinking
   - Token refresh

3. **`prisma/schema.prisma`** (MODIFIED)
   - Added `googleId` field (unique, nullable)
   - Added `profilePicture` field (nullable)

4. **`src/index.ts`** (MODIFIED)
   - Registered Google OAuth routes at `/api/auth/google`

5. **`.env.example`** (MODIFIED)
   - Added Google OAuth environment variables

### How IP Bypass Works

```typescript
// From src/middleware/ipWhitelist.ts (lines 96-105)
// This code ALREADY EXISTS - no changes needed!

// Admin JWT token bypass - CRITICAL FEATURE
if (req.headers.authorization?.startsWith("Bearer ")) {
  const token = req.headers.authorization.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

  if (decoded.role === "ADMIN") {
    console.log(`[Security] Admin JWT authenticated (IP: ${clientIP})`);
    return next(); // ✅ BYPASS IP WHITELIST
  }
}
```

**This means:**

- Admin signs in with Google → Gets JWT with `role: 'ADMIN'`
- Admin makes request with JWT → `ipWhitelist.ts` checks role → **Bypasses IP check**
- Works from **any IP address** in the world
- No lockout possible for admins

## Google Cloud Console Setup

### Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - App name: `Advancia PayLedger`
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: `email`, `profile` (default)

### Step 2: Configure OAuth Client

1. Application type: **Web application**
2. Name: `Advancia Backend`
3. Authorized JavaScript origins:

   ```
   http://localhost:4000
   https://your-production-domain.com
   ```

4. Authorized redirect URIs:

   ```
   http://localhost:4000/api/auth/google/callback
   https://your-production-domain.com/api/auth/google/callback
   ```

5. Click **Create**
6. Copy **Client ID** and **Client Secret**

### Step 3: Update Environment Variables

Add to your `.env` file:

```bash
GOOGLE_CLIENT_ID="123456789-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"
```

**Production:**

```bash
GOOGLE_REDIRECT_URI="https://api.advanciapay.com/api/auth/google/callback"
```

## Database Migration

Run Prisma migration to add Google fields:

```bash
npx prisma migrate dev --name add-google-auth
```

This adds:

- `googleId` - Unique Google user identifier
- `profilePicture` - URL to user's Google profile picture

## API Endpoints

### 1. Initialize OAuth Flow

**POST** `/api/auth/google/init`

Start Google Sign-In flow.

**Request:**

```json
{
  "type": "admin" // or "user"
}
```

**Response:**

```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "eyJ0eXBlIjoiYWRtaW4iLCJ0aW1lc3RhbXAiOjE2..."
}
```

**Usage:**

```typescript
// Frontend: Redirect user to authUrl
window.location.href = response.authUrl;
```

### 2. Handle OAuth Callback

**POST** `/api/auth/google/callback`

Exchange authorization code for JWT token.

**Request:**

```json
{
  "code": "4/0AbCD1234...",
  "state": "eyJ0eXBlIjoiYWRtaW4i..."
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123456",
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "profilePicture": "https://lh3.googleusercontent.com/..."
  }
}
```

### 3. Verify ID Token (Client-Side Flow)

**POST** `/api/auth/google/verify`

Verify Google ID token from client-side Sign-In.

**Request:**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "type": "admin" // or "user"
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

### 4. Link Google Account

**POST** `/api/auth/google/link`

Link Google account to existing user.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Request:**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Google account linked successfully",
  "user": {
    "id": "clx123456",
    "email": "user@example.com",
    "googleId": "1234567890"
  }
}
```

### 5. Unlink Google Account

**POST** `/api/auth/google/unlink`

Remove Google authentication from account.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "success": true,
  "message": "Google account unlinked successfully"
}
```

### 6. Get Google Auth Status

**GET** `/api/auth/google/status`

Check if user has Google account linked.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "success": true,
  "linked": true,
  "user": {
    "id": "clx123456",
    "email": "user@example.com",
    "role": "ADMIN",
    "profilePicture": "https://lh3.googleusercontent.com/..."
  }
}
```

### 7. Refresh JWT Token

**POST** `/api/auth/google/refresh`

Get new JWT token (extends expiration).

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Frontend Integration

### Option 1: Server-Side Flow (Recommended)

```typescript
// Step 1: Initialize OAuth flow
const initGoogle = async () => {
  const res = await fetch("http://localhost:4000/api/auth/google/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "admin" }), // or 'user'
  });

  const { authUrl } = await res.json();

  // Redirect to Google Sign-In
  window.location.href = authUrl;
};

// Step 2: Handle callback (on /auth/google/callback page)
const handleCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");

  const res = await fetch("http://localhost:4000/api/auth/google/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  });

  const { token, user } = await res.json();

  // Store JWT token
  localStorage.setItem("token", token);

  // Redirect to admin dashboard
  window.location.href = "/admin/dashboard";
};
```

### Option 2: Client-Side Flow (Google Identity Services)

```html
<!-- Add Google Identity Services library -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

```typescript
// Initialize Google Sign-In button
google.accounts.id.initialize({
  client_id: "YOUR_CLIENT_ID.apps.googleusercontent.com",
  callback: handleGoogleSignIn,
});

google.accounts.id.renderButton(document.getElementById("googleSignInButton"), {
  theme: "outline",
  size: "large",
  text: "signin_with",
});

// Handle sign-in response
const handleGoogleSignIn = async (response: any) => {
  const idToken = response.credential;

  // Send to backend for verification
  const res = await fetch("http://localhost:4000/api/auth/google/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      type: "admin", // or 'user'
    }),
  });

  const { token, user } = await res.json();

  // Store JWT token
  localStorage.setItem("token", token);

  // Redirect to dashboard
  window.location.href = "/admin/dashboard";
};
```

## Security Features

### Rate Limiting

- **10 authentication attempts per 15 minutes** per IP address
- Automatic cleanup of rate limit entries every 5 minutes
- Prevents brute force attacks

### JWT Token Security

JWT tokens include:

```json
{
  "userId": "clx123456",
  "email": "admin@example.com",
  "role": "ADMIN",
  "googleId": "1234567890",
  "type": "google",
  "iat": 1234567890,
  "exp": 1235172690
}
```

- **7-day expiration** (configurable)
- **role field** enables IP bypass for admins
- **googleId** enables linking multiple accounts
- **HS256 algorithm** with secret key

### Audit Logging

All authentication events logged to `audit_logs` table:

- `GOOGLE_LOGIN_SUCCESS` - Successful authentication
- `GOOGLE_ADMIN_ACCESS_DENIED` - Non-admin tried admin login
- Includes IP address, user agent, timestamp

## Testing

### Test Admin Login (curl)

```bash
# Step 1: Get OAuth URL
curl -X POST http://localhost:4000/api/auth/google/init \
  -H "Content-Type: application/json" \
  -d '{"type":"admin"}'

# Copy authUrl and open in browser
# Sign in with Google
# Get redirected to callback URL with code

# Step 2: Exchange code for token
curl -X POST http://localhost:4000/api/auth/google/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "4/0AbCD1234...",
    "state": "eyJ0eXBlIjoiYWRtaW4i..."
  }'

# Response includes JWT token
```

### Test IP Bypass

```bash
# Use JWT token to access admin endpoint from ANY IP
curl http://localhost:4000/api/admin/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ✅ Works from any IP address because role=ADMIN
```

## Troubleshooting

### Error: "Missing GOOGLE_CLIENT_ID"

Add Google OAuth credentials to `.env`:

```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/auth/google/callback"
```

### Error: "Email not verified"

User must verify their Google account email before authenticating.

### Error: "Too many authentication attempts"

Rate limit exceeded (10 attempts per 15 minutes). Wait 15 minutes or adjust rate limit in `googleAuth.ts`.

### Error: "Admin access required"

User with `role: 'USER'` tried to use admin login. Only accounts with `role: 'ADMIN'` in database can use admin Google
login.

### Error: "Google account already linked to another user"

The Google ID is already associated with a different account. Unlink from other account first.

## Production Deployment

### Environment Variables

```bash
# Production URLs
GOOGLE_REDIRECT_URI="https://api.advanciapay.com/api/auth/google/callback"
FRONTEND_URL="https://advanciapay.com"

# Use production Google OAuth credentials
GOOGLE_CLIENT_ID="prod-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="prod-secret-here"
```

### Google Cloud Console

1. Add production domain to authorized origins:

   ```
   https://advanciapay.com
   https://api.advanciapay.com
   ```

2. Add production callback URL:

   ```
   https://api.advanciapay.com/api/auth/google/callback
   ```

3. Configure OAuth consent screen for production
4. Submit for verification if needed (for large user base)

## Admin Lockout Prevention - Summary

### The Problem

Admins could be locked out if their IP address changes or if IP whitelist is misconfigured.

### The Solution

**JWT with role=ADMIN bypasses IP whitelist automatically**

1. Admin signs in with Google
2. Backend verifies Google token
3. Backend creates/finds user, checks role
4. Backend generates JWT with `role: 'ADMIN'`
5. Frontend stores JWT in localStorage
6. All API requests include JWT in Authorization header
7. `ipWhitelist.ts` middleware checks JWT role
8. If `role === 'ADMIN'`, **bypass IP whitelist completely**
9. Admin can access from **any IP address** worldwide

### Why It Works

- No code changes needed to `ipWhitelist.ts` (already implemented)
- Works with any auth method (password, Web3, Google)
- JWT role field is the single source of truth
- Consistent security model across all authentication methods

## Next Steps

1. ✅ Backend Google OAuth implementation (COMPLETE)
2. ⏳ Frontend Google Sign-In button component
3. ⏳ Admin dashboard Google auth integration
4. ⏳ Test with multiple Google accounts
5. ⏳ Production deployment and testing

## Support

For issues or questions:

- Check audit logs: `SELECT * FROM audit_logs WHERE action LIKE 'GOOGLE%'`
- Check rate limiting: Review console logs for rate limit messages
- Check JWT token: Decode at [jwt.io](https://jwt.io) to verify role field
- Check Google OAuth:
  [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
