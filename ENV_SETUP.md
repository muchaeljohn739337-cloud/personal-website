# Environment Variables Setup Guide

This document lists all environment variables required and optional for the SaaS platform.

## Quick Start

1. Create a `.env.local` file in the root directory
2. Copy the variables below that you need
3. Replace placeholder values with your actual credentials

## Required Variables

These MUST be set for the application to run:

```bash
# Core Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Application URL
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Production - Update these for your Cloudflare domain
# NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
# NEXTAUTH_URL=https://advanciapayledger.com
```

## Payment Providers

### Stripe

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

**Setup Steps:**

1. Create account at [Stripe](https://stripe.com/)
2. Get API keys from Dashboard > Developers > API keys
3. Set up webhook endpoint: `/api/stripe/webhook`
4. Copy webhook signing secret

---

### LemonSqueezy

```bash
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key_here
LEMONSQUEEZY_STORE_ID=your_lemonsqueezy_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_lemonsqueezy_webhook_secret_here
```

**Setup Steps:**

1. Create account at [LemonSqueezy](https://www.lemonsqueezy.com/)
2. Go to Settings > API
3. Generate API key
4. Get Store ID from Settings > Stores
5. Create webhook endpoint: `/api/payments/lemonsqueezy/webhook`
6. Copy webhook secret

---

### NOWPayments

```bash
NOWPAYMENTS_API_KEY=your_nowpayments_api_key_here
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret_here
```

**Setup Steps:**

1. Create account at [NOWPayments](https://nowpayments.io/)
2. Get API key from Dashboard > API Settings
3. Set up IPN (Instant Payment Notification) webhook: `/api/payments/nowpayments/webhook`
4. Copy IPN secret key

---

### Alchemy Pay

```bash
ALCHEMY_PAY_API_URL=https://openapi.alchemypay.org
ALCHEMY_PAY_APP_ID=your_alchemy_pay_app_id_here
ALCHEMY_PAY_APP_SECRET=your_alchemy_pay_app_secret_here
```

**Setup Steps:**

1. Create account at [Alchemy Pay](https://alchemypay.org/)
2. Apply for merchant account
3. Get App ID and App Secret from dashboard
4. Set callback URL: `/api/payments/alchemypay/webhook`

---

## OAuth Providers

### Google OAuth

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Setup Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

### GitHub OAuth

```bash
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

**Setup Steps:**

1. Go to [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and generate Client Secret

---

## Email Configuration

### SMTP (Generic)

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASSWORD=your_smtp_password_here
SMTP_FROM=noreply@yourdomain.com
```

### Resend (Recommended)

```bash
RESEND_API_KEY=re_your_resend_api_key_here
```

**Setup Steps:**

1. Create account at [Resend](https://resend.com/)
2. Get API key from Dashboard > API Keys
3. Verify your domain

---

## Redis (Optional - for caching & rate limiting)

```bash
REDIS_URL=redis://localhost:6379
```

Or for Redis Cloud:

```bash
REDIS_URL=rediss://default:password@host:port
```

---

## Feature Flags

```bash
ENABLE_2FA=true
ENABLE_EMAIL_VERIFICATION=true
```

---

## Monitoring & Analytics

### Sentry

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
NEXT_PUBLIC_SENTRY_DEBUG=false  # Set to 'true' for debugging
NEXT_PUBLIC_APP_VERSION=1.0.0    # App version for release tracking
```

**Setup Steps:**

1. Create account at [Sentry](https://sentry.io/)
2. Create new project (select Next.js)
3. Copy DSN from project settings (Client Keys section)
4. Get Auth Token from Settings > Account > API > Auth Tokens
5. Get Org and Project slugs from URL or project settings

---

### LogRocket

```bash
NEXT_PUBLIC_LOGROCKET_APP_ID=your_logrocket_app_id_here
```

**Setup Steps:**

1. Create account at [LogRocket](https://logrocket.com/)
2. Create new project
3. Copy App ID from project settings
4. Configure privacy settings in LogRocket dashboard

---

## Storage

### AWS S3

```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name_here
```

### Supabase Storage

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

---

## AI & Integrations

### OpenAI

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

**Setup Steps:**

1. Create account at [OpenAI](https://platform.openai.com/)
2. Go to API Keys section
3. Create new secret key

---

## Cloudflare (For Workers Deployment)

```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
```

**Setup Steps:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to My Profile > API Tokens
3. Create token with Workers permissions

---

## Complete Example `.env.local`

```bash
# ==============================================================================
# CORE CONFIGURATION (REQUIRED)
# ==============================================================================
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Production - Update these for your Cloudflare domain
# NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
# NEXTAUTH_URL=https://advanciapayledger.com
NODE_ENV=development

JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# ==============================================================================
# PAYMENT PROVIDERS
# ==============================================================================

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LemonSqueezy
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key_here
LEMONSQUEEZY_STORE_ID=your_lemonsqueezy_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_lemonsqueezy_webhook_secret_here

# NOWPayments
NOWPAYMENTS_API_KEY=your_nowpayments_api_key_here
NOWPAYMENTS_IPN_SECRET=your_nowpayments_ipn_secret_here

# Alchemy Pay
ALCHEMY_PAY_API_URL=https://openapi.alchemypay.org
ALCHEMY_PAY_APP_ID=your_alchemy_pay_app_id_here
ALCHEMY_PAY_APP_SECRET=your_alchemy_pay_app_secret_here

# ==============================================================================
# OAUTH
# ==============================================================================
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# ==============================================================================
# EMAIL
# ==============================================================================
RESEND_API_KEY=re_your_resend_api_key_here
SMTP_FROM=noreply@yourdomain.com

# ==============================================================================
# REDIS
# ==============================================================================
REDIS_URL=redis://localhost:6379

# ==============================================================================
# FEATURE FLAGS
# ==============================================================================
ENABLE_2FA=true
ENABLE_EMAIL_VERIFICATION=true
```

---

## Security Notes

⚠️ **IMPORTANT:**

- Never commit `.env.local` or `.env` files to git
- Use different secrets for development and production
- Rotate secrets regularly
- Use strong, randomly generated secrets (64+ characters for JWT secrets)
- In production, use environment variable management (Vercel, AWS Secrets Manager, etc.)
- Keep payment provider secrets secure and limit access

---

## Verification

After setting up your environment variables, you can verify them by:

1. Running the application: `npm run dev`
2. The app will validate required variables on startup
3. Check console for warnings about missing optional variables
4. Test payment providers individually in your admin dashboard

---

## Getting Help

If you encounter issues:

1. Check the console for specific missing variable errors
2. Verify all required variables are set
3. Ensure payment provider credentials are correct
4. Check webhook endpoints are properly configured
5. Review provider-specific documentation
