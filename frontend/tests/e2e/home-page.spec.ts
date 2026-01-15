import { test, expect } from '@playwright/test';

test.describe('HomePage (Bot Dashboard)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.home-page', { timeout: 15000 });
  });

  test.describe('Page Layout', () => {
    test('should display the page title with bot count', async ({ page }) => {
      await expect(page.locator('[data-testid="home-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="home-title"]')).toContainText('Bot Dashboard');
    });

    test('should display the settings button', async ({ page }) => {
      await expect(page.locator('[data-testid="settings-btn"]')).toBeVisible();
    });

    test('should display the stats bar', async ({ page }) => {
      await expect(page.locator('[data-testid="home-stats"]')).toBeVisible();
    });
  });

  test.describe('Stats Bar', () => {
    test('should display bots count', async ({ page }) => {
      await expect(page.locator('[data-testid="stats-bots-count"]')).toBeVisible();
    });

    test('should display workers count as clickable', async ({ page }) => {
      await expect(page.locator('[data-testid="stats-workers-link"]')).toBeVisible();
    });

    test('should display logs count as clickable', async ({ page }) => {
      await expect(page.locator('[data-testid="stats-logs-link"]')).toBeVisible();
    });

    test('should navigate to workers page when clicking workers stat', async ({ page }) => {
      await page.locator('[data-testid="stats-workers-link"]').click();
      await expect(page).toHaveURL(/\/workers/);
    });

    test('should navigate to logs page when clicking logs stat', async ({ page }) => {
      await page.locator('[data-testid="stats-logs-link"]').click();
      await expect(page).toHaveURL(/\/logs/);
    });

    test('should display statistics button', async ({ page }) => {
      await expect(page.locator('[data-testid="stats-statistics-btn"]')).toBeVisible();
    });

    test('should navigate to statistics page when clicking statistics button', async ({ page }) => {
      await page.locator('[data-testid="stats-statistics-btn"]').click();
      await expect(page).toHaveURL(/\/statistics/);
    });
  });

  test.describe('Bots Section', () => {
    test('should display bots section header', async ({ page }) => {
      await expect(page.locator('.bots-label')).toBeVisible();
    });

    test('should display add bot button', async ({ page }) => {
      await expect(page.locator('[data-testid="add-bot-btn"]')).toBeVisible();
    });

    test('should display filter button', async ({ page }) => {
      await expect(page.locator('[data-testid="filter-btn"]')).toBeVisible();
    });

    test('should display history button', async ({ page }) => {
      await expect(page.locator('.history-btn')).toBeVisible();
    });
  });

  test.describe('Bots List', () => {
    test('should display bot cards after loading', async ({ page }) => {
      // Wait for network requests to complete
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="bots-list"]')).toBeVisible({ timeout: 10000 });
      const cards = page.locator('[data-testid^="bot-card-"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to bot detail when clicking a bot card', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid^="bot-card-"]').first().click();
      await expect(page).toHaveURL(/\/bot\//, { timeout: 10000 });
    });

    test('should display bot name on card', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="bot-name"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display bot status on card', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid^="bot-status-"]').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Add Bot Drawer', () => {
    test('should open add bot drawer when clicking add button', async ({ page }) => {
      await page.locator('[data-testid="add-bot-btn"]').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible();
    });

    test('should close drawer when pressing escape', async ({ page }) => {
      await page.locator('[data-testid="add-bot-btn"]').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.q-dialog')).not.toBeVisible();
    });
  });

  test.describe('Filter Drawer', () => {
    test('should open filter drawer when clicking filter button', async ({ page }) => {
      await page.locator('[data-testid="filter-btn"]').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible();
    });

    test('should display filter options', async ({ page }) => {
      await page.locator('[data-testid="filter-btn"]').click();
      await page.waitForSelector('.q-dialog, .q-drawer');
      await expect(page.locator('.q-dialog, .q-drawer')).toContainText(/filter/i);
    });
  });

  test.describe('Filter History Drawer', () => {
    test('should open filter history drawer when clicking history button', async ({ page }) => {
      await page.locator('.history-btn').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible();
      await expect(page.locator('.q-dialog, .q-drawer')).toContainText('History');
    });
  });

  test.describe('Settings Drawer', () => {
    test('should open settings drawer when clicking settings button', async ({ page }) => {
      await page.locator('[data-testid="settings-btn"]').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible();
    });

    test('should display settings options', async ({ page }) => {
      await page.locator('[data-testid="settings-btn"]').click();
      await page.waitForSelector('.q-dialog, .q-drawer');
      await expect(page.locator('.q-dialog, .q-drawer')).toContainText('Settings');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('.home-page')).toBeVisible();
      await expect(page.locator('[data-testid="home-stats"]')).toBeVisible();
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.home-page')).toBeVisible();
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('.home-page')).toBeVisible();
    });
  });
});
