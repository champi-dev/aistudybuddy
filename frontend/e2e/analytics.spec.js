import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Register user 
    const timestamp = Date.now();
    const testUser = {
      name: `Analytics Test ${timestamp}`,
      username: `analyticstest${timestamp}`,
      email: `analyticstest${timestamp}@example.com`,
      password: 'testpass123'
    };

    await page.goto('/');
    await page.click('text=Create an account');
    await page.fill('input[placeholder*="name" i]', testUser.name);
    await page.fill('input[placeholder*="username" i]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
  });

  test('should show empty analytics state for new user', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="analytics-tab"]');
    
    // Should show zero stats, not fake data
    await expect(page.locator('[data-testid="total-sessions"]')).toContainText('0');
    await expect(page.locator('[data-testid="total-cards-studied"]')).toContainText('0');
    await expect(page.locator('[data-testid="total-correct"]')).toContainText('0');
    await expect(page.locator('[data-testid="average-accuracy"]')).toContainText('0');
    
    // Should show empty state messages
    await expect(page.locator('text=No study sessions yet')).toBeVisible();
    await expect(page.locator('text=Start studying to see your progress')).toBeVisible();
    
    // Recent activity should be empty
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-item"]')).toHaveCount(0);
    
    // Streaks should be zero
    await expect(page.locator('[data-testid="current-streak"]')).toContainText('0');
    await expect(page.locator('[data-testid="longest-streak"]')).toContainText('0');
  });

  test('should update analytics after study session', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create deck with cards
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Analytics Deck ${timestamp}`);
    await page.click('button[type="submit"]');
    
    // Add cards
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="add-card-button"]');
      await page.fill('textarea[placeholder*="front" i]', `Question ${i} ${timestamp}`);
      await page.fill('textarea[placeholder*="back" i]', `Answer ${i} ${timestamp}`);
      await page.click('button[type="submit"]');
    }
    
    // Complete study session
    await page.click('[data-testid="start-study-button"]');
    
    // Answer 2 correct, 1 incorrect
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]');
    
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]');
    
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-incorrect"]');
    await page.click('[data-testid="close-explanation"]');
    
    // Go to analytics
    await page.click('[data-testid="analytics-tab"]');
    
    // Should show updated stats (not zeros)
    await expect(page.locator('[data-testid="total-sessions"]')).toContainText('1');
    await expect(page.locator('[data-testid="total-cards-studied"]')).toContainText('3');
    await expect(page.locator('[data-testid="total-correct"]')).toContainText('2');
    await expect(page.locator('[data-testid="average-accuracy"]')).toContainText('67'); // 2/3 = 67%
    
    // Should show recent activity
    await expect(page.locator('[data-testid="activity-item"]')).toHaveCount(1);
    const activityItem = page.locator('[data-testid="activity-item"]').first();
    await expect(activityItem).toContainText('3 cards');
    await expect(activityItem).toContainText('67%');
    
    // Current streak should be 1
    await expect(page.locator('[data-testid="current-streak"]')).toContainText('1');
    await expect(page.locator('[data-testid="longest-streak"]')).toContainText('1');
  });

  test('should show study insights with real data', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create and study multiple decks to generate insights
    for (let deckNum = 1; deckNum <= 2; deckNum++) {
      await page.click('[data-testid="create-deck-button"]');
      await page.fill('input[placeholder*="title" i]', `Insights Deck ${deckNum} ${timestamp}`);
      await page.click('button[type="submit"]');
      
      // Add cards
      for (let i = 1; i <= 3; i++) {
        await page.click('[data-testid="add-card-button"]');
        await page.fill('textarea[placeholder*="front" i]', `Q${deckNum}-${i} ${timestamp}`);
        await page.fill('textarea[placeholder*="back" i]', `A${deckNum}-${i} ${timestamp}`);
        await page.click('button[type="submit"]');
      }
      
      // Study the deck
      await page.click('[data-testid="start-study-button"]');
      
      // Answer all correctly for first deck, mixed for second
      const allCorrect = deckNum === 1;
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="flip-card-button"]');
        if (allCorrect || i < 2) {
          await page.click('[data-testid="answer-correct"]');
        } else {
          await page.click('[data-testid="answer-incorrect"]');
          await page.click('[data-testid="close-explanation"]');
        }
      }
      
      // Return to dashboard for next deck
      await page.click('[data-testid="return-to-deck-button"]');
      await page.click('[data-testid="dashboard-tab"]');
    }
    
    // Check insights
    await page.click('[data-testid="analytics-tab"]');
    await page.click('[data-testid="insights-tab"]');
    
    // Should show real insights, not hardcoded text
    const insights = page.locator('[data-testid="insight-item"]');
    await expect(insights).toHaveCount.toBeGreaterThan(0);
    
    // Insights should mention actual performance
    const insightTexts = await insights.allTextContents();
    const hasAccuracyInsight = insightTexts.some(text => 
      text.includes('accuracy') || text.includes('performance')
    );
    expect(hasAccuracyInsight).toBe(true);
    
    // Should not contain placeholder text
    const hasPlaceholder = insightTexts.some(text => 
      text.includes('Sample insight') || text.includes('Placeholder')
    );
    expect(hasPlaceholder).toBe(false);
  });

  test('should show study streaks calendar', async ({ page }) => {
    // Go to streaks section
    await page.click('[data-testid="analytics-tab"]');
    await page.click('[data-testid="streaks-tab"]');
    
    // Should show calendar grid for last 90 days
    await expect(page.locator('[data-testid="streak-calendar"]')).toBeVisible();
    
    // Should show individual day tiles
    const dayTiles = page.locator('[data-testid="streak-day"]');
    await expect(dayTiles).toHaveCount(90);
    
    // Most days should be unstudied (empty state)
    const unstudiedDays = page.locator('[data-testid="streak-day"][data-studied="false"]');
    await expect(unstudiedDays).toHaveCount.toBeGreaterThan(85); // Most days empty for new user
    
    // Should show legend
    await expect(page.locator('[data-testid="streak-legend"]')).toBeVisible();
    await expect(page.locator('text=No activity')).toBeVisible();
    await expect(page.locator('text=Study day')).toBeVisible();
  });

  test('should track and display study streaks correctly', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create a deck for testing streaks
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Streak Deck ${timestamp}`);
    await page.click('button[type="submit"]');
    
    // Add a card
    await page.click('[data-testid="add-card-button"]');
    await page.fill('textarea[placeholder*="front" i]', `Streak Question ${timestamp}`);
    await page.fill('textarea[placeholder*="back" i]', `Streak Answer ${timestamp}`);
    await page.click('button[type="submit"]');
    
    // Study today
    await page.click('[data-testid="start-study-button"]');
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]');
    
    // Check streak after first session
    await page.click('[data-testid="analytics-tab"]');
    await expect(page.locator('[data-testid="current-streak"]')).toContainText('1');
    await expect(page.locator('[data-testid="longest-streak"]')).toContainText('1');
    
    // Today should be marked as studied in calendar
    await page.click('[data-testid="streaks-tab"]');
    const today = new Date().toISOString().split('T')[0];
    await expect(page.locator(`[data-testid="streak-day"][data-date="${today}"][data-studied="true"]`)).toBeVisible();
  });

  test('should show top performing decks', async ({ page }) => {
    const timestamp = Date.now();
    
    // Create multiple decks with different performance
    const decks = [
      { name: 'High Performance', accuracy: 100 },
      { name: 'Medium Performance', accuracy: 67 },
      { name: 'Low Performance', accuracy: 33 }
    ];
    
    for (const deck of decks) {
      await page.click('[data-testid="create-deck-button"]');
      await page.fill('input[placeholder*="title" i]', `${deck.name} ${timestamp}`);
      await page.click('button[type="submit"]');
      
      // Add 3 cards
      for (let i = 1; i <= 3; i++) {
        await page.click('[data-testid="add-card-button"]');
        await page.fill('textarea[placeholder*="front" i]', `${deck.name} Q${i}`);
        await page.fill('textarea[placeholder*="back" i]', `${deck.name} A${i}`);
        await page.click('button[type="submit"]');
      }
      
      // Study with targeted accuracy
      await page.click('[data-testid="start-study-button"]');
      
      const correctAnswers = Math.round(3 * deck.accuracy / 100);
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="flip-card-button"]');
        if (i < correctAnswers) {
          await page.click('[data-testid="answer-correct"]');
        } else {
          await page.click('[data-testid="answer-incorrect"]');
          await page.click('[data-testid="close-explanation"]');
        }
      }
      
      // Return to dashboard
      await page.click('[data-testid="return-to-deck-button"]');
      await page.click('[data-testid="dashboard-tab"]');
    }
    
    // Check top decks analytics
    await page.click('[data-testid="analytics-tab"]');
    
    // Should show top performing decks
    await expect(page.locator('[data-testid="top-decks-section"]')).toBeVisible();
    const topDeckItems = page.locator('[data-testid="top-deck-item"]');
    await expect(topDeckItems).toHaveCount.toBeGreaterThan(0);
    
    // First deck should have highest session count (all have 1 session)
    // But should show real data, not hardcoded
    const firstDeck = topDeckItems.first();
    await expect(firstDeck).toContainText('1 session');
    await expect(firstDeck).toContainText('3 cards');
    
    // Should not show placeholder data
    const deckTexts = await topDeckItems.allTextContents();
    const hasPlaceholder = deckTexts.some(text => 
      text.includes('Sample Deck') || text.includes('Example')
    );
    expect(hasPlaceholder).toBe(false);
  });

  test('should handle analytics with no data gracefully', async ({ page }) => {
    // Fresh user should see appropriate empty states
    await page.click('[data-testid="analytics-tab"]');
    
    // All main stats should be zero
    await expect(page.locator('[data-testid="total-sessions"]')).toContainText('0');
    await expect(page.locator('[data-testid="total-cards-studied"]')).toContainText('0');
    await expect(page.locator('[data-testid="total-correct"]')).toContainText('0');
    await expect(page.locator('[data-testid="average-accuracy"]')).toContainText('0');
    
    // Charts should handle empty data
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
    await expect(page.locator('text=No data to display')).toBeVisible();
    
    // Recent activity should be empty
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    await expect(page.locator('text=No recent study sessions')).toBeVisible();
    
    // Top decks should be empty
    await expect(page.locator('[data-testid="top-decks-section"]')).toBeVisible();
    await expect(page.locator('text=No decks studied yet')).toBeVisible();
    
    // Insights should encourage user to start studying
    await page.click('[data-testid="insights-tab"]');
    await expect(page.locator('text=Start studying to get personalized insights')).toBeVisible();
  });

  test('should export analytics data', async ({ page }) => {
    // Create some study data first
    const timestamp = Date.now();
    await page.click('[data-testid="create-deck-button"]');
    await page.fill('input[placeholder*="title" i]', `Export Test ${timestamp}`);
    await page.click('button[type="submit"]');
    
    await page.click('[data-testid="add-card-button"]');
    await page.fill('textarea[placeholder*="front" i]', 'Export Question');
    await page.fill('textarea[placeholder*="back" i]', 'Export Answer');
    await page.click('button[type="submit"]');
    
    await page.click('[data-testid="start-study-button"]');
    await page.click('[data-testid="flip-card-button"]');
    await page.click('[data-testid="answer-correct"]');
    
    // Go to analytics and export
    await page.click('[data-testid="analytics-tab"]');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-data-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/analytics-.*\.csv/);
    
    // Verify file content contains real data, not sample data
    const path = await download.path();
    const fs = require('fs');
    const content = fs.readFileSync(path, 'utf8');
    
    expect(content).toContain('Export Test');
    expect(content).toContain('1'); // Session count
    expect(content).not.toContain('Sample');
    expect(content).not.toContain('Example');
  });
});