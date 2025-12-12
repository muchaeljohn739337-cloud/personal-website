# Tailscale Integration Guide

## Overview

Tailscale provides zero-trust networking for secure admin access and service-to-service communication.

## Use Cases for This Project

### 1. Secure Admin Endpoints ⭐ PRIMARY USE CASE

Restrict admin routes to Tailscale network only:

- `/api/admin/shield/*` - SHIELD security dashboard
- `/api/admin/security/*` - Security management
- `/api/admin/*` - All admin endpoints
- HashiCorp Vault UI (port 8200)

### 2. Service-to-Service Communication

- Backend → Vault (encrypted)
- Backend → Redis (when enabled)
- Backend → Database (production)
- Backend → AI Workers

### 3. Development Access

- Local dev → Staging environment
- Local dev → Production logs/monitoring
- CI/CD → Private resources

## Installation

### Windows (Your Current Setup)

```powershell
# Download and install
winget install tailscale.tailscale

# Or via Chocolatey
choco install tailscale

# Start Tailscale
tailscale up

# Get your Tailscale IP
tailscale ip -4
# Example output: 100.101.102.103
```

### Linux/Mac (Production Servers)

```bash
# Ubuntu/Debian
curl -fsSL https://tailscale.com/install.sh | sh

# Start and authenticate
sudo tailscale up

# Get IP
tailscale ip -4
```

## Configuration

### Step 1: Middleware for Tailscale-Only Routes

Create `src/middleware/tailscaleAuth.ts`:

```typescript
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to restrict access to Tailscale network only
 * Checks if request comes from 100.x.x.x IP range (Tailscale CGNAT)
 */
export function requireTailscale(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip || req.socket.remoteAddress || "";

  // Tailscale uses 100.64.0.0/10 CGNAT range
  const isTailscale = /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./.test(clientIP);

  if (!isTailscale && process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      error: "Forbidden",
      message: "This endpoint requires Tailscale network access",
    });
  }

  next();
}

/**
 * Optional: Get Tailscale device info from headers
 * (requires Tailscale to be configured as reverse proxy)
 */
export function getTailscaleUser(req: Request): string | null {
  return req.headers["tailscale-user"]?.toString() || null;
}
```

### Step 2: Apply to Admin Routes

Modify `src/index.ts`:

```typescript
import { requireTailscale } from "./middleware/tailscaleAuth";

// Option A: Protect all admin routes
app.use("/api/admin", requireTailscale, adminRouter);

// Option B: Protect specific sensitive routes
app.use("/api/admin/shield", requireTailscale, securityAdminRouter);
app.use("/api/admin/security", requireTailscale, adminSecurityRouter);

// Option C: Layered security (Tailscale + JWT + Role check)
app.use(
  "/api/admin/shield",
  requireTailscale, // Layer 1: Network access
  authenticateToken, // Layer 2: Valid JWT
  requireAdmin, // Layer 3: Admin role
  securityAdminRouter
);
```

### Step 3: Vault Access via Tailscale

Update `.env`:

```bash
# Before (localhost only)
VAULT_ADDR=http://localhost:8200

# After (accessible from any Tailscale device)
# Replace with your server's Tailscale IP
VAULT_ADDR=http://100.101.102.103:8200
```

Configure Vault to listen on Tailscale IP:

```hcl
# vault.hcl
listener "tcp" {
  address     = "100.101.102.103:8200"  # Your Tailscale IP
  tls_disable = true  # Tailscale already encrypts
}
```

### Step 4: Environment-Specific Config

Update `src/config.ts`:

```typescript
export const config = {
  // ... existing config

  tailscale: {
    enabled: process.env.TAILSCALE_ENABLED === "true",
    adminOnlyRoutes: ["/api/admin/shield", "/api/admin/security", "/api/admin/vault"],
  },
};
```

## Access Patterns

### Development (Local)

```bash
# Start backend on localhost
npm run dev

# Access from same machine
curl http://localhost:4000/api/health

# Access admin endpoints (if Tailscale enabled)
curl http://localhost:4000/api/admin/shield/dashboard
```

### Production (Tailscale)

```bash
# From any Tailscale device
curl http://100.101.102.103:4000/api/admin/shield/dashboard

# Or use machine name
curl http://prod-backend:4000/api/admin/shield/dashboard
```

## Tailscale ACLs (Access Control Lists)

Configure in Tailscale admin console for fine-grained control:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["group:admins"],
      "dst": ["tag:backend:4000", "tag:vault:8200"]
    },
    {
      "action": "accept",
      "src": ["tag:backend"],
      "dst": ["tag:vault:8200", "tag:redis:6379"]
    }
  ],
  "groups": {
    "group:admins": ["you@example.com", "admin@example.com"]
  },
  "tagOwners": {
    "tag:backend": ["you@example.com"],
    "tag:vault": ["you@example.com"]
  }
}
```

## Testing

### Test Tailscale Detection

```typescript
// Add to src/routes/health.ts
router.get("/tailscale-check", (req, res) => {
  const clientIP = req.ip || req.socket.remoteAddress;
  const isTailscale = /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./.test(clientIP || "");

  res.json({
    clientIP,
    isTailscale,
    tailscaleRange: "100.64.0.0/10",
  });
});
```

Test:

```powershell
# From Tailscale network
curl http://100.101.102.103:4000/api/health/tailscale-check

