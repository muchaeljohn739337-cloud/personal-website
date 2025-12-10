# 🧪 Testing Guide - Sentry, LogRocket, and E2E Tests

## Overview

This guide covers setting up and using error tracking (Sentry), session replay (LogRocket), and end-to-end testing (Playwright).

---

## 🔴 Sentry - Error Tracking

### Setup

1. **Create Sentry Account**
   - Go to [sentry.io](https://sentry.io/)
   - Create account and organization
   - Create a new Next.js project

2. **Configure Environment Variables**

   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/project-id
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=your-project-slug
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   NEXT_PUBLIC_SENTRY_DEBUG=false
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

3. **Features Enabled**
   - ✅ Error tracking (client & server)
   - ✅ Performance monitoring
   - ✅ Session replay (on errors)
   - ✅ Source maps upload
   - ✅ User context tracking
   - ✅ Automatic breadcrumbs

### Configuration Files

- `sentry.client.config.ts` - Client-side Sentry config
- `sentry.server.config.ts` - Server-side Sentry config
- `sentry.edge.config.ts` - Edge function config
- `next.config.mjs` - Build-time Sentry integration

### Usage

Sentry automatically captures:

- Unhandled exceptions
- Console errors
- API errors
- Performance issues
- Navigation errors

**Manual Error Reporting:**

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exception
try {
  // risky operation
} catch (error) {
  Sentry.captureException(error);
}

// Add context
Sentry.setUser({ id: '123', email: 'user@example.com' });
Sentry.setTag('page', 'checkout');
Sentry.setContext('payment', { amount: 100, currency: 'USD' });
```

### Viewing Errors

1. Go to Sentry dashboard
2. Navigate to Issues
3. Filter by environment, release, or user
4. View stack traces, breadcrumbs, and session replays

---

## 📹 LogRocket - Session Replay

### Setup

1. **Create LogRocket Account**
   - Go to [logrocket.com](https://logrocket.com/)
   - Create account and project
   - Get App ID

2. **Configure Environment Variable**

   ```bash
   NEXT_PUBLIC_LOGROCKET_APP_ID=your_app_id_here
   ```

3. **Features Enabled**
   - ✅ Session replay
   - ✅ Network request logging (sanitized)
   - ✅ Console logging
   - ✅ Error tracking
   - ✅ Privacy controls (masks sensitive data)

### Configuration

LogRocket is initialized in `components/MonitoringInit.tsx` and respects cookie consent preferences.

**Privacy Settings:**

- All inputs are masked
- Password fields are blocked
- Sensitive headers are removed
- Network bodies are not captured

### Usage

**Identify Users:**

```typescript
import { identifyUser } from '@/lib/monitoring/logrocket';

identifyUser(userId, {
  email: 'user@example.com',
  name: 'John Doe',
  plan: 'pro',
});
```

**Capture Exceptions:**

```typescript
import { captureException } from '@/lib/monitoring/logrocket';

try {
  // operation
} catch (error) {
  captureException(error, {
    context: 'payment',
    userId: '123',
  });
}
```

### Viewing Sessions

1. Go to LogRocket dashboard
2. Navigate to Sessions
3. Filter by user, date, or error
4. Watch session replay with network logs

---

## 🎭 End-to-End Testing (Playwright)

### Setup

Playwright is already configured. Install browsers:

```bash
npx playwright install
```

### Test Structure

```
e2e/
├── home.spec.ts        # Home page tests
├── auth.spec.ts        # Authentication flow tests
├── payment.spec.ts     # Payment integration tests
├── navigation.spec.ts  # Navigation tests
└── api.spec.ts         # API endpoint tests
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Writing Tests

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');

  // Find element
  const button = page.locator('button');
  await expect(button).toBeVisible();

  // Click
  await button.click();

  // Assert
  await expect(page).toHaveURL(/.*success/);
});
```

### Test Configuration

See `playwright.config.ts` for:

- Test directories
- Browser configurations
- Timeout settings
- Base URL
- Reporter options

### Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** before interacting
3. **Use page.waitForURL()** for navigation
4. **Handle async operations** properly
5. **Clean up test data** after tests

### CI/CD Integration

Tests run automatically in CI:

- GitHub Actions configured
- Tests run on PRs
- Reports uploaded as artifacts

---

## 🔧 Test Environment Variables

Create `.env.test` for E2E tests:

```bash
# Test credentials (optional)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Test API keys
TEST_STRIPE_KEY=sk_test_...
TEST_PAYPAL_CLIENT_ID=test_...
```

---

## 📊 Monitoring Dashboard

### Sentry Dashboard

- **Issues**: Error tracking and resolution
- **Performance**: Transaction monitoring
- **Releases**: Version tracking
- **Users**: User-impacted errors

### LogRocket Dashboard

- **Sessions**: User session replays
- **Errors**: Error tracking with context
- **Analytics**: User behavior insights
- **Network**: API call monitoring

---

## 🚨 Alerting

### Sentry Alerts

1. Go to Alerts in Sentry
2. Create alert rules:
   - New error types
   - Error rate spikes
   - Performance degradation
   - User-impact thresholds

### LogRocket Alerts

1. Go to Settings > Alerts
2. Set up alerts for:
   - New error types
   - Session errors
   - Performance issues

---

## 🔒 Privacy & Security

### Data Sanitization

Both Sentry and LogRocket automatically sanitize:

- ✅ Passwords and tokens
- ✅ Credit card numbers
- ✅ API keys
- ✅ Authorization headers
- ✅ Sensitive form inputs

### Cookie Consent

Monitoring services only initialize if:

- User has consented to analytics cookies
- Cookie consent banner shows user preference

---

## 📈 Performance Monitoring

### Sentry Performance

- Transaction tracking
- Database query monitoring
- API endpoint performance
- Page load times

### LogRocket Performance

- Session performance metrics
- Network timing
- JavaScript errors
- Rendering performance

---

## 🐛 Debugging

### Enable Sentry Debug Mode

```bash
NEXT_PUBLIC_SENTRY_DEBUG=true
```

### View Local Test Reports

```bash
npm run test:e2e:report
```

### Test in Debug Mode

```bash
npm run test:e2e:debug
```

---

## ✅ Checklist

- [ ] Sentry account created and configured
- [ ] LogRocket account created and configured
- [ ] Environment variables set
- [ ] Tests passing locally
- [ ] CI/CD tests configured
- [ ] Alerts set up
- [ ] Privacy settings reviewed
- [ ] Documentation updated

---

## 📚 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [LogRocket Docs](https://docs.logrocket.com/docs)
- [Playwright Docs](https://playwright.dev/)
- [E2E Testing Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated**: $(date)
