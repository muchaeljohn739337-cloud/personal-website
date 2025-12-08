# 🌐 Domain Configuration Summary

## Your Domains

✅ **Primary Domain**: `advanciapayledger.com`  
✅ **WWW Domain**: `www.advanciapayledger.com`

Both domains are configured and ready for use on Cloudflare.

---

## ✅ Configuration Status

### Files Updated

- ✅ `next.config.mjs` - Image domains configured
- ✅ `wrangler.toml` - Cloudflare Workers domains
- ✅ `app/layout.tsx` - Metadata URLs
- ✅ `public/robots.txt` - Sitemap URL
- ✅ `public/sitemap.xml` - All page URLs
- ✅ `package.json` - Health check URL
- ✅ `scripts/deploy-production.sh` - Health check URL

### Environment Variables Needed

**Production Environment Variables** (set in Vercel/Cloudflare Dashboard):

```bash
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
NEXTAUTH_URL=https://advanciapayledger.com
PRIMARY_DOMAIN=advanciapayledger.com
```

---

## 🚀 Next Steps

### 1. Configure DNS in Cloudflare

Follow the guide in `CLOUDFLARE_SETUP.md` to:
- Add A/CNAME records
- Configure SSL/TLS
- Set up redirects (optional)

### 2. Add Domain to Deployment Platform

**Vercel:**
1. Go to Project Settings → Domains
2. Add `advanciapayledger.com`
3. Add `www.advanciapayledger.com`
4. Follow DNS verification steps

**Cloudflare Workers:**
```bash
npx wrangler pages domain add advanciapayledger.com
npx wrangler pages domain add www.advanciapayledger.com
```

### 3. Set Environment Variables

Update production environment variables in your deployment platform:
- `NEXT_PUBLIC_APP_URL=https://advanciapayledger.com`
- `NEXTAUTH_URL=https://advanciapayledger.com`

### 4. Test Domain

```bash
# Test root domain
curl -I https://advanciapayledger.com

# Test www subdomain
curl -I https://www.advanciapayledger.com

# Test health endpoint
curl https://advanciapayledger.com/api/health
```

---

## 📋 Domain Usage Throughout Application

The domain `advanciapayledger.com` is used in:

- ✅ SEO metadata (OpenGraph, Twitter cards)
- ✅ Email templates
- ✅ Payment provider redirect URLs
- ✅ Webhook URLs
- ✅ API health checks
- ✅ Social sharing links
- ✅ Sitemap and robots.txt

All references have been updated to use `advanciapayledger.com`.

---

## 🔒 HTTPS Configuration

Both domains should use HTTPS:

- Cloudflare SSL/TLS mode: **Full (strict)**
- Always Use HTTPS: **Enabled**
- Automatic HTTPS Rewrites: **Enabled**

---

## 📚 Documentation

- **Cloudflare Setup**: See `CLOUDFLARE_SETUP.md`
- **Production Deployment**: See `PRODUCTION_DEPLOYMENT.md`
- **Environment Variables**: See `ENV_SETUP.md`

---

**Status**: ✅ Domain configuration complete and ready for deployment!


