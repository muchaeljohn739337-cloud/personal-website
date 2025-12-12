# Security Implementation Guide

## 🔒 Security Recommendations Implementation

### Status: IN PROGRESS

**Date**: December 10, 2025

---

## 1. Secret Rotation (CRITICAL - HIGH PRIORITY)

### Exposed Secrets to Rotate

The following secrets were exposed in the repository and MUST be rotated immediately:

#### Database Credentials

- **DATABASE_URL**: `postgresql://postgres:[PASSWORD]@db.xesecqcqzykvmrtxrzqi.supabase.co:5432/postgres`
  - ⚠️ **SECURITY**: Password has been rotated - use new password from secure storage
  - **Action**: Password updated in Vercel and GitHub Secrets
  - **Priority**: RESOLVED - Password rotated

#### Authentication Secrets

- **NEXTAUTH_SECRET**: `JV9HXAvzT/BNC+aeHVKfk3Kg1OiOkUDMw5W2jzZm0+s=`
  - **Action**: Generate new secret and update in Vercel
  - **Priority**: CRITICAL

#### New Generated Secrets (DO NOT COMMIT)

```bash
# Use these NEW secrets in Vercel only - DO NOT commit to git
JWT_SECRET=t++j9qHWunNgzz/3oZ0fCETkOFiE/sHnVXvJS40K12I=
SESSION_SECRET=wrIOnlD67FGqxBtBUmJouECR+1lWvF50piIZ2pypnDc=
NEXTAUTH_SECRET=UvCTSzKA7RdYRmjojBZV9j96A5AtOYyqbsd03tT9POM=
```

---

## 2. Immediate Actions Required

### Step 1: Rotate Supabase Database Password

```bash
# Go to Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi
2. Go to Settings > Database
3. Click "Reset Database Password"
4. Copy the new password
5. Update DATABASE_URL in Vercel (see Step 3)
```

### Step 2: Remove .env from Git History

```bash
# Remove .env file from git history completely
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Alternative: Use BFG Repo-Cleaner (faster)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
# bfg --delete-files .env
# git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

### Step 3: Configure Vercel Environment Variables

#### Production Environment

```bash
# Navigate to: https://vercel.com/your-project/settings/environment-variables

# Add these variables for Production:
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_URL=https://your-domain.vercel.app

# NEW ROTATED SECRETS (from Step 1 above)
JWT_SECRET=[Copy from generated secrets above]
SESSION_SECRET=[Copy from generated secrets above]
NEXTAUTH_SECRET=[Copy from generated secrets above]

# Database (with NEW password from Supabase)
DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.xesecqcqzykvmrtxrzqi.supabase.co:5432/postgres

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=74ecde4d46d4b399c7295cf599d2886b
CLOUDFLARE_R2_BUCKET_NAME=uploads

# Email
EMAIL_FROM=noreply@advanciapayledger.com
EMAIL_FROM_NAME=Advancia PayLedger
```

#### Preview Environment

```bash
# Add these variables for Preview:
NODE_ENV=preview
NEXT_PUBLIC_APP_URL=https://preview-branch.vercel.app
NEXTAUTH_URL=https://preview-branch.vercel.app

# Use SAME secrets as production
# Database can use same or separate preview database
```

#### Development Environment

```bash
# Add these variables for Development:
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

# Use different secrets for development (optional)
# Database can use local or development Supabase project
```

### Step 4: Update Local Development Setup

```bash
# 1. Create .env.local (NOT tracked by git)
cp env.example .env.local

# 2. Add your local development secrets to .env.local
# 3. NEVER commit .env.local
# 4. Update .env to only contain example values (no real secrets)
```

### Step 5: Clean Up Repository

```bash
# 1. Remove sensitive data from .env
# 2. Ensure .env only has example/template values
# 3. Commit the cleaned .env
git add .env
git commit -m "security: Remove sensitive data from .env"
git push origin master --force

