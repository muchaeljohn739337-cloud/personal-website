# 🚀 Production Deployment Guide - Advancia Pay Ledger

## Architecture Overview

```
User → Cloudflare DNS/SSL → Vercel (Frontend) + Render (Backend)
```

### Components

- **Frontend**: Vercel → `advanciapayledger.com`
- **Backend**: Render → `api.advanciapayledger.com`
- **DNS/SSL**: Cloudflare (manages certificates)

---

## 📋 Pre-Deployment Checklist

### ✅ Completed

- [x] All TypeScript errors fixed
- [x] Code committed to GitHub (commit: c72cb6a)
- [x] Cloudflare account configured
- [x] Domain: advanciapayledger.com registered

### ⏳ To Complete

- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render
- [ ] Configure Cloudflare DNS
- [ ] Set up Origin Certificates
- [ ] Configure environment variables

---

## 🎯 Step-by-Step Deployment

### Step 1: Deploy Frontend to Vercel

```powershell
cd frontend
npx vercel --prod
```

**During setup:**

- Link to existing project or create new
- Set project name: `advancia-frontend`
- Root directory: `./`
- Build command: `npm run build`
- Output directory: `.next`

**Environment Variables (add in Vercel dashboard):**

```env
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**After deployment:**

- Note the Vercel deployment URL (e.g., `advancia-frontend.vercel.app`)
- Keep this for DNS configuration

---

### Step 2: Deploy Backend to Render

**A. Create Render Account**

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"

**B. Configure Backend Service**

- **Repository**: muchaeljohn739337-cloud/modular-saas-platform
- **Name**: advancia-backend
- **Root Directory**: `backend`
- **Environment**: Node
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free (for testing) or Starter ($7/mo)

**C. Environment Variables (add in Render dashboard):**

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-production-secret-min-32-chars
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=app-specific-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
VAPID_PUBLIC_KEY=your-vapid-public
VAPID_PRIVATE_KEY=your-vapid-private
FRONTEND_URL=https://advanciapayledger.com
```

**After deployment:**

- Note the Render URL (e.g., `advancia-backend.onrender.com`)
- Test: `https://advancia-backend.onrender.com/api/health`

---

### Step 3: Configure Cloudflare DNS

**A. Add DNS Records**

Go to Cloudflare Dashboard → DNS → Records

**1. Frontend (Vercel)**

```
Type: CNAME
Name: @ (or advanciapayledger.com)
Target: cname.vercel-dns.com
Proxy: ON (Orange cloud)
```

**2. www Subdomain**

```
Type: CNAME
Name: www
Target: cname.vercel-dns.com
Proxy: ON
```

**3. Backend (Render)**

```
Type: CNAME
Name: api
Target: advancia-backend.onrender.com
Proxy: ON
```

**B. SSL/TLS Settings**

- Go to SSL/TLS → Overview
- Set encryption mode: **Full (strict)**
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"

---

### Step 4: Create Cloudflare Origin Certificates

**Why needed:** Encrypts traffic between Cloudflare and your backends (Vercel/Render)

**A. Generate Certificate**

1. Cloudflare Dashboard → SSL/TLS → Origin Server
2. Click "Create Certificate"
3. Select:
   - Private key type: RSA (2048)
   - Hostnames: `advanciapayledger.com`, `*.advanciapayledger.com`
   - Certificate validity: 15 years
4. Click "Create"
5. **IMPORTANT**: Copy both:
   - Origin Certificate (PEM format)
   - Private Key

**B. Add to Vercel**

1. Vercel Dashboard → Project Settings → Domains
2. Add domain: `advanciapayledger.com`
3. Settings → SSL → Add Custom Certificate
4. Paste Origin Certificate + Private Key

**C. Add to Render**

1. Render Dashboard → Service → Settings
2. Custom Domains → Add `api.advanciapayledger.com`
3. If needed, add Origin Certificate in SSL settings

---

### Step 5: Configure Custom Domains

**A. Vercel Domain**

