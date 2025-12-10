# 🔄 How to Rotate Supabase Keys - Step-by-Step Guide

**Date:** 2025-12-09  
**Project:** `qbxugwctchtqwymhucpl`  
**Priority:** 🔴 **CRITICAL - Do this immediately**

---

## 🎯 Overview

This guide walks you through rotating all exposed Supabase keys to secure your project.

**Estimated Time:** 10-15 minutes

---

## 📋 Prerequisites

- Access to Supabase Dashboard
- Access to Vercel Dashboard (for production)
- Text editor for `.env.local`

---

## 🔴 Step 1: Rotate Service Role Key (CRITICAL)

**Why:** Service Role Key has FULL database access and bypasses all security.

### Instructions:

1. **Open Supabase Dashboard:**
   - Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api
   - Or: https://app.supabase.com → Select project `qbxugwctchtqwymhucpl` → Settings → API

2. **Find Service Role Key:**
   - Scroll to **"Project API keys"** section
   - Look for **"service_role"** key (it's the secret one, usually shown as `••••••••`)
   - Click the **"Reveal"** button to see the current key (optional, for reference)

3. **Rotate the Key:**
   - Click the **"Reset"** or **"Rotate"** button next to the service_role key
   - Confirm the action in the popup
   - **⚠️ IMPORTANT:** Copy the NEW key immediately - you won't be able to see it again!

4. **Save the New Key:**
   - Store it securely (password manager, secure note)
   - You'll need it for the next steps

**What happens:** The old service_role key becomes invalid immediately.

---

## 🟡 Step 2: Rotate Anon Key (Recommended)

**Why:** Anon key was exposed and could be used to access public data.

### Instructions:

1. **In the Same API Settings Page:**
   - Find **"anon"** or **"public"** key section
   - This is the key that starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **Rotate the Key:**
   - Click **"Reset"** or **"Rotate"** button
   - Confirm the action
   - **Copy the NEW key immediately**

3. **Save the New Key:**
   - Store it securely

**What happens:** The old anon key becomes invalid. Any applications using it will stop working until updated.

---

## 🟡 Step 3: Rotate Publishable Key (Optional but Recommended)

**Why:** Extra security layer - rotate if you want to be thorough.

### Instructions:

1. **In the Same API Settings Page:**
   - Find **"publishable"** key (if available)
   - Usually starts with `sb_publishable_...`

2. **Rotate the Key:**
   - Click **"Reset"** or **"Rotate"** button
   - Confirm the action
   - **Copy the NEW key immediately**

3. **Save the New Key**

---

## 🔐 Step 4: Change Database Password (Recommended)

**Why:** Database password was exposed in connection strings.

### Instructions:

1. **Go to Database Settings:**
   - Navigate to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/database
   - Or: Settings → Database

2. **Find Database Password Section:**
   - Look for **"Database Password"** or **"Connection Pooling"** section
   - Find the **"Reset Database Password"** button

3. **Reset Password:**
   - Click **"Reset Database Password"**
   - Confirm the action
   - **⚠️ IMPORTANT:** Copy the NEW password immediately
   - You'll need it to update connection strings

4. **Save the New Password:**
   - Store it securely

**What happens:** Old database connections will fail. You'll need to update all connection strings.

---

## 📝 Step 5: Update Local Environment Variables

### Instructions:

1. **Open `.env.local` file:**
   - Located in project root: `personal-website/.env.local`
   - If it doesn't exist, create it

2. **Update the Following Variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qbxugwctchtqwymhucpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PASTE_NEW_ANON_KEY_HERE>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PASTE_NEW_PUBLISHABLE_KEY_HERE>
SUPABASE_SERVICE_ROLE_KEY=<PASTE_NEW_SERVICE_ROLE_KEY_HERE>

# Database Connection (replace [NEW_PASSWORD] with actual password)
DATABASE_URL=postgres://postgres.qbxugwctchtqwymhucpl:[NEW_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
DIRECT_URL=postgres://postgres.qbxugwctchtqwymhucpl:[NEW_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

3. **Save the File**

4. **Restart Development Server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

---

## 🌐 Step 6: Update Vercel Environment Variables

### Instructions:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project: `personal-website`

2. **Navigate to Environment Variables:**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Update Each Variable:**

   **a. Update `NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
   - Find the variable in the list
   - Click **"Edit"** or **"..."** menu → **"Edit"**
   - Paste the NEW anon key
   - Select **Production** environment (and others if needed)
   - Click **"Save"**

   **b. Update `SUPABASE_SERVICE_ROLE_KEY`:**
   - Find the variable
   - Click **"Edit"**
   - Paste the NEW service_role key
   - Select **Production** environment
   - Click **"Save"**

   **c. Update `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (if exists):**
   - Find the variable
   - Click **"Edit"**
   - Paste the NEW publishable key
   - Select **Production** environment
   - Click **"Save"**

   **d. Update `DATABASE_URL`:**
   - Find the variable
   - Click **"Edit"**
   - Replace `[NEW_PASSWORD]` with the actual new password
   - Format: `postgres://postgres.qbxugwctchtqwymhucpl:[NEW_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
   - Select **Production** environment
   - Click **"Save"**

   **e. Update `DIRECT_URL` (if exists):**
   - Find the variable
   - Click **"Edit"**
   - Replace `[NEW_PASSWORD]` with the actual new password
   - Format: `postgres://postgres.qbxugwctchtqwymhucpl:[NEW_PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`
   - Select **Production** environment
   - Click **"Save"**

4. **Redeploy Application:**
   - Go to **Deployments** tab
   - Click **"..."** on the latest deployment → **"Redeploy"**
   - Or push a new commit to trigger deployment

---

## ✅ Step 7: Verify Everything Works

### Test Locally:

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Test Supabase Connection:**
   - Visit: http://localhost:3000/notes
   - Should display notes from Supabase
   - If you see errors, check console and verify keys are correct

3. **Check Application Logs:**
   - Look for any authentication errors
   - Verify database connections work

### Test Production:

1. **Wait for Deployment:**
   - After updating Vercel variables, wait for redeployment
   - Check deployment status in Vercel dashboard

2. **Test Production Site:**
   - Visit your production URL
   - Test Supabase features (notes page, etc.)
   - Check for any errors

---

## 🔍 Step 8: Monitor for Unauthorized Access

### In Supabase Dashboard:

1. **Check Logs:**
   - Go to: https://app.supabase.com/project/qbxugwctchtqwymhucpl/logs
   - Look for any suspicious API calls
   - Check for failed authentication attempts

2. **Monitor Database:**
   - Go to: Database → Tables
   - Check for unexpected data changes
   - Review recent activity

3. **Set Up Alerts (Recommended):**
   - Go to: Settings → Notifications
   - Enable alerts for:
     - Failed authentication attempts
     - Unusual API usage
     - Database access patterns

---

## 📋 Checklist

Use this checklist to ensure you've completed everything:

- [ ] Rotated Service Role Key in Supabase Dashboard
- [ ] Copied new Service Role Key
- [ ] Rotated Anon Key in Supabase Dashboard
- [ ] Copied new Anon Key
- [ ] Rotated Publishable Key (optional)
- [ ] Changed Database Password
- [ ] Copied new Database Password
- [ ] Updated `.env.local` with all new keys
- [ ] Updated Vercel environment variables
- [ ] Redeployed application on Vercel
- [ ] Tested local development
- [ ] Tested production deployment
- [ ] Verified no errors in logs
- [ ] Monitored Supabase for suspicious activity

---

## 🆘 Troubleshooting

### Problem: "Invalid API key" errors

**Solution:**
- Double-check you copied the keys correctly (no extra spaces)
- Verify keys are updated in both `.env.local` and Vercel
- Restart development server after updating `.env.local`
- Redeploy on Vercel after updating environment variables

### Problem: Database connection errors

**Solution:**
- Verify new password is correct in connection strings
- Check `DATABASE_URL` and `DIRECT_URL` are updated
- Ensure password is URL-encoded if it contains special characters
- Restart application after updating

### Problem: Application still using old keys

**Solution:**
- Clear browser cache
- Restart development server completely
- Check Vercel deployment logs for errors
- Verify environment variables are saved correctly in Vercel

### Problem: Can't find "Rotate" button in Supabase

**Solution:**
- Look for "Reset" button instead
- Check you're in the correct project
- Ensure you have admin access to the project
- Try refreshing the page

---

## 🔗 Quick Links

- **Supabase API Settings:** https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/api
- **Supabase Database Settings:** https://app.supabase.com/project/qbxugwctchtqwymhucpl/settings/database
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Logs:** https://app.supabase.com/project/qbxugwctchtqwymhucpl/logs

---

## ⏱️ Timeline

**Immediate (Now):**
- Rotate Service Role Key
- Rotate Anon Key
- Change Database Password

**Within 1 Hour:**
- Update local environment variables
- Update Vercel environment variables
- Test locally

**Within 24 Hours:**
- Verify production deployment
- Monitor for unauthorized access
- Document any issues

---

## 📞 Need Help?

If you encounter issues:

1. Check Supabase documentation: https://supabase.com/docs
2. Review error messages in application logs
3. Check Supabase dashboard logs
4. Verify all keys are correctly formatted

---

**Status:** ⚠️ **ACTION REQUIRED**  
**Last Updated:** 2025-12-09

