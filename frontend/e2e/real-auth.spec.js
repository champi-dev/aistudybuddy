import { test, expect } from '@playwright/test';

test.describe('Real Authentication Flow', () => {
  test('should register and login with real backend integration', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      name: `Real Test User ${timestamp}`,
      username: `realtest${timestamp}`,
      email: `realtest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.goto('/');
    
    // Verify we're on login page with no hardcoded data
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Click "Sign up" link (actual text in the UI)
    await page.click('text=Sign up');
    
    // Should now be on register form
    await expect(page.locator('text=Create your account')).toBeVisible();
    
    // Fill registration form
    await page.fill('input[placeholder*="Full name"]', testUser.name);
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Email"]', testUser.email);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Should be redirected to dashboard after successful registration
    await page.waitForURL('**/dashboard');
    
    // Verify user is logged in and dashboard shows real data (not hardcoded)
    const welcomeText = await page.textContent('body');
    expect(welcomeText).toContain('Welcome');
    
    // Check that there's no sample/fake data
    expect(welcomeText).not.toContain('Sample Deck');
    expect(welcomeText).not.toContain('Example Cards');
    expect(welcomeText).not.toContain('Placeholder');
    
    // Should show empty state for new user
    await expect(page.locator('text=No decks yet')).toBeVisible();
    await expect(page.locator('text=Create your first deck')).toBeVisible();
    
    // Logout and test login
    await page.click('button:has-text("Logout")');
    
    // Should be back on login page
    await expect(page.locator('text=Sign in to continue')).toBeVisible();
    
    // Login with the same credentials
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should be back on dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    console.log('✅ Authentication flow completed successfully with real backend');
    console.log('✅ No hardcoded data detected');
    console.log('✅ Empty state properly displayed for new user');
  });

  test('should create deck and verify no fake data', async ({ page }) => {
    const timestamp = Date.now();
    
    // Quick registration
    const testUser = {
      name: `Deck Test ${timestamp}`,
      username: `decktest${timestamp}`,
      email: `decktest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.goto('/');
    await page.click('text=Sign up');
    await page.fill('input[placeholder*="Full name"]', testUser.name);
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Email"]', testUser.email);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Create a deck
    await page.click('text=Create Deck');
    
    const deckData = {
      title: `Real Test Deck ${timestamp}`,
      description: `This is a real test deck created at ${new Date().toISOString()}`,
      category: 'Testing'
    };
    
    await page.fill('input[placeholder*="deck title"]', deckData.title);
    await page.fill('textarea[placeholder*="description"]', deckData.description);
    await page.fill('input[placeholder*="category"]', deckData.category);
    
    await page.click('button[type="submit"]');
    
    // Should be on deck detail page
    await page.waitForURL('**/decks/**');
    
    // Verify deck details are displayed correctly (not hardcoded)
    await expect(page.locator(`text=${deckData.title}`)).toBeVisible();
    await expect(page.locator(`text=${deckData.description}`)).toBeVisible();
    await expect(page.locator(`text=${deckData.category}`)).toBeVisible();
    
    // Should show empty cards state
    await expect(page.locator('text=No cards in this deck yet')).toBeVisible();
    
    // Add a card
    await page.click('text=Add Card');
    
    const cardData = {
      front: `What is the timestamp? ${timestamp}`,
      back: `The timestamp is ${timestamp}, created at ${new Date().toISOString()}`
    };
    
    await page.fill('textarea[placeholder*="front"]', cardData.front);
    await page.fill('textarea[placeholder*="back"]', cardData.back);
    await page.click('button[type="submit"]');
    
    // Should see the card
    await expect(page.locator(`text=${cardData.front}`)).toBeVisible();
    await expect(page.locator(`text=${cardData.back}`)).toBeVisible();
    
    // Card count should update
    await expect(page.locator('text=1 card')).toBeVisible();
    
    console.log('✅ Deck creation completed with real data');
    console.log('✅ Card addition working correctly');
    console.log('✅ No hardcoded content detected');
  });

  test('should test AI generation with real backend', async ({ page }) => {
    const timestamp = Date.now();
    
    // Quick setup
    const testUser = {
      name: `AI Test ${timestamp}`,
      username: `aitest${timestamp}`,
      email: `aitest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.goto('/');
    await page.click('text=Sign up');
    await page.fill('input[placeholder*="Full name"]', testUser.name);
    await page.fill('input[placeholder*="Username"]', testUser.username);
    await page.fill('input[placeholder*="Email"]', testUser.email);
    await page.fill('input[placeholder*="Password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Try AI generation
    await page.click('text=Generate with AI');
    
    const aiData = {
      topic: `JavaScript Testing ${timestamp}`,
      cardCount: 2,
      difficulty: 2,
      category: 'Programming'
    };
    
    await page.fill('input[placeholder*="topic"]', aiData.topic);
    await page.fill('input[type="number"]', aiData.cardCount.toString());
    await page.selectOption('select[name="difficulty"]', aiData.difficulty.toString());
    await page.fill('input[placeholder*="category"]', aiData.category);
    
    await page.click('button[type="submit"]');
    
    // Should show generation in progress
    await expect(page.locator('text=Generating')).toBeVisible();
    
    // Wait for completion (up to 30 seconds)
    await page.waitForSelector('text=View Deck', { timeout: 30000 });
    
    await page.click('text=View Deck');
    
    // Should be on deck page with AI-generated content
    await expect(page.locator(`text=${aiData.topic} - AI Generated`)).toBeVisible();
    
    // Should have the requested number of cards
    const cards = page.locator('[data-testid="card"], .card-item, text*="Question"');
    await expect(cards).toHaveCount.toBeGreaterThanOrEqual(aiData.cardCount);
    
    // Verify content is not hardcoded
    const deckContent = await page.textContent('body');
    expect(deckContent).not.toContain('Sample question');
    expect(deckContent).not.toContain('Example answer');
    expect(deckContent).not.toContain('Lorem ipsum');
    
    console.log('✅ AI generation working with real backend');
    console.log('✅ Generated content is not hardcoded');
    console.log('✅ Proper number of cards generated');
  });
});