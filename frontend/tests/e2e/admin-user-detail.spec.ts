import { expect, test } from "@playwright/test";

/**
 * E2E test for Admin User Detail page
 * Flow: Login via OTP → Users list → Details → verify profile/balances → switch tabs → suspend toggle
 */

// Admin credentials (matching backend defaults)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@advancia.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASS || "Admin@123";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+15551234567";

test.describe("Admin User Detail", () => {
  test("should display user details, allow tab switching, and toggle suspend status", async ({
    page,
  }) => {
    // 1. Login as admin via OTP (dev mode)
    console.log("DEBUG: Starting admin login...");
    await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle" });
    
    // Wait for page to load
    await expect(page.locator('h1:has-text("Admin Login")')).toBeVisible({ timeout: 10000 });
    console.log("DEBUG: Admin login page loaded");
    
    // Fill admin credentials
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.fill('input[type="tel"]', ADMIN_PHONE);
    
    console.log(`DEBUG: Attempting login with ${ADMIN_EMAIL}`);
    
    // Set up network listener to capture the login request/response
    page.on('response', async (response) => {
      if (response.url().includes('/api/auth/admin/login')) {
        console.log(`DEBUG: Login API response status: ${response.status()}`);
        const responseBody = await response.text().catch(() => 'Unable to read response');
        console.log(`DEBUG: Login API response: ${responseBody}`);
      }
    });
    
    // Click Send OTP button and wait for response
    const submitButton = page.locator('button[type="submit"]:has-text("Send OTP")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Check for error messages
    const errorMessage = page.locator('.bg-red-50');
    const hasError = await errorMessage.isVisible().catch(() => false);
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.error(`DEBUG: Error displayed: ${errorText}`);
    }

    // Wait until OTP input is visible (step changes to "otp") or error appears
    console.log("DEBUG: Waiting for OTP input field or error...");
    await Promise.race([
      expect(page.locator('input[placeholder="123456"]')).toBeVisible({ timeout: 15000 }),
      expect(errorMessage).toBeVisible({ timeout: 15000 }).then(() => {
        throw new Error(`Login failed with error: ${errorMessage.textContent()}`);
      }),
    ]);
    console.log("DEBUG: OTP input field appeared");

    // Fetch OTP via dev helper endpoint
    console.log("DEBUG: Fetching OTP from backend...");
    const codeResp = await page.request.get(
      `http://localhost:4000/api/auth/admin/dev/get-otp?email=${encodeURIComponent(ADMIN_EMAIL)}`,
    );
    
    if (!codeResp.ok()) {
      console.error("DEBUG: Failed to fetch OTP:", await codeResp.text());
    }
    expect(codeResp.ok()).toBeTruthy();
    
    const codeData = await codeResp.json();
    const otpCode = (codeData as any).code as string;
    expect(otpCode).toBeTruthy();
    console.log(`DEBUG: Retrieved OTP: ${otpCode}`);

    // Enter OTP code
    await page.fill('input[placeholder="123456"]', otpCode);
    console.log("DEBUG: Filled OTP:", otpCode);
    
    // Wait for Verify button to be visible and enabled
    const verifyButton = page.locator('button[type="submit"]:has-text("Verify OTP")');
    await expect(verifyButton).toBeVisible();
    await expect(verifyButton).toBeEnabled({ timeout: 5000 });
    console.log("DEBUG: Verify button is enabled");
    
    // Click verify and wait for navigation to /admin/sessions
    console.log("DEBUG: Clicking Verify OTP button...");
    await verifyButton.click();
    
    // Wait for successful redirect to admin sessions page
    await page.waitForURL(/\/admin\/sessions/, { timeout: 15000 });
    console.log("DEBUG: Successfully logged in, current URL:", page.url());

    // Wait a moment for localStorage to be set
    await page.waitForTimeout(1000);

    // Verify tokens are stored
    const token = await page.evaluate(() => localStorage.getItem("token"));
    const adminToken = await page.evaluate(() => localStorage.getItem("adminToken"));
    console.log("DEBUG: token exists=", !!token);
    console.log("DEBUG: adminToken exists=", !!adminToken);
    expect(token).toBeTruthy();
    expect(adminToken).toBeTruthy();

    // 2. Navigate to Users page
    await page.goto("http://localhost:3000/admin/users", { waitUntil: "domcontentloaded" });
    
    // Wait for React to hydrate and render - look for any text that should be on the page
    console.log("DEBUG: Waiting for page to render...");
    await page.waitForSelector("h1, h2, table, .text-xl", { timeout: 15000 }).catch(() => console.log("DEBUG: No heading found"));
    
    // Debug: Take screenshot and check URL
    await page.screenshot({ path: "debug-users-page.png", fullPage: true });
    console.log("DEBUG: Current URL after goto:", page.url());
    
    // Debug: Check if RequireRole is blocking
    const hasLoginForm = await page.locator('input[type="email"]').count();
    console.log("DEBUG: Has login form (redirected)?:", hasLoginForm > 0);
    
    //Wait for User Management heading
    await expect(page.locator("h1").filter({ hasText: "User Management" })).toBeVisible({
      timeout: 10000,
    });

    // 3. Wait for users table to load (ensure at least one row is visible)
    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 10000,
    });

    // 4. Click the first "Details" button
    const firstDetailsButton = page
      .locator('button:has-text("Details")')
      .first();
    await expect(firstDetailsButton).toBeVisible({ timeout: 5000 });
    await firstDetailsButton.click();

    // 5. Verify redirect to user detail page
    await expect(page).toHaveURL(/\/admin\/users\/[^/]+$/, { timeout: 10000 });

    // 6. Verify User Profile Card is visible
    await expect(page.locator("text=User Profile")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Email")).toBeVisible();

    // 7. Verify Balances Card is visible
    await expect(page.locator("text=Balances & Tier")).toBeVisible();
    await expect(page.locator("text=USD Balance")).toBeVisible();

    // 8. Verify KYC section visible on Overview tab
    await expect(page.locator("text=KYC Status")).toBeVisible();

    // 9. Switch to Transactions tab
    const transactionsTab = page.locator('button:has-text("Transactions")');
    await transactionsTab.click();
    await expect(page.locator("text=Recent Transactions")).toBeVisible({
      timeout: 5000,
    });

    // 10. Switch to Activity tab
    const activityTab = page.locator('button:has-text("Activity")');
    await activityTab.click();
    await expect(page.locator("text=Activity Log")).toBeVisible({
      timeout: 5000,
    });

    // 11. Switch back to Overview
    const overviewTab = page.locator('button:has-text("Overview")');
    await overviewTab.click();
    await expect(page.locator("text=User Profile")).toBeVisible({
      timeout: 5000,
    });

    // 12. Test suspend toggle
    const suspendButton = page
      .locator(
        'button:has-text("Suspend User"), button:has-text("Activate User")',
      )
      .first();
    await expect(suspendButton).toBeVisible({ timeout: 5000 });
    const initialButtonText = await suspendButton.textContent();

    // Click suspend/activate button
    await suspendButton.click();

    // Verify confirmation modal appears
    await expect(
      page.locator("text=/Suspend User\\?|Activate User\\?|Are you sure/i"),
    ).toBeVisible({ timeout: 3000 });

    // Click confirm button in modal
    const confirmButton = page
      .locator('button:has-text("Suspend"), button:has-text("Activate")')
      .last();
    await confirmButton.click();

    // Wait for toast notification
    await expect(
      page.locator("text=/user suspended|user activated/i"),
    ).toBeVisible({ timeout: 10000 });

    // Verify button text changed
    await expect(suspendButton).not.toHaveText(initialButtonText || "", {
      timeout: 5000,
    });

    console.log("✅ Admin User Detail E2E test passed");
  });
});
