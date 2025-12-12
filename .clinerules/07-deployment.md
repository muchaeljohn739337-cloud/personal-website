# Deployment Guide

## Brief Overview

Deployment options for Advancia PayLedger - Vercel (primary) and Cloudflare Workers.

## Vercel Deployment (Primary)

```bash
npm run deploy:prod      # Build + deploy to Vercel
npm run verify:prod      # Health check post-deploy
```

Environment variables: Set via Vercel dashboard or `npm run setup:vercel:env`

## Cloudflare Workers (Alternative)

Uses OpenNext for Cloudflare Pages deployment.

```bash
npm run build:worker     # prisma generate + next build + opennext
npm run deploy:worker    # wrangler pages deploy
```

Configuration in `wrangler.toml`:

- Uses R2 for caching
- Secrets via `wrangler secret put VARIABLE_NAME`

## Required Environment Variables

For both platforms:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth session encryption
- `JWT_SECRET` - JWT signing
- `SESSION_SECRET` - Session encryption

## Pre-Deployment Checklist

1. Run `npm run type-check` - no TypeScript errors
2. Run `npm run lint` - no ESLint errors
3. Run `npm test` - all tests pass
4. Run `npx prisma generate` - Prisma client up to date
5. Verify all required env vars are set
6. Run `npm run build` locally to catch issues

## Post-Deployment

1. Run `npm run verify:prod` to health check
2. Monitor error rates in Sentry
3. Verify key user flows manually
