# 🔧 Web3Auth Troubleshooting Guide

**Date:** 2025-12-10  
**Project:** advancia

---

## ❌ Common Errors

### Error 1: "Wallet is not ready yet, failed to fetch project configurations"

**Cause:** Web3Auth cannot fetch project configuration from the dashboard.

**Solutions:**

1. **Verify Client ID:**

   ```bash
   # Check .env.local
   NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI
   ```

   - Ensure the **full** Client ID is present (not truncated)
   - Client ID should be ~88 characters long
   - No spaces or line breaks in the Client ID

2. **Verify Network Configuration:**

   ```bash
   WEB3AUTH_NETWORK=mainnet
   ```

   - Must match the network in Web3Auth dashboard
   - Options: `mainnet`, `testnet`, `cyan`, `aqua`
   - Default: `mainnet`

3. **Check Web3Auth Dashboard:**
   - Visit: https://dashboard.web3auth.io/organization/advanciapay/projects
   - Verify project is **active**
   - Check project settings match your configuration

---

### Error 2: "Project not found. Please ensure you're using the correct client ID and network"

**Cause:** Client ID doesn't match any project in Web3Auth, or network mismatch.

**Solutions:**

1. **Verify Client ID in Dashboard:**
   - Go to: https://dashboard.web3auth.io/organization/advanciapay/projects/BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI
   - Copy the **exact** Client ID from the dashboard
   - Ensure no extra characters or spaces

2. **Check Network Match:**
   - Dashboard network must match `WEB3AUTH_NETWORK` in `.env.local`
   - If project is on `mainnet`, set `WEB3AUTH_NETWORK=mainnet`
   - If project is on `testnet`, set `WEB3AUTH_NETWORK=testnet`

3. **Verify Project Status:**
   - Project must be **active** in dashboard
   - Check if project was deleted or suspended
   - Verify organization access

---

## 🔍 Debugging Steps

### Step 1: Check Environment Variables

```bash
# In PowerShell
$env:NEXT_PUBLIC_WEB3AUTH_CLIENT_ID
$env:WEB3AUTH_NETWORK

# Or check .env.local
Get-Content .env.local | Select-String "WEB3AUTH"
```

**Expected Output:**

```
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI
WEB3AUTH_NETWORK=mainnet
```

### Step 2: Verify Client ID Length

```bash
# Client ID should be ~88 characters
$clientId = "BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI"
Write-Host "Length: $($clientId.Length)"  # Should be 88
```

### Step 3: Check Browser Console

Open browser DevTools (F12) and check console for:

- Web3Auth initialization logs
- Error messages with details
- Network requests to Web3Auth API

### Step 4: Verify Dashboard Configuration

1. **Project Settings:**
   - Go to: https://dashboard.web3auth.io/organization/advanciapay/projects
   - Click on your project
   - Verify **Status** is "Active"
   - Check **Network** matches your `.env.local`

2. **Chain Networks:**
   - Go to: Chain Networks tab
   - Ensure required chains are enabled
   - Verify RPC endpoints are configured

---

## ✅ Quick Fix Checklist

- [ ] Client ID is complete (not truncated) in `.env.local`
- [ ] `WEB3AUTH_NETWORK` matches dashboard network
- [ ] Project is active in Web3Auth dashboard
- [ ] Restarted dev server after changing `.env.local`
- [ ] Cleared browser cache and hard refresh (Ctrl+Shift+R)
- [ ] Checked browser console for detailed errors
- [ ] Verified Client ID matches dashboard exactly

---

## 🔄 Restart After Changes

After updating `.env.local`, **always restart** your dev server:

```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

Environment variables are only loaded on server start.

---

## 📝 Correct Configuration

**`.env.local`:**

```bash
# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI
WEB3AUTH_NETWORK=mainnet
WEB3AUTH_VERIFIER_NAME=advanciapay
```

**Important:**

- No quotes around values
- No trailing spaces
- No line breaks in Client ID
- Full Client ID (all 88 characters)

---

## 🆘 Still Having Issues?

1. **Check Web3Auth Dashboard:**
   - Verify project exists and is active
   - Check network configuration
   - Review project settings

2. **Test with Minimal Config:**
   - Use only `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` and `WEB3AUTH_NETWORK`
   - Remove other optional variables temporarily

3. **Check Package Versions:**

   ```bash
   npm list @web3auth/modal @web3auth/base @web3auth/ethereum-provider
   ```

4. **Review Logs:**
   - Browser console for client-side errors
   - Terminal for server-side errors
   - Network tab for API request failures

---

**Dashboard URL:** https://dashboard.web3auth.io/organization/advanciapay/projects  
**Project ID:** `BFNxdvITF4K95t3m0W704IllAlQ5xxwsmOJDXp9PNbISrzF2LPve6moMn3Cdukcz5kQv1ftp7SsP7q13mM_qmVI`
