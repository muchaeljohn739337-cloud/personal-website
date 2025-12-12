# Vercel Environment Variables Setup

## 🔐 Required Environment Variables for Vercel Deployment

Copy these environment variables to your Vercel Dashboard:
**Settings → Environment Variables → Add New**

---

### 1. Backend API URL

```bash
NEXT_PUBLIC_API_URL=https://advancia-backend-upnrf.onrender.com
```

> **Note**: This is your Render backend service URL. Update if your Render service name is different.

---

### 2. Frontend URL (Vercel Domain)

```bash
NEXT_PUBLIC_FRONTEND_URL=https://modular-saas-platform-frontend.vercel.app
```

> **Note**: Replace with your actual Vercel app domain once deployed. You can update this after first deployment.

---

### 3. Cron Job Secret (Generated Secure Key)

```bash
CRON_SECRET=YOUR_CRON_SECRET
```

> **Note**: This is a randomly generated 64-character hex string for securing cron endpoints.

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `modular-saas-platform-frontend` (or similar)
3. Navigate to: **Settings → Environment Variables**
4. Add each variable above:
   - Variable Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://advancia-backend-upnrf.onrender.com`
   - Environment: Select **All** (Production, Preview, Development)
   - Click **Save**
5. Repeat for `NEXT_PUBLIC_FRONTEND_URL` and `CRON_SECRET`

---

### Step 2: Redeploy to Vercel

After adding the environment variables:

```bash
# Option A: Push changes to trigger auto-deployment
git add .
git commit -m "docs: add Vercel environment setup guide"
git push origin copilot/vscode1762097186579

# Option B: Manual redeploy in Vercel Dashboard
# Go to Deployments → Click "..." → Redeploy
```

---

### Step 3: Update Frontend URL After First Deploy

1. After Vercel deploys successfully, note your app URL:
   - It will be something like: `https://modular-saas-platform-frontend-xyz123.vercel.app`
2. Go back to **Settings → Environment Variables**
3. Update `NEXT_PUBLIC_FRONTEND_URL` with your actual Vercel URL
4. Redeploy again (click Redeploy in Vercel Dashboard)

---

## 🔍 Verify Deployment

### Check 1: Frontend Loads

```
https://your-vercel-app.vercel.app
```

Should display your landing page without errors.

### Check 2: API Connectivity

Open browser console on your Vercel app and check:

- No CORS errors
- API calls to `/api/*` work correctly
- Backend responds properly

### Check 3: Environment Variables Applied

In Vercel Dashboard → Deployments → Select latest deployment → View Function Logs
Check that environment variables are present in the build logs.

---

## 📝 Optional Environment Variables

Add these if you're using additional features:

### Sentry Error Tracking

```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

### Analytics

```bash
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### Site Metadata

```bash
SITE_URL=https://your-vercel-app.vercel.app
SITE_NAME=Advancia Pay Ledger
```

---

## 🐛 Troubleshooting

### Issue: "Module not found" errors

**Solution**: Ensure all dependencies are in `package.json` and run:

```bash
cd frontend
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
git push
```

### Issue: API calls fail with CORS errors

**Solution**:

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend CORS configuration allows Vercel domain
3. Update backend `FRONTEND_URL` env var to include Vercel domain

### Issue: Build succeeds but app shows blank page

**Solution**:

1. Check browser console for errors
2. Verify all `NEXT_PUBLIC_*` variables are set
3. Check Vercel Function Logs for runtime errors

---

## 🔄 Backend Configuration (Render)

Make sure your Render backend has these CORS origins:

```bash
# In Render Dashboard → advancia-backend-upnrf → Environment
FRONTEND_URL=https://your-vercel-app.vercel.app,https://advanciapayledger.com
```

This allows your Vercel frontend to communicate with the Render backend.

---

## ✅ Deployment Checklist

- [ ] All 3 environment variables added to Vercel
- [ ] Variables set for "All" environments (Production, Preview, Development)
- [ ] Code pushed to trigger deployment
- [ ] Deployment completed successfully
- [ ] Frontend URL updated with actual Vercel domain
- [ ] Redeployed after URL update
- [ ] Backend CORS updated to include Vercel domain
- [ ] Tested frontend loads without errors
- [ ] Tested API connectivity from frontend
- [ ] Verified cron endpoints are secured

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Vercel build completes without errors
- ✅ App loads at `https://your-vercel-app.vercel.app`
- ✅ No console errors in browser
- ✅ API calls to backend work correctly
- ✅ Authentication flows function properly
- ✅ Real-time features (Socket.IO) connect successfully

---

## 🔗 Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Render Dashboard](https://dashboard.render.com)
- [Cloudflare Pages Dashboard](https://dash.cloudflare.com)
- [GitHub Repository](https://github.com/muchaeljohn739337-cloud/-modular-saas-platform)

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Render backend logs
3. Review browser console errors
4. Verify all environment variables are correctly set
5. Ensure backend is running and healthy

**Backend Health Check**: `https://advancia-backend-upnrf.onrender.com/api/health`
