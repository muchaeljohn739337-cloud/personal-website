# Security Configuration Guide

## ✅ Completed Security Setup

### 1. Sentry Error Tracking

**Status:** Configured (awaiting DSN)

**Setup:**

```bash
# Add to backend/.env:
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Features:**

- Automatic error capture and monitoring
- Performance profiling (10% sample rate in production)
- Release tracking
- Filters common network errors (ECONNREFUSED, timeout)

**Get Your DSN:**

1. Sign up at https://sentry.io
2. Create new project
3. Copy DSN from Settings → Client Keys
4. Paste into `.env` file

---

### 2. SMS Pool API Configuration

**Status:** ✅ Secure storage script ready

**Store API Key:**

```bash
cd backend
npx tsx scripts/store-smspool-key.ts
```

**Features:**

- Encrypted storage using SafePrisma
- Retrieved via `getSMSPoolCredentials()` function
- No plaintext keys in environment files

**Get Your API Key:**

1. Sign up at https://smspool.net
2. Navigate to API section
3. Copy your API key
4. Run storage script above

---

### 3. Cloudflare Turnstile CAPTCHA

**Status:** ✅ Configuration ready (disabled by default)

**Setup:**

```bash
# Add to backend/.env:
TURNSTILE_ENABLED=true
TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key
```

**Get Your Keys:**

1. Go to https://dash.cloudflare.com
2. Navigate to Turnstile section
3. Create new site/widget
4. Copy Site Key and Secret Key

**Implementation:**

- Add Turnstile widget to frontend forms
- Backend validates with TURNSTILE_SECRET_KEY
- Free tier: 1M requests/month

---

### 4. HTTPS & Security Headers

**Status:** ✅ Fully configured and active

**Enabled Security Features:**

#### HTTPS Enforcement

- Automatic HTTP → HTTPS redirect (production only)
- Redirect loop detection and prevention
- Trust proxy headers (Cloudflare/NGINX compatible)

#### Security Headers Applied:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [comprehensive policy]
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

#### CSP (Content Security Policy):

- `default-src 'self'`
- Allow Stripe, CDN, fonts
- Block inline scripts (except whitelisted)
- Prevent clickjacking

---

### 5. Rate Limiting & DDoS Protection

**Status:** ✅ Active

**Configuration (.env):**

```bash
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window
ENABLE_DDOS_PROTECTION=true
MAX_REQUESTS_PER_SECOND=50
```

**Features:**

- IP-based rate limiting (in-memory)
- Retry-After headers
- X-RateLimit-\* headers
- DDoS protection with request throttling

---

### 6. Cloudflare Integration

**Status:** ✅ Middleware active

**Configuration:**

```bash
CLOUDFLARE_ENABLED=true
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_API_TOKEN=your-api-token
TRUST_PROXY=true
CLOUDFLARE_IPS_ONLY=false
```

**Features:**

- Real IP extraction from CF-Connecting-IP
- Country/threat detection
- CDN acceleration
- Web Application Firewall (WAF)

---

## 🔐 Additional Security Features

### IP Whitelisting (Admin Routes)

**Status:** ✅ Disabled (using JWT authentication instead)

Dynamic IP/VPN friendly - uses JWT tokens for admin access control.

### Vault Encryption

**Status:** ✅ Active

- Secrets encrypted at rest
- Database-backed Vault storage
- SafePrisma integration

---

## 🚀 Quick Start

### 1. Enable Sentry (Optional but Recommended)

```bash
# Get DSN from sentry.io
echo "SENTRY_DSN=https://xxx@sentry.io/xxx" >> backend/.env
```

### 2. Store SMS Pool Key

```bash
cd backend
npx tsx scripts/store-smspool-key.ts
# Enter your API key when prompted
```

### 3. Enable Turnstile (Optional)

```bash
# Get keys from Cloudflare dashboard
echo "TURNSTILE_ENABLED=true" >> backend/.env
echo "TURNSTILE_SITE_KEY=your-key" >> backend/.env
echo "TURNSTILE_SECRET_KEY=your-secret" >> backend/.env
```

### 4. Production Deployment

```bash
# Set NODE_ENV=production to enable:
# - HTTPS enforcement
# - Strict CSP
# - Enhanced logging
export NODE_ENV=production
```

---

## 📊 Security Monitoring

### Endpoints:

- `/health` - Server health check
- `/api/admin/security/audit` - Security audit logs
- Sentry Dashboard - Real-time error monitoring

### Headers to Verify:

```bash
curl -I http://localhost:4000/health
# Should show:
# - Strict-Transport-Security
# - X-Frame-Options: DENY
# - Content-Security-Policy
```

---

## ⚠️ Important Notes

1. **Sentry DSN**: Required for error tracking in production
2. **SMS Pool**: Required for phone verification features
3. **Turnstile**: Recommended for public-facing forms
4. **HTTPS**: Auto-enabled in production (NODE_ENV=production)
5. **Rate Limits**: Adjust based on traffic patterns

---

## 🔧 Troubleshooting

### "Redirect loop detected"

- Check `TRUST_PROXY=true` in .env
- Verify proxy headers (X-Forwarded-Proto)

### "Rate limit exceeded"

- Increase `RATE_LIMIT_MAX_REQUESTS`
- Or increase `RATE_LIMIT_WINDOW_MS`

### "Sentry not initializing"

- Verify `SENTRY_DSN` format
- Check network connectivity

---

## 📝 Environment Variables Summary

```bash
# Sentry
SENTRY_DSN=

# SMS Pool (stored in Vault)
SMSPOOL_SERVICE_ID=1

# Turnstile
TURNSTILE_ENABLED=false
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Security
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_DDOS_PROTECTION=true
```

---

**All security middleware is ACTIVE and protecting your application! 🛡️**
