# Database Security Enhancements

**Date:** December 1, 2025  
**Status:** ✅ IMPLEMENTED

## Critical SQL Injection Fixes

### 1. Command Injection in dataBackupSync.ts

**Vulnerability:** Shell command concatenation with user-controlled database credentials

```typescript
// ❌ BEFORE (VULNERABLE)
const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${filepath}"`;
await execAsync(command);
```

**Fix:** Separated command from user input using `execFile` with argument array

```typescript
// ✅ AFTER (SECURE)
await execFileAsync("pg_dump", ["-h", dbHost, "-p", dbPort, "-U", dbUser, "-d", dbName, "-F", "p", "-f", filepath], {
  env: { ...process.env, PGPASSWORD: dbPassword },
});
```

**Impact:** Prevents shell injection via malicious database credentials

---

## New Security Utilities: `src/utils/dbSecurity.ts`

### Safe Query Patterns

#### 1. Tagged Template Queries (Recommended)

```typescript
import { safeQuery } from "./utils/dbSecurity";

// ✅ Automatic escaping via Prisma tagged templates
const users = await safeQuery`
  SELECT * FROM users 
  WHERE email = ${userEmail} 
  AND status = ${status}
`;
```

#### 2. Identifier Whitelisting

```typescript
import { sanitizeIdentifier } from "./utils/dbSecurity";

// ✅ Only allow pre-defined table names
const tableName = sanitizeIdentifier(userInput, ["users", "audit_logs", "transactions"]);
```

#### 3. Pagination Sanitization

```typescript
import { sanitizePaginationParams } from "./utils/dbSecurity";

// ✅ Enforces numeric limits (1-1000) and validates input
const { limit, offset } = sanitizePaginationParams({
  limit: req.query.limit,
  offset: req.query.offset,
});
```

#### 4. ORDER BY Protection

```typescript
import { sanitizeOrderBy } from "./utils/dbSecurity";

// ✅ Whitelist columns and directions
const orderClause = sanitizeOrderBy(req.query.sort, ["created_at", "updated_at", "email", "status"], ["ASC", "DESC"]);
```

---

## Existing Safe Patterns in Codebase

### ✅ Already Using Prisma Tagged Templates

These files correctly use Prisma's safe query methods:

- `src/utils/waitForDatabase.ts` - Health check: `prisma.$queryRaw\`SELECT 1\``
- `src/routes/health.ts` - Database ping: `prisma.$queryRaw\`SELECT 1\``
- `src/ai/surveillanceAI.ts` - Connection test: `prisma.$queryRaw\`SELECT 1\``
- `src/agents/AIDeploymentAgent.ts` - Health checks: `prisma.$queryRaw\`SELECT 1\``
- `src/agents/MonitorAgent.ts` - Database validation: `prisma.$queryRaw\`SELECT 1\``

### ✅ Safe Static Queries

These files use parameterized queries without user input:

- `src/ai/recordCleanupAI.ts` - Orphaned record cleanup
- `src/ai/mapperAI.ts` - Data integrity checks

---

## Security Best Practices

### DO ✅

1. **Use Prisma's type-safe query builder**

   ```typescript
   await prisma.users.findMany({ where: { email: userEmail } });
   ```

2. **Use tagged templates for raw SQL**

   ```typescript
   await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
   ```

3. **Whitelist identifiers (tables, columns)**

   ```typescript
   const allowedTables = ["users", "logs"];
   if (!allowedTables.includes(table)) throw new Error("Invalid table");
   ```

4. **Validate and sanitize inputs**

   ```typescript
   const id = parseInt(userId);
   if (isNaN(id)) throw new Error("Invalid ID");
   ```

5. **Use SafePrisma wrapper for audit logs**

   ```typescript
   import { SafePrisma } from "./ai-expansion/validators/SafePrisma";
   await SafePrisma.create("audit_logs", { userId, action, resourceType });
   ```

### DON'T ❌

