import { test, expect } from '@playwright/test';

test.describe('BotDetailPage', () => {
  let botId: string;

  test.beforeAll(async ({ request }) => {
    // Try different API response formats
    const response = await request.get('http://localhost:3000/api/bots?perPage=1');
    const data = await response.json();

    // Handle different response structures
    if (data.data?.items?.[0]?.id) {
      botId = data.data.items[0].id;
    } else if (data.items?.[0]?.id) {
      botId = data.items[0].id;
    } else if (Array.isArray(data) && data[0]?.id) {
      botId = data[0].id;
    } else {
      // Fallback: use a test bot ID
      botId = 'test-bot-1';
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/bot/${botId}`);
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.bot-detail-page', { timeout: 15000 });
  });

  test.describe('Page Layout', () => {
    test('should display the page header with back button', async ({ page }) => {
      const backBtn = page.locator('.back-btn');
      await expect(backBtn.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display breadcrumb navigation', async ({ page }) => {
      await expect(page.locator('.breadcrumb').first()).toBeVisible();
    });

    test('should display bot name in header', async ({ page }) => {
      await expect(page.locator('.breadcrumb-current')).toBeVisible();
    });

    test('should navigate back when clicking back button', async ({ page }) => {
      await page.locator('.back-btn').first().click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Bot Information Card', () => {
    test('should display bot details card', async ({ page }) => {
      await expect(page.locator('.bot-info-card')).toBeVisible();
    });

    test('should display bot name in breadcrumb', async ({ page }) => {
      await expect(page.locator('.breadcrumb-current')).toBeVisible();
    });

    test('should display bot status badge', async ({ page }) => {
      // Wait for the status badge to be visible
      const statusBadge = page.locator('[data-testid="bot-detail-status"]');
      await expect(statusBadge).toBeVisible({ timeout: 10000 });
    });

    test('should display bot description', async ({ page }) => {
      // Bot description is optional, so we check for the container
      const description = page.locator('[data-testid="bot-description"]');
      const descExists = await description.count() > 0;
      if (descExists) {
        await expect(description).toBeVisible();
      }
    });

    test('should display edit button', async ({ page }) => {
      await expect(page.locator('[data-testid="bot-edit-btn"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display delete button', async ({ page }) => {
      await expect(page.locator('[data-testid="bot-delete-btn"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Workers Section', () => {
    test('should display workers tab', async ({ page }) => {
      await expect(page.locator('.tab-btn').first()).toBeVisible();
    });

    test('should display add worker button', async ({ page }) => {
      // Make sure workers tab is active
      const workersTab = page.locator('.tab-btn').first();
      if (!(await workersTab.getAttribute('class'))?.includes('tab-btn--active')) {
        await workersTab.click();
        await page.waitForTimeout(300);
      }
      await expect(page.locator('[data-testid="add-worker-btn"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display workers section actions', async ({ page }) => {
      // Make sure workers tab is active
      const workersTab = page.locator('.tab-btn').first();
      if (!(await workersTab.getAttribute('class'))?.includes('tab-btn--active')) {
        await workersTab.click();
        await page.waitForTimeout(300);
      }
      await expect(page.locator('[data-testid="workers-section"]')).toBeVisible({ timeout: 10000 });
    });

    test('should display filter button for workers', async ({ page }) => {
      await expect(page.locator('.filter-btn').first()).toBeVisible();
    });
  });

  test.describe('Logs Section', () => {
    test('should display logs tab', async ({ page }) => {
      // Click on logs tab to view logs section
      const logsTab = page.locator('.tab-btn.tab-btn--logs');
      await logsTab.click();
      await expect(logsTab).toHaveClass(/tab-btn--active/);
    });

    test('should switch between workers and logs tabs', async ({ page }) => {
      // Initially workers tab is active
      const workersTab = page.locator('.tab-btn').first();
      const logsTab = page.locator('.tab-btn.tab-btn--logs');

      // Click logs tab
      await logsTab.click();
      await page.waitForTimeout(300);
      await expect(logsTab).toHaveClass(/tab-btn--active/);

      // Click workers tab again
      await workersTab.click();
      await page.waitForTimeout(300);
      await expect(workersTab).toHaveClass(/tab-btn--active/);
    });
  });

  test.describe('Edit Bot', () => {
    test('should open edit drawer when clicking edit button', async ({ page }) => {
      await page.locator('[data-testid="bot-edit-btn"]').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible({ timeout: 5000 });
    });

    test('should pre-fill form with bot data', async ({ page }) => {
      await page.locator('[data-testid="bot-edit-btn"]').click();
      await page.waitForSelector('.q-dialog, .q-drawer', { timeout: 5000 });
      const input = page.locator('.q-dialog input[type="text"], .q-drawer input[type="text"]').first();
      await expect(input).not.toHaveValue('');
    });
  });

  test.describe('Delete Bot', () => {
    test('should show confirmation dialog when clicking delete', async ({ page }) => {
      await page.locator('[data-testid="bot-delete-btn"]').click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });
    });

    test('should cancel deletion when clicking cancel', async ({ page }) => {
      await page.locator('[data-testid="bot-delete-btn"]').click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });
      // Look for cancel/no button in the dialog
      const cancelBtn = page.locator('.q-dialog').getByRole('button', { name: /no|cancel|cancelar/i });
      await cancelBtn.click();
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Add Worker', () => {
    test('should open add worker drawer', async ({ page }) => {
      // Make sure workers tab is active first
      const workersTab = page.locator('.tab-btn').first();
      if (!(await workersTab.getAttribute('class'))?.includes('tab-btn--active')) {
        await workersTab.click();
        await page.waitForTimeout(300);
      }
      await page.locator('[data-testid="add-worker-btn"]').click();
      await expect(page.locator('.q-dialog, .q-drawer')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);
      await expect(page.locator('.bot-detail-page')).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      await expect(page.locator('.bot-detail-page')).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      await expect(page.locator('.bot-detail-page')).toBeVisible();
    });
  });
});
