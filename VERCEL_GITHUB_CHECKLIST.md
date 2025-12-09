# 🔍 Vercel & GitHub Deployment Checklist

## Vercel Deployment Status

### Domain Configuration

- ✅ `vercel.json` configured with domains:
  - `advanciapayledger.com`
  - `www.advanciapayledger.com`
- ✅ Build command: `npm run build` (includes Prisma generate)
- ✅ Framework: Next.js
- ✅ Region: `iad1` (US East)

### Required Actions

1. **Verify Domain in Vercel Dashboard**
   - Go to Vercel Dashboard → Project Settings → Domains
   - Ensure both domains are added and verified
   - Check DNS records match Vercel's requirements

2. **Environment Variables**
   - Set all required environment variables in Vercel
   - See `ENV_SETUP.md` for complete list
   - Ensure production secrets are set (not development)

3. **Deploy to Production**

   ```bash
   npm run deploy:prod
   ```

4. **Verify Deployment**
   - Check `https://advanciapayledger.com` loads correctly
   - Check `https://www.advanciapayledger.com` redirects or loads
   - Test API endpoints
   - Verify SSL certificates

---

## GitHub Actions Status

### CI Workflow (`.github/workflows/ci.yml`)

- ✅ Linting check
- ✅ Type checking
- ✅ Build check
- ✅ Security audit
- ✅ Test execution

### Deploy Workflow (`.github/workflows/deploy.yml`)

- ✅ Pre-production checks
- ✅ Prisma generate step (added)
- ✅ Build application
- ✅ Deploy to Vercel
- ✅ Database migrations
- ✅ Deployment verification

### Required Actions

1. **Check Failed Jobs**
   - Go to GitHub → Actions tab
   - Review any failed workflow runs
   - Fix errors and re-run failed jobs

2. **Verify Secrets**
   - Ensure GitHub secrets are set:
     - `VERCEL_TOKEN`
     - `VERCEL_ORG_ID`
     - `VERCEL_PROJECT_ID`
     - `DATABASE_URL` (for migrations)

3. **Clean Up Workflow Runs**
   - Delete old failed runs if needed
   - Keep only recent successful runs

---

## Common Issues & Fixes

### Vercel Issues

**Issue: Domain not resolving**

- Check DNS records in domain registrar
- Verify A/CNAME records point to Vercel
- Wait for DNS propagation (up to 48 hours)

**Issue: Build fails**

- Check environment variables are set
- Verify `DATABASE_URL` is accessible
- Check build logs for specific errors

**Issue: SSL certificate errors**

- Vercel auto-provisions SSL
- Ensure domain is verified in Vercel
- Check DNS records are correct

### GitHub Actions Issues

**Issue: Workflow fails on lint**

- Run `npm run lint -- --fix` locally
- Fix any remaining linting errors
- Commit and push fixes

**Issue: Workflow fails on build**

- Run `npm run build` locally
- Fix any build errors
- Ensure all dependencies are in package.json

**Issue: Deployment fails**

- Check Vercel token is valid
- Verify project ID is correct
- Check Vercel project settings

---

## Quick Commands

### Check Vercel Status

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Check deployment status
vercel list

# View logs
vercel logs
```

### Check GitHub Actions

```bash
# View workflow status (via GitHub UI or CLI)
gh workflow list
gh run list
gh run view <run-id>
```

### Fix Common Issues

```bash
# Fix linting
npm run lint -- --fix

# Fix TypeScript
npx tsc --noEmit

# Test build locally
npm run build

# Run pre-production checks
npm run preprod:check
```

---

## Next Steps

1. ✅ Run database migration: `npx prisma migrate dev`
2. ✅ Create first admin: `npx tsx scripts/create-admin.ts`
3. ⚠️ Verify Vercel deployment
4. ⚠️ Check GitHub Actions status
5. ⚠️ Test all admin functions
6. ⚠️ Monitor logs and errors

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
