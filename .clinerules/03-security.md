# Security Requirements

## Brief Overview

Security is critical for this fintech platform. All new code must follow these guidelines.

## Snyk Security Scanning

- Always run Snyk scans on new first-party code in Snyk-supported languages
- If security issues are found, attempt to fix them using Snyk results context
- Rescan after fixing to ensure no newly introduced issues
- Repeat until no new issues are found

## Authentication

- All API routes must validate auth via `getServerSession(authOptions)`
- Never bypass NextAuth - use `lib/auth.ts` configuration
- User roles: `USER`, `ADMIN`, `SUPER_ADMIN` - middleware enforces `/admin` routes

## Rate Limiting

Use rate limiting from `lib/security/rate-limit.ts` for public endpoints:

```typescript
import { checkRateLimit, getClientIP, rateLimitConfigs } from '@/lib/security/rate-limit';

const ip = getClientIP(request.headers);
const result = checkRateLimit(ip, rateLimitConfigs.auth);
if (!result.success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

## Environment Variables

- Never expose secrets in client code
- Check `lib/env.ts` for env var patterns before adding new ones
- Required vars: `JWT_SECRET`, `SESSION_SECRET`, `NEXTAUTH_SECRET`, `DATABASE_URL`

## Input Validation

- Always validate user input with Zod schemas from `lib/validations/`
- Sanitize all inputs before database operations
- Use parameterized queries (Prisma handles this automatically)

## OWASP Top 10 Awareness

- XSS: React escapes by default, avoid `dangerouslySetInnerHTML`
- CSRF: Use CSRF tokens for state-changing operations
- Injection: Use Prisma ORM (parameterized), never raw SQL
