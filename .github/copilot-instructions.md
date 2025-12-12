## Advancia Pay Ledger — AI Agent Working Guide

Purpose: Give AI coding agents the minimum, specific context to be productive in this repo without guesswork.

### Architecture and Boundaries

- **Backend**: Node.js + Express + TypeScript, Prisma ORM, Socket.IO. Entry: `backend/src/index.ts`.
- **Frontend**: Next.js 14 (App Router) in `frontend/` consuming `/api/**` from backend.
- **Database**: PostgreSQL via Prisma with many models (see `backend/prisma/schema.prisma`). Always use `backend/src/prismaClient.ts` singleton.
- **Realtime**: Socket.IO on the same HTTP server. Clients join per-user rooms: `join-room` → room `user-${userId}`. Server emits domain-specific events.
- **Notifications**: Web push + email + socket broadcast in `backend/src/services/notificationService.ts`. Socket instance injected via `setSocketIO(io)` from `index.ts`.
- **Config/CORS**: `backend/src/config/index.ts` computes `allowedOrigins`. Add new origins there, not in middleware directly.

### Mom-Shield-Dad Architecture (Critical)

This platform implements autonomous AI security + incident response via 5 core systems working together:

1. **Mom AI Core** (`backend/src/ai/mom-core/`) - Autonomous incident handling with 4 specialized agents:
   - `analyzer.ts`: Root cause analysis, pattern matching (~300 lines)
   - `problem-solver.ts`: Generate fix proposals (~350 lines)
   - `decision.ts`: Risk evaluation, approval routing (~400 lines)
   - `learner.ts`: Track outcomes, improve over time (~300 lines)
   - Workflow: Analyze → Solve → Decide → Learn. API: `POST /api/mom/handle-incident`

2. **SHIELD** (`backend/src/security/comprehensive-shield.ts`) - 8-layer security middleware:
   - Rate limiting, IP blacklist, API key validation, SQL/XSS detection, content moderation
   - All `/api/**` routes protected. Activated via `activateShield()` in `index.ts`

3. **SIEM** (`backend/src/services/SIEMIntegration.ts`) - Threat correlation with 5 rules:
   - Brute force, suspicious withdrawals, API key compromise, DDoS, coordinated attacks
   - Creates incidents, multi-channel alerts (Slack, Email, PagerDuty). API: `/api/siem`

4. **Sandbox Runner** (`backend/src/services/SandboxRunner.ts`) - Docker isolation:
   - Executes untrusted code in isolated containers (no network, read-only, limits)
   - Requires Docker daemon. API: `POST /api/sandbox/execute`

5. **Dad Admin Console** (`backend/src/routes/dad-console.ts`) - Human oversight:
   - Approval workflows (RBAC-based), emergency kill-switch, rollback capabilities
   - IP-whitelisted. API: `/api/dad/*` (requires admin role)

### Key runtime behaviors and cross-cutting concerns

- Rate limiting applies to all `/api/**` (see `rateLimit` middleware in `backend/src/index.ts`).
- Stripe webhook requires raw body on `/api/payments/webhook` before `express.json()`. Don't move middleware order.
- AuthN/AuthZ: JWT with `authenticateToken` and role gates via `allowRoles/requireAdmin` (see `backend/src/middleware/auth.ts` and usages in routes like `users.ts`, `support.ts`). Some routes also check an `x-api-key` header in development-friendly way (see `routes/auth.ts`).
- Decimals: Prisma Decimal fields should be serialized as strings in JSON responses. Use `backend/src/utils/decimal.ts` helpers: `serializeDecimal()`, `serializeDecimalFields()`, `serializeDecimalArray()`.
- Background jobs: `node-cron` schedules notification fallback emails in `index.ts`.

### Route conventions and wiring

- Routers live in `backend/src/routes/*.ts`. Each exports an Express router:
  - Example: `tokens.ts`, `rewards.ts`, `auth.ts`, `system.ts`, `users.ts`, `support.ts`.
- Register routers in `backend/src/index.ts` under `/api/<name>` in the "Registering routes" section. Keep the Stripe webhook raw-body line before `express.json()`.
- Input validation and security headers live in `backend/src/middleware/security.ts`; reuse `validateInput`, `securityHeaders` if adding endpoints.

### Data model hot spots (Prisma)

- Core models: `User`, `Transaction`, `TokenWallet`, `TokenTransaction`, `Reward`, `UserTier`, `AuditLog`, crypto orders/withdrawals, notifications, support, and Ethereum activity.
- When you add or change schema:
  - Update `backend/prisma/schema.prisma` → run `npx prisma migrate dev` in `backend`.
  - Regenerate client if needed: `npm run prisma:generate`.
  - Verify with `npx prisma studio`.

