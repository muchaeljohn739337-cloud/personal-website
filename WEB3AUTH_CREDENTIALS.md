# 🔐 Web3Auth Credentials Configuration

**Date:** 2025-12-10  
**Project:** advancia  
**Status:** ✅ **CONFIGURED**

---

## 📋 Credentials

### Client ID (Public)

```
BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI
```

**Usage:** Client-side initialization (safe to expose in frontend)  
**Environment Variable:** `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID`

### Client Secret (Private)

```
[REDACTED - stored in environment variables]
```

**Usage:** Server-side JWT verification (NEVER expose to client)  
**Environment Variable:** `WEB3AUTH_CLIENT_SECRET`  
**⚠️ WARNING:** Keep this secret secure. Do NOT commit to git.

### JWKS Endpoint

```
https://api-auth.web3auth.io/.well-known/jwks.json
```

**Usage:** JWT token verification (optional, for server-side validation)  
**Environment Variable:** `WEB3AUTH_JWKS_ENDPOINT`

---

## 🔧 Setup Instructions

### 1. Update `.env.local`

Add the following to your `.env.local` file:

```bash
# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI
WEB3AUTH_CLIENT_SECRET=564a33d58a7f42a10c2855685faa9b2882aa0a3b9f9d689cca03defaf7b6e8d0
WEB3AUTH_NETWORK=mainnet
WEB3AUTH_VERIFIER_NAME=advanciapay
WEB3AUTH_JWKS_ENDPOINT=https://api-auth.web3auth.io/.well-known/jwks.json
```

### 2. Update Vercel Environment Variables

For production deployment, add these to Vercel:

1. Go to: https://vercel.com/dashboard
2. Select your project: `personal-website` or `advanciapayledger`
3. Go to: **Settings** → **Environment Variables**
4. Add the following:
   - **NEXT_PUBLIC_WEB3AUTH_CLIENT_ID**
     - Value: `BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI`
     - Environment: Production, Preview, Development

   - **WEB3AUTH_CLIENT_SECRET** (Optional - for server-side JWT verification)
     - Value: `[YOUR_CLIENT_SECRET_HERE]` (Get from Web3Auth Dashboard)
     - Environment: Production, Preview, Development
     - ⚠️ Mark as **Secret**

   - **WEB3AUTH_NETWORK**
     - Value: `mainnet`
     - Environment: Production, Preview, Development

   - **WEB3AUTH_VERIFIER_NAME** (Optional)
     - Value: `advanciapay`
     - Environment: Production, Preview, Development

   - **WEB3AUTH_JWKS_ENDPOINT** (Optional)
     - Value: `https://api-auth.web3auth.io/.well-known/jwks.json`
     - Environment: Production, Preview, Development

---

## ✅ Verification

### Test Web3Auth Connection

1. Start dev server:

   ```bash
   npm run dev
   ```

2. Navigate to: http://localhost:3000/dashboard/web3

3. Click "Connect with Web3Auth"

4. Verify the modal opens and shows social login options

### Check Environment Variables

```bash
# Check if Client ID is set
echo $NEXT_PUBLIC_WEB3AUTH_CLIENT_ID

# Or in PowerShell
$env:NEXT_PUBLIC_WEB3AUTH_CLIENT_ID
```

---

## 🔒 Security Notes

1. **Client ID (Public):**
   - ✅ Safe to expose in frontend code
   - ✅ Can be committed to git (in env.example)
   - ✅ Used for Web3Auth modal initialization

2. **Client Secret (Private):**
   - ❌ NEVER expose in client-side code
   - ❌ NEVER commit to git
   - ✅ Only use for server-side JWT verification
   - ✅ Store securely in environment variables

3. **JWKS Endpoint:**
   - ✅ Public endpoint (safe to expose)
   - ✅ Used for JWT token verification
   - ✅ Optional - only needed for server-side validation

---

## 📚 Resources

- **Web3Auth Dashboard:** https://dashboard.web3auth.io/organization/advanciapay/getting-started
- **Web3Auth Docs:** https://web3auth.io/docs
- **Project Name:** advancia
- **JWKS Endpoint:** https://api-auth.web3auth.io/.well-known/jwks.json

---

## ⚠️ Important Notes

- **Devnet Warning:** Devnet undergoes periodic key rotations that could lead to lost wallets. Devnet accounts
  won't be migrated to Mainnet.
- **Network:** Currently configured for `mainnet`. Change to `testnet`, `cyan`, or `aqua` for development if
  needed.
- **Client Secret:** Only needed if you plan to verify JWT tokens on the server side. For client-side only
  usage, the Client ID is sufficient.

---

**Status:** ✅ Credentials configured and ready to use  
**Next Step:** Update `.env.local` and test the Web3Auth connection
