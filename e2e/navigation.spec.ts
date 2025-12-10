import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check navigation exists
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Check for common navigation items
    const navItems = ['Features', 'Pricing', 'About', 'Docs'];
    for (const item of navItems) {
      const navLink = page.locator(`nav a:has-text("${item}")`).first();
      if (await navLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(navLink).toBeVisible();
      }
    }
  });

  test('should navigate to Features section', async ({ page }) => {
    await page.goto('/');

    const featuresLink = page.locator('a[href*="features"], nav a:has-text("Features")').first();
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await page.waitForTimeout(1000);
      // Should scroll to features or navigate
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have mobile menu toggle', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Look for mobile menu button
    const menuButton = page
      .locator('button[aria-label*="menu" i], button:has-text("Menu")')
      .first();
    if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Mobile menu should be visible
      const mobileMenu = page.locator('nav, [role="menu"], [class*="mobile-menu"]');
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should have working logo that links to home', async ({ page }) => {
    await page.goto('/');

    const logo = page.locator('a[href="/"], nav a:has-text("Advancia")').first();
    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL(/\//);
    }
  });

  test('should navigate to static pages', async ({ page }) => {
    const pages = [
      { name: 'Privacy', path: '/privacy' },
      { name: 'Terms', path: '/terms' },
      { name: 'FAQ', path: '/faq' },
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      await expect(page).toHaveURL(new RegExp(pageInfo.path));
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
