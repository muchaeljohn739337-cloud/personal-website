# 🔧 Agent Test Troubleshooting Guide

## Problem: `npm run agent:test` fails with "command failed"

### Quick Diagnosis

Run this simple test first:

```powershell
cd backend
node scripts/test-env.js
```

This will tell you exactly what's wrong.

---

## Common Issues & Fixes

### ❌ Issue 1: PostgreSQL Not Running

**Error:**

```
❌ Database connection failed!
ECONNREFUSED
```

**Fix:**

```powershell

# Check if PostgreSQL is running

Test-NetConnection localhost -Port 5432

# Start PostgreSQL

net start postgresql-x64-14

# OR

Start-Service postgresql*
```

---

### ❌ Issue 2: Database Doesn't Exist

**Error:**

```
database "advancia_payledger" does not exist
```

**Fix:**

```powershell

# Connect to PostgreSQL

psql -U postgres

# Create the database

CREATE DATABASE advancia_payledger;
\q

# Run migrations

cd backend
npx prisma migrate deploy
```

---

### ❌ Issue 3: tsx Not Working

**Error:**

```
npm error command C:\WINDOWS\system32\cmd.exe /d /s /c tsx scripts/test-agents.ts
```

**Fix:**

```powershell

# Option 1: Reinstall dependencies

cd backend
rm -r node_modules
npm install

# Option 2: Use node directly (simpler)

node scripts/test-env.js

# Option 3: Build and run compiled code

npm run build
node dist/scripts/test-agents.js
```

---

### ❌ Issue 4: Prisma Client Not Generated

**Error:**

```
Cannot find module '@prisma/client'
```

**Fix:**

```powershell
cd backend
npx prisma generate
```

---

### ❌ Issue 5: Missing Dependencies

**Error:**

```
Cannot find module 'xxx'
```

**Fix:**

```powershell
cd backend
npm install
```

---

## Step-by-Step Recovery

If everything is broken, follow these steps:

```powershell

# 1. Navigate to backend

cd backend

# 2. Clean install

rm -r node_modules
npm install

# 3. Generate Prisma client

npx prisma generate

# 4. Check database connection

node scripts/test-env.js

# 5. If database test passes, run agents

npm run agent:test
```

---

## Alternative: Use Compiled Code

If tsx keeps failing:

```powershell
cd backend

# Build the project

npm run build

# Run agent status check (compiled)

node dist/scripts/check-agent-status.js

# Or compile the test script manually

npx tsc scripts/test-agents.ts --outDir dist/scripts --module commonjs --esModuleInterop
node dist/scripts/test-agents.js
```

---

## Quick Test Commands

```powershell

# Test database only

node scripts/test-env.js

# Test agent status

npm run agent:status

# Run one agent manually

npm run agent:execute -- MonitorAgent

# Full test suite

npm run agent:test
```

---

## Get More Info

If you're still stuck, run:

```powershell
cd backend

# Show environment

node -e "console.log(process.env.DATABASE_URL)"

# Test Prisma

npx prisma validate

# Check if port is open

Test-NetConnection localhost -Port 5432

# List agents

ls src/agents/*Agent.ts
```

---

## Success Checklist

✅ PostgreSQL running on port 5432 ✅ Database `advancia_payledger` exists ✅ `node_modules` folder exists ✅ Prisma
client generated ✅ `node scripts/test-env.js` passes ✅ Ready to run `npm run agent:test`
