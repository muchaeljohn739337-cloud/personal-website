# 🔒 Security Quick Reference

## ✅ DO THIS

### 1. Use Prisma Tagged Templates

```typescript
// ✅ SAFE
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

### 2. Whitelist Identifiers

```typescript
// ✅ SAFE
import { sanitizeIdentifier } from "./utils/dbSecurity";
const table = sanitizeIdentifier(input, ["users", "logs"]);
```

### 3. Validate Inputs

```typescript
// ✅ SAFE
import { isValidUUID, isValidEmail } from "./utils/dbSecurity";
if (!isValidUUID(id)) throw new Error("Invalid ID");
```

### 4. Use SafePrisma

```typescript
// ✅ SAFE - Auto-adds required fields
import { SafePrisma } from "./ai-expansion/validators/SafePrisma";
await SafePrisma.create("audit_logs", { userId, action, resourceType, resourceId });
```

### 5. Separate Commands from Input

```typescript
// ✅ SAFE
const { execFile } = require("child_process");
await execFileAsync("command", [arg1, arg2], { env: { VAR: value } });
```

---

## ❌ DON'T DO THIS

### 1. String Concatenation

```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE id = '${userId}'`;
```

### 2. $queryRawUnsafe with User Input

```typescript
// ❌ VULNERABLE
await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}`);
```

### 3. Shell Commands with User Input

```typescript
// ❌ VULNERABLE
exec(`psql -c "${userInput}"`);
```

### 4. Unvalidated Identifiers

```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM ${userTableName}`;
```

---

## 🚀 Quick Start

```typescript
import {
  safeQuery,
  sanitizeIdentifier,
  sanitizePaginationParams,
  isValidUUID,
  executeWithRetry,
} from "./utils/dbSecurity";

// Safe query
const users = await safeQuery`SELECT * FROM users WHERE id = ${id}`;

// Validate table name
const table = sanitizeIdentifier(input, ["users", "logs"]);

// Sanitize pagination
const { limit, offset } = sanitizePaginationParams(req.query);

// Validate UUID
if (!isValidUUID(id)) throw new Error("Invalid");

// Query with retry
const result = await executeWithRetry(() => prisma.users.findMany());
```

---

## 📚 Full Documentation

- **DATABASE_SECURITY.md** - Complete security guide
- **SECURITY_IMPROVEMENTS.md** - What was fixed
- **examples/SecurityExamples.ts** - 9 working examples
- **src/utils/dbSecurity.ts** - Utility functions

---

**Remember:** Always separate commands from user input!
