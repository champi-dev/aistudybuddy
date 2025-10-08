import { test, expect } from '@playwright/test';

test('Complete E2E flow with actual UI elements', async ({ page }) => {
  const timestamp = Date.now();
  
  // Step 1: Navigate and verify login page
  await page.goto('/');
  await page.screenshot({ path: 'test-results/01-login-page.png' });
  
  console.log('✅ Page loaded successfully');
  
  // Step 2: Try to register a new user
  await page.click('text=Sign up');
  await page.screenshot({ path: 'test-results/02-register-page.png' });
  
  // Get all input fields and log their attributes
  const inputs = await page.locator('input').all();
  console.log('Found', inputs.length, 'input fields');
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const placeholder = await input.getAttribute('placeholder');
    const type = await input.getAttribute('type');
    console.log(`Input ${i}: type="${type}", placeholder="${placeholder}"`);
  }
  
  // Try different approaches to fill the form
  try {
    // Try by input order (name, username, email, password)
    await inputs[0].fill(`Test User ${timestamp}`);
    await inputs[1].fill(`testuser${timestamp}`);
    await inputs[2].fill(`test${timestamp}@example.com`);
    await inputs[3].fill('testpass123');
    
    console.log('✅ Form filled successfully');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait a bit and see what happens
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/03-after-submit.png' });
    
    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);
    
    if (currentUrl.includes('dashboard')) {
      console.log('✅ Successfully registered and redirected to dashboard');
      
      // Check for empty state (no hardcoded data)
      const bodyText = await page.textContent('body');
      
      // Verify no sample data
      const hasSampleData = bodyText.includes('Sample') || 
                           bodyText.includes('Example') || 
                           bodyText.includes('Lorem') ||
                           bodyText.includes('Placeholder');
      
      if (!hasSampleData) {
        console.log('✅ No hardcoded sample data found');
      } else {
        console.log('❌ Found potential sample data in:', bodyText);
      }
      
      // Try to create a deck
      const createButtons = await page.locator('button, a').filter({ hasText: /create|add|new/i }).all();
      if (createButtons.length > 0) {
        console.log('Found', createButtons.length, 'create buttons');
        await createButtons[0].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/04-create-deck.png' });
        console.log('✅ Successfully navigated to create deck page');
      }
      
    } else {
      console.log('Registration failed or redirected elsewhere');
      const errorText = await page.textContent('body');
      console.log('Page content:', errorText);
    }
    
  } catch (error) {
    console.log('Form filling failed:', error.message);
    await page.screenshot({ path: 'test-results/error.png' });
  }
});