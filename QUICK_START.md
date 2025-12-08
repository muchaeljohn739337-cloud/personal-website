# 🚀 Quick Start Guide

## First Time Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
```bash
npm run env:template
# OR manually: cp env.example .env.local
```

### 3. Generate Secrets
```bash
npm run generate:secrets
# Copy the generated secrets to your .env.local file
```

### 4. Configure Database
```bash
# Update DATABASE_URL in .env.local
# Then run migrations
npm run prisma:migrate
```

### 5. Seed Database (Optional)
```bash
npm run prisma:seed
```

### 6. Create Admin User
```bash
npm run create-admin
```

### 7. Start Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

---

## Production Setup

### 1. Run Production Setup Script
```bash
npm run setup:prod
```

This will:
- Check environment variables
- Install dependencies
- Generate Prisma client
- Run migrations (optional)
- Create admin user (optional)
- Build application

### 2. Set Production Environment Variables

**In Vercel/Cloudflare Dashboard:**
- Go to Settings → Environment Variables
- Add all required variables from `ENV_SETUP.md`
- Use `npm run generate:secrets` to create new secrets

### 3. Deploy
```bash
npm run deploy:full
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # E2E tests with UI

# Code Quality
npm run lint             # Check code
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run format:check     # Check formatting

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio

# Deployment
npm run deploy:prod      # Deploy to production
npm run migrate:prod     # Run production migrations
npm run verify:prod      # Verify production deployment

# Utilities
npm run generate:secrets # Generate secure secrets
npm run env:template     # Create .env.local from template
npm run security:check   # Security audit
npm run audit:full       # Full system audit
```

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env.local`
- Check database is running
- Verify network access

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 20.x)

### Environment Variables Not Loading
- Ensure file is named `.env.local` (not `.env`)
- Restart dev server after changes
- Check variable names match exactly

---

## Next Steps

1. ✅ Complete first-time setup
2. ⚠️ Configure payment providers (see `PAYMENT_SETUP.md`)
3. ⚠️ Set up monitoring (see `TESTING_GUIDE.md`)
4. ⚠️ Configure DNS (see `CLOUDFLARE_SETUP.md`)
5. 🚀 Deploy to production (see `PRODUCTION_DEPLOYMENT.md`)

---

**Need Help?** Check the documentation files or run `npm run audit:full` for system status.

