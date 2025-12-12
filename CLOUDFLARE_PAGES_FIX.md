# Cloudflare Pages Deployment Configuration

## ⚠️ CRITICAL: Correct Deployment Settings

The Cloudflare Pages project is currently misconfigured. It's using **Cloudflare Workers** deployment commands instead of **Cloudflare Pages** auto-deployment.

### Current (BROKEN) Configuration

```
Build command: npm run build ✅
Deploy command: npx wrangler versions upload ❌ WRONG!
```

### Correct Configuration for Cloudflare Pages Dashboard

Navigate to: **Cloudflare Dashboard → Pages → advancia-pay-ledger → Settings → Builds & deployments**

#### Build Settings

| Setting                    | Value                           |
| -------------------------- | ------------------------------- |
| **Framework preset**       | Next.js (Static HTML Export)    |
| **Build command**          | `npm run build`                 |
| **Build output directory** | `out`                           |
| **Root directory**         | `frontend` (if monorepo) or `/` |

#### Environment Variables (Build)

```bash
CF_PAGES=true                    # Triggers Next.js export mode
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://advancia-pay-ledger-backend.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://advancia-pay-ledger-backend.onrender.com
```

#### Deploy Settings

| Setting               | Value                         |
| --------------------- | ----------------------------- |
| **Deploy command**    | **LEAVE EMPTY** or **DELETE** |
| **Production branch** | `main`                        |

## Why This Matters

### Workers vs Pages

- **Cloudflare Workers**: Serverless JavaScript runtime (requires `wrangler versions upload`)
- **Cloudflare Pages**: Static site hosting (auto-deploys from build output directory)

### Current Error

```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

This error occurs because:

1. `npx wrangler versions upload` is for **Workers**, not **Pages**
2. Pages should automatically deploy from the `out` directory
3. No deploy command is needed - Cloudflare handles this automatically

## How Next.js Export Works

### next.config.js Logic

```javascript
output: process.env.CF_PAGES ? "export" : "standalone";
```

When `CF_PAGES=true`:

- Next.js generates static HTML files in `out/` directory
- All pages are pre-rendered at build time
- No Node.js server required
- Perfect for Cloudflare Pages

### Build Output

```
✓ Generating static pages (57/57)
✓ Finalizing page optimization
```

All 57 routes successfully exported to `out/` directory.

## Fix Steps

### Option 1: Cloudflare Dashboard (Recommended)

1. Go to **Cloudflare Dashboard**
2. Navigate to **Pages** → **advancia-pay-ledger** → **Settings**
3. Click **Builds & deployments**
4. Update:
   - Build command: `npm run build`
   - Build output directory: `out`
   - **Delete the "Deploy command" entirely**
5. Add environment variable: `CF_PAGES=true`
6. Save and retry deployment

### Option 2: Wrangler Configuration (Alternative)

If you must use wrangler for some reason, use Pages deployment:

```bash
npx wrangler pages deploy out --project-name=advancia-pay-ledger
```

But this is **NOT recommended** - let Cloudflare auto-deploy.

## Verification

After fixing the configuration, you should see:

```
✅ Build completed successfully
✅ Deploying to Cloudflare Pages...
✅ Deployment complete
🌐 https://advancia-pay-ledger.pages.dev
```

No `wrangler` errors, no missing entry-point messages.

## Additional Notes

### Why `CF_PAGES` Environment Variable?

- Tells Next.js to use `export` mode instead of `standalone`
- Must be set in Cloudflare build environment
- Local builds don't need this (uses `standalone` for local development)

### Monitoring Build Logs

Watch for these success indicators:

- ✓ Compiled successfully
- ✓ Checking validity of types
- ✓ Generating static pages (57/57)
- ✓ Finalizing page optimization

### Common Issues

1. **Missing `CF_PAGES` env var** → Next.js uses standalone mode → deploys `.next` instead of `out`
2. **Wrong deploy command** → Wrangler tries Workers deployment → fails
3. **Incorrect output directory** → Cloudflare can't find files to deploy

---

**Status**: Configuration needs to be updated in Cloudflare Dashboard
**Priority**: High - blocks all frontend deployments
**ETA**: 5 minutes to update settings in dashboard
