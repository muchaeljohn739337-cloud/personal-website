---
description: Auto-deployment instructions for GitHub Copilot agents
applyTo: "**"
---

## 🚀 Auto-Deployment Instructions for Copilot

### Project Overview

- **Project:** Advancia Pay Ledger - Modular SaaS Platform
- **Stack:** Node.js + Express + TypeScript (Backend), Next.js 14 (Frontend), PostgreSQL (Database)
- **Deployment Targets:**
  - Backend: Render (https://api.advanciapayledger.com)
  - Frontend: Vercel (https://advanciapayledger.com)
  - Database: PostgreSQL on Render

---

## 📋 Pre-Deployment Checklist

Before deploying, **ALWAYS verify:**

1. **Environment Variables**

   - Backend `.env` file exists and contains all required keys
   - Frontend `.env.local` contains `NEXT_PUBLIC_API_URL`
   - Never commit `.env` files to git

2. **Database Migrations**

   - Run `cd backend && npx prisma migrate status` to check pending migrations
   - If migrations pending: `npx prisma migrate deploy`
   - Always generate Prisma client: `npx prisma generate`

3. **Build Verification**

   - Backend: `cd backend && npm run build` (must succeed)
   - Frontend: `cd frontend && npm run build` (must succeed)
   - Fix all TypeScript errors before deploying

4. **Security Checks**
   - HTTPS enforcement enabled in production
   - CORS origins include production domains
   - Rate limiting configured
   - Security headers applied

---

## 🛠️ Deployment Commands

### Full Deployment (Backend + Frontend)

```powershell
# Run the comprehensive deployment script
.\scripts\ADVANCIA-FULL-DEPLOY.ps1
```

**What This Does:**

1. Checks git status and environment setup
2. Builds and tests backend
3. Deploys backend to Render
4. Builds and tests frontend
5. Deploys frontend to Vercel
6. Verifies deployments with health checks

### Backend Only Deployment

```powershell
# Method 1: Via Render CLI (recommended)
cd backend
render deploy

# Method 2: Git push trigger
git add .
git commit -m "deploy: backend updates"
git push origin main
# Render auto-deploys on git push
```

### Frontend Only Deployment

```powershell
# Method 1: Via Vercel CLI (recommended)
cd frontend
vercel --prod

# Method 2: Git push trigger
git add .
git commit -m "deploy: frontend updates"
git push origin main
# Vercel auto-deploys on git push
```

### Database Migration Deployment

```powershell
# When schema changes are made
cd backend

# 1. Create migration
npx prisma migrate dev --name <migration_name>

# 2. Push to production database
npx prisma migrate deploy

# 3. Generate client
npx prisma generate

# 4. Restart backend service
render restart advancia-backend
```

---

## 🔄 Automated Deployment Workflows

### GitHub Actions Auto-Deploy

**File:** `.github/workflows/deploy.yml` (if exists)

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch

**Steps:**

1. Checkout code
2. Install dependencies
3. Run tests
4. Build backend and frontend
5. Deploy to Render (backend) and Vercel (frontend)
6. Send Slack/Discord notification

### Pre-Commit Hooks

**File:** `.husky/pre-commit` (if exists)

**Checks Before Commit:**

- TypeScript compilation (`tsc --noEmit`)
- ESLint validation
- Prettier formatting
- Unit tests pass

---

## 🚨 Deployment Safety Rules

### NEVER Deploy If:

1. **Tests are failing**

   ```powershell
   cd backend && npm test
   cd frontend && npm test
   ```

2. **TypeScript errors exist**

   ```powershell
   # Backend
   cd backend && npx tsc --noEmit

   # Frontend
   cd frontend && npx tsc --noEmit
   ```

3. **Database migrations are pending**

   ```powershell
   cd backend && npx prisma migrate status
   ```

4. **Environment variables are missing**

   - Check `backend/.env` for required keys
   - Verify Render environment variables match
   - Confirm Vercel environment variables match

5. **Build fails locally**
   - Backend must build: `cd backend && npm run build`
   - Frontend must build: `cd frontend && npm run build`

### ALWAYS Do After Deployment:

1. **Verify Health Endpoints**

   ```bash
   # Backend health check
   curl https://api.advanciapayledger.com/api/health

   # Frontend health check
   curl https://advanciapayledger.com
   ```

2. **Check Logs**

   ```powershell
   # Backend logs
   render logs advancia-backend --tail

   # Frontend logs
   vercel logs advancia-frontend
   ```

3. **Test Critical Paths**
   - User registration/login
   - Payment processing
   - Admin console access
   - Real-time notifications (Socket.IO)

---

## 🔧 Common Deployment Issues & Fixes

### Issue 1: Backend Won't Start

**Symptoms:** Render shows "Service Unavailable" or restarts repeatedly

**Fixes:**

1. Check environment variables in Render dashboard
2. Verify `DATABASE_URL` is correct
3. Run migrations: `npx prisma migrate deploy`
4. Check logs: `render logs advancia-backend`
5. Restart service: `render restart advancia-backend`

### Issue 2: Frontend Build Fails

**Symptoms:** Vercel build fails with TypeScript errors

**Fixes:**

1. Fix TypeScript errors locally first: `cd frontend && npx tsc --noEmit`
2. Ensure `NEXT_PUBLIC_API_URL` is set in Vercel environment variables
3. Check Next.js config: `next.config.js` must export valid config
4. Verify all dependencies are installed: `npm install`

### Issue 3: Database Connection Fails

**Symptoms:** Backend can't connect to PostgreSQL

**Fixes:**

1. Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database?schema=public`
2. Check database is running: `psql $DATABASE_URL -c "SELECT 1"`
3. Whitelist Render IPs in database firewall
4. Test connection: `cd backend && npx prisma db execute --file <(echo 'SELECT 1')`

### Issue 4: CORS Errors in Production

**Symptoms:** Frontend can't call backend APIs, browser shows CORS error

**Fixes:**

1. Add production frontend URL to `backend/src/config/index.ts`:
   ```typescript
   allowedOrigins: [
     "https://advanciapayledger.com",
     "https://www.advanciapayledger.com",
     // ... other origins
   ];
   ```
2. Redeploy backend
3. Clear browser cache and test

### Issue 5: Environment Variables Missing

**Symptoms:** Backend crashes with "JWT_SECRET is not defined" or similar

**Fixes:**

1. Check Render environment variables match `backend/.env.example`
2. Add missing variables in Render dashboard
3. Required backend variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
4. Required frontend variables:
   - `NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com`

---

## 🎯 Deployment Verification Tests

### Automated Test Script

```powershell
# Run comprehensive production verification
node production-verification.js
```

**What It Tests:**

- ✅ Backend health endpoint responds
- ✅ Frontend loads successfully
- ✅ Database connection works
- ✅ Authentication endpoints functional
- ✅ Payment processing available
- ✅ Real-time Socket.IO connections
- ✅ Security headers present
- ✅ HTTPS enforced

### Manual Verification Checklist

After deployment, manually verify:

- [ ] **User Registration** - Create new test account
- [ ] **User Login** - Login with test credentials
- [ ] **Dashboard Access** - View user dashboard
- [ ] **Admin Console** - Access `/admin` (admin account)
- [ ] **Payment Processing** - Initiate test payment (Stripe test mode)
- [ ] **Crypto Wallet** - View crypto wallet balances
- [ ] **Withdrawal System** - Create withdrawal request
- [ ] **Real-time Notifications** - Trigger notification, verify received
- [ ] **Socket.IO Connection** - Check browser console for connection
- [ ] **Security Headers** - Verify HSTS, CSP headers present

---

## 📦 Deployment Scripts Reference

### Available PowerShell Scripts

| Script                          | Purpose                            | Usage                                     |
| ------------------------------- | ---------------------------------- | ----------------------------------------- |
| `ADVANCIA-FULL-DEPLOY.ps1`      | Full backend + frontend deployment | `.\scripts\ADVANCIA-FULL-DEPLOY.ps1`      |
| `Quick-Deploy-Azure-Simple.ps1` | Deploy .NET backend to Azure       | `.\scripts\Quick-Deploy-Azure-Simple.ps1` |
| `start-dev-servers.ps1`         | Start local development servers    | `.\scripts\start-dev-servers.ps1`         |
| `commit-and-deploy.ps1`         | Git commit and auto-deploy         | `.\scripts\commit-and-deploy.ps1`         |

### VS Code Tasks

**Run via:** `Ctrl+Shift+B` or Command Palette → "Tasks: Run Task"

- **🚀 Start Development Servers** - Start backend + frontend locally
- **🔍 Type Check & Lint** - Validate TypeScript and ESLint
- **📦 Build & Deploy** - Full production deployment
- **🗄️ Database Tools** - Open Prisma Studio
- **🧪 Run Tests** - Execute backend and frontend tests
- **🔗 Test Frontend→Backend Connectivity** - Verify CORS and API connection

---

## 🔐 Security Considerations for Deployment

### Required Security Measures

1. **HTTPS Enforcement**

   - Backend automatically redirects HTTP → HTTPS in production
   - HSTS headers enabled with 1-year max-age
   - Configured in `backend/src/middleware/httpsEnforcement.ts`

2. **Rate Limiting**

   - AI rate limiter protects external connectors
   - Stripe: 30 requests/min, 5 concurrent
   - Crypto: 20 requests/min, 3 concurrent
   - Email: 50 requests/min, 10 concurrent
   - Configured in `backend/src/middleware/aiRateLimiter.ts`

3. **Security Headers**

   - CSP with whitelist for Stripe, CDNs
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Configured in `backend/src/middleware/httpsEnforcement.ts`

4. **Environment Secrets**

   - Never commit `.env` files
   - Use Render/Vercel environment variable UI
   - Rotate secrets regularly (JWT_SECRET, API keys)

5. **Database Security**
   - Use strong passwords (20+ characters)
   - Enable SSL for database connections
   - Whitelist only necessary IPs
   - Regular backups enabled

---

## 🚀 Quick Deployment Commands

### For Copilot Agents - Copy & Paste Ready

```powershell
# ═══════════════════════════════════════════════════════════════
# QUICK DEPLOYMENT - FULL STACK
# ═══════════════════════════════════════════════════════════════

# 1. Verify everything builds locally
cd backend
npm run build
npx prisma migrate status
cd ../frontend
npm run build

# 2. Run full deployment script
cd ..
.\scripts\ADVANCIA-FULL-DEPLOY.ps1

# 3. Verify deployment
curl https://api.advanciapayledger.com/api/health
curl https://advanciapayledger.com

# ═══════════════════════════════════════════════════════════════
# QUICK DEPLOYMENT - BACKEND ONLY
# ═══════════════════════════════════════════════════════════════

cd backend
npm run build
git add .
git commit -m "deploy: backend updates"
git push origin main
# Wait for Render auto-deploy (~2-3 minutes)
curl https://api.advanciapayledger.com/api/health

# ═══════════════════════════════════════════════════════════════
# QUICK DEPLOYMENT - FRONTEND ONLY
# ═══════════════════════════════════════════════════════════════

cd frontend
npm run build
vercel --prod
# Or via git push
git add .
git commit -m "deploy: frontend updates"
git push origin main
# Wait for Vercel auto-deploy (~1-2 minutes)
curl https://advanciapayledger.com

# ═══════════════════════════════════════════════════════════════
# QUICK DEPLOYMENT - DATABASE MIGRATION
# ═══════════════════════════════════════════════════════════════

cd backend
npx prisma migrate dev --name <migration_name>
npx prisma migrate deploy
npx prisma generate
render restart advancia-backend
```

---

## 📊 Deployment Success Criteria

**Deployment is successful when:**

✅ **Backend:**

- Health endpoint returns 200: `https://api.advanciapayledger.com/api/health`
- Database connection works
- No error logs in Render
- All API endpoints respond correctly

✅ **Frontend:**

- Homepage loads: `https://advanciapayledger.com`
- No 404 or 500 errors
- API calls to backend succeed
- No console errors in browser

✅ **Database:**

- Migrations applied successfully
- Prisma client generated
- Connection pool stable
- No connection timeout errors

✅ **Security:**

- HTTPS enforced (no HTTP access)
- HSTS headers present
- CSP headers configured
- Rate limiting active

✅ **Real-time:**

- Socket.IO connects successfully
- Notifications received in real-time
- Admin console updates live
- No disconnection loops

---

## 🆘 Emergency Rollback Procedure

**If deployment causes critical issues:**

### Immediate Rollback

```powershell
# 1. Rollback Render backend to previous version
render rollback advancia-backend

# 2. Rollback Vercel frontend to previous deployment
vercel rollback advancia-frontend

# 3. Verify services are working
curl https://api.advanciapayledger.com/api/health
curl https://advanciapayledger.com
```

### Database Rollback

```powershell
# If migration caused issues
cd backend

# 1. Check migration history
npx prisma migrate status

# 2. Rollback last migration (⚠️ DANGEROUS - data loss possible)
npx prisma migrate resolve --rolled-back <migration_name>

# 3. Restart backend
render restart advancia-backend
```

### Git Revert

```powershell
# Revert last commit and redeploy
git revert HEAD
git push origin main

# Wait for auto-deployment to complete
```

---

## 🎓 Best Practices for Copilot Agents

### When Making Changes That Require Deployment

1. **Test locally first**

   - Always run `npm run dev` and test changes locally
   - Verify no errors in backend and frontend consoles

2. **Check TypeScript compilation**

   - Run `npx tsc --noEmit` in both backend and frontend
   - Fix all errors before committing

3. **Run tests**

   - Backend: `cd backend && npm test`
   - Frontend: `cd frontend && npm test`

4. **Update documentation**

   - If adding new endpoints, update API docs
   - If changing configuration, update README
   - Document breaking changes

5. **Commit with descriptive messages**

   ```
   feat: add user profile endpoint
   fix: resolve CORS issue in payments
   deploy: update security headers
   ```

6. **Deploy incrementally**

   - Deploy backend first if API changes
   - Then deploy frontend
   - Test after each deployment

7. **Monitor post-deployment**
   - Watch Render/Vercel logs for errors
   - Test critical user paths
   - Monitor error tracking (Sentry if configured)

---

## 📞 Support & Resources

**Documentation:**

- Backend README: `backend/README.md`
- Frontend README: `frontend/README.md`
- AI Safety Guide: `AI_SAFETY_INTEGRATION_GUIDE.md`
- Deployment Config: `DEPLOYMENT_CONFIG.md`

**Monitoring:**

- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Error Tracking: Check Sentry (if configured)

**Emergency Contacts:**

- Support Email: support@advanciapayledger.com
- Repository: GitHub Issues

---

## ✅ Deployment Checklist Summary

**Before Every Deployment:**

- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] Local build succeeds (`npm run build`)
- [ ] Database migrations ready (`npx prisma migrate status`)
- [ ] Environment variables verified
- [ ] CORS origins include production domains
- [ ] Security features enabled

**After Every Deployment:**

- [ ] Health endpoints respond (200 status)
- [ ] No errors in deployment logs
- [ ] Critical user flows tested
- [ ] Security headers present
- [ ] Socket.IO connections work
- [ ] Database queries succeed

**If Issues Occur:**

- [ ] Check logs immediately
- [ ] Rollback if critical
- [ ] Fix issue locally
- [ ] Test thoroughly
- [ ] Redeploy with fix

---

**🚀 This guide ensures safe, reliable, and automated deployments for the Advancia Pay Ledger platform.**
