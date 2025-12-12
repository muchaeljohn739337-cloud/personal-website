# Cloudflare Integration Setup Guide

## 🔐 Overview

This guide covers setting up Cloudflare protection, IP whitelisting, and security features for your application.

---

## 🌐 What's Configured

### 1. **Cloudflare Middleware**

- Real IP detection from CF-Connecting-IP header
- Cloudflare Ray ID tracking
- Country/geolocation data
- Proxy IP verification

### 2. **IP Whitelisting**

- Restrict admin routes to specific IPs
- Support for exact IPs, wildcards, and CIDR ranges
- Your IP (84.239.41.201) pre-configured

### 3. **Security Features**

- DDoS protection
- Rate limiting per IP
- Cloudflare-only access mode
- Trust proxy headers

---

## 📋 Setup Steps

### Step 1: Configure Environment Variables

Your `.env` file now includes:

```env
# Cloudflare Configuration
CLOUDFLARE_ENABLED=true
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_API_TOKEN=your-api-token

# Turnstile CAPTCHA
TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# IP Whitelist (your IP already added)
ADMIN_IP_WHITELIST=84.239.41.201,127.0.0.1,::1

# Trust Cloudflare proxy
TRUST_PROXY=true
```

### Step 2: Get Cloudflare Credentials

1. **Zone ID & API Token**:
   - Go to: https://dash.cloudflare.com
   - Select your domain
   - Scroll down to "Zone ID" (copy it)
   - Go to: Profile → API Tokens → Create Token
   - Use template: "Edit zone DNS"
   - Copy the token

2. **Turnstile Keys** (optional, for CAPTCHA):
   - Go to: https://dash.cloudflare.com → Turnstile
   - Create a new site
   - Copy Site Key and Secret Key

### Step 3: Apply Middleware to Routes

The middleware is ready to use. Add to your main server file:

```typescript
import { cloudflareMiddleware } from "./middleware/cloudflare";
import { ipWhitelistMiddleware, checkIPRoute } from "./middleware/ipWhitelist";

// Apply globally
app.use(cloudflareMiddleware);

// Check current IP (debug endpoint)
app.get("/api/check-ip", checkIPRoute);

// Protect admin routes
app.use("/admin", ipWhitelistMiddleware);
app.use("/api/admin", ipWhitelistMiddleware);
```

---

## 🔍 Testing Your Setup

### Test 1: Check Your IP

```bash
curl https://your-domain.com/api/check-ip
```

**Expected response:**

```json
{
  "ip": "84.239.41.201",
  "whitelisted": true,
  "cloudflare": {
    "ray": "9a79baf89f421914",
    "country": "GB",
    "isFromCF": true
  }
}
```

### Test 2: Access Admin Route

```bash
curl https://your-domain.com/admin
```

- ✅ **From whitelisted IP**: Access granted
- ❌ **From other IP**: 403 Forbidden

---

## 🛡️ IP Whitelist Formats

### Exact IP

```env
ADMIN_IP_WHITELIST=84.239.41.201
```

### Multiple IPs

```env
ADMIN_IP_WHITELIST=84.239.41.201,203.0.113.0,127.0.0.1
```

### Wildcard Pattern

```env
ADMIN_IP_WHITELIST=84.239.41.*
```

### CIDR Range

```env
ADMIN_IP_WHITELIST=84.239.41.0/24
```

### Disable Whitelist (Allow All)

```env
ADMIN_IP_WHITELIST=
```

---

## 🚀 Production Deployment

### Cloudflare Settings

1. **SSL/TLS Mode**: Full (strict)
2. **Always Use HTTPS**: On
3. **Automatic HTTPS Rewrites**: On
4. **Minimum TLS Version**: 1.2
5. **TLS 1.3**: On

### Firewall Rules (Optional)

Create rule to block non-whitelisted IPs:

```
(ip.src ne 84.239.41.201 and http.request.uri.path contains "/admin")
```

### WAF Rules (Optional)

- Enable OWASP Core Ruleset
- Enable Bot Fight Mode
- Configure rate limiting: 100 req/15min per IP

---

## 📊 Monitoring

### Cloudflare Analytics

- View traffic in Cloudflare Dashboard
- Monitor blocked requests
- Track Ray IDs for debugging

### Application Logs

The middleware logs all requests:

```
[Cloudflare] Request from 84.239.41.201 | Ray: 9a79baf89f421914 | Country: GB
[Security] IP 84.239.41.201 whitelisted | Path: /admin
```

### Debug Endpoint

```bash
GET /api/check-ip
```

Returns:

- Your real IP
- Whitelist status
- Cloudflare metadata
- All proxy headers

---

## 🔧 Troubleshooting

### Issue: Wrong IP Detected

**Solution**: Ensure `TRUST_PROXY=true` in `.env`

```typescript
app.set("trust proxy", true);
```

### Issue: Cloudflare Ray ID Not Found

**Symptom**: `req.cloudflare.ray` is undefined

**Solution**: Request not coming through Cloudflare

- Check DNS is proxied (orange cloud)
- Verify Cloudflare is active

### Issue: IP Still Blocked After Whitelisting

**Check:**

1. Correct IP format in whitelist
2. No extra spaces in `.env`
3. Server restarted after config change
4. Check actual IP with `/api/check-ip`

### Issue: Direct IP Access Blocked

If using `cloudflareOnlyMiddleware`, direct IP access is blocked:

```typescript
// Disable for development
if (process.env.NODE_ENV === "production") {
  app.use(cloudflareOnlyMiddleware);
}
```

---

## 🎯 Security Best Practices

### 1. **Always Use HTTPS**

- Force HTTPS in Cloudflare
- Redirect HTTP → HTTPS

### 2. **Restrict Admin Access**

- Keep IP whitelist minimal
- Use VPN for admin access
- Enable MFA for admin users

### 3. **Monitor Cloudflare Logs**

- Review blocked requests daily
- Watch for DDoS attempts
- Track suspicious patterns

### 4. **Rate Limiting**

- Configure appropriate limits
- Different limits for different endpoints
- Whitelist known good IPs

### 5. **Keep Credentials Secure**

- Store Cloudflare API tokens in Vault
- Rotate tokens regularly
- Use least-privilege access

---

## 📚 Additional Resources

- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
- [Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Cloudflare Workers](https://workers.cloudflare.com/)

---

## ✅ Configuration Checklist

- [ ] Added Cloudflare Zone ID to `.env`
- [ ] Added Cloudflare API Token to `.env`
- [ ] Configured Turnstile keys (optional)
- [ ] Added your IP (84.239.41.201) to whitelist
- [ ] Applied middleware to Express app
- [ ] Tested `/api/check-ip` endpoint
- [ ] Verified admin route protection
- [ ] Set `TRUST_PROXY=true`
- [ ] Configured Cloudflare SSL settings
- [ ] Enabled Cloudflare WAF (optional)

---

**Your IP**: 84.239.41.201  
**Cloudflare Ray**: 9a79baf89f421914  
**Status**: ✅ Pre-configured and ready to use!
