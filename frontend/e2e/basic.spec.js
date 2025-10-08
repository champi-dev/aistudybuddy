import { test, expect } from '@playwright/test';

test.describe('Basic Frontend Test', () => {
  test('should load the application and show login page', async ({ page }) => {
    await page.goto('/');
    
    // Take a screenshot to see what's actually rendered
    await page.screenshot({ path: 'test-results/homepage.png' });
    
    // Check if the page title is correct
    await expect(page).toHaveTitle('AI Study Buddy');
    
    // Look for any text that indicates it's a login page
    const pageContent = await page.textContent('body');
    console.log('Page content:', pageContent);
    
    // Check for common login elements (be flexible about exact text)
    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
    const hasSubmitButton = await page.locator('button[type="submit"]').count() > 0;
    
    console.log('Has email input:', hasEmailInput);
    console.log('Has password input:', hasPasswordInput);
    console.log('Has submit button:', hasSubmitButton);
    
    // Basic checks
    expect(hasEmailInput).toBe(true);
    expect(hasPasswordInput).toBe(true);
    expect(hasSubmitButton).toBe(true);
  });

  test('should verify no hardcoded data on fresh load', async ({ page }) => {
    await page.goto('/');
    
    const pageContent = await page.textContent('body');
    
    // Check that there's no hardcoded sample data
    expect(pageContent).not.toContain('Sample Deck');
    expect(pageContent).not.toContain('Example Card');
    expect(pageContent).not.toContain('John Doe');
    expect(pageContent).not.toContain('test@example.com');
    expect(pageContent).not.toContain('Lorem ipsum');
    expect(pageContent).not.toContain('placeholder data');
    
    // The page should be dynamic, showing real empty state
    console.log('✅ No hardcoded sample data found');
  });
});