# Backend API Test Suite

Comprehensive E2E (End-to-End) test suite for Advancia Pay Ledger backend API endpoints.

## 📁 Structure

```
test/
├── setup.ts                           # Global test configuration
├── test-utils.ts                       # Reusable test helper functions
├── auth/
│   └── auth.controller.spec.ts        # Authentication endpoints
├── wallets/
│   └── wallets.controller.spec.ts     # Wallet management endpoints
└── withdrawals/
    └── withdrawals.controller.spec.ts # Withdrawal endpoints
```

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.controller.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"
```

## 🔧 Configuration

Jest configuration is in `jest.config.js`:
- **Test Environment**: Node.js
- **Test Timeout**: 30 seconds
- **Test Pattern**: `**/*.spec.ts` and `**/*.test.ts`
- **Coverage Threshold**: 70-80% across branches, functions, lines, statements

## 📦 Test Utilities

### `test-utils.ts`

Provides helper functions for common test operations:

```typescript
// Create test user with JWT token
const { user, token } = await createTestUser({ 
  email: 'test@example.com',
  role: 'admin' 
});

// Create test wallet
const wallet = await createTestWallet(userId, 'BTC', 10);

// Create test withdrawal
const withdrawal = await createTestWithdrawal(userId, 0.5, 'BTC', 'pending');

// Generate auth header
const headers = authHeader(token);

// Cleanup
await cleanupTestUser(userId);
```

### `setup.ts`

Global setup and teardown:
- Connects to test database before all tests
- Cleans database before/after test runs
- Provides `resetDatabase()` for isolated tests
- Exports `getApp()` to access Express instance

## 📝 Test Suites

### Authentication Tests (`auth.controller.spec.ts`)

6 test suites covering:
- ✅ User registration with validation
- ✅ Login with JWT token generation
- ✅ Logout and token invalidation
- ✅ Token refresh flow
- ✅ Password reset workflow
- ✅ Input validation and error handling

### Wallet Tests (`wallets.controller.spec.ts`)

7 test suites covering:
- ✅ Wallet creation and listing
- ✅ Balance queries by currency
- ✅ Transaction history with pagination
- ✅ Transaction filtering by date/type
- ✅ Wallet updates and deletion
- ✅ Authentication requirements
- ✅ Authorization (user can only access own wallets)

### Withdrawal Tests (`withdrawals.controller.spec.ts`)

8 test suites covering:
- ✅ Withdrawal request creation
- ✅ Insufficient balance validation
- ✅ User withdrawal history
- ✅ Withdrawal details retrieval
- ✅ Admin pending withdrawals list
- ✅ Admin approval with balance deduction
- ✅ Admin rejection with reason
- ✅ Withdrawal statistics for admins

## 🗃️ Database Setup

### Prerequisites

1. PostgreSQL test database
2. Environment variable `DATABASE_URL` pointing to test database

**⚠️ Important**: Use a separate test database! Tests truncate all tables.

### Example Test Database URL

```env
# .env.test
DATABASE_URL="postgresql://user:password@localhost:5432/advancia_test?schema=public"
```

### Database Isolation

Each test suite uses `beforeEach(resetDatabase)` to ensure:
- Clean state before every test
- No data pollution between tests
- Predictable test outcomes

## 🔐 Authentication Flow

Tests use JWT authentication:

```typescript
// 1. Create user and get token
const { user, token } = await createTestUser();

// 2. Use token in requests
const response = await request(app)
  .get('/api/wallets')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

## 📊 Coverage Goals

| Metric     | Target |
|------------|--------|
| Branches   | 70%    |
| Functions  | 75%    |
| Lines      | 75%    |
| Statements | 80%    |

Generate coverage report:
```bash
npm run test:coverage
open coverage/index.html  # View detailed report
```

## 🐛 Debugging Tests

### Run specific test
```bash
npm test -- --testNamePattern="should approve a pending withdrawal"
```

### Enable verbose output
```bash
npm test -- --verbose
```

### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "--testTimeout=30000"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## 📚 Writing New Tests

### Template

```typescript
import request from 'supertest';
import { getApp, resetDatabase } from '../setup';
import { createTestUser, authHeader } from '../test-utils';

describe('Feature Name (E2E)', () => {
  const app = getApp();
  let userAuth: { user: any; token: string };

  beforeEach(async () => {
    await resetDatabase();
    userAuth = await createTestUser();
  });

  describe('GET /api/endpoint', () => {
    it('should do something', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .set(authHeader(userAuth.token))
        .expect(200);

      expect(response.body).toHaveProperty('someField');
    });
  });
});
```

### Best Practices

1. **Isolation**: Use `resetDatabase()` in `beforeEach`
2. **Cleanup**: Tests clean up automatically via global hooks
3. **Descriptive Names**: Use clear test descriptions
4. **Assert Everything**: Check status code, response structure, database state
5. **Edge Cases**: Test validation, authorization, edge conditions
6. **Decimals**: Use Prisma Decimal for monetary values, serialize to string in responses

## 🔄 CI/CD Integration

Tests run automatically on:
- Every commit (via GitHub Actions)
- Pull requests
- Before deployment

### CI Configuration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    cd backend
    npm test -- --ci --coverage --maxWorkers=2
```

## 📞 Troubleshooting

### Tests hang or timeout
- Check database connection
- Ensure `testTimeout` is sufficient (30s default)
- Use `--runInBand` to run serially

### Database connection errors
- Verify `DATABASE_URL` points to test database
- Check PostgreSQL is running
- Run `npx prisma migrate deploy` in test database

### Import errors
- Run `npm install` to ensure all dependencies installed
- Check `tsconfig.json` paths match Jest `moduleNameMapper`

### Coverage not collected
- Ensure source files are in `src/**/*.ts`
- Check `collectCoverageFrom` patterns in `jest.config.js`

## 🎯 Next Steps

- [ ] Add integration tests for external services (Stripe, email)
- [ ] Add performance benchmarks
- [ ] Add contract tests for API schemas
- [ ] Set up mutation testing (Stryker)
- [ ] Add visual regression tests for error responses
