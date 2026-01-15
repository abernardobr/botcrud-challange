import { test, expect } from '@playwright/test';

test.describe('StatisticsPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/statistics');
    await page.waitForSelector('.statistics-page', { timeout: 15000 });
  });

  test.describe('Page Layout', () => {
    test('should display the page header with back button', async ({ page }) => {
      await expect(page.locator('.back-btn, [class*="back"]').first()).toBeVisible();
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      await expect(page.locator('.breadcrumb, [class*="breadcrumb"]').first()).toBeVisible();
    });

    test('should navigate back to home when clicking back button', async ({ page }) => {
      await page.locator('.back-btn').first().click();
      await expect(page).toHaveURL('/');
    });

    test('should navigate via breadcrumb link', async ({ page }) => {
      await page.locator('.breadcrumb-link, [class*="breadcrumb"] span').first().click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Overview Cards', () => {
    test('should display 4 overview cards', async ({ page }) => {
      await expect(page.locator('.overview-card')).toHaveCount(4);
    });

    test('should display total bots card', async ({ page }) => {
      await expect(page.locator('.overview-card.primary')).toBeVisible();
      await expect(page.locator('.overview-card.primary .card-value')).toBeVisible();
    });

    test('should display total workers card', async ({ page }) => {
      await expect(page.locator('.overview-card.secondary')).toBeVisible();
    });

    test('should display total logs card', async ({ page }) => {
      await expect(page.locator('.overview-card.tertiary')).toBeVisible();
    });

    test('should display enabled rate card', async ({ page }) => {
      await expect(page.locator('.overview-card.accent')).toBeVisible();
    });

    test('should display workers per bot average', async ({ page }) => {
      await expect(page.locator('.overview-card.secondary .card-trend')).toBeVisible();
    });

    test('should display logs per worker average', async ({ page }) => {
      await expect(page.locator('.overview-card.tertiary .card-trend')).toBeVisible();
    });
  });

  test.describe('Charts Section', () => {
    test('should display bots by status chart', async ({ page }) => {
      await expect(page.getByText('Status')).toBeVisible();
      await expect(page.locator('.chart-card').first()).toBeVisible();
    });

    test('should display logs distribution chart', async ({ page }) => {
      await expect(page.getByText('Distribution')).toBeVisible();
    });

    test('should display workers per bot chart', async ({ page }) => {
      await expect(page.getByText('Workers per Bot')).toBeVisible();
    });

    test('should display activity timeline chart', async ({ page }) => {
      await expect(page.getByText('Timeline')).toBeVisible();
    });

    test('should render chart canvas elements', async ({ page }) => {
      const canvases = page.locator('canvas');
      await expect(canvases.first()).toBeVisible();
    });

    test('should display chart legend for status chart', async ({ page }) => {
      await expect(page.locator('.chart-legend, .legend-item').first()).toBeVisible();
    });
  });

  test.describe('Top Performers Section', () => {
    test('should display top bots section', async ({ page }) => {
      await expect(page.getByText('Top Bots')).toBeVisible();
    });

    test('should display top workers section', async ({ page }) => {
      await expect(page.getByText('Top Workers')).toBeVisible();
    });

    test('should display up to 5 top bots', async ({ page }) => {
      const performerItems = page.locator('.performers-card').first().locator('.performer-item');
      const count = await performerItems.count();
      expect(count).toBeLessThanOrEqual(5);
    });

    test('should display up to 5 top workers', async ({ page }) => {
      const performerItems = page.locator('.performers-card').last().locator('.performer-item');
      const count = await performerItems.count();
      expect(count).toBeLessThanOrEqual(5);
    });

    test('should display rank badges (gold, silver, bronze)', async ({ page }) => {
      await expect(page.locator('.performer-rank.gold').first()).toBeVisible();
    });

    test('should display bot name for top bots', async ({ page }) => {
      await expect(page.locator('.performers-card').first().locator('.performer-name').first()).toBeVisible();
    });

    test('should display worker name for top workers', async ({ page }) => {
      await expect(page.locator('.performers-card').last().locator('.performer-name').first()).toBeVisible();
    });

    test('should display counts for each performer', async ({ page }) => {
      await expect(page.locator('.performer-value').first()).toBeVisible();
    });
  });

  test.describe('Top Bots Navigation', () => {
    test('should navigate to bot detail when clicking top bot', async ({ page }) => {
      await page.locator('.performers-card').first().locator('.performer-item.clickable').first().click();
      await expect(page).toHaveURL(/\/bot\//);
    });

    test('should have clickable styling on top bots', async ({ page }) => {
      await expect(page.locator('.performers-card').first().locator('.performer-item.clickable').first()).toBeVisible();
    });
  });

  test.describe('Top Workers Navigation', () => {
    test('should navigate to worker detail when clicking top worker', async ({ page }) => {
      await page.locator('.performers-card').last().locator('.performer-item.clickable').first().click();
      await expect(page).toHaveURL(/\/worker\//);
    });

    test('should have clickable styling on top workers', async ({ page }) => {
      await expect(page.locator('.performers-card').last().locator('.performer-item.clickable').first()).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('.statistics-page')).toBeVisible();
      await expect(page.locator('.overview-section')).toBeVisible();
    });

    test('should stack overview cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('.overview-section')).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.statistics-page')).toBeVisible();
    });

    test('should display charts row on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.charts-row')).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('.statistics-page')).toBeVisible();
    });

    test('should display performers section on larger screens', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(page.locator('.performers-section')).toBeVisible();
    });
  });
});
