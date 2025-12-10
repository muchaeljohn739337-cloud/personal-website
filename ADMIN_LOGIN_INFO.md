# 🔐 Admin Login Information

## Default Admin Credentials

Based on the project documentation, here are the default admin credentials:

### Admin Account:

**Email:** `admin@advanciapayledger.com`  
**Password:** `AdvanciaAdmin2024!Secure#`  
**Role:** `ADMIN`

**⚠️ IMPORTANT SECURITY NOTES:**
- These are default credentials - **CHANGE IMMEDIATELY** after first login
- Use a strong, unique password (12+ characters, mixed case, numbers, symbols)
- Enable 2FA for admin account
- Never share these credentials

---

## Login URL

**Development:**
- http://localhost:3000/auth/login

**Production:**
- https://advanciapayledger.com/auth/login
- https://www.advanciapayledger.com/auth/login

---

## How to Verify Admin Exists

Once your database is connected, check if admin exists:

```bash
npm run check:admin
```

This will show:
- All admin users in the database
- Their email addresses
- Their roles and status

---

## How to Create Admin (If Not Exists)

### Option 1: Using Script (Recommended)

```bash
npm run create-admin
```

**Follow the prompts:**
1. Email: `admin@advanciapayledger.com`
2. Name: `Admin User` (or your name)
3. Password: `AdvanciaAdmin2024!Secure#` (or your secure password)
4. Role: `ADMIN` (or `SUPER_ADMIN`)

### Option 2: Using Environment Variables

Set in your `.env` file:

```bash
ADMIN_EMAIL=admin@advanciapayledger.com
ADMIN_PASSWORD=AdvanciaAdmin2024!Secure#
```

Then the setup script will use these values.

---

## Current Status

**Database Connection:** ⚠️ Not connected  
**Admin Check:** Cannot verify (database required)

**Next Steps:**
1. Connect to database (update `DATABASE_URL` in `.env`)
2. Run: `npm run check:admin` to verify admin exists
3. If no admin: Run `npm run create-admin` to create one
4. Login at: `http://localhost:3000/auth/login`

---

## Security Reminder

**After logging in:**
- ✅ Change password immediately
- ✅ Enable 2FA
- ✅ Review admin settings
- ✅ Delete this file after setup

---

**Status**: Admin credentials available, but database connection required to verify/create admin user.

