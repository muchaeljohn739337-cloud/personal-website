# Admin Password Setup Guide

## ⚠️ IMPORTANT: Password Security Update

The authentication system now uses **bcrypt password verification**. Your `ADMIN_PASS` environment variable **MUST be a bcrypt hash**, not plain text.

---

## Quick Setup

### Option 1: Generate Hash (Recommended)

```powershell
cd backend
node scripts/hash-admin-password.js "YourSecurePassword"
```

**Output:**

```
🔐 Hashing Admin Password...

Plain Password: YourSecurePassword

Hashed Password (copy to .env):
────────────────────────────────────────────────────────────
$2a$10$abc123...xyz789
────────────────────────────────────────────────────────────

Add to backend/.env:
ADMIN_PASS="$2a$10$abc123...xyz789"

✅ Hash generated successfully!
```

**Then update `backend/.env`:**

```env
ADMIN_EMAIL="admin@advancia.com"
ADMIN_PASS="$2a$10$abc123...xyz789"
```

---

### Option 2: Use Default (Development Only)

**Default password:** `Admin@123`

**Generate hash:**

```powershell
cd backend
node scripts/hash-admin-password.js
```

Copy the output hash to `.env`:

```env
ADMIN_PASS="$2a$10$[hash-here]"
```

---

## For Production

### Step 1: Generate Strong Password

```powershell
# Generate secure random password (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 20 | % {[char]$_})

# Or use: https://passwordsgenerator.net/
```

### Step 2: Hash the Password

```powershell
cd backend
node scripts/hash-admin-password.js "YOUR_GENERATED_PASSWORD"
```

### Step 3: Store Securely

**In production environment:**

- Store plain password in password manager (LastPass, 1Password, etc.)
- Add hashed password to `.env` or deployment environment variables
- **NEVER commit plain or hashed passwords to Git**

---

## Migration from Plain Text

If your current `.env` has:

```env
ADMIN_PASS="Admin@123"  # ❌ Plain text - INSECURE
```

**Fix it:**

```powershell
cd backend
node scripts/hash-admin-password.js "Admin@123"
```

Replace with hash:

```env
ADMIN_PASS="$2a$10$[generated-hash]"  # ✅ Hashed - SECURE
```

---

## Verification

### Test Admin Login

**1. Start backend:**

```powershell
cd backend
npm run dev
```

**2. Test login (using API client or curl):**

```powershell
curl -X POST http://localhost:4000/api/auth/admin/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@advancia.com","password":"YOUR_PLAIN_PASSWORD","phone":"+1234567890"}'
```

**Expected response:**

```json
{
  "message": "OTP sent. Please verify.",
  "requiresOTP": true
}
```

---

## Troubleshooting

### Issue: "Invalid credentials"

**Cause:** Password mismatch

**Solution:**

1. Verify your `.env` has the correct hash
2. Re-generate hash: `node scripts/hash-admin-password.js "YourPassword"`
3. Ensure no extra quotes or spaces in `.env`

### Issue: Script error

**Cause:** bcryptjs not installed

**Solution:**

```powershell
cd backend
npm install bcryptjs
```

### Issue: Login works but verification fails

**Cause:** Possible timing issue or bcrypt version mismatch

**Check:**

```javascript
// In backend/src/routes/authAdmin.ts
const passwordValid = await bcrypt.compare(password, ADMIN_PASS);
console.log("Password valid:", passwordValid); // Should be true
```

---

## Security Best Practices

✅ **DO:**

- Use strong passwords (20+ characters, mixed case, numbers, symbols)
- Store plain passwords in password manager
- Use hashed passwords in `.env` files
- Rotate passwords every 90 days
- Use different passwords for dev/staging/production

❌ **DON'T:**

- Commit plain text passwords to Git
- Share passwords via email/Slack
- Reuse passwords across environments
- Use simple or dictionary passwords
- Store passwords in code comments

---

## Environment Variables Reference

```env
# Admin Authentication
ADMIN_EMAIL="admin@advancia.com"
ADMIN_PASS="$2a$10$[bcrypt-hash-here]"  # ⚠️ MUST be bcrypt hash

# JWT Tokens
JWT_SECRET="your-jwt-secret-key-here"
REFRESH_SECRET="your-refresh-secret-here"

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/advancia_payledger"
```

---

## Related Files

- `backend/scripts/hash-admin-password.js` - Password hashing utility
- `backend/src/routes/authAdmin.ts` - Admin authentication routes
- `backend/.env` - Environment configuration (not in Git)
- `backend/.env.example` - Template for environment variables

---

## Questions?

See the main authentication documentation:

- `backend/scripts/README-AUTH-VERIFICATION.md`
- `VERIFICATION_FIXES_SUMMARY.md`