1. **Never concatenate SQL strings**

   ```typescript
   // ❌ VULNERABLE
   const query = `SELECT * FROM users WHERE id = '${userId}'`;
   ```

2. **Never use $queryRawUnsafe with user input**

   ```typescript
   // ❌ VULNERABLE
   await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName}`);
   ```

3. **Never pass user input to shell commands**

   ```typescript
   // ❌ VULNERABLE
   exec(`psql -c "${userQuery}"`);
   ```

4. **Never trust client-side validation alone**

   ```typescript
   // ❌ INSUFFICIENT
   if (req.body.isValid) {
     /* execute query */
   }
   ```

---

## Database Enhancement Features

### 1. Query Retry Logic

```typescript
import { executeWithRetry } from "./utils/dbSecurity";

const result = await executeWithRetry(
  () => prisma.users.findUnique({ where: { id: userId } }),
  3, // max retries
  30000 // timeout ms
);
```

### 2. Safe Bulk Operations

```typescript
import { safeBulkOperation } from "./utils/dbSecurity";

const operations = users.map((user) => () => prisma.audit_logs.create({ data: { userId: user.id, action: "LOGIN" } }));

await safeBulkOperation(operations, 100); // batch size
```

### 3. Health Checks

```typescript
import { checkDatabaseHealth } from "./utils/dbSecurity";

const health = await checkDatabaseHealth();
// { connected: true, latency: 45 }
```

### 4. Input Validation

```typescript
import { isValidUUID, isValidEmail } from "./utils/dbSecurity";

if (!isValidUUID(userId)) throw new Error("Invalid user ID");
if (!isValidEmail(email)) throw new Error("Invalid email");
```

---

## Markdown Linting Setup

### Installed Tools

- **markdownlint-cli** - Markdown linting and style enforcement
- **prettier** - Code formatting including markdown

### Configuration Files

- `.markdownlint.json` - Markdown rules (120 char line length, ATX headers, dash lists)
- `.prettierrc.json` - Prettier config with markdown overrides

### NPM Scripts

```bash
npm run lint:md          # Check markdown files for issues
npm run lint:md:fix      # Auto-fix markdown issues
npm run format:md        # Format markdown with Prettier
npm run format:check     # Verify formatting without changes
```

---

## Testing Recommendations

### 1. SQL Injection Tests

```typescript
// Test that special characters are escaped
const maliciousInput = "'; DROP TABLE users; --";
await expect(prisma.users.findMany({ where: { email: maliciousInput } })).resolves.toEqual([]);
```

### 2. Input Validation Tests

```typescript
// Test identifier whitelisting
expect(() => sanitizeIdentifier("malicious_table", ["users", "logs"])).toThrow("Invalid identifier");
```

### 3. Performance Tests

```typescript
// Test query timeout protection
await expect(executeWithRetry(() => slowQuery(), 1, 100)).rejects.toThrow("Query timeout");
```

---

## Migration Checklist

- [x] Fixed command injection in `dataBackupSync.ts`
- [x] Created `dbSecurity.ts` utility module
- [x] Installed markdown linting tools
- [x] Created `.markdownlint.json` config
- [x] Created `.prettierrc.json` config
- [x] Added npm scripts for linting
- [x] Documented security patterns
- [ ] Run security audit: `npm audit`
- [ ] Update existing code to use new utilities (gradual migration)
- [ ] Add SQL injection tests to test suite
- [ ] Security training for team

---

## Next Steps

1. **Run Security Audit**

   ```bash
   npm audit
   npm audit fix
   ```

2. **Lint All Markdown Files**

   ```bash
   npm run lint:md:fix
   npm run format:md
   ```

3. **Gradual Code Migration**
   - Replace raw queries with `dbSecurity` utilities
   - Add input validation to all API endpoints
   - Use SafePrisma for all audit log operations

4. **Add Security Tests**
   - SQL injection test suite
   - Input validation tests
   - Command injection tests

---

## Resources

- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Prisma Security Best Practices](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)
- [Node.js Security Checklist](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
