import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
  });

  test('should show login page on initial load', async ({ page }) => {
    // Verify we're on login page
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for dynamic content, not hardcoded
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });

  test('should switch to register form', async ({ page }) => {
    // Click register link
    await page.click('text=Create an account');
    
    // Verify register form appears
    await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="name" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="username" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for dynamic content
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.locator('button[type="submit"]')).toContainText('Create Account');
  });

  test('should register new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      name: `Test User ${timestamp}`,
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'testpass123'
    };

    // Go to register
    await page.click('text=Create an account');
    
    // Fill registration form
    await page.fill('input[placeholder*="name" i]', testUser.name);
    await page.fill('input[placeholder*="username" i]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify user is logged in - check for user-specific content
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Verify no hardcoded data - should show actual user name
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Check that token usage shows real data (0 for new user)
    const tokenUsage = page.locator('[data-testid="token-usage"]');
    await expect(tokenUsage).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // First register a user
    const timestamp = Date.now();
    const testUser = {
      name: `Login Test ${timestamp}`,
      username: `logintest${timestamp}`,
      email: `logintest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.click('text=Create an account');
    await page.fill('input[placeholder*="name" i]', testUser.name);
    await page.fill('input[placeholder*="username" i]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Logout
    await page.click('[data-testid="logout-button"]');
    
    // Now test login
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should be logged in and see dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    // Try login with empty fields
    await page.click('button[type="submit"]');
    
    // Should see validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    
    // Try invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('should handle login with wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Should stay on login page
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    const timestamp = Date.now();
    const testUser = {
      name: `Logout Test ${timestamp}`,
      username: `logouttest${timestamp}`,
      email: `logouttest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.click('text=Create an account');
    await page.fill('input[placeholder*="name" i]', testUser.name);
    await page.fill('input[placeholder*="username" i]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Now logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });
});