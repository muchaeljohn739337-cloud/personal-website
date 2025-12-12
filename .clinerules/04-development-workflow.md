# Development Workflow

## Brief Overview

Commands and processes for developing Advancia PayLedger.

## Development Commands

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

## Before Committing

1. Run `npm run type-check` - TypeScript must compile cleanly
2. Run `npm run lint` - ESLint errors must be fixed
3. Run `npm test` - Unit tests must pass
4. If Prisma schema changed, run `npx prisma generate`

## Testing Patterns

- Unit tests: `__tests__/` mirrors source structure
- E2E tests: `e2e/*.spec.ts` with Playwright
- Mock Prisma with `jest.mock('@/lib/prismaClient')`

## Common Gotchas

1. **Build ignores TS/ESLint errors** - Always run checks locally
2. **Prisma schema changes** require `npx prisma generate` before TypeScript sees them
3. **Route groups** `(admin)`, `(dashboard)` don't affect URL paths
4. **Heavy components** should use `dynamic()` import - see `app/layout.tsx`

## Git Workflow

- Branch strategy: `main` (production), `develop` (staging), feature branches
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- PR template in `.github/pull_request_template.md`
