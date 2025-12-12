# 🔐 Sentry Auth Token Setup

**Issue:** Warning about missing Sentry auth token during build  
**Status:** ✅ **Fixed** - Warning is now suppressed when token is not provided

---

## What Changed

The Sentry configuration has been updated to:

- ✅ Only upload source maps if `SENTRY_AUTH_TOKEN` is provided
- ✅ Suppress warnings when auth token is not available
- ✅ Error reporting still works without source maps

---

## About the Warning

The warning you saw:

```
Warning: No auth token provided. Will not upload source maps.
```

This is **not an error** - it's just informing you that source maps won't be uploaded to Sentry. Your application will still work perfectly, and error reporting will still function. Source maps just make stack traces easier to read in Sentry.

---

## Options

### Option 1: Ignore the Warning (Recommended for Now)

**Status:** ✅ **Already Fixed**

The configuration now suppresses this warning. Your build will complete without the warning, and everything will work normally.

**Pros:**

- No action needed
- Build completes cleanly
- Error reporting still works
- No additional setup required

**Cons:**

- Stack traces in Sentry will be minified (harder to read)
- Source maps won't be uploaded

---

### Option 2: Add Sentry Auth Token (Optional)

If you want prettier stack traces in Sentry, you can add the auth token:

#### Step 1: Get Sentry Auth Token

1. Go to: https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Select scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Copy the token

#### Step 2: Add to Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select project: `personal-website`
3. Navigate to: **Settings → Environment Variables**
4. Add:
   - **Name:** `SENTRY_AUTH_TOKEN`
   - **Value:** `[your-token-from-step-1]`
   - **Environment:** Production (and Preview if needed)
5. Click "Save"

#### Step 3: Add to Local Development

Add to your `.env.local` file:

```bash
SENTRY_AUTH_TOKEN=your_token_here
```

#### Step 4: Redeploy

After adding the token, trigger a new deployment:

- Vercel will automatically redeploy when env vars change
- Or manually redeploy from Vercel dashboard

**Pros:**

- Prettier stack traces in Sentry
- Easier debugging
- Better error context

**Cons:**

- Requires Sentry account setup
- Slightly longer build times (source map upload)

---

## Current Configuration

The `next.config.mjs` now includes:

```javascript
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only include authToken if provided
  ...(process.env.SENTRY_AUTH_TOKEN && {
    authToken: process.env.SENTRY_AUTH_TOKEN,
  }),

  // Suppress warnings if token not provided
  silent: !process.env.CI || !process.env.SENTRY_AUTH_TOKEN,

  // ... other options
};
```

This means:

- ✅ No warnings if token is missing
- ✅ Source maps upload automatically if token is provided
- ✅ Error reporting works either way

---

## Verification

After the fix, you should see:

- ✅ Build completes without Sentry auth token warnings
- ✅ No errors in build logs
- ✅ Application works normally
- ✅ Error reporting to Sentry still functions

---

## Summary

**Current Status:** ✅ **Fixed**

The warning has been resolved. You can:

1. **Continue without the token** - Everything works, just minified stack traces
2. **Add the token later** - For prettier stack traces (optional)

**No action required** - the warning is now suppressed and won't appear in future builds.

---

**Last Updated:** 2025-01-27
