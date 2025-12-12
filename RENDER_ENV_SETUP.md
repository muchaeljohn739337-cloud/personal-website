# 🚀 Render Deployment - Environment Variables Setup

## 📋 Service Information

- **Service ID**: `srv-d4gh11n5r7bs73b8iak0`
- **Service Type**: Web Service (API)
- **Deploy Hook**: `https://api.render.com/deploy/srv-d4gh11n5r7bs73b8iak0?key=Z8KwHSCZ5BI`

## 🔧 Required Environment Variables

Add these environment variables in the Render dashboard:

### 1. **ALLOWED_ORIGINS**

```
https://advanciapayledger.com,https://www.advanciapayledger.com
```

### 2. **DATABASE_URL** ⚠️ CRITICAL

```
postgresql://database_advanci:Uxn46MtpYisv6HmlbFtI5hw0oUIcbDay@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl
```

### 3. **FRONTEND_URL**

```
https://advanciapayledger.com
```

### 4. **NODE_ENV**

```
production
```

### 5. **PORT**

```
4000
```

### 6. **SMTP_HOST**

```
smtp.gmail.com
```

### 7. **SMTP_PORT**

```
587
```

### 8. **VAPID_SUBJECT**

```
mailto:support@advanciapayledger.com
```

## 📌 Setup Instructions

### Option 1: Via Render Dashboard

1. Go to: https://dashboard.render.com/web/srv-d4gh11n5r7bs73b8iak0
2. Click the **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable from the list above:
   - Enter the variable name (e.g., `DATABASE_URL`)
   - Enter the corresponding value
   - Click "Save Changes"
5. Repeat for all 8 variables
6. Once all variables are added, click **"Manual Deploy"** → **"Deploy latest commit"**

### Option 2: Via Deploy Hook (Trigger Redeploy)

After adding environment variables, trigger a new deployment:

```bash
curl -X POST https://api.render.com/deploy/srv-d4gh11n5r7bs73b8iak0?key=Z8KwHSCZ5BI
```

## ✅ Verification Steps

After deployment completes:

### 1. Check Build Logs

Look for these success indicators:

```
✔ Generated Prisma Client
✔ prisma migrate deploy succeeded
✔ Build succeeded
```

### 2. Test Health Endpoint

```bash
curl https://api.advanciapayledger.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-30T...",
  "environment": "production"
}
```

### 3. Test CORS Configuration

```bash
curl -H "Origin: https://advanciapayledger.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.advanciapayledger.com/api/auth/login
```

Should return CORS headers with allowed origin.

## 🚨 Critical Notes

1. **DATABASE_URL is REQUIRED** - Without this, Prisma migrations will fail during build
2. **ALLOWED_ORIGINS** - Must include both `advanciapayledger.com` and `www.advanciapayledger.com`
3. **SMTP Settings** - Required for email OTP authentication
4. **VAPID_SUBJECT** - Required for web push notifications

## 🔐 Additional Environment Variables (Optional)

You may also need to add these based on your full `.env` file:

- `EMAIL_USER` - Gmail account for SMTP
- `EMAIL_PASSWORD` - Gmail app password
- `JWT_SECRET` - Secret key for JWT token signing
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `VAPID_PUBLIC_KEY` - Public key for web push
- `VAPID_PRIVATE_KEY` - Private key for web push

## 📚 Related Documentation

- Main deployment guide: `.github/copilot-deployment-instructions.md`
- CORS configuration: `CORS_DEPLOYMENT_GUIDE.md`
- Production domains: See `copilot-instructions.md`

## 🆘 Troubleshooting

### Build Fails at Prisma Migration

**Error**: `The datasource property is required in your Prisma config file`

**Solution**: Add `DATABASE_URL` environment variable in Render dashboard

### CORS Errors in Frontend

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Verify `ALLOWED_ORIGINS` includes both domains with correct protocol (https://)

### Email OTP Not Sending

**Solution**: Ensure `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, and `EMAIL_PASSWORD` are set

---

**Last Updated**: November 30, 2025
