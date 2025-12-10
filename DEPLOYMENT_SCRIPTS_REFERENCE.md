# 🚀 Deployment Scripts Quick Reference

**Last Updated:** 2025-01-27  
**Status:** All scripts verified and working ✅

---

## 📋 **Available Deployment Scripts**

### 🔐 **Secret Generation**

#### `npm run generate:prod-secrets`
**Purpose:** Generate secure production secrets for JWT, sessions, NextAuth, and cron jobs

**Output:**
- `JWT_SECRET` (128 hex characters)
- `SESSION_SECRET` (128 hex characters)
- `NEXTAUTH_SECRET` (44 base64 characters)
- `CRON_SECRET` (44 base64 characters)

**Usage:**
```bash
npm run generate:prod-secrets
```

**Note:** Also available as `npm run generate:prod:secrets` (duplicate command)

---

### 🔧 **Environment Setup**

#### `npm run setup:vercel-env`
**Purpose:** Interactive script to set up Vercel environment variables

**Usage:**
```bash
npm run setup:vercel-env
```

**What it does:**
- Guides you through setting Vercel environment variables
- Validates required variables
- Provides setup instructions

---

### ✅ **Pre-Deployment Verification**

#### `npm run deploy:checklist`
**Purpose:** Comprehensive pre-deployment verification checklist

**Usage:**
```bash
npm run deploy:checklist
```

**What it checks:**
- 🔴 Security (key rotation, secrets)
- 🟠 Environment variables
- 🟡 Pre-deployment checks (build, lint, tests)
- 🟢 Database (connection, migrations)
- 🔵 Supabase (connection, storage)
- 🟣 Deployment readiness
- ⚪ Post-deployment verification

**Output:** Detailed checklist with pass/fail status for each item

---

#### `npm run verify:vercel:env`
**Purpose:** Verify all required Vercel environment variables are set

**Usage:**
```bash
npm run verify:vercel:env
```

**What it checks:**
- Required environment variables presence
- Variable format validation
- Provides missing variables list

---

#### `npm run preprod:check`
**Purpose:** Pre-production deployment validation

**Usage:**
```bash
npm run preprod:check
```

**What it checks:**
- Node.js version
- Required files existence
- Environment variables
- Database migrations
- Build configuration

---

### 🚀 **Deployment**

#### `npm run deploy:prod`
**Purpose:** Standard production deployment to Vercel

**Usage:**
```bash
npm run deploy:prod
```

**What it does:**
1. Builds the project (`npm run build`)
2. Deploys to Vercel production (`vercel --prod`)

---

#### `npm run deploy:prod:safe`
**Purpose:** Safe production deployment with additional checks

**Usage:**
```bash
npm run deploy:prod:safe
```

**What it does:**
- Runs pre-deployment checks
- Validates environment variables
- Builds the project
- Deploys to Vercel with safety checks

**Script:** `scripts/deploy-to-production.ts`

---

#### `npm run deploy:production`
**Purpose:** Comprehensive production deployment orchestration

**Usage:**
```bash
npm run deploy:production
```

**What it does:**
- Environment variable checks
- Prisma generation
- Project build
- Database migrations
- Pre-production checks
- Vercel deployment

**Script:** `scripts/deploy-production.ts`

---

#### `npm run deploy:full`
**Purpose:** Full deployment with all safety checks

**Usage:**
```bash
npm run deploy:full
```

**What it does:**
1. Pre-production checks (`npm run preprod:check`)
2. Security checks (`npm run security:check`)
3. Production deployment (`npm run deploy:prod`)

---

### 🔍 **Post-Deployment Verification**

#### `npm run verify:prod`
**Purpose:** Verify production deployment health

**Usage:**
```bash
npm run verify:prod
```

**What it does:**
- Checks health endpoint: `https://advanciapayledger.com/api/health`
- Validates deployment is live and responding

---

### 📊 **Database Management**

#### `npm run migrate:prod`
**Purpose:** Run database migrations in production

**Usage:**
```bash
npm run migrate:prod
```

**What it does:**
- Applies pending Prisma migrations to production database
- Uses `prisma migrate deploy`

---

## 🎯 **Recommended Deployment Workflow**

### **Step 1: Generate Secrets**
```bash
npm run generate:prod-secrets
```
Copy the generated secrets to Vercel environment variables.

### **Step 2: Set Environment Variables**
```bash
npm run setup:vercel-env
```
Or manually set in Vercel Dashboard.

### **Step 3: Verify Setup**
```bash
npm run verify:vercel:env
npm run deploy:checklist
```

### **Step 4: Deploy**
```bash
npm run deploy:prod:safe
```
Or for full automated deployment:
```bash
npm run deploy:production
```

### **Step 5: Run Migrations**
```bash
npm run migrate:prod
```

### **Step 6: Verify Deployment**
```bash
npm run verify:prod
```

---

## 📝 **Quick Command Reference**

```bash
# Generate secrets
npm run generate:prod-secrets

# Setup environment
npm run setup:vercel-env

# Verify setup
npm run verify:vercel:env
npm run deploy:checklist
npm run preprod:check

# Deploy
npm run deploy:prod:safe        # Safe deployment
npm run deploy:production       # Full automated deployment
npm run deploy:full             # With all checks

# Post-deployment
npm run migrate:prod            # Run migrations
npm run verify:prod            # Check health
```

---

## 🔗 **Related Documentation**

- **`DEPLOYMENT_ACTION_PLAN.md`** - Complete step-by-step deployment guide
- **`DEPLOYMENT_STATUS.md`** - Current deployment status
- **`VERCEL_ENVIRONMENT_SETUP.md`** - Detailed Vercel setup instructions
- **`SECURITY_INCIDENT_SUPABASE_KEY_EXPOSURE.md`** - Security documentation

---

## ⚠️ **Important Notes**

1. **Always generate new secrets** for production - never reuse development secrets
2. **Set all environment variables** in Vercel before deploying
3. **Run pre-deployment checks** to catch issues early
4. **Verify deployment** after completion
5. **Run migrations** after successful deployment

---

**Status:** ✅ All scripts tested and working  
**Last Verified:** 2025-01-27

