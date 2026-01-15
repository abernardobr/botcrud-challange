import { test, expect } from '@playwright/test';

test.describe('LogsPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/logs');
    await page.waitForSelector('.logs-page', { timeout: 15000 });
  });

  test.describe('Page Layout', () => {
    test('should display the page header with back button', async ({ page }) => {
      await expect(page.locator('.back-btn, [class*="back"]').first()).toBeVisible();
    });

    test('should display the page title with logs count', async ({ page }) => {
      await expect(page.locator('.page-title')).toBeVisible();
      await expect(page.locator('.page-title')).toContainText('Logs');
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
    test('should display logs count', async ({ page }) => {
      await expect(page.locator('.stat-item').first()).toBeVisible();
    });

    test('should display bots count as clickable', async ({ page }) => {
      await expect(page.locator('.stat-item.clickable').first()).toBeVisible();
    });

    test('should display workers count as clickable', async ({ page }) => {
      await expect(page.locator('.stat-item.clickable')).toHaveCount(2);
    });

    test('should navigate to home page when clicking bots stat', async ({ page }) => {
      await page.locator('.stat-item.clickable').filter({ hasText: /bot/i }).click();
      await expect(page).toHaveURL('/');
    });

    test('should navigate to workers page when clicking workers stat', async ({ page }) => {
      await page.locator('.stat-item.clickable').filter({ hasText: /worker/i }).click();
      await expect(page).toHaveURL(/\/workers/);
    });
  });

  test.describe('Logs Section', () => {
    test('should display section header', async ({ page }) => {
      await expect(page.locator('.section-label, .section-header').first()).toBeVisible();
    });

    test('should display create log button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /add|create/i }).first()).toBeVisible();
    });

    test('should display filter button', async ({ page }) => {
      await expect(page.locator('.filter-btn')).toBeVisible();
    });

    test('should display history button', async ({ page }) => {
      await expect(page.locator('.history-btn')).toBeVisible();
    });
  });

  test.describe('Logs List', () => {
    test('should display log cards after loading', async ({ page }) => {
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.logs-list').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display log cards', async ({ page }) => {
      // Wait for loading to complete
      await page.waitForLoadState('networkidle');
      const cards = page.locator('.log-card, [data-testid^="log-card-"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Create Log Dialog', () => {
    test('should open create log dialog when clicking add button', async ({ page }) => {
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible();
    });

    test('should display form fields', async ({ page }) => {
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible();
      await expect(page.locator('.q-dialog textarea, .q-dialog input').first()).toBeVisible();
    });

    test('should require bot and worker selection', async ({ page }) => {
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible();
      const selects = page.locator('.q-dialog .q-select');
      await expect(selects).toHaveCount(2);
    });

    test('should have close button in dialog', async ({ page }) => {
      // Note: The create log dialog is persistent and does not close on Escape
      await page.getByRole('button', { name: /add|create/i }).first().click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });
      // Verify there is a close or cancel button
      const closeBtn = page.locator('.q-dialog').getByRole('button', { name: /close|cancel|cancelar/i });
      await expect(closeBtn.first()).toBeVisible({ timeout: 5000 });
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
      await expect(page.locator('.q-dialog')).toContainText(/message|bot|worker|filter/i);
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
      await expect(page.locator('.logs-page')).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('.logs-page')).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('.logs-page')).toBeVisible();
    });
  });
});
