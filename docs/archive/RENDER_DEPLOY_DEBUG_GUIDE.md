# 🔧 Render Deploy Debug Guide - Advancia Pay Ledger

## Current Deployment Status

**Last Check**: October 23, 2025  
**Backend API**: https://api.advanciapayledger.com  
**Frontend**: https://advanciapayledger.com  
**Status**: Backend returning 502 Bad Gateway ❌

---

## 🚨 Common Render Deployment Issues & Fixes

### Issue 1: 502 Bad Gateway (CURRENT ISSUE)

**Symptoms**:

- Backend health check fails
- `curl https://api.advanciapayledger.com/api/health` returns 502
- Render dashboard shows service as "Live" but unhealthy

**Root Causes**:

1. **Database connection failure**
2. **Prisma migration errors**
3. **Build command failure**
4. **Environment variable missing**
5. **Node.js process crash on startup**

**Debugging Steps**:

```powershell
# Step 1: Check Render logs
# Go to: https://dashboard.render.com/web/srv-XXXXX/logs

# Step 2: Look for these error patterns:
# - "Error: P1001: Can't reach database server"
# - "Migration failed"
# - "Cannot find module"
# - "ECONNREFUSED"
# - "Port already in use"
```

**Fix #1: Database Connection**

Update `render.yaml`:

```yaml
buildCommand: >
  npm ci &&
  npx prisma generate &&
  npx prisma migrate deploy || echo "Migration warning" &&
  npm run build

# Add to envVars:
- key: DATABASE_URL
  fromDatabase:
    name: advancia-db
    property: connectionString
```

**Fix #2: Add Connection Retry Logic**

Create `backend/src/utils/wait-for-db.ts`:

```typescript
import prisma from "../prismaClient";

export async function waitForDatabase(maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Database connected");
      return;
    } catch (error) {
      console.warn(`⚠️  DB connection attempt ${i + 1}/${maxAttempts} failed`);
      if (i === maxAttempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
```

Update `backend/src/index.ts`:

```typescript
import { waitForDatabase } from "./utils/wait-for-db";

async function start() {
  await waitForDatabase();
  server.listen(PORT, () => console.log(`Server on ${PORT}`));
}

start().catch((err) => {
  console.error("❌ Startup failed:", err);
  process.exit(1);
});
```

---

### Issue 2: Prisma Migration Failures

**Error Messages**:

```
Error: Migration `20251022094130_add_crypto_balances_to_users` failed
The migration has been rolled back.
```

**Fix**:

Update `render.yaml` buildCommand:

```yaml
buildCommand: >
  npm ci &&
  npx prisma migrate resolve --rolled-back 20251022094130_add_crypto_balances_to_users &&
  npx prisma migrate deploy &&
  npm run build
```

**OR** reset migrations (ONLY FOR DEVELOPMENT):

```powershell
# Connect to Render shell
render shell advancia-backend-upnrf

# Reset migrations
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

### Issue 3: Environment Variables Missing

**Common Missing Vars**:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `NODE_ENV=production`

**Check Render Dashboard**:

1. Go to Environment tab
2. Verify all variables from `.env.example`
3. Ensure `DATABASE_URL` is synced from database

**Test locally**:

```powershell
# backend/.env.render (create for testing)
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host/db"
JWT_SECRET="your-jwt-secret"
FRONTEND_URL="https://advanciapayledger.com"

# Test build locally
cd backend
npm run build
node dist/index.js
```

---

### Issue 4: Build Command Errors

**Current Build Command** (from render.yaml):

```yaml
buildCommand: "npm ci && npx prisma migrate resolve --rolled-back 20251022094130_add_crypto_balances_to_users || true && npx prisma migrate deploy && npm run build"
```

**Issues**:

- `|| true` suppresses errors ❌
- Single long command hard to debug ❌
- No explicit Prisma generate ❌

**Improved Build Command**:

```yaml
buildCommand: |
  set -e
  echo "📦 Installing dependencies..."
  npm ci --production=false
  echo "🔄 Generating Prisma Client..."
  npx prisma generate
  echo "🗄️ Running migrations..."
  npx prisma migrate deploy
  echo "🔨 Building TypeScript..."
  npm run build
  echo "✅ Build complete!"
```

---

### Issue 5: Port Configuration

**Error**: `Port 5000 is already in use`

**Fix** - Ensure index.ts uses Render's PORT:

```typescript
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

Update `package.json`:

```json
{
  "scripts": {
    "start:render": "node dist/index.js"
  }
}
```

---

### Issue 6: Health Check Path Wrong

**Current Config**:

```yaml
healthCheckPath: /api/health
```

**Verify endpoint exists**:

```typescript
// backend/src/index.ts
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});
```

**Test health check locally**:

```powershell
curl http://localhost:4000/api/health
# Should return: {"status":"healthy",...}
```

---

## 📋 Step-by-Step Deployment Checklist

### Pre-Deployment