### Realtime and notifications

- To emit to a specific user: join room `user-${userId}` then `io.to(`user-${userId}`).emit(''event'', payload)`.
- Notification service sends socket, push (web-push), and email (nodemailer). Environment keys: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `EMAIL_USER`, `EMAIL_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`.

### External integrations

- **Authentication (Email-Only OTP)**: Twilio SMS removed for cost savings ($18-27/year saved). Authentication now uses:
  - Email OTP via Gmail SMTP (free) - see `routes/auth.ts`
  - Password login with bcrypt hashing
  - TOTP 2FA (Time-based One-Time Password)
  - Required env vars: `EMAIL_USER`, `EMAIL_PASSWORD`, `SMTP_HOST` (smtp.gmail.com), `SMTP_PORT` (587)
- **Stripe** payments webhook in `routes/payments.ts`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **Ethereum** gateway endpoints in `routes/ethereum.ts` (ethers v5 on backend; ethers v6 in frontend).
- **Unified AI Gateway** (`backend/src/services/UnifiedAIGateway.ts`) - 7 AI providers from one interface:
  - OpenAI (GPT-4o, GPT-4o-mini), Anthropic (Claude 3.5), DeepSeek, Gemini (FREE), Ollama (local/free), Cohere, Cloudflare AI Workers (FREE)
  - Auto-failover, cost optimization, response caching. API: `POST /api/ai-gateway/chat`
- **Cloudflare Services**:
  - R2 Storage (`backend/src/services/r2Storage.ts`): Zero-egress file storage. API: `/api/files/*`
  - AI Workers: Free Llama 3.1 models. Env: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
  - Middleware (`backend/src/middleware/cloudflare.ts`): Real IP detection, security headers

### Production domains and URLs

- **Primary production domain**: `https://www.advanciapayledger.com` (redirects to `https://advanciapayledger.com`)
- **Frontend production**: `https://advanciapayledger.com` (deployed on Vercel)
- **API production**: `https://api.advanciapayledger.com` (deployed on Render)
- **Admin subdomain**: `https://admin.advanciapayledger.com` (if configured)

### Deployment instructions

- **Full deployment guide**: See `.github/copilot-deployment-instructions.md` for comprehensive auto-deployment instructions
- **Quick deploy**: Run `.\scripts\ADVANCIA-FULL-DEPLOY.ps1` for full stack deployment
- **Backend only**: `cd backend && render deploy` or git push to trigger auto-deploy
- **Frontend only**: `cd frontend && vercel --prod` or git push to trigger auto-deploy
- **Pre-deployment checks**: Always verify tests pass, TypeScript compiles, builds succeed locally
- **Post-deployment**: Check health endpoints, verify logs, test critical user flows
- **Support email**: `support@advanciapayledger.com`
- When adding new features or routes, ensure CORS allows these production domains in `backend/src/config/index.ts`.
- Always test production URLs after deployment: `https://api.advanciapayledger.com/api/health`

### Local Dev Workflows (Linux/WSL/Bash)

```bash
# Backend (Port 4000)
cd backend && npm install && npm run dev  # ts-node-dev watches src/

# Frontend (Port 3000)
cd frontend && npm install && npm run dev  # Next.js dev server

# Database Setup (First Time)
cd backend
npx prisma migrate dev                     # Apply migrations
npx prisma studio                          # Open GUI browser

# Tests (Jest with --forceExit prevents hanging)
npm test                                   # All tests
npm run test:coverage                      # With coverage report
```

### Critical Workflow Gotchas

- **Middleware Order**: Stripe webhook raw body handler MUST come before `express.json()` in `backend/src/index.ts` (~line 120). Never reorder.
- **Socket.IO Injection**: Routes receive socket via setter functions like `setTransactionSocketIO(io)` called in `index.ts`. Check route file exports.
- **Prisma Singleton**: Always `import prisma from './prismaClient'`. Never `new PrismaClient()` in route files.
- **Decimal Fields**: Prisma Decimal types crash JSON.stringify. Use `serializeDecimal()` from `backend/src/utils/decimal.ts` before responses.
- **CORS Config**: Add origins to `backend/src/config/index.ts` `allowedOrigins` array only. Middleware reads from there.

### Debugging Patterns

```bash
# Backend debug mode
node --inspect=9229 -r ts-node/register backend/src/index.ts

# VS Code launch.json
{
  "name": "Backend Debug",
  "type": "node",
  "request": "attach",
  "port": 9229,
  "skipFiles": ["<node_internals>/**"]
}
```