# 4. Verify .gitignore includes:
.env.local
.env.*.local
.env.production
*.pem
*.key
*.secret
```

---

## 3. Vercel Secret Management Setup

### Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Add secrets (encrypted, not visible in dashboard)
vercel env add JWT_SECRET
vercel env add SESSION_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add DATABASE_URL

# Pull environment variables for local development
vercel env pull .env.local
```

### Using Vercel Dashboard

```bash
# 1. Go to: https://vercel.com/your-project/settings/environment-variables
# 2. Click "Add New"
# 3. Select environment (Production/Preview/Development)
# 4. Mark sensitive variables as "Sensitive" (hidden from logs)
```

---

## 4. Monitoring Setup

### Vercel Analytics

```bash
# 1. Enable Vercel Analytics
# Dashboard: https://vercel.com/your-project/analytics

# 2. Install analytics package
npm install @vercel/analytics

# 3. Add to app/layout.tsx:
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Monitoring (Sentry)

```bash
# 1. Sign up for Sentry: https://sentry.io
# 2. Install Sentry
npm install @sentry/nextjs

# 3. Initialize Sentry
npx @sentry/wizard@latest -i nextjs

# 4. Add to Vercel environment variables:
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### Deployment Alerts

```bash
# Configure in Vercel Dashboard:
# Settings > Notifications

# Available alerts:
- Deployment Failed
- Deployment Ready
- Domain Configuration Issues
- Build Errors
- High Error Rates

# Integration options:
- Email
- Slack
- Discord
- Webhooks
```

### Supabase Monitoring

```bash
# 1. Enable Supabase Monitoring
# Dashboard: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/reports

# 2. Set up alerts for:
- Database CPU usage > 80%
- Storage usage > 80%
- Connection pool exhaustion
- Slow queries

# 3. Enable Query Performance Insights
# Settings > Database > Query Performance
```

---

## 5. Additional Security Measures

### Implement Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Enable CORS Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL, 'https://your-domain.vercel.app'];

  const origin = request.headers.get('origin');

  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse(null, {
      status: 403,
      statusText: 'Forbidden',
    });
  }

  return NextResponse.next();
}
```

### Rate Limiting

```bash
# Install rate limiting package
npm install @upstash/ratelimit @upstash/redis

# Set up Upstash Redis (free tier available)
# Dashboard: https://console.upstash.com
```

---

## 6. Verification Checklist

### Security Verification

- [ ] All exposed secrets rotated
- [ ] .env removed from git history
- [ ] Vercel environment variables configured
- [ ] Local .env.local created (not tracked)
- [ ] .gitignore properly configured
- [ ] Security headers implemented
- [ ] CORS protection enabled

### Monitoring Verification

- [ ] Vercel Analytics enabled
- [ ] Error monitoring (Sentry) configured
- [ ] Deployment alerts set up
- [ ] Supabase monitoring enabled
- [ ] Slack/Email notifications configured

### Testing

- [ ] Test deployment with new secrets
- [ ] Verify database connection works
- [ ] Test authentication flow
- [ ] Verify error monitoring captures errors
- [ ] Test deployment failure alerts

---

## 7. Emergency Contacts & Resources

### Supabase Support

- Dashboard: https://supabase.com/dashboard
- Support: https://supabase.com/support

### Vercel Support

- Dashboard: https://vercel.com/dashboard
- Support: https://vercel.com/support

### Security Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/security-headers

---

## 8. Next Steps

1. **IMMEDIATE**: Rotate Supabase database password
2. **IMMEDIATE**: Update Vercel environment variables with new secrets
3. **HIGH**: Remove .env from git history
4. **HIGH**: Test deployment with rotated secrets
5. **MEDIUM**: Set up monitoring and alerts
6. **MEDIUM**: Implement additional security headers
7. **LOW**: Document security procedures for team

---

## Notes

- This document contains sensitive information. Keep it secure.
- Update this document as you complete each step.
- Review and rotate secrets quarterly.
- Conduct security audits regularly.
