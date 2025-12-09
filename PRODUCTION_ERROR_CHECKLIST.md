# 🔍 Production Environment Error Checklist

## Quick Diagnostic

Run this command to check for production errors:
```bash
npm run check:production
```

## Common Production Errors

### 1. Missing Environment Variables ❌

**Symptoms:**
- Application fails to start
- Authentication not working
- Database connection errors

**Required Variables:**
- `DATABASE_URL` - Production database connection
- `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `SESSION_SECRET` - Generate: `openssl rand -base64 32`
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `NEXTAUTH_URL` - Your production URL

**Fix:**
1. Go to Vercel → Project Settings → Environment Variables
2. Add all required variables
3. Redeploy

### 2. Database Connection Errors ❌

**Symptoms:**
- `PrismaClientInitializationError`
- `Connection timeout`
- `Database connection failed`

**Fix:**
- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled if required
- Check connection pool limits

### 3. Authentication Errors ❌

**Symptoms:**
- Login not working
- Session not persisting
- Redirect loops

**Fix:**
- Set `NEXTAUTH_SECRET` (32+ characters)
- Set `NEXTAUTH_URL` to production domain
- Update OAuth callback URLs in provider dashboards
- Clear browser cookies and try again

### 4. API Route Errors ❌

**Symptoms:**
- 500 errors on API routes
- Timeout errors
- Function execution errors

**Fix:**
- Check Vercel function logs
- Verify environment variables are set
- Check database connection
- Review API route error handling

### 5. Build Errors ❌

**Symptoms:**
- Deployment fails
- Build timeout
- Missing dependencies

**Fix:**
- Check build logs in Vercel
- Verify `package.json` dependencies
- Ensure `prisma generate` runs before build
- Check for TypeScript errors

## Verification Steps

### 1. Check Environment Variables
```bash
npm run check:production
```

### 2. Check Build
```bash
npm run build
```

### 3. Check Health Endpoint
```bash
curl https://advanciapayledger.com/api/health
```

### 4. Check System Status
```bash
curl https://advanciapayledger.com/api/system/status
```

## Vercel Dashboard Checks

1. **Deployments Tab**
   - Check latest deployment status
   - Review build logs
   - Check function logs

2. **Settings → Environment Variables**
   - Verify all required variables are set
   - Check variable values are correct
   - Ensure variables are for "Production" environment

3. **Settings → Domains**
   - Verify domain is configured
   - Check DNS settings
   - Verify SSL certificate

## Emergency Actions

### Rollback Deployment
1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Disable Feature
- Set feature flag: `ENABLE_FEATURE=false`
- Redeploy

### Check Logs
- Vercel Dashboard → Logs
- Filter by error level
- Review function execution logs

---

**Use `npm run check:production` to automatically detect and report production errors.**

