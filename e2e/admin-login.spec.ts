import { test, expect } from '@playwright/test';

/**
 * Admin Login Test
 * Tests admin authentication with provided credentials
 */
test.describe('Admin Login', () => {
  test('should login with admin credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Fill in admin credentials
    await page.fill('input[type="email"]', 'superadmin@advanciapayledger.com');
    await page.fill('input[type="password"]', 'QAZwsxEDC1!?');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Verify we're logged in (check for admin-specific content)
    const url = page.url();
    expect(url).toMatch(/\/admin|\/dashboard/);

    // Verify admin user info is displayed (if available)
    const userEmail = await page.textContent('body');
    expect(userEmail).toContain('superadmin@advanciapayledger.com');
  });

  test('should access admin dashboard', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'superadmin@advanciapayledger.com');
    await page.fill('input[type="password"]', 'QAZwsxEDC1!?');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Navigate to admin dashboard
    await page.goto('/admin');
    
    // Verify admin dashboard loads
    await expect(page).toHaveURL(/\/admin/);
  });
});