- [ ] Test build locally: `npm run build`
- [ ] Test start locally: `npm run start:render`
- [ ] Verify all env vars in `.env.example` match Render dashboard
- [ ] Check Prisma migrations: `npx prisma migrate status`
- [ ] Test database connection locally
- [ ] Verify health endpoint works: `curl http://localhost:4000/api/health`

### Deployment

- [ ] Commit and push to GitHub
- [ ] Wait for Render auto-deploy (or trigger manual deploy)
- [ ] Watch build logs in real-time
- [ ] Check for Prisma migration warnings
- [ ] Verify service goes "Live" (green)

### Post-Deployment

- [ ] Test health check: `curl https://api.advanciapayledger.com/api/health`
- [ ] Test database: `curl https://api.advanciapayledger.com/api/admin/stats`
- [ ] Check application logs for errors
- [ ] Monitor error rate in Render dashboard
- [ ] Test frontend connection to backend

---

## 🔍 Debugging Commands

### View Render Logs (Web UI)

1. Go to https://dashboard.render.com
2. Click on `advancia-backend-upnrf`
3. Click "Logs" tab
4. Filter by "Error" or "Warning"

### SSH into Render Instance

```powershell
# Install Render CLI
npm install -g render-cli

# Login
render login

# Connect to shell
render shell advancia-backend-upnrf

# Once connected:
cd /opt/render/project/src
npm run build
node dist/index.js
```

### Test Database Connection

```powershell
# From Render shell:
npx prisma studio --browser none --port 5555
# Then access: https://YOUR-SERVICE.onrender.com:5555
```

### Check Environment Variables

```powershell
# From Render shell:
printenv | grep DATABASE_URL
printenv | grep JWT_SECRET
printenv | grep NODE_ENV
```

---

## 🚀 Quick Fixes (Try These First)

### Fix 1: Force Redeploy

```powershell
# Trigger redeployment without code changes
git commit --allow-empty -m "Trigger Render redeploy"
git push origin main
```

### Fix 2: Clear Build Cache

1. Go to Render Dashboard
2. Click on service
3. Settings → Clear Build Cache
4. Manual Deploy → Deploy latest commit

### Fix 3: Restart Service

1. Render Dashboard → Service
2. Manual Deploy → Restart

### Fix 4: Check Database Health

1. Render Dashboard → Databases
2. Click `advancia-db`
3. Check "Status" is "Available"
4. Test connection string

---

## 📊 Monitoring & Alerts

### Set Up Alerts

1. Render Dashboard → Service
2. Notifications → Add Notification
3. Email: your-email@example.com
4. Events: Deploy failed, Service unhealthy

### Add Custom Health Check

```typescript
// backend/src/routes/health.ts
import prisma from "../prismaClient";

router.get("/health", async (req, res) => {
  try {
    // Test database
    await prisma.$queryRaw`SELECT 1`;

    // Check critical services
    const checks = {
      database: "healthy",
      memory:
        process.memoryUsage().heapUsed / 1024 / 1024 < 400
          ? "healthy"
          : "warning",
      uptime: process.uptime(),
    };

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error.message,
    });
  }
});
```

---

## 🛠️ Advanced Troubleshooting

### Issue: Slow Response Times

**Solution**: Enable Prisma Query Logging

```typescript
// backend/src/prismaClient.ts
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// OR for production:
const prisma = new PrismaClient({
  log: [
    { level: "warn", emit: "event" },
    { level: "error", emit: "event" },
  ],
});

prisma.$on("warn", (e) => console.warn(e));
prisma.$on("error", (e) => console.error(e));
```

### Issue: Memory Leaks

**Solution**: Add Memory Monitoring

```typescript
// backend/src/utils/memory-monitor.ts
setInterval(() => {
  const used = process.memoryUsage();
  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(used.external / 1024 / 1024)}MB`,
  });
}, 60000); // Every minute
```

### Issue: Database Connection Pool Exhausted

**Solution**: Configure Prisma Connection Limit

```env
# .env
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20"
```

---

## 📞 Support Resources

- **Render Status**: https://status.render.com
- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Prisma Docs**: https://www.prisma.io/docs

---

## ✅ Current Action Plan for 502 Error

1. **Check Render Logs** (https://dashboard.render.com/web/srv-*/logs)

   - Look for "DATABASE_URL" connection errors
   - Check for Prisma migration failures
   - Verify Node.js didn't crash on startup

2. **Verify Environment Variables**

   - DATABASE_URL is set and synced from database
   - JWT_SECRET is configured
   - NODE_ENV=production

3. **Test Database Connection**

   - From Render shell: `npx prisma studio`
   - Verify migrations: `npx prisma migrate status`

4. **Update Build Command** (if needed)

   ```yaml
   buildCommand: npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
   ```

5. **Add Startup Retry Logic**

   - Implement waitForDatabase() helper
   - Add graceful error handling in index.ts

6. **Force Redeploy**
   ```powershell
   git commit --allow-empty -m "Fix 502 - add DB retry logic"
   git push origin main
   ```

---

**Last Updated**: October 23, 2025  
**Status**: Debugging 502 Bad Gateway on backend  
**Next Steps**: Check Render logs → Verify DB connection → Update build command
