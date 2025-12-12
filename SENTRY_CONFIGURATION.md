# Sentry Configuration Guide

**Status:** ✅ Configured and Secured  
**Last Updated:** December 10, 2025

## Overview

All Sentry credentials have been properly secured in GitHub Secrets and environment variables. **NO SECRETS ARE COMMITTED TO THE REPOSITORY.**

## Sentry Project Details

- **Organization:** advancia-pay
- **Project:** javascript-nextjs
- **Project ID:** 4510496006471680

## Secured Credentials

All the following credentials are stored in:

- GitHub Secrets (for CI/CD)
- `.env.local` (for local development - NOT tracked in git)

### GitHub Secrets Configured

| Secret Name              | Purpose                         | Status |
| ------------------------ | ------------------------------- | ------ |
| `NEXT_PUBLIC_SENTRY_DSN` | Public DSN for error reporting  | ✅ Set |
| `SENTRY_AUTH_TOKEN`      | Personal auth token for uploads | ✅ Set |
| `SENTRY_KEY`             | Public key for integrations     | ✅ Set |

### Available Endpoints (DO NOT COMMIT)

These endpoints are documented here for reference but should NEVER be hardcoded:

1. **DSN Endpoint** - For error reporting (public, safe in client code)
2. **OTLP Endpoint** - For OpenTelemetry Protocol traces
3. **Security Header Endpoint** - For Content Security Policy reporting
4. **Minidump Endpoint** - For native crash reporting
5. **Unreal Engine Endpoint** - For Unreal Engine integration
6. **Vercel Log Drain** - For Vercel logging integration
7. **Vercel Trace Drain** - For Vercel OTLP traces

All endpoints use authentication via `x-sentry-auth` headers with the Sentry key.

## Modern Instrumentation Files

The project uses Next.js 14+ instrumentation hooks:

### Server/Edge Runtime

**File:** `instrumentation.ts`

- Uses `register()` function
- Handles both `nodejs` and `edge` runtimes
- Filters sensitive headers (authorization, cookie, x-api-key)
- Environment-based sampling:
  - Production: 10% server, 5% edge
  - Development: 100% server, 50% edge

### Client Runtime

**File:** `instrumentation-client.ts`

- Session replay with error sampling
- Production sampling: 10% sessions, 100% errors
- Masks all text and blocks media
- Ignores browser extension errors

## Environment Variables

### Required in Production (Vercel)

```bash
NEXT_PUBLIC_SENTRY_DSN=<DSN_FROM_GITHUB_SECRETS>
SENTRY_AUTH_TOKEN=<TOKEN_FROM_GITHUB_SECRETS>
SENTRY_ORG=advancia-pay
SENTRY_PROJECT=javascript-nextjs
```

### Local Development (.env.local)

```bash
NEXT_PUBLIC_SENTRY_DSN=<copy_from_sentry_dashboard>
SENTRY_AUTH_TOKEN=<copy_from_sentry_dashboard>
```

## Vercel Integration

### Log Drain Setup (Optional)

If you want to send Vercel logs to Sentry:

1. Go to Vercel Project Settings > Log Drains
2. Add endpoint: `https://o4510495968002048.ingest.us.sentry.io/api/4510496006471680/integration/vercel/logs`
3. Add header: `x-sentry-auth: sentry sentry_key=<USE_SENTRY_KEY_FROM_GITHUB_SECRETS>`

### Trace Drain Setup (Optional)

For OpenTelemetry traces:

1. Go to Vercel Project Settings > Integrations
2. Configure OTLP endpoint: `https://o4510495968002048.ingest.us.sentry.io/api/4510496006471680/integration/otlp/v1/traces`
3. Add header: `x-sentry-auth: sentry sentry_key=<USE_SENTRY_KEY_FROM_GITHUB_SECRETS>`

## Source Maps Upload

Source maps are automatically uploaded during build when:

- `SENTRY_AUTH_TOKEN` is set
- Build runs in CI/CD or production environment
- Webpack plugin is configured (handled by `@sentry/nextjs`)

## Loading Script (Browser)

For manual browser integration (optional):

```html
<script
  src="https://js.sentry-cdn.com/0314003446dd77ca8c91be09fd19bae9.min.js"
  crossorigin="anonymous"
></script>
```

**Note:** This is only needed for non-Next.js pages. The instrumentation files handle this automatically for Next.js.

## Security Best Practices

### ✅ DO

- Store all credentials in GitHub Secrets
- Use `.env.local` for local development
- Reference environment variables in code: `process.env.NEXT_PUBLIC_SENTRY_DSN`
- Keep `.env` as a template with placeholders only
- Verify `.env.local` is in `.gitignore`

### ❌ DON'T

- Commit `.env.local` to git
- Hardcode DSN or auth tokens in source files
- Share credentials in chat, email, or documentation
- Commit the Sentry auth token
- Include secret keys in client-side code (except `NEXT_PUBLIC_*` variables)

## Testing Sentry Integration

### Test Error Capture

```typescript
// In any component or API route
import * as Sentry from '@sentry/nextjs';

try {
  throw new Error('Test error for Sentry');
} catch (error) {
  Sentry.captureException(error);
}
```

### Check Dashboard

1. Visit: https://advancia-pay.sentry.io/
2. Navigate to: Projects > javascript-nextjs
3. View: Issues tab for captured errors

## Troubleshooting

### No Errors Appearing in Sentry

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check browser console for Sentry initialization
3. Ensure sampling rate isn't filtering all events
4. Check network tab for requests to `sentry.io`

### Source Maps Not Uploading

1. Verify `SENTRY_AUTH_TOKEN` is set
2. Check build logs for upload confirmation
3. Ensure token has correct permissions (write)
4. Verify organization and project names match

### Build Warnings

If you see warnings about deprecated config files:

- Delete: `sentry.client.config.ts`
- Delete: `sentry.server.config.ts`
- Delete: `sentry.edge.config.ts`
- Keep: `instrumentation.ts` and `instrumentation-client.ts`

## Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Instrumentation Hook Docs](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [Sentry Dashboard](https://advancia-pay.sentry.io/)

## Support

For issues or questions:

- Sentry Support: https://sentry.io/support/
- Next.js Docs: https://nextjs.org/docs
- Project Issues: https://github.com/muchaeljohn739337-cloud/personal-website/issues
