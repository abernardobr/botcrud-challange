import { test, expect } from '@playwright/test';

test.describe('WorkersPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/workers');
    await page.waitForSelector('.workers-page', { timeout: 15000 });
  });

  test.describe('Page Layout', () => {
    test('should display the page header with back button', async ({ page }) => {
      await expect(page.locator('.back-btn, [class*="back"]').first()).toBeVisible();
    });

    test('should display the page title with workers count', async ({ page }) => {
      await expect(page.locator('.page-title')).toBeVisible();
      await expect(page.locator('.page-title')).toContainText('Workers');
    });

    test('should display settings button', async ({ page }) => {
      await expect(page.locator('.settings-btn')).toBeVisible();
    });

    test('should navigate back to home when clicking back button', async ({ page }) => {
      await page.locator('.back-btn').first().click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Stats Bar', () => {
    test('should display workers count', async ({ page }) => {
      await expect(page.locator('.stat-item').first()).toBeVisible();
    });

    test('should display bots count as clickable', async ({ page }) => {
      await expect(page.locator('.stat-item.clickable').first()).toBeVisible();
    });

    test('should display logs count as clickable', async ({ page }) => {
      await expect(page.locator('.stat-item.clickable')).toHaveCount(2);
    });

    test('should navigate to home page when clicking bots stat', async ({ page }) => {
      await page.locator('.stat-item.clickable').filter({ hasText: /bot/i }).click();
      await expect(page).toHaveURL('/');
    });

    test('should navigate to logs page when clicking logs stat', async ({ page }) => {
      await page.locator('.stat-item.clickable').filter({ hasText: /log/i }).click();
      await expect(page).toHaveURL(/\/logs/);
    });
  });

  test.describe('Workers Section', () => {
    test('should display section header', async ({ page }) => {
      await expect(page.locator('.section-label, .section-header').first()).toBeVisible();
    });

    test('should display create worker button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /add|create/i }).first()).toBeVisible();
    });

    test('should display filter button', async ({ page }) => {
      await expect(page.locator('.filter-btn')).toBeVisible();
    });

    test('should display history button', async ({ page }) => {
      await expect(page.locator('.history-btn')).toBeVisible();
    });
  });

  test.describe('Workers List', () => {
    test('should display worker cards after loading', async ({ page }) => {
      await expect(page.locator('.workers-list')).toBeVisible();
    });

    test('should display worker cards', async ({ page }) => {
      const cards = page.locator('[class*="worker-card"], .q-card');
      await expect(cards.first()).toBeVisible();
    });

    test('should navigate to worker detail when clicking a card', async ({ page }) => {
      // Use specific worker-card class to avoid clicking other q-cards
      const workerCard = page.locator('.worker-card').first();
      await expect(workerCard).toBeVisible({ timeout: 10000 });
      await workerCard.click();
      // Worker detail route is /bot/{botId}/worker/{workerId}
      await expect(page).toHaveURL(/\/bot\/.*\/worker\//, { timeout: 10000 });
    });
  });

  test.describe('Add Worker Drawer', () => {
    test('should open add worker drawer when clicking add button', async ({ page }) => {
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible();
    });

    test('should display form fields', async ({ page }) => {
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible();
      await expect(page.locator('.q-dialog input[type="text"]').first()).toBeVisible();
    });

    test('should require bot selection', async ({ page }) => {
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible();
      await expect(page.locator('.q-select, select').first()).toBeVisible();
    });

    test('should close drawer on escape', async ({ page }) => {
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.q-dialog')).not.toBeVisible();
    });
  });

  test.describe('Filter Functionality', () => {
    test('should open filter drawer when clicking filter button', async ({ page }) => {
      await page.locator('.filter-btn').click();
      await expect(page.locator('.q-dialog')).toBeVisible();
    });

    test('should display filter fields', async ({ page }) => {
      await page.locator('.filter-btn').click();
      await expect(page.locator('.q-dialog')).toBeVisible();
      await expect(page.locator('.q-dialog')).toContainText(/name|description|bot|filter/i);
    });
  });

  test.describe('Filter History', () => {
    test('should open filter history drawer', async ({ page }) => {
      await page.locator('.history-btn').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible({ timeout: 5000 });
      // Check for the filter history drawer
      await expect(page.locator('.filter-history-drawer, .header-title').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Settings Drawer', () => {
    test('should open settings drawer', async ({ page }) => {
      await page.locator('.settings-btn').click();
      await expect(page.locator('.q-dialog')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.locator('.workers-page')).toBeVisible();
      await expect(page.locator('.workers-list')).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.workers-page')).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('.workers-page')).toBeVisible();
    });
  });
});
