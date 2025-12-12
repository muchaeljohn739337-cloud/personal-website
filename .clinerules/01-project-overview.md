# Advancia PayLedger - Project Overview

## Brief Overview

Enterprise SaaS fintech platform built with Next.js 14+ (App Router).
These rules are project-specific for the Advancia PayLedger codebase.

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Database**: PostgreSQL via Supabase + Prisma ORM (3200+ line schema)
- **Authentication**: NextAuth.js with credentials, Google, GitHub providers + Web3Auth
- **Payments**: Multi-provider (Stripe, LemonSqueezy, NowPayments crypto)
- **AI Agents**: Claude-powered autonomous task system
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel primary, Cloudflare Workers alternative

## Project Structure

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

## Critical Files

- `lib/auth.ts` - NextAuth configuration, always use `getServerSession(authOptions)`
- `lib/prismaClient.ts` - Global Prisma instance, never create new PrismaClient
- `lib/env.ts` - Environment variable validation, check before adding new ones
- `prisma/schema.prisma` - Database schema (3200+ lines)
