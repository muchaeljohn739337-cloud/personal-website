# BotID Protection Configuration Guide

Bot protection is now properly configured and **disabled by default**. You can enable it when ready.

## Current Status

✅ Bot protection code is functional  
✅ Disabled by default (`BOTID_ENABLED=false`)  
✅ Works with Cloudflare Bot Management  
✅ Supports Cloudflare Turnstile, reCAPTCHA, hCaptcha  

## How It Works

### 1. Cloudflare Bot Management (Recommended)

If your site is behind Cloudflare with Bot Management enabled:

- Automatically uses `cf-bot-management-score` header
- No additional configuration needed
- Just set `BOTID_ENABLED=true`

### 2. Cloudflare Turnstile (Free)

1. Go to https://dash.cloudflare.com/?to=/:account/turnstile
2. Create a new site
3. Get your **Site Key** and **Secret Key**
4. Add to `.env`:

   ```
   BOTID_ENABLED=true
   BOTID_SECRET_KEY=your_secret_key
   NEXT_PUBLIC_BOTID_SITE_KEY=your_site_key
   ```

### 3. Other Services (reCAPTCHA, hCaptcha)

Modify `lib/security/botid-protection.ts` to integrate your preferred service.

## Protected Routes

By default, these routes are protected when enabled:

- `/admin/*` - Admin dashboard
- `/dashboard/*` - User dashboard  
- `/api/admin/*` - Admin API endpoints
- `/api/auth/login` - Login endpoint
- `/api/auth/register` - Registration
- `/api/payments/*` - Payment endpoints
- `/api/crypto/*` - Crypto transactions
- `/api/tokens/*` - Token operations
- `/api/rewards/*` - Rewards system

## To Enable Bot Protection

### Option 1: Local Development

```bash
# In .env
BOTID_ENABLED=true
BOTID_SECRET_KEY=your_turnstile_secret_key
NEXT_PUBLIC_BOTID_SITE_KEY=your_turnstile_site_key
```

### Option 2: Vercel Production

```bash
vercel env add BOTID_ENABLED production
# Enter: true

vercel env add BOTID_SECRET_KEY production  
# Enter: your_secret_key

vercel env add NEXT_PUBLIC_BOTID_SITE_KEY production
# Enter: your_site_key

# Redeploy
vercel --prod
```

## Testing

1. Enable bot protection
2. Try accessing `/dashboard` or `/admin`
3. Should see bot challenge for suspicious traffic
4. Regular browsers should pass through

## Current Configuration

**Status**: ✅ Disabled (safe for login)  
**Mode**: Fail-open (allows traffic on error)  
**Cloudflare Integration**: ✅ Ready  
**Custom Integration**: ✅ Supported  

## Next Steps

1. **Now**: Keep disabled, login works fine
2. **Later**: Get Cloudflare Turnstile keys (free)
3. **Then**: Enable protection for production traffic
4. **Monitor**: Check logs for false positives

## Troubleshooting

**Problem**: Still seeing "Bot verification required"  
**Solution**: Ensure `BOTID_ENABLED=false` in both local and Vercel

**Problem**: Want to protect specific routes only  
**Solution**: Edit `PROTECTED_ROUTES` in `lib/security/botid-protection.ts`

**Problem**: False positives blocking real users  
**Solution**: Adjust bot detection thresholds or use Cloudflare's verified bot list
