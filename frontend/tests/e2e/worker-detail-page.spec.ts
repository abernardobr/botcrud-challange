import { test, expect } from '@playwright/test';

test.describe('WorkerDetailPage', () => {
  let botId: string;
  let workerId: string;

  test.beforeAll(async ({ request }) => {
    // Try different API response formats
    const response = await request.get('http://localhost:3000/api/workers?perPage=1');
    const data = await response.json();

    // Handle different response structures
    let worker;
    if (data.data?.items?.[0]) {
      worker = data.data.items[0];
    } else if (data.items?.[0]) {
      worker = data.items[0];
    } else if (Array.isArray(data) && data[0]) {
      worker = data[0];
    } else {
      // Fallback: use test IDs
      workerId = 'test-worker-1';
      botId = 'test-bot-1';
      return;
    }

    workerId = worker.id;
    botId = worker.bot || worker.botId;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/bot/${botId}/worker/${workerId}`);
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.worker-detail-page, .q-page', { timeout: 15000 });
  });

  test.describe('Page Layout', () => {
    test('should display the page header with back button', async ({ page }) => {
      await expect(page.locator('.back-btn').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      await expect(page.locator('.breadcrumb').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display worker name in header', async ({ page }) => {
      // Wait for worker data to load and display in breadcrumb
      const breadcrumbCurrent = page.locator('.breadcrumb-current');
      await expect(breadcrumbCurrent).toBeVisible({ timeout: 10000 });
      // Ensure it has actual content (not empty)
      await expect(breadcrumbCurrent).not.toBeEmpty({ timeout: 10000 });
    });

    test('should navigate back to bot detail when clicking back button', async ({ page }) => {
      await page.locator('.back-btn').first().click();
      await expect(page).toHaveURL(new RegExp(`/bot/${botId}`), { timeout: 10000 });
    });
  });

  test.describe('Worker Information Card', () => {
    test('should display worker details', async ({ page }) => {
      await expect(page.locator('.worker-info-card, .q-card').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display edit button', async ({ page }) => {
      const editBtn = page.locator('[data-testid="worker-edit-btn"], button').filter({ hasText: /edit/i }).first();
      await expect(editBtn).toBeVisible({ timeout: 10000 });
    });

    test('should display delete button', async ({ page }) => {
      const deleteBtn = page.locator('[data-testid="worker-delete-btn"], button').filter({ hasText: /delete/i }).first();
      await expect(deleteBtn).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Logs Section', () => {
    test('should display logs section', async ({ page }) => {
      await expect(page.locator('.logs-section, .section-header').filter({ hasText: 'Logs' }).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display filter button for logs', async ({ page }) => {
      await expect(page.locator('.filter-btn').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display filter history button', async ({ page }) => {
      await expect(page.locator('.history-btn').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Edit Worker', () => {
    test('should open edit drawer when clicking edit button', async ({ page }) => {
      const editBtn = page.locator('[data-testid="worker-edit-btn"], button').filter({ hasText: /edit/i }).first();
      await editBtn.click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible({ timeout: 5000 });
    });

    test('should pre-fill form with worker data', async ({ page }) => {
      // First, wait for worker name to appear in the worker info card (ensures data is loaded)
      const workerNameEl = page.locator('.worker-name');
      await expect(workerNameEl).toBeVisible({ timeout: 10000 });
      await expect(workerNameEl).not.toBeEmpty({ timeout: 10000 });
      const workerName = await workerNameEl.textContent();

      // Click edit button (the one in worker-actions with edit icon)
      const editBtn = page.locator('.worker-actions .action-btn').first();
      await editBtn.click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Wait for form to be populated (Quasar uses async watch)
      await page.waitForTimeout(500);

      // Quasar inputs have the actual input nested inside .q-field__native
      const input = page.locator('.q-dialog .q-field__native').first();

      // The input should have the worker name
      if (workerName) {
        await expect(input).toHaveValue(workerName.trim(), { timeout: 5000 });
      } else {
        await expect(input).not.toHaveValue('', { timeout: 5000 });
      }
    });
  });

  test.describe('Delete Worker', () => {
    test('should show confirmation dialog when clicking delete', async ({ page }) => {
      const deleteBtn = page.locator('[data-testid="worker-delete-btn"], button').filter({ hasText: /delete/i }).first();
      await deleteBtn.click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });
    });

    test('should cancel deletion when clicking cancel', async ({ page }) => {
      const deleteBtn = page.locator('[data-testid="worker-delete-btn"], button').filter({ hasText: /delete/i }).first();
      await deleteBtn.click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });
      await page.locator('.q-dialog').getByRole('button', { name: /no|cancel|cancelar/i }).click();
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Filter Logs', () => {
    test('should open filter drawer', async ({ page }) => {
      await page.locator('.filter-btn').first().click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible({ timeout: 5000 });
    });

    test('should open filter history drawer', async ({ page }) => {
      await page.locator('.history-btn').first().click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible({ timeout: 5000 });
      // Check for the filter history drawer header title
      await expect(page.locator('.filter-history-drawer, .header-title').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);
      await expect(page.locator('.worker-detail-page, .q-page')).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      await expect(page.locator('.worker-detail-page, .q-page')).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      await expect(page.locator('.worker-detail-page, .q-page')).toBeVisible();
    });
  });
});
