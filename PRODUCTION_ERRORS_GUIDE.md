# 🔧 Production Environment Errors - Troubleshooting Guide

## Common Production Errors and Solutions

### 1. Environment Variables Missing

**Error**: `Missing required environment variables`

**Solution**:
1. Go to your Vercel dashboard → Project Settings → Environment Variables
2. Add all required variables:
   - `DATABASE_URL` - Production database connection string
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `JWT_SECRET` - Generate with: `openssl rand -base64 32`
   - `SESSION_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://advanciapayledger.com`)
   - `NEXTAUTH_URL` - Your production URL (e.g., `https://advanciapayledger.com`)

### 2. Database Connection Errors

**Error**: `Database connection failed` or `PrismaClientInitializationError`

**Solutions**:
- Verify `DATABASE_URL` is correct and points to production database
- Check database is accessible from Vercel's IP ranges
- Ensure database connection pool limits are sufficient
- Check if SSL is required: `?sslmode=require` in connection string

### 3. Authentication Errors

**Error**: `NEXTAUTH_SECRET is not set` or authentication not working

**Solutions**:
- Set `NEXTAUTH_SECRET` in environment variables
- Ensure `NEXTAUTH_URL` matches your production domain
- Check callback URLs in OAuth providers (Google, GitHub) match production domain

### 4. API Route Errors

**Error**: `500 Internal Server Error` on API routes

**Solutions**:
- Check Vercel function logs for detailed error messages
- Verify all environment variables are set
- Check database connection
- Review API route error handling

### 5. Build Errors

**Error**: Build fails during deployment

**Solutions**:
- Check build logs in Vercel dashboard
- Verify `package.json` dependencies are correct
- Ensure `prisma generate` runs before build
- Check for TypeScript errors (even if ignored in build)

### 6. Payment Provider Errors

**Error**: Payment processing fails

**Solutions**:
- Verify payment provider API keys are set (Stripe, LemonSqueezy, etc.)
- Check webhook URLs are configured correctly
- Ensure using live keys (not test keys) in production
- Verify webhook secrets match

### 7. Middleware Errors

**Error**: `Middleware error` or authentication redirect loops

**Solutions**:
- Check `middleware.ts` is properly configured
- Verify `NEXTAUTH_SECRET` is set
- Check public routes are correctly excluded
- Review authentication flow

## Quick Diagnostic Commands

### Check Production Errors
```bash
npm run check:production
```

### Check Environment Variables
```bash
npm run preprod:check
```

### Verify Deployment
```bash
npm run verify:prod
```

### Check System Health
```bash
npm run health:check
```

## Vercel-Specific Issues

### Environment Variables Not Loading
- Ensure variables are set for "Production" environment
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Function Timeout
- Increase function timeout in `vercel.json` if needed
- Optimize slow API routes
- Use edge functions for simple routes

### Database Connection Pooling
- Use connection pooling (e.g., PgBouncer)
- Set `DATABASE_URL` with pooling parameters
- Monitor connection count

## Monitoring Production Errors

### Sentry
- Check Sentry dashboard for error reports
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set
- Review error trends and patterns

### LogRocket
- Check LogRocket for session replays
- Verify `NEXT_PUBLIC_LOGROCKET_APP_ID` is set
- Review user sessions with errors

### Vercel Logs
- Check Vercel dashboard → Logs
- Filter by error level
- Review function execution logs

## Emergency Fixes

### Quick Rollback
1. Go to Vercel dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Disable Feature
- Use feature flags in environment variables
- Set `ENABLE_FEATURE=false` to disable problematic features

### Database Migration Issues
```bash
# Run migrations manually
npx prisma migrate deploy
```

## Prevention Checklist

- [ ] All required environment variables set
- [ ] Database connection tested
- [ ] Payment providers configured with live keys
- [ ] OAuth callbacks updated for production domain
- [ ] Error monitoring (Sentry/LogRocket) configured
- [ ] Build passes locally
- [ ] Pre-production checks pass
- [ ] Database migrations applied
- [ ] SSL/HTTPS configured
- [ ] Domain DNS configured correctly

## Getting Help

1. Check Vercel deployment logs
2. Review Sentry error reports
3. Check GitHub Actions workflow logs
4. Review application logs
5. Test API endpoints manually

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

