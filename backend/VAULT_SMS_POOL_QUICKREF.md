# SMS Pool Vault Integration - Quick Reference

## 🎯 Overview

Your SMS Pool credentials are now integrated with HashiCorp Vault for enhanced security. This document provides quick
commands for common operations.

---

## 🚀 Quick Start

### 1. Store Credentials in Vault (First Time Setup)

```bash
# Make sure SMSPOOL_API_KEY is in your .env file first
cd backend
npx tsx scripts/store-smspool-in-vault.ts
```

**Output:**

- ✅ Stored: `smspool_api_key` (with 90-day rotation)
- ✅ Stored: `smspool_service_id`
- 📊 Audit log entries created

---

## 🔍 Verify Setup

### Check if credentials are in Vault

```typescript
import { VaultService } from "./src/services/VaultService";

const vault = new VaultService();
const apiKey = await vault.getSecret("smspool_api_key");
console.log("API Key:", apiKey ? "✅ Found" : "❌ Not found");
```

### Check RPA Config

The RPA config automatically uses Vault when `VAULT_ENABLED=true`:

```typescript
import { getSMSPoolCredentials } from "./src/rpa/config";

const creds = await getSMSPoolCredentials();
console.log("API Key:", creds.apiKey ? "✅ Loaded" : "❌ Missing");
console.log("Service ID:", creds.serviceId);
```

---

## 🔄 Credential Management

### Manual Rotation (Before 90-day automatic rotation)

```bash
# Update API key in SMS Pool dashboard first, then:
cd backend
npx tsx -e "
import { VaultService } from './src/services/VaultService';
const vault = new VaultService();
await vault.rotateSecret('smspool_api_key', 'NEW_API_KEY_HERE', 'admin-user-id');
"
```

### View Audit Logs

```bash
# See who accessed SMS Pool credentials
cd backend
npx prisma studio
# Navigate to: vault_audit_logs table
# Filter by: secretKey = 'smspool_api_key'
```

---

## 🔧 Configuration Modes

### Production Mode (Vault Enabled)

```env
# backend/.env
VAULT_ENABLED=true
VAULT_ADDR=https://vault.yourcompany.com
VAULT_TOKEN=hvs.xxxxxxxxxxxxx
# SMSPOOL_API_KEY not needed here (stored in Vault)
```

### Development Mode (Vault Fallback)

```env
# backend/.env
VAULT_ENABLED=false
SMSPOOL_API_KEY=SMSPOOL_fS2pMx2K7kxv2gotVOMPwQZEK8K9D0UG
SMSPOOL_SERVICE_ID=1
```

---

## 📊 Security Features

| Feature                | Status       | Details                  |
| ---------------------- | ------------ | ------------------------ |
| **Encryption at Rest** | ✅ Enabled   | AES-256-CBC              |
| **Automatic Rotation** | ✅ Enabled   | 90-day policy            |
| **Audit Logging**      | ✅ Enabled   | All access logged        |
| **Admin-Only Access**  | ✅ Enabled   | RBAC enforced            |
| **MFA Support**        | ✅ Available | TOTP-based               |
| **Fallback Support**   | ✅ Enabled   | Uses .env if Vault fails |

---

## 🚨 Troubleshooting

### Issue: Script fails with "No admin user found"

**Solution:**

```bash
cd backend
npx tsx scripts/seed-admin.ts
# Then retry store-smspool-in-vault.ts
```

### Issue: "Secret already exists"

**Solution:**

```typescript
// Use rotateSecret instead of createSecret
import { VaultService } from "./src/services/VaultService";
const vault = new VaultService();
await vault.rotateSecret("smspool_api_key", "NEW_VALUE", "admin-user-id");
```

### Issue: Vault connection timeout

**Solution:**

```bash
# Check Vault server status
curl $VAULT_ADDR/v1/sys/health

# Verify VAULT_TOKEN is valid
export VAULT_TOKEN=your-token
vault token lookup
```

### Issue: RPA still using environment variable

**Solution:**

```bash
# Verify VAULT_ENABLED is set correctly
echo $VAULT_ENABLED  # Should output: true

# Check Vault service logs
# Look for: "✅ HashiCorp Vault connected"
```

---

## 📚 Related Files

- **Vault Service**: `backend/src/services/VaultService.ts`
- **Storage Script**: `backend/scripts/store-smspool-in-vault.ts`
- **RPA Config**: `backend/src/rpa/config.ts`
- **Setup Guide**: `backend/SMS_POOL_SETUP.md`
- **Prisma Schema**: `backend/prisma/schema.prisma` (vault_secrets, vault_audit_logs)

---

## ✅ Security Checklist

- [ ] SMS Pool credentials stored in Vault
- [ ] `VAULT_ENABLED=true` in production .env
- [ ] SMSPOOL_API_KEY removed from production .env (keep in .env.local for backup)
- [ ] Vault token secured (not in version control)
- [ ] Audit logs reviewed regularly
- [ ] 90-day rotation policy confirmed
- [ ] Backup codes generated for MFA
- [ ] Team trained on Vault access procedures

---

**Need Help?**

- Review: `backend/SMS_POOL_SETUP.md`
- Check logs: Vault service logs in console
- Test connection: `npx tsx scripts/store-smspool-in-vault.ts --dry-run`
