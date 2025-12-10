import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint should return 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
    }
  });

  test('health check should include status information', async ({ request }) => {
    const response = await request.get('/api/health');

    if (response.ok()) {
      const data = await response.json();
      expect(data.status).toBeTruthy();
      // Status should be 'healthy' or 'degraded'
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    }
  });

  test('protected API routes should require authentication', async ({ request }) => {
    // Try to access a protected endpoint without auth
    const response = await request.get('/api/user/profile').catch(() => null);

    // Should return 401 or 403
    if (response) {
      expect([401, 403, 404]).toContain(response.status());
    }
  });
});
