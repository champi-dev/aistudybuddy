import { test, expect } from '@playwright/test';

test.describe('Deck Management & AI Generation', () => {
  let userToken;
  
  test.beforeEach(async ({ page }) => {
    // Register and login before each test
    const timestamp = Date.now();
    const testUser = {
      name: `Deck Test ${timestamp}`,
      username: `decktest${timestamp}`,
      email: `decktest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.goto('/');
    await page.click('text=Create an account');
    await page.fill('input[placeholder*="name" i]', testUser.name);
    await page.fill('input[placeholder*="username" i]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display empty decks state initially', async ({ page }) => {
    // Verify no hardcoded deck data
    await expect(page.locator('[data-testid="decks-list"]')).toBeVisible();
    
    // Should show empty state, not fake data
    const deckCards = page.locator('[data-testid="deck-card"]');
    await expect(deckCards).toHaveCount(0);
    
    // Should show empty state message
    await expect(page.locator('text=No decks yet')).toBeVisible();
    await expect(page.locator('text=Create your first deck')).toBeVisible();
  });

  test('should create manual deck successfully', async ({ page }) => {
    const timestamp = Date.now();
    const deckData = {
      title: `Manual Test Deck ${timestamp}`,
      description: `Test description for manual deck ${timestamp}`,
      category: 'Test Category'
    };

    // Click create deck button
    await page.click('[data-testid="create-deck-button"]');
    
    // Fill manual deck form
    await page.fill('input[placeholder*="title" i]', deckData.title);
    await page.fill('textarea[placeholder*="description" i]', deckData.description);
    await page.fill('input[placeholder*="category" i]', deckData.category);
    
    // Select difficulty
    await page.selectOption('select[name="difficulty"]', '3');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to deck detail page
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+$/);
    
    // Verify deck details are displayed (not hardcoded)
    await expect(page.locator(`text=${deckData.title}`)).toBeVisible();
    await expect(page.locator(`text=${deckData.description}`)).toBeVisible();
    await expect(page.locator(`text=${deckData.category}`)).toBeVisible();
    
    // Should show empty cards state
    await expect(page.locator('text=No cards yet')).toBeVisible();
    await expect(page.locator('[data-testid="add-card-button"]')).toBeVisible();
  });

  test('should generate AI deck with real content', async ({ page }) => {
    const timestamp = Date.now();
    const aiDeckData = {
      topic: `Machine Learning Basics ${timestamp}`,
      cardCount: 3,
      difficulty: 2,
      category: 'AI/ML'
    };

    // Click AI generate button
    await page.click('[data-testid="ai-generate-button"]');
    
    // Fill AI generation form
    await page.fill('input[placeholder*="topic" i]', aiDeckData.topic);
    await page.fill('input[type="number"]', aiDeckData.cardCount.toString());
    await page.selectOption('select[name="difficulty"]', aiDeckData.difficulty.toString());
    await page.fill('input[placeholder*="category" i]', aiDeckData.category);
    
    // Submit AI generation
    await page.click('button[type="submit"]');
    
    // Should show generation in progress
    await expect(page.locator('text=Generating deck')).toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for generation to complete (up to 30 seconds)
    await page.waitForTimeout(5000); // Wait initial delay
    
    // Keep checking until generation completes
    let generationComplete = false;
    for (let i = 0; i < 50; i++) { // 50 * 500ms = 25 seconds max
      try {
        await expect(page.locator('text=Generation complete')).toBeVisible({ timeout: 500 });
        generationComplete = true;
        break;
      } catch (e) {
        // Still generating, wait more
        await page.waitForTimeout(500);
      }
    }
    
    expect(generationComplete).toBe(true);
    
    // Click view deck button
    await page.click('[data-testid="view-deck-button"]');
    
    // Should be on deck detail page
    await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+$/);
    
    // Verify AI-generated content (not hardcoded)
    await expect(page.locator(`text=${aiDeckData.topic} - AI Generated`)).toBeVisible();
    await expect(page.locator(`text=${aiDeckData.category}`)).toBeVisible();
    
    // Verify cards were generated
    const cardElements = page.locator('[data-testid="flashcard"]');
    await expect(cardElements).toHaveCount(aiDeckData.cardCount);
    
    // Check that cards have real content, not placeholder text
    for (let i = 0; i < aiDeckData.cardCount; i++) {
      const card = cardElements.nth(i);
      const frontText = await card.locator('[data-testid="card-front"]').textContent();
      const backText = await card.locator('[data-testid="card-back"]').textContent();
      
      // Verify not empty or placeholder
      expect(frontText.length).toBeGreaterThan(10);
      expect(backText.length).toBeGreaterThan(10);
      expect(frontText).not.toContain('Sample');
      expect(frontText).not.toContain('Example');
      expect(backText).not.toContain('Sample');
      expect(backText).not.toContain('Example');
    }
  });

  test('should add manual card to deck', async ({ page }) => {
    const timestamp = Date.now();
    
    // First create a deck
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Card Test Deck ${timestamp}`);
    await page.fill('textarea[placeholder*="description" i]', 'Deck for testing cards');
    await page.click('button[type="submit"]');
    
    // Add a card
    await page.click('[data-testid="add-card-button"]');
    
    const cardData = {
      front: `What is the capital of France? ${timestamp}`,
      back: `Paris is the capital of France. Test answer ${timestamp}`
    };
    
    await page.fill('textarea[placeholder*="front" i]', cardData.front);
    await page.fill('textarea[placeholder*="back" i]', cardData.back);
    await page.selectOption('select[name="difficulty"]', '2');
    
    await page.click('button[type="submit"]');
    
    // Should see the new card
    await expect(page.locator(`text=${cardData.front}`)).toBeVisible();
    await expect(page.locator(`text=${cardData.back}`)).toBeVisible();
    
    // Card count should be 1
    await expect(page.locator('text=1 card')).toBeVisible();
  });

  test('should edit deck details', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create a deck first
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Edit Test ${timestamp}`);
    await page.fill('textarea[placeholder*="description" i]', 'Original description');
    await page.click('button[type="submit"]');
    
    // Edit the deck
    await page.click('[data-testid="edit-deck-button"]');
    
    const newTitle = `Edited Deck ${timestamp}`;
    const newDescription = `Updated description ${timestamp}`;
    
    await page.fill('input[placeholder*="title" i]', newTitle);
    await page.fill('textarea[placeholder*="description" i]', newDescription);
    await page.click('button[type="submit"]');
    
    // Verify changes
    await expect(page.locator(`text=${newTitle}`)).toBeVisible();
    await expect(page.locator(`text=${newDescription}`)).toBeVisible();
    await expect(page.locator('text=Original description')).not.toBeVisible();
  });

  test('should delete deck', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create a deck
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Delete Test ${timestamp}`);
    await page.click('button[type="submit"]');
    
    const deckTitle = `Delete Test ${timestamp}`;
    
    // Delete the deck
    await page.click('[data-testid="delete-deck-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Deck should not be visible anymore
    await expect(page.locator(`text=${deckTitle}`)).not.toBeVisible();
  });

  test('should filter decks by category', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create decks in different categories
    const categories = ['Math', 'Science', 'History'];
    
    for (const category of categories) {
      await page.click('[data-testid="create-deck-button"]');
      await page.fill('input[placeholder*="title" i]', `${category} Deck ${timestamp}`);
      await page.fill('input[placeholder*="category" i]', category);
      await page.click('button[type="submit"]');
      await page.goBack();
    }
    
    // Filter by Math category
    await page.selectOption('[data-testid="category-filter"]', 'Math');
    
    // Should only show Math deck
    await expect(page.locator(`text=Math Deck ${timestamp}`)).toBeVisible();
    await expect(page.locator(`text=Science Deck ${timestamp}`)).not.toBeVisible();
    await expect(page.locator(`text=History Deck ${timestamp}`)).not.toBeVisible();
  });

  test('should search decks by title', async ({ page }) => {
    const timestamp = Date.now();
    const searchTerm = `SearchTest${timestamp}`;
    
    // Create decks with searchable titles
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `${searchTerm} Algebra`);
    await page.click('button[type="submit"]');
    await page.goBack();
    
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Biology Basics ${timestamp}`);
    await page.click('button[type="submit"]');
    await page.goBack();
    
    // Search for specific term
    await page.fill('[data-testid="search-input"]', searchTerm);
    
    // Should only show matching deck
    await expect(page.locator(`text=${searchTerm} Algebra`)).toBeVisible();
    await expect(page.locator(`text=Biology Basics ${timestamp}`)).not.toBeVisible();
  });
});