1. Vercel Dashboard → Project → Settings → Domains
2. Add domain: `advanciapayledger.com`
3. Add domain: `www.advanciapayledger.com`
4. Vercel will show DNS instructions (already done in Cloudflare)

**B. Render Domain**

1. Render Dashboard → Service → Settings
2. Custom Domains → Add Custom Domain
3. Enter: `api.advanciapayledger.com`
4. Copy CNAME value (already configured in Cloudflare)

---

### Step 6: Update Environment Variables

**Frontend (Vercel) - Update:**

```env
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
```

**Backend (Render) - Update:**

```env
FRONTEND_URL=https://advanciapayledger.com
CORS_ORIGIN=https://advanciapayledger.com,https://www.advanciapayledger.com
```

**Redeploy both services after updating env vars**

---

## 🔍 Post-Deployment Verification

### 1. Check DNS Propagation

```powershell
nslookup advanciapayledger.com
nslookup api.advanciapayledger.com
```

### 2. Test Endpoints

```powershell
# Frontend
curl https://advanciapayledger.com

# Backend health check
curl https://api.advanciapayledger.com/api/health
```

### 3. Verify SSL

```powershell
# Check certificate
openssl s_client -connect advanciapayledger.com:443 -servername advanciapayledger.com < nul
```

### 4. Test Full Flow

1. Visit https://advanciapayledger.com
2. Try login/signup
3. Check API calls in browser DevTools (should hit api.advanciapayledger.com)
4. Verify no CORS errors

---

## 🛠️ GitHub Actions Auto-Deploy (Optional)

**Add GitHub Secrets:**

```
RENDER_API_KEY=your-render-api-key
RENDER_SERVICE_ID=your-render-service-id
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

**Workflow will auto-deploy on push to main branch**

---

## 📊 Monitoring & Maintenance

### Cloudflare Analytics

- Dashboard → Analytics → Traffic
- Monitor SSL/TLS metrics
- Check for attack patterns

### Vercel Analytics

- Dashboard → Analytics
- Monitor frontend performance
- Check build logs

### Render Metrics

- Dashboard → Metrics
- Monitor backend response times
- Check logs for errors

---

## 🚨 Troubleshooting

### SSL Certificate Issues

**Problem**: Mixed content warnings
**Solution**:

- Verify Cloudflare SSL mode: Full (strict)
- Check Origin Certificate is installed
- Enable "Always Use HTTPS"

### CORS Errors

**Problem**: API calls blocked
**Solution**:

- Verify CORS_ORIGIN in backend env vars
- Check frontend is using correct API URL
- Restart backend after env var changes

### DNS Not Resolving

**Problem**: Domain not loading
**Solution**:

- Wait 5-10 minutes for DNS propagation
- Clear browser DNS cache: `ipconfig /flushdns`
- Check Cloudflare proxy (orange cloud) is ON

### 522 Errors (Connection Timeout)

**Problem**: Cloudflare can't reach origin
**Solution**:

- Verify Render service is running
- Check custom domain configuration in Render
- Verify DNS CNAME points to correct Render URL

---

## 📝 Quick Commands

**Redeploy Frontend:**

```powershell
cd frontend
npx vercel --prod
```

**Redeploy Backend:**

- Push to GitHub (auto-deploy if configured)
- Or manually: Render Dashboard → Manual Deploy

**Check Logs:**

```powershell
# Vercel
npx vercel logs

# Render
# Use dashboard
```

---

## ✅ Launch Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] DNS records configured in Cloudflare
- [ ] Origin certificates created and added
- [ ] Custom domains configured
- [ ] Environment variables set
- [ ] SSL/TLS full strict mode enabled
- [ ] Health checks passing
- [ ] Frontend loads successfully
- [ ] API requests working
- [ ] No CORS errors
- [ ] SSL certificates valid

---

## 🎉 Success!

Your application is now live:

- **Website**: https://advanciapayledger.com
- **API**: https://api.advanciapayledger.com
- **Dashboard**: https://advanciapayledger.com/admin

Monitor and enjoy your production deployment! 🚀
