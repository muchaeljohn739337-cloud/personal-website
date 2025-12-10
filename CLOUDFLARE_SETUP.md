# 🌐 Cloudflare Domain Configuration

## Domain Information

**Primary Domain**: `advanciapayledger.com`  
**WWW Domain**: `www.advanciapayledger.com`

Both domains are configured and should work identically.

---

## 🔧 Cloudflare DNS Configuration

### Required DNS Records

1. **A Record (Root Domain)**

   ```
   Type: A
   Name: @
   Content: [Your Vercel/Server IP]
   Proxy: Proxied (Orange Cloud) ✅
   TTL: Auto
   ```

2. **CNAME Record (WWW)**

   ```
   Type: CNAME
   Name: www
   Content: advanciapayledger.com
   Proxy: Proxied (Orange Cloud) ✅
   TTL: Auto
   ```

   **OR** (if using Vercel):

   ```
   Type: CNAME
   Name: www
   Content: cname.vercel-dns.com
   Proxy: Proxied (Orange Cloud) ✅
   TTL: Auto
   ```

### Email Records (Optional)

3. **MX Records** (if using email on your domain)

   ```
   Type: MX
   Name: @
   Priority: 10
   Content: mail.your-email-provider.com
   TTL: Auto
   ```

4. **SPF Record**

   ```
   Type: TXT
   Name: @
   Content: v=spf1 include:_spf.your-email-provider.com ~all
   TTL: Auto
   ```

5. **DMARC Record**
   ```
   Type: TXT
   Name: _dmarc
   Content: v=DMARC1; p=none; rua=mailto:dmarc@advanciapayledger.com
   TTL: Auto
   ```

---

## 🔒 SSL/TLS Settings

In Cloudflare Dashboard → SSL/TLS:

1. **SSL/TLS Encryption Mode**: `Full (strict)` ✅
   - This ensures end-to-end encryption

2. **Always Use HTTPS**: `On` ✅
   - Automatically redirects HTTP to HTTPS

3. **Minimum TLS Version**: `1.2` ✅
   - Recommended for security

4. **Automatic HTTPS Rewrites**: `On` ✅
   - Rewrites HTTP links to HTTPS

---

## ⚡ Cloudflare Performance Settings

### Speed Optimizations

1. **Auto Minify**: Enable for CSS, HTML, JavaScript
2. **Brotli Compression**: Enable
3. **HTTP/2**: Enable
4. **HTTP/3 (with QUIC)**: Enable
5. **0-RTT Connection Resumption**: Enable (if available)

### Caching

1. **Caching Level**: `Standard`
2. **Browser Cache TTL**: `Respect Existing Headers`
3. **Always Online**: `On`

---

## 🔐 Security Settings

### WAF (Web Application Firewall)

1. **Security Level**: `Medium` or `High`
2. **Challenge Passage**: `30 minutes`
3. **Browser Integrity Check**: `On`

### Page Rules

Create page rules for:

1. **API Routes** (Bypass Cache)

   ```
   URL: advanciapayledger.com/api/*
   Settings:
   - Cache Level: Bypass
   - Disable Security
   ```

2. **Static Assets** (Cache Everything)

   ```
   URL: advanciapayledger.com/_next/static/*
   Settings:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   ```

3. **WWW Redirect** (Optional - if you want to redirect www to non-www)
   ```
   URL: www.advanciapayledger.com/*
   Settings:
   - Forwarding URL: 301 Permanent Redirect
   - Destination URL: https://advanciapayledger.com/$1
   ```

---

## 🚀 Vercel Integration

If deploying to Vercel:

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add `advanciapayledger.com`
   - Add `www.advanciapayledger.com`

2. **Verify DNS Records**
   - Vercel will show required DNS records
   - Add them to Cloudflare

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - Cloudflare should use "Full (strict)" mode

---

## 📝 Environment Variables for Production

Set these in your deployment platform (Vercel/Cloudflare):

```bash
# Base URLs
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
NEXTAUTH_URL=https://advanciapayledger.com

# Domain Configuration
PRIMARY_DOMAIN=advanciapayledger.com

# Ensure HTTPS
NODE_ENV=production
```

---

## 🔄 Cloudflare Workers Configuration

If using Cloudflare Workers (via `wrangler.toml`):

1. **Set up Custom Domain**

   ```bash
   npx wrangler pages domain add advanciapayledger.com --project-name=personal-website
   npx wrangler pages domain add www.advanciapayledger.com --project-name=personal-website
   ```

2. **Environment Variables**
   - Already configured in `wrangler.toml`
   - Set secrets via Cloudflare Dashboard or CLI

---

## ✅ Verification Checklist

- [ ] DNS A record configured for root domain
- [ ] DNS CNAME record configured for www subdomain
- [ ] SSL/TLS mode set to "Full (strict)"
- [ ] Always Use HTTPS enabled
- [ ] Domain added to Vercel/Deployment platform
- [ ] Environment variables set correctly
- [ ] Both domains resolve correctly
- [ ] HTTPS works on both domains
- [ ] WWW redirects to non-WWW (if desired)
- [ ] SSL certificate valid (green lock)

---

## 🧪 Testing

### Test DNS Resolution

```bash
# Test root domain
nslookup advanciapayledger.com

# Test www subdomain
nslookup www.advanciapayledger.com

# Test HTTPS
curl -I https://advanciapayledger.com
curl -I https://www.advanciapayledger.com
```

### Test SSL Certificate

```bash
# Check SSL certificate
openssl s_client -connect advanciapayledger.com:443 -servername advanciapayledger.com

# Or use online tools:
# - SSL Labs: https://www.ssllabs.com/ssltest/
# - Security Headers: https://securityheaders.com/
```

---

## 🔍 Troubleshooting

### Domain Not Resolving

1. Check DNS records in Cloudflare
2. Verify nameservers are set correctly
3. Wait for DNS propagation (can take up to 48 hours)

### SSL Certificate Issues

1. Ensure "Full (strict)" mode is enabled
2. Check certificate in Vercel/deployment platform
3. Verify DNS records are correct

### WWW vs Non-WWW

- Both should work if configured correctly
- Use Page Rules to redirect one to the other (optional)
- Update `NEXTAUTH_URL` to use your preferred domain

---

## 📚 Additional Resources

- [Cloudflare DNS Documentation](https://developers.cloudflare.com/dns/)
- [Cloudflare SSL/TLS Guide](https://developers.cloudflare.com/ssl/)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [Cloudflare Workers Domains](https://developers.cloudflare.com/workers/platform/domains/)

---

**Last Updated**: $(date)
