# Copilot Instructions - Advancia PayLedger

## Architecture Overview

This is a **Next.js 14+ (App Router)** enterprise SaaS platform with:

- **Database**: PostgreSQL via Supabase + Prisma ORM (3200+ line schema)
- **Auth**: NextAuth.js with credentials, Google, GitHub providers + Web3Auth
- **Payments**: Multi-provider (Stripe, LemonSqueezy, NowPayments crypto)
- **AI Agents**: Claude-powered autonomous task system in `lib/agents/`
- **Deployment**: Vercel primary, Cloudflare Workers optional

## Key Directory Structure

```
app/                    # Next.js App Router - use route groups (admin)/, (dashboard)/
├── api/               # Route handlers - each has /route.ts
├── auth/              # Auth pages (login, register, etc.)
components/
├── ui/                # shadcn/ui components + custom (Button, Card, Input)
lib/
├── agents/            # AI agent system (orchestrator, worker, claude-client)
├── auth.ts            # NextAuth config - ALWAYS use this, not custom auth
├── prismaClient.ts    # Global Prisma instance - import as { prisma }
├── security/          # Rate limiting, CSRF, BotID protection
├── payments/          # Payment provider integrations
├── validations/       # Zod schemas for auth, organization, etc.
```

## Coding Patterns

### Imports - Use Path Aliases

```typescript
import { prisma } from '@/lib/prismaClient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
```

### Component Pattern

```tsx
'use client'; // Required for client components

import { cn } from '@/lib/utils/cn';

export function Component({ className, ...props }) {
  return <div className={cn('base-classes', className)} {...props} />;
}
```

### API Routes

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Implementation
}
```

### Validation with Zod

Use existing schemas in `lib/validations/` - see `lib/validations/auth.ts` for examples.

## Critical Conventions

1. **Prisma**: Never create new PrismaClient - import from `@/lib/prismaClient`
2. **Auth**: Use `getServerSession(authOptions)` for server-side, session hooks client-side
3. **Roles**: `USER`, `ADMIN`, `SUPER_ADMIN` - middleware enforces `/admin` routes
4. **Styling**: Tailwind CSS + `cn()` utility for class merging
5. **Environment**: Required vars in `lib/env.ts` - check before adding new ones

## Developer Workflow

```bash
# Development
npm run dev              # Start dev server
npm run type-check       # TypeScript validation
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint issues

# Database
npx prisma generate      # After schema changes
npx prisma migrate dev   # Create migration
npm run prisma:studio    # Visual database browser

# Testing
npm test                 # Jest unit tests
npm run test:e2e         # Playwright E2E tests
npm run test:db          # Database connection check
```

## Security Requirements

- Run **Snyk scans** on new code (see `.github/instructions/snyk_rules.instructions.md`)
- All API routes must validate auth via `getServerSession`
- Use rate limiting from `lib/security/rate-limit.ts` for public endpoints
- Never expose secrets - check `lib/env.ts` for env var patterns

## Testing Patterns

- **Unit tests**: `__tests__/` mirrors source structure
- **E2E tests**: `e2e/*.spec.ts` with Playwright
- Mock Prisma with `jest.mock('@/lib/prismaClient')`

## Common Gotchas

1. **Build ignores TS/ESLint errors** - always run `npm run type-check && npm run lint` locally
2. **Prisma schema changes** require `npx prisma generate` before TypeScript sees them
3. **Route groups** `(admin)`, `(dashboard)` don't affect URL paths
4. **Heavy components** should use `dynamic()` import - see `app/layout.tsx`

## AI Agent System

The Claude-powered agent system in `lib/agents/` follows this architecture:

```
Orchestrator → Worker → Job Handlers → Claude API
     ↓            ↓           ↓
 Task Queue   Checkpoints   Logs (Sentry)
```

**Key Components:**

- **orchestrator.ts** - `Orchestrator.submitTask(task, context)` queues and processes tasks
- **worker.ts** - `AgentWorker` polls for pending jobs, creates checkpoints for approvals
- **claude-client.ts** - `callClaude(systemPrompt, userPrompt, options)` wraps Anthropic API
- **job-handlers.ts** - Define handlers with checkpoint creation for code gen, data processing

**Adding a Job Handler:**

```typescript
// lib/agents/job-handlers.ts
export const myHandler: JobHandler = async (context) => {
  const { createLog, createCheckpoint, waitForCheckpoint, inputData } = context;

  await createLog('thinking', 'Processing request', inputData);

  // Create approval checkpoint before destructive actions
  const checkpointId = await createCheckpoint(
    CheckpointType.APPROVAL_REQUIRED,
    'Review before proceeding',
    { preview: data }
  );

  const approved = await waitForCheckpoint(checkpointId);
  if (!approved) throw new Error('Rejected');

  return { success: true };
};
```

**Environment:** Requires `ANTHROPIC_API_KEY` in `.env`

## Payment Integrations

Multi-provider payment system in `lib/payments/`:

| Provider         | Use Case                | Key Functions                                                           |
| ---------------- | ----------------------- | ----------------------------------------------------------------------- |
| **Stripe**       | Cards, subscriptions    | `createOptimizedCheckoutSession()` with 3D Secure                       |
| **LemonSqueezy** | MoR for SaaS            | `createCheckout()`, webhook signature via `LEMONSQUEEZY_WEBHOOK_SECRET` |
| **NowPayments**  | Crypto (BTC, ETH, etc.) | `createPayment()`, IPN callbacks                                        |

**Adding Payment Flow:**

```typescript
// Always persist payment state in Prisma
import { prisma } from '@/lib/prismaClient';

// Stripe pattern
const session = await createOptimizedCheckoutSession({
  customerId,
  priceId,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
  organizationId,
});

// Crypto pattern
const payment = await createPayment({
  userId,
  priceAmount: 99.0,
  priceCurrency: 'usd',
  payCurrency: 'btc',
  orderId: `order_${Date.now()}`,
});
```

**Webhook handlers** are in `app/api/webhooks/` - always verify signatures.

## Deployment

**Primary: Vercel**

```bash
npm run deploy:prod      # Build + deploy to Vercel
npm run verify:prod      # Health check post-deploy
```

**Alternative: Cloudflare Workers** (via OpenNext)

```bash
npm run build:worker     # prisma generate + next build + opennext
npm run deploy:worker    # wrangler pages deploy
```

**Cloudflare Config:** See `wrangler.toml` - uses R2 for caching, requires secrets via `wrangler secret put`.

**Environment Variables:**

- Vercel: Set via dashboard or `npm run setup:vercel:env`
- Cloudflare: `wrangler secret put VARIABLE_NAME`

## PR & Code Review Conventions

**Branch Strategy:** `main` (production), `develop` (staging), feature branches

**PR Requirements** (see `.github/pull_request_template.md`):

1. Fill out PR template with type of change and testing performed
2. CI must pass: lint, type-check, unit tests, E2E tests
3. Security fixes require Snyk scan results
4. Breaking changes require documentation updates

**Commit Style:** Conventional commits preferred

```
feat: add crypto payment flow
fix: resolve auth redirect loop
docs: update API documentation
chore: upgrade dependencies
```

**CI Pipeline** (`.github/workflows/ci.yml`):

- Lint + format check
- TypeScript type check
- Unit tests with coverage
- E2E tests (Playwright/Chromium)
