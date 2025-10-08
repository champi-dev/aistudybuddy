import { test, expect } from '@playwright/test';

test.describe('Study Session Flow', () => {
  let deckId;
  
  test.beforeEach(async ({ page }) => {
    // Setup: Register user and create deck with cards
    const timestamp = Date.now();
    const testUser = {
      name: `Study Test ${timestamp}`,
      username: `studytest${timestamp}`,
      email: `studytest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.goto('/');
    await page.click('text=Create an account');
    await page.fill('input[placeholder*="name" i]', testUser.name);
    await page.fill('input[placeholder*="username" i]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Create a deck with cards for studying
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Study Deck ${timestamp}`);
    await page.fill('textarea[placeholder*="description" i]', 'Deck for study testing');
    await page.click('button[type="submit"]');
    
    // Extract deck ID from URL
    const url = page.url();
    deckId = url.match(/\/decks\/([a-f0-9-]+)/)[1];
    
    // Add test cards
    const cards = [
      { front: `Question 1 ${timestamp}`, back: `Answer 1 ${timestamp}` },
      { front: `Question 2 ${timestamp}`, back: `Answer 2 ${timestamp}` },
      { front: `Question 3 ${timestamp}`, back: `Answer 3 ${timestamp}` }
    ];
    
    for (const card of cards) {
      await page.click('[data-testid="add-card-button"]');
      await page.fill('textarea[placeholder*="front" i]', card.front);
      await page.fill('textarea[placeholder*="back" i]', card.back);
      await page.click('button[type="submit"]');
    }
  });

  test('should start study session', async ({ page }) => {
    // Start study session
    await page.click('[data-testid="start-study-button"]');
    
    // Should be on study page
    await expect(page).toHaveURL(/\/study\/[a-f0-9-]+$/);
    
    // Should show first card front
    await expect(page.locator('[data-testid="study-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="card-front"]')).toBeVisible();
    
    // Should show progress indicator
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    await expect(page.locator('text=1 of 3')).toBeVisible();
    
    // Should show flip button
    await expect(page.locator('[data-testid="flip-card-button"]')).toBeVisible();
  });

  test('should flip card to show answer', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Verify front is visible
    const frontText = await page.locator('[data-testid="card-front"]').textContent();
    expect(frontText).toContain('Question 1');
    
    // Flip card
    await page.click('[data-testid="flip-card-button"]');
    
    // Should show back side
    await expect(page.locator('[data-testid="card-back"]')).toBeVisible();
    const backText = await page.locator('[data-testid="card-back"]').textContent();
    expect(backText).toContain('Answer 1');
    
    // Should show answer buttons
    await expect(page.locator('[data-testid="answer-incorrect"]')).toBeVisible();
    await expect(page.locator('[data-testid="answer-correct"]')).toBeVisible();
  });

  test('should progress through all cards', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Go through all 3 cards
    for (let i = 1; i <= 3; i++) {
      // Check progress
      await expect(page.locator(`text=${i} of 3`)).toBeVisible();
      
      // Flip card
      await page.click('[data-testid="flip-card-button"]');
      
      // Answer correctly
      await page.click('[data-testid="answer-correct"]');
      
      if (i < 3) {
        // Should advance to next card
        await page.waitForTimeout(500); // Wait for transition
        await expect(page.locator('[data-testid="card-front"]')).toBeVisible();
      }
    }
    
    // Should complete session
    await expect(page.locator('[data-testid="session-complete"]')).toBeVisible();
    await expect(page.locator('text=Study session complete')).toBeVisible();
  });

  test('should track correct and incorrect answers', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Answer first card correctly
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]');
    
    // Answer second card incorrectly
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-incorrect"]');
    
    // Answer third card correctly
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]');
    
    // Check final results
    await expect(page.locator('[data-testid="session-results"]')).toBeVisible();
    await expect(page.locator('text=2 correct')).toBeVisible();
    await expect(page.locator('text=1 incorrect')).toBeVisible();
    await expect(page.locator('text=67% accuracy')).toBeVisible(); // 2/3 = 67%
  });

  test('should use hint system', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Click hint button
    await page.click('[data-testid="hint-button"]');
    
    // Should show hint level 1
    await expect(page.locator('[data-testid="hint-text"]')).toBeVisible();
    const hint1 = await page.locator('[data-testid="hint-text"]').textContent();
    expect(hint1.length).toBeGreaterThan(10);
    
    // Click next hint level
    await page.click('[data-testid="next-hint-button"]');
    
    // Should show hint level 2
    const hint2 = await page.locator('[data-testid="hint-text"]').textContent();
    expect(hint2).not.toBe(hint1);
    expect(hint2.length).toBeGreaterThan(10);
    
    // Verify hint is not hardcoded
    expect(hint1).not.toContain('Sample hint');
    expect(hint2).not.toContain('Sample hint');
  });

  test('should show explanation after wrong answer', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Flip and answer incorrectly
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-incorrect"]');
    
    // Should show explanation
    await expect(page.locator('[data-testid="explanation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="explanation-text"]')).toBeVisible();
    
    const explanationText = await page.locator('[data-testid="explanation-text"]').textContent();
    expect(explanationText.length).toBeGreaterThan(20);
    expect(explanationText).not.toContain('Sample explanation');
    
    // Close explanation
    await page.click('[data-testid="close-explanation"]');
    
    // Should continue to next card
    await expect(page.locator('text=2 of 3')).toBeVisible();
  });

  test('should handle study session completion', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Complete all cards quickly
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="flip-card-button"]');
      await page.click('[data-testid="answer-correct"]');
    }
    
    // Should show completion screen
    await expect(page.locator('[data-testid="session-complete"]')).toBeVisible();
    await expect(page.locator('text=Congratulations!')).toBeVisible();
    
    // Should show session stats
    await expect(page.locator('[data-testid="session-stats"]')).toBeVisible();
    await expect(page.locator('text=Cards studied: 3')).toBeVisible();
    await expect(page.locator('text=100% accuracy')).toBeVisible();
    
    // Should have option to study again
    await expect(page.locator('[data-testid="study-again-button"]')).toBeVisible();
    
    // Should have option to return to deck
    await expect(page.locator('[data-testid="return-to-deck-button"]')).toBeVisible();
  });

  test('should save study session data', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Complete session
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="flip-card-button"]');
      await page.click('[data-testid="answer-correct"]');
    }
    
    // Return to deck
    await page.click('[data-testid="return-to-deck-button"]');
    
    // Deck should show updated study stats
    await expect(page.locator('text=Last studied:')).toBeVisible();
    
    // Go to analytics to verify session was saved
    await page.click('[data-testid="analytics-button"]');
    
    // Should show recent activity
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    
    // Should show updated stats (not zeros)
    const totalSessions = await page.locator('[data-testid="total-sessions"]').textContent();
    expect(parseInt(totalSessions)).toBeGreaterThan(0);
    
    const totalCards = await page.locator('[data-testid="total-cards"]').textContent();
    expect(parseInt(totalCards)).toBeGreaterThan(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Use spacebar to flip card
    await page.keyboard.press('Space');
    await expect(page.locator('[data-testid="card-back"]')).toBeVisible();
    
    // Use arrow keys for answers
    await page.keyboard.press('ArrowLeft'); // Incorrect
    
    // Should advance to next card
    await expect(page.locator('text=2 of 3')).toBeVisible();
    
    // Flip with spacebar again
    await page.keyboard.press('Space');
    
    // Use right arrow for correct
    await page.keyboard.press('ArrowRight'); // Correct
    
    // Should advance to final card
    await expect(page.locator('text=3 of 3')).toBeVisible();
  });

  test('should handle spaced repetition scheduling', async ({ page }) => {
    await page.click('[data-testid="start-study-button"]');
    
    // Complete session with mixed results
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]'); // Card 1 correct
    
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-incorrect"]'); // Card 2 incorrect
    await page.click('[data-testid="close-explanation"]');
    
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]'); // Card 3 correct
    
    // Return to deck and check next review dates
    await page.click('[data-testid="return-to-deck-button"]');
    
    // Cards should have different next review schedules
    const cards = page.locator('[data-testid="card-item"]');
    
    // Incorrect card should be scheduled sooner
    const incorrectCard = cards.nth(1);
    await expect(incorrectCard.locator('[data-testid="next-review"]')).toContainText('Review soon');
    
    // Correct cards should be scheduled later
    const correctCard = cards.nth(0);
    await expect(correctCard.locator('[data-testid="next-review"]')).toContainText('Review in');
  });
});