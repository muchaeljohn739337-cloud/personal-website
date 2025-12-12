# Test Commands Quick Reference

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.controller.spec.ts
npm test -- wallets.controller.spec.ts
npm test -- withdrawals.controller.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Run tests in specific directory
npm test -- test/auth/
npm test -- test/wallets/
npm test -- test/withdrawals/

# Watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run in band (one test file at a time)
npm test -- --runInBand

# Verbose output
npm test -- --verbose

# Silent mode (no console.log output)
npm test -- --silent

# Update snapshots
npm test -- -u
```

## 🐛 Debugging

```bash
# Debug single test
npm test -- --testNamePattern="specific test name" --runInBand

# Show open handles (for hanging tests)
npm test -- --detectOpenHandles

# Force exit (when tests hang)
npm test -- --forceExit

# Clear cache
npm test -- --clearCache

# No cache
npm test -- --no-cache
```

## 📊 Coverage

```bash
# Generate coverage
npm run test:coverage

# View coverage in browser
npm run test:coverage && open coverage/index.html

# Coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/routes/auth.ts"

# Coverage summary only
npm test -- --coverage --coverageReporters=text
```

## 🔍 Filtering

```bash
# Run only tests with "admin" in name
npm test -- --testNamePattern="admin"

# Run tests in auth suite only
npm test -- --testPathPattern="auth"

# Skip tests with "slow" in name
npm test -- --testNamePattern="^((?!slow).)*$"

# Run only failed tests from last run
npm test -- --onlyFailures
```

## ⚡ Performance

```bash
# Run tests in parallel (default)
npm test

# Run serially (one at a time)
npm test -- --runInBand

# Limit workers
npm test -- --maxWorkers=2

# Show test duration
npm test -- --verbose

# Faster without coverage
npm test -- --skipCoverage
```

## 🎯 CI/CD Mode

```bash
# CI optimized
npm test -- --ci --coverage --maxWorkers=2

# CI with no colors
npm test -- --ci --no-colors

# Fail on first error
npm test -- --bail
```

## 🛠️ Setup & Cleanup

```bash
# Reset test database
npx prisma migrate reset --force

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

## 📝 Common Workflows

### First Time Setup
```bash
cd backend
npm install
cp .env.example .env.test
# Edit .env.test with test database URL
npx prisma migrate deploy
npm test
```

### Before Committing
```bash
npm run test:coverage
npm run lint
npm run build
```

### Debugging Failed Test
```bash
# Run specific test
npm test -- --testNamePattern="test name" --verbose

# Check database state
npx prisma studio

# Clear cache and rerun
npm test -- --clearCache --testNamePattern="test name"
```

### Adding New Test
```bash
# Create test file
touch test/feature/feature.controller.spec.ts

# Run only new file
npm test -- feature.controller.spec.ts --watch

# Run with coverage
npm test -- feature.controller.spec.ts --coverage
```

## 🎨 Test Writing Patterns

```typescript
// Basic test structure
describe('Feature Name (E2E)', () => {
  const app = getApp();
  let userAuth: { user: any; token: string };

  beforeEach(async () => {
    await resetDatabase();
    userAuth = await createTestUser();
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set(authHeader(userAuth.token))
      .expect(200);

    expect(response.body).toHaveProperty('field');
  });
});

// Test with database verification
it('should update database', async () => {
  await request(app)
    .post('/api/endpoint')
    .set(authHeader(userAuth.token))
    .send({ data: 'value' })
    .expect(201);

  const record = await prisma.model.findFirst();
  expect(record).toBeDefined();
});

// Test error handling
it('should return 400 for invalid input', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .set(authHeader(userAuth.token))
    .send({ invalid: 'data' })
    .expect(400);

  expect(response.body).toHaveProperty('error');
});
```

## 📌 Useful Jest Matchers

```typescript
// Equality
expect(value).toBe(expected)
expect(value).toEqual(expected)
expect(value).toStrictEqual(expected)

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeDefined()
expect(value).toBeNull()

// Numbers
expect(number).toBeGreaterThan(3)
expect(number).toBeLessThan(5)
expect(number).toBeCloseTo(3.14, 2)

// Strings
expect(string).toMatch(/pattern/)
expect(string).toContain('substring')

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)
expect(array).toEqual(expect.arrayContaining([1, 2]))

// Objects
expect(object).toHaveProperty('key')
expect(object).toMatchObject({ key: 'value' })

// Errors
expect(() => fn()).toThrow()
expect(() => fn()).toThrow(Error)
expect(() => fn()).toThrow('error message')

// Async
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()
```

## 🚨 Troubleshooting

```bash
# Tests hang
npm test -- --detectOpenHandles --forceExit

# Database connection issues
# Check DATABASE_URL in .env.test
echo $DATABASE_URL
npx prisma migrate status

# Import errors
npm install
npx prisma generate

# Type errors
npx tsc --noEmit

# Clear everything and start fresh
rm -rf node_modules coverage
npm install
npx prisma generate
npm test
```

## 📚 Resources

- Jest Docs: https://jestjs.io/docs/getting-started
- Supertest Docs: https://github.com/visionmedia/supertest
- Prisma Testing: https://www.prisma.io/docs/guides/testing
- Test README: `/backend/test/README.md`
- Implementation Summary: `/backend/TEST_IMPLEMENTATION_SUMMARY.md`
