# CORS Configuration and Deployment Settings

## ✅ CORS Fixes Applied

### Backend Changes (`backend/src/index.ts`)

- **Express CORS**: Simplified to use `config.allowedOrigins` directly
- **Socket.IO CORS**: Updated to use the same `config.allowedOrigins` list
- Both now accept the Vercel deployment origin: `https://frontend-kappa-murex-46.vercel.app`

### Config Changes (`backend/src/config/index.ts`)

- Added `https://frontend-kappa-murex-46.vercel.app` to production allowed origins
- This ensures the Vercel frontend can make API calls without CORS errors

## 🔧 Environment Variables for Deployment

### Backend (Render) Environment Variables

```bash
NODE_ENV=production
FRONTEND_URL=https://frontend-kappa-murex-46.vercel.app
ALLOWED_ORIGINS=https://advanciapayledger.com,https://www.advanciapayledger.com,https://frontend-kappa-murex-46.vercel.app
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secure_jwt_secret
# ... other required env vars
```

### Frontend (Vercel) Environment Variables

```bash
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com
```

## 🧪 Testing CORS Configuration

### Manual Testing Commands

**Test CORS headers:**

```bash
# Test with curl
curl -i -H "Origin: https://frontend-kappa-murex-46.vercel.app" \
  https://www.advanciapayledger.com/api/system/status

# Expected: Access-Control-Allow-Origin header present
```

**Test NextAuth session:**

```bash
curl -i -H "Origin: https://frontend-kappa-murex-46.vercel.app" \
  https://www.advanciapayledger.com/api/auth/session
```

### Automated Test Script

Run the created `test-cors.js` script:

```bash
node test-cors.js
```

## 🚀 Deployment Steps

1. **Redeploy Backend** (Render):

   - Push the CORS changes to trigger redeploy
   - Verify logs show: `Allowed CORS Origins: ...frontend-kappa-murex-46.vercel.app...`

2. **Update Vercel Environment**:

   - Set `NEXT_PUBLIC_API_URL` to your Render backend URL
   - Redeploy frontend

3. **Test Live Application**:
   - Visit Vercel frontend URL
   - Check browser console for CORS errors
   - Verify API calls work (no 522 errors)

## 🔍 Troubleshooting

### If CORS errors persist:

1. Check backend logs for CORS rejection messages
2. Verify `ALLOWED_ORIGINS` env var includes Vercel domain
3. Ensure backend is redeployed with latest changes

### If 522 errors continue:

1. Check Render service health
2. Verify DNS/Cloudflare configuration
3. Check backend startup logs for configuration errors

### WebSocket issues:

1. Ensure Socket.IO CORS uses same allowed origins
2. Check browser network tab for WebSocket handshake
3. Verify no proxy/firewall blocking WebSocket connections

## 📋 Current Status

- ✅ CORS middleware updated for Vercel origin
- ✅ Socket.IO CORS aligned with Express CORS
- ✅ Configuration includes specific Vercel deployment URL
- ⏳ Backend redeployment needed
- ⏳ Vercel environment variable configuration needed