# Should return:
# { "clientIP": "100.x.x.x", "isTailscale": true }
```

## Docker Integration

Update `Dockerfile`:

```dockerfile
# Install Tailscale in container
FROM node:18-alpine AS base

# Add Tailscale
RUN apk add --no-cache ca-certificates iptables iproute2 \
    && wget -q https://pkgs.tailscale.com/stable/tailscale_latest_amd64.tgz \
    && tar xzf tailscale_latest_amd64.tgz --strip-components=1 \
    && mv tailscale tailscaled /usr/local/bin/

# ... rest of Dockerfile

# Entrypoint script to start Tailscale + app
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
```

`docker-entrypoint.sh`:

```bash
#!/bin/sh
if [ -n "$TAILSCALE_AUTHKEY" ]; then
  tailscaled --tun=userspace-networking &
  tailscale up --authkey=$TAILSCALE_AUTHKEY
fi

exec node dist/index.js
```

## Security Benefits

### Defense in Depth

```
Layer 1: Cloudflare (DDoS, WAF)
Layer 2: Tailscale (Network access control)
Layer 3: SHIELD (Application security)
Layer 4: JWT (Authentication)
Layer 5: RBAC (Authorization)
```

### Zero Trust Principles

- ✅ Never trust the network
- ✅ Verify every connection
- ✅ Encrypt all traffic (WireGuard)
- ✅ Least privilege access

## Monitoring

### Log Tailscale Access

```typescript
import { logger } from "./utils/logger";

export function requireTailscale(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip || req.socket.remoteAddress || "";
  const isTailscale = /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./.test(clientIP);

  if (!isTailscale && process.env.NODE_ENV !== "development") {
    logger.warn("Blocked non-Tailscale admin access attempt", {
      ip: clientIP,
      path: req.path,
      userAgent: req.headers["user-agent"],
    });
    return res.status(403).json({ error: "Tailscale required" });
  }

  logger.info("Tailscale admin access", {
    ip: clientIP,
    path: req.path,
    user: req.user?.email,
  });

  next();
}
```

## Cost

- **Free tier**: Up to 100 devices, 3 users
- **Personal**: $6/month (unlimited devices)
- **Starter**: $6/user/month (team features)
- **Perfect for**: Small to medium projects

## Alternatives Comparison

| Feature        | Tailscale   | WireGuard | OpenVPN   | SSH Tunnel |
| -------------- | ----------- | --------- | --------- | ---------- |
| Setup Time     | 5 min       | 30 min    | 60 min    | 5 min      |
| User-Friendly  | ⭐⭐⭐⭐⭐  | ⭐⭐⭐    | ⭐⭐      | ⭐⭐⭐     |
| Auto-Config    | Yes         | No        | No        | No         |
| NAT Traversal  | Yes         | Manual    | Manual    | Manual     |
| Multi-Platform | Yes         | Yes       | Yes       | Yes        |
| Free Tier      | 100 devices | Unlimited | Unlimited | Unlimited  |

## Recommended Rollout

### Phase 1: Development (Week 1)

1. Install Tailscale on dev machine
2. Add `requireTailscale` middleware
3. Test admin endpoints via Tailscale

### Phase 2: Staging (Week 2)

1. Set up Tailscale on staging server
2. Migrate Vault to Tailscale-only access
3. Test all admin workflows

### Phase 3: Production (Week 3)

1. Deploy Tailscale to production
2. Enable Tailscale requirement for admin routes
3. Configure ACLs for team access
4. Monitor and iterate

## Troubleshooting

### Can't access admin endpoints

```powershell
# Check Tailscale status
tailscale status

# Check IP
tailscale ip -4

# Ping backend server
tailscale ping <server-name>
```

### Cloudflare interfering with Tailscale IPs

```typescript
// Use X-Forwarded-For header
const clientIP = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || req.socket.remoteAddress;
```

### Development mode bypass

```typescript
export function requireTailscale(req: Request, res: Response, next: NextFunction) {
  // Allow localhost in development
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  // Enforce Tailscale in production
  const clientIP = req.ip || "";
  const isTailscale = /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./.test(clientIP);

  if (!isTailscale) {
    return res.status(403).json({ error: "Tailscale required" });
  }

  next();
}
```

## Conclusion

**YES, Tailscale fits your project perfectly**, especially for:

1. ✅ Securing admin/SHIELD endpoints (primary use case)
2. ✅ Vault communication
3. ✅ Multi-environment access
4. ✅ Team collaboration

**Start with Phase 1** (dev machine) and expand from there. The investment is minimal (free tier works fine) and the
security benefits are substantial.