Use `debugger;` statement in route handlers for breakpoints.

### AI Agent System (47+ agents)

- **Mom AI Core**: 5 agents (AnalysisAgent, SolutionAgent, DecisionAgent, LearningAgent, MomAICore orchestrator)
- **Multi-Agent Orchestrator** (`backend/src/ai-expansion/orchestrator/MultiAgentOrchestrator.ts`): 6 agents (analyst, coder, writer, researcher, planner, reviewer)
- **Business Agents** (`backend/src/agents/`): 21+ specialized agents (AIBuilderAgent, BugFixAgent, SecurityFraudAgent, TransactionAuditAgent, etc.)
- **RPA Agents** (`backend/src/agents/rpa/`): 9 monitoring agents (Agent1-9)
- Agent scheduler (`backend/src/agents/AgentScheduler.ts`) manages all agents with cron schedules
- Agents extend `BaseAgent` class with `execute()` method. API: `GET /api/agents/rpa/status`, `POST /api/agents/rpa/trigger`

### Implementation Tips Specific to This Repo

- **Prisma**: Always `import prisma from './prismaClient'` to avoid multiple client instances. Never instantiate directly.
- **Decimals**: Convert Prisma Decimal to string in responses: `serializeDecimal(value)` or `serializeDecimalFields(object, ['amount', 'balance'])`.
- **Socket.IO**: Routes get `io` via setter functions (`setTransactionSocketIO(io)` in `index.ts`). Export setter from route file, call in `index.ts`.
- **CORS**: Add origins to `backend/src/config/index.ts` `allowedOrigins` array. Never hardcode in middleware.
- **Stripe Webhook**: Raw body middleware must precede `express.json()` in `backend/src/index.ts` line ~120. Critical for signature verification.
- **Mom AI Incidents**: Use `momAICore.handleIncident({ type, severity, metadata })` → returns `{ decision, riskLevel, requiresApproval }`.
- **File Uploads**: Use R2 Storage with isolation: `uploadToR2({ userId, category, filename, buffer })` stores as `category/userId/timestamp-filename`.
- **Cloudflare**: Use `npx wrangler` for R2/Workers/AI operations (bucket list, deploy, logs).

### Key commands for development

**Backend:**

```bash
cd backend && npm install          # Install dependencies
npm run dev                        # Start dev server (ts-node-dev, port 4000)
npx prisma migrate dev             # Create/apply database migration
npx prisma studio                  # Open Prisma Studio GUI
npx prisma generate                # Regenerate Prisma Client after schema changes
npm test                           # Run tests
node --inspect=9229 -r ts-node/register src/index.ts  # Debug mode
```

**Frontend:**

```bash
cd frontend && npm install         # Install dependencies
npm run dev                        # Start Next.js (port 3000)
npm run build                      # Production build
npm run lint                       # ESLint check
```

**Deployment:**

```bash
./scripts/ADVANCIA-FULL-DEPLOY.ps1  # Full stack deployment (Windows)
cd backend && render deploy          # Backend only (Render)
cd frontend && vercel --prod         # Frontend only (Vercel)
npx wrangler r2 bucket list         # List Cloudflare R2 buckets
npx wrangler deploy backend/cloudflare-worker.js  # Deploy Worker
```

### Files to read first for context

- `backend/src/index.ts` (server, middleware order, route wiring, Socket.IO, cron, agent initialization)
- `backend/src/config/index.ts` (origins, ports, env derivation)
- `backend/src/ai/mom-core/index.ts` (Mom AI workflow: analyze → solve → decide → learn)
- `backend/src/services/UnifiedAIGateway.ts` (7 AI providers, failover, cost optimization)
- `backend/src/services/notificationService.ts` (push/email/socket pattern)
- `backend/src/utils/decimal.ts` (Decimal serialization helpers)
- `backend/prisma/schema.prisma` (entities & relations)
- `backend/PROJECT_README.md` (Mom-Shield-Dad architecture diagram)
- `frontend/README.md` and `backend/README.md` (commands and structure)

### Critical documentation

- `MOM_SHIELD_DAD_COMPLETE.md` - Complete architecture guide (827 lines)
- `DAD_CONSOLE_GUIDE.md` - Admin oversight system (535 lines)
- `UNIFIED_AI_GATEWAY_SETUP.md` - Multi-provider AI integration
- `CLOUDFLARE_COMPLETE_CONFIG.md` - R2, AI Workers, CDN setup
- `.github/copilot-deployment-instructions.md` - Automated deployment guide

If anything here is unclear or you need deeper conventions (tests, logging fields, error formats), ask and we'll refine this guide.
