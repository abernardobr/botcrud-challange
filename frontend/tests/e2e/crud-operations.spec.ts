import { test, expect } from '@playwright/test';

// Generate unique names to avoid conflicts
const timestamp = Date.now();
const testBotName = `Test Bot ${timestamp}`;
const testBotNameUpdated = `Updated Bot ${timestamp}`;
const testWorkerName = `Test Worker ${timestamp}`;
const testWorkerNameUpdated = `Updated Worker ${timestamp}`;
const testLogMessage = `Test log message ${timestamp}`;

test.describe('CRUD Operations', () => {
  test.describe.configure({ mode: 'serial' });

  let createdBotId: string;
  let createdWorkerId: string;

  test.describe('Bot CRUD', () => {
    test('should create a new bot', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.home-page', { timeout: 15000 });

      // Click add bot button
      await page.locator('[data-testid="add-bot-btn"]').click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Fill the form (dialogs render in portal, don't use .q-dialog prefix)
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill(testBotName);

      // Fill description (textarea)
      const descriptionInput = page.locator('textarea').first();
      await descriptionInput.fill('Test bot description for E2E testing');

      // Select status - click on the select to open dropdown
      const statusSelect = page.locator('.q-select').first();
      await statusSelect.click();
      // Wait for dropdown options to appear
      await page.waitForSelector('.q-menu .q-item, .q-virtual-scroll__content .q-item', { timeout: 5000 });
      // Select "Enabled" option
      await page.locator('.q-item').filter({ hasText: /enabled/i }).first().click();
      await page.waitForTimeout(300);

      // Click save button
      await page.locator('.action-btn--save').click();

      // Wait for dialog to close and success notification
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 10000 });

      // Verify the new bot appears in the list
      await page.waitForTimeout(1000); // Wait for list to refresh
      const botCard = page.locator('[data-testid^="bot-card-"]').filter({ hasText: testBotName });
      await expect(botCard).toBeVisible({ timeout: 10000 });

      // Store the bot ID for later tests
      const botCardTestId = await botCard.getAttribute('data-testid');
      createdBotId = botCardTestId?.replace('bot-card-', '') || '';
      expect(createdBotId).toBeTruthy();
    });

    test('should update the created bot', async ({ page }) => {
      expect(createdBotId).toBeTruthy();

      // Navigate to bot detail page
      await page.goto(`/bot/${createdBotId}`);
      await page.waitForSelector('.bot-detail-page', { timeout: 15000 });

      // Click edit button
      await page.waitForLoadState('networkidle');
      await page.locator('[data-testid="bot-edit-btn"]').click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Clear and update the name - use triple click to select all then type
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.click({ clickCount: 3 }); // Select all
      await nameInput.fill(testBotNameUpdated);

      // Update description - triple click to select all
      const descriptionInput = page.locator('textarea').first();
      await descriptionInput.click({ clickCount: 3 }); // Select all
      await descriptionInput.fill('Updated bot description');

      // Click save button
      await page.locator('.action-btn--save').click();

      // Wait for dialog to close and page to refresh
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 10000 });
      await page.waitForLoadState('networkidle');

      // Verify the updated name appears in breadcrumb (retry-able assertion)
      await expect(page.locator('.breadcrumb-current')).toContainText(testBotNameUpdated, { timeout: 10000 });
    });
  });

  test.describe('Worker CRUD', () => {
    test('should create a new worker for the bot', async ({ page }) => {
      expect(createdBotId).toBeTruthy();

      // Navigate to bot detail page
      await page.goto(`/bot/${createdBotId}`);
      await page.waitForSelector('.bot-detail-page', { timeout: 15000 });

      // Make sure workers tab is active
      const workersTab = page.locator('.tab-btn').first();
      const tabClass = await workersTab.getAttribute('class');
      if (!tabClass?.includes('tab-btn--active')) {
        await workersTab.click();
        await page.waitForTimeout(300);
      }

      // Click add worker button
      await page.locator('[data-testid="add-worker-btn"]').click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Fill the form (dialogs render in portal, don't use .q-dialog prefix)
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill(testWorkerName);

      // Fill description
      const descriptionInput = page.locator('textarea').first();
      await descriptionInput.fill('Test worker description');

      // Bot should already be selected (disabled field when coming from bot detail)

      // Click save button
      await page.locator('.action-btn--save').click();

      // Wait for dialog to close
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 10000 });

      // Verify the new worker appears in the list
      await page.waitForTimeout(1000);
      const workerCard = page.locator('[data-testid^="worker-card-"]').filter({ hasText: testWorkerName });
      await expect(workerCard).toBeVisible({ timeout: 10000 });

      // Store the worker ID
      const workerCardTestId = await workerCard.getAttribute('data-testid');
      createdWorkerId = workerCardTestId?.replace('worker-card-', '') || '';
      expect(createdWorkerId).toBeTruthy();
    });

    test('should update the created worker', async ({ page }) => {
      expect(createdBotId).toBeTruthy();
      expect(createdWorkerId).toBeTruthy();

      // Navigate to worker detail page
      await page.goto(`/bot/${createdBotId}/worker/${createdWorkerId}`);
      await page.waitForSelector('.q-page', { timeout: 15000 });

      // Click edit button - find button that contains "edit" text (icon)
      await page.waitForLoadState('networkidle');
      // Use :has-text() selector which searches in subtree including icons
      const editBtn = page.locator('button:has-text("edit")').first();
      await editBtn.click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Clear and update the name (dialogs render in portal, don't use .q-dialog prefix)
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.click({ clickCount: 3 }); // Select all
      await nameInput.fill(testWorkerNameUpdated);

      // Update description
      const descriptionInput = page.locator('textarea').first();
      await descriptionInput.click({ clickCount: 3 }); // Select all
      await descriptionInput.fill('Updated worker description');

      // Click save button
      await page.locator('.action-btn--save').click();

      // Wait for dialog to close
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 10000 });

      // Verify the updated name appears in the h3 heading
      await page.waitForTimeout(1000);
      await expect(page.locator('h3').first()).toContainText(testWorkerNameUpdated);
    });
  });

  test.describe('Log CRUD', () => {
    test('should create a new log', async ({ page }) => {
      expect(createdBotId).toBeTruthy();
      expect(createdWorkerId).toBeTruthy();

      // Navigate to bot detail page
      await page.goto(`/bot/${createdBotId}`);
      await page.waitForSelector('.bot-detail-page', { timeout: 15000 });

      // Click on logs tab
      const logsTab = page.locator('.tab-btn.tab-btn--logs');
      await logsTab.click();
      await page.waitForTimeout(500);

      // Click add log button - use role selector since data-testid may not exist
      await page.getByRole('button', { name: 'Add Log' }).click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Fill the message (dialog renders in portal, don't use .q-dialog prefix)
      const messageInput = page.locator('textarea').first();
      await messageInput.fill(testLogMessage);

      // Select worker from dropdown (use role selector for combobox)
      const workerCombobox = page.getByRole('combobox').first();
      await workerCombobox.click();
      await page.waitForTimeout(500); // Wait for dropdown to open
      // Try to select worker - use locator that works with Quasar menus
      const workerOption = page.locator('.q-item, [role="option"]').filter({ hasText: new RegExp(testWorkerNameUpdated, 'i') }).first();
      await workerOption.waitFor({ state: 'visible', timeout: 5000 });
      await workerOption.click();
      await page.waitForTimeout(300);

      // Click save button
      await page.locator('.action-btn--save').click();

      // Wait for dialog to close
      await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 10000 });

      // Verify the new log appears in the list (logs on bot detail page are in a table, not cards)
      await page.waitForTimeout(1000);
      // Check for log in either table row or log card format
      const logElement = page.locator('table tbody tr, .log-card').filter({ hasText: testLogMessage });
      await expect(logElement.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Cleanup - Delete Operations', () => {
    test('should delete the created worker', async ({ page }) => {
      expect(createdBotId).toBeTruthy();
      expect(createdWorkerId).toBeTruthy();

      // Navigate to worker detail page
      await page.goto(`/bot/${createdBotId}/worker/${createdWorkerId}`);
      await page.waitForSelector('.q-page', { timeout: 15000 });

      // Click delete button - use has-text for buttons with icon
      await page.waitForLoadState('networkidle');
      await page.locator('button:has-text("delete")').first().click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Confirm deletion (dialog renders in portal)
      await page.getByRole('button', { name: /yes|confirm|ok|delete/i }).click();

      // Should navigate back to bot detail page
      await expect(page).toHaveURL(new RegExp(`/bot/${createdBotId}`), { timeout: 10000 });

      // Verify worker is no longer in the list
      await page.waitForTimeout(1000);
      const workerCard = page.locator('[data-testid^="worker-card-"]').filter({ hasText: testWorkerNameUpdated });
      await expect(workerCard).not.toBeVisible({ timeout: 5000 });
    });

    test('should delete the created bot', async ({ page }) => {
      expect(createdBotId).toBeTruthy();

      // Navigate to bot detail page
      await page.goto(`/bot/${createdBotId}`);
      await page.waitForSelector('.bot-detail-page', { timeout: 15000 });

      // Click delete button
      await page.locator('[data-testid="bot-delete-btn"]').click();
      await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

      // Confirm deletion (dialog renders in portal)
      await page.getByRole('button', { name: /yes|confirm|ok|delete/i }).click();

      // Should navigate back to home page
      await expect(page).toHaveURL('/');

      // Verify bot is no longer in the list
      await page.waitForTimeout(1000);
      const botCard = page.locator('[data-testid^="bot-card-"]').filter({ hasText: testBotNameUpdated });
      await expect(botCard).not.toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Workers Page CRUD', () => {
  const workerTimestamp = Date.now();
  const workerPageBotName = `Worker Page Bot ${workerTimestamp}`;
  const workerPageWorkerName = `Worker Page Worker ${workerTimestamp}`;
  let workerPageBotId: string;

  test.beforeAll(async ({ request }) => {
    // Create a bot via API for worker tests
    const response = await request.post('http://localhost:3000/api/bots', {
      data: {
        name: workerPageBotName,
        description: 'Bot created for worker page tests',
        status: 'ENABLED',
      },
    });
    const bot = await response.json();
    workerPageBotId = bot.data.id;
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: delete the bot created for tests
    if (workerPageBotId) {
      await request.delete(`http://localhost:3000/api/bots/${workerPageBotId}`);
    }
  });

  test('should create a worker from workers page', async ({ page }) => {
    await page.goto('/workers');
    await page.waitForSelector('.workers-page', { timeout: 15000 });

    // Click add worker button
    await page.getByRole('button', { name: /add|create/i }).first().click();
    await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

    // Fill the form (dialogs render in portal, don't use .q-dialog prefix)
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill(workerPageWorkerName);

    // Fill description
    const descriptionInput = page.locator('textarea').first();
    await descriptionInput.fill('Worker created from workers page');

    // Select bot from dropdown (dialogs and dropdowns are in portals)
    const botSelect = page.locator('.q-select').first();
    await botSelect.click();
    // Wait for dropdown options to appear
    await page.waitForSelector('.q-menu .q-item, .q-virtual-scroll__content .q-item', { timeout: 5000 });
    await page.locator('.q-item').filter({ hasText: new RegExp(workerPageBotName, 'i') }).first().click();
    await page.waitForTimeout(300);

    // Click save button
    await page.locator('.action-btn--save').click();

    // Wait for dialog to close
    await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 10000 });

    // Verify the new worker appears in the list
    await page.waitForTimeout(1000);
    const workerCard = page.locator('.worker-card, [data-testid^="worker-card-"]').filter({ hasText: workerPageWorkerName }).first();
    await expect(workerCard).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Logs Page CRUD', () => {
  const logTimestamp = Date.now();
  const logPageBotName = `Log Page Bot ${logTimestamp}`;
  const logPageWorkerName = `Log Page Worker ${logTimestamp}`;
  const logPageMessage = `Log created from logs page ${logTimestamp}`;
  let logPageBotId: string;
  let logPageWorkerId: string;

  test.beforeAll(async ({ request }) => {
    // Create a bot via API
    const botResponse = await request.post('http://localhost:3000/api/bots', {
      data: {
        name: logPageBotName,
        description: 'Bot created for log page tests',
        status: 'ENABLED',
      },
    });
    const bot = await botResponse.json();
    logPageBotId = bot.data.id;

    // Create a worker for the bot
    const workerResponse = await request.post('http://localhost:3000/api/workers', {
      data: {
        name: logPageWorkerName,
        description: 'Worker created for log page tests',
        bot: logPageBotId,
      },
    });
    const worker = await workerResponse.json();
    logPageWorkerId = worker.data.id;
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: delete the worker and bot
    if (logPageWorkerId) {
      await request.delete(`http://localhost:3000/api/workers/${logPageWorkerId}`);
    }
    if (logPageBotId) {
      await request.delete(`http://localhost:3000/api/bots/${logPageBotId}`);
    }
  });

  test('should create a log from logs page', async ({ page }) => {
    await page.goto('/logs');
    await page.waitForSelector('.logs-page', { timeout: 15000 });

    // Click add log button
    await page.getByRole('button', { name: /add|create/i }).first().click();
    await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

    // Fill the message (dialogs render in portal, don't use .q-dialog prefix)
    const messageInput = page.locator('textarea').first();
    await messageInput.fill(logPageMessage);

    // Select bot from dropdown (if there's a bot select)
    const selects = page.locator('.q-select');
    const selectCount = await selects.count();

    if (selectCount >= 2) {
      // First select is likely bot, second is worker
      const botSelect = selects.first();
      await botSelect.click();
      await page.waitForSelector('.q-menu .q-item, .q-virtual-scroll__content .q-item', { timeout: 5000 });
      await page.locator('.q-item').filter({ hasText: new RegExp(logPageBotName, 'i') }).first().click();
      await page.waitForTimeout(500);

      // Select worker
      const workerSelect = selects.nth(1);
      await workerSelect.click();
      await page.waitForSelector('.q-menu .q-item, .q-virtual-scroll__content .q-item', { timeout: 5000 });
      await page.locator('.q-item').filter({ hasText: new RegExp(logPageWorkerName, 'i') }).first().click();
      await page.waitForTimeout(300);
    } else if (selectCount === 1) {
      // Only worker select
      const workerSelect = selects.first();
      await workerSelect.click();
      await page.waitForSelector('.q-menu .q-item, .q-virtual-scroll__content .q-item', { timeout: 5000 });
      await page.locator('.q-item').filter({ hasText: new RegExp(logPageWorkerName, 'i') }).first().click();
      await page.waitForTimeout(300);
    }

    // Click save button
    await page.locator('.action-btn--save').click();

    // Wait for dialog to close
    await expect(page.locator('.q-dialog')).not.toBeVisible({ timeout: 10000 });

    // Verify the new log appears in the list
    await page.waitForTimeout(1000);
    const logCard = page.locator('.log-card, [data-testid^="log-card-"]').filter({ hasText: logPageMessage }).first();
    await expect(logCard).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Cascade Delete Tests
 * Verifies that when a bot is deleted, all associated workers and logs are also deleted
 */
test.describe('Cascade Delete - Bot removes Workers and Logs', () => {
  test.describe.configure({ mode: 'serial' });

  const cascadeTimestamp = Date.now();
  const cascadeBotName = `Cascade Bot ${cascadeTimestamp}`;
  const cascadeWorker1Name = `Cascade Worker 1 ${cascadeTimestamp}`;
  const cascadeWorker2Name = `Cascade Worker 2 ${cascadeTimestamp}`;
  const cascadeLog1Message = `Cascade Log 1 for Worker 1 ${cascadeTimestamp}`;
  const cascadeLog2Message = `Cascade Log 2 for Worker 1 ${cascadeTimestamp}`;
  const cascadeLog3Message = `Cascade Log 3 for Worker 2 ${cascadeTimestamp}`;

  let cascadeBotId: string;
  let cascadeWorker1Id: string;
  let cascadeWorker2Id: string;
  let cascadeLog1Id: string;
  let cascadeLog2Id: string;
  let cascadeLog3Id: string;

  test('Step 1: Create a bot for cascade delete test', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/bots', {
      data: {
        name: cascadeBotName,
        description: 'Bot for testing cascade delete',
        status: 'ENABLED',
      },
    });
    expect(response.ok()).toBeTruthy();
    const bot = await response.json();
    cascadeBotId = bot.data.id;
    expect(cascadeBotId).toBeTruthy();
  });

  test('Step 2: Create first worker for the bot', async ({ request }) => {
    expect(cascadeBotId).toBeTruthy();

    const response = await request.post('http://localhost:3000/api/workers', {
      data: {
        name: cascadeWorker1Name,
        description: 'First worker for cascade delete test',
        bot: cascadeBotId,
      },
    });
    expect(response.ok()).toBeTruthy();
    const worker = await response.json();
    cascadeWorker1Id = worker.data.id;
    expect(cascadeWorker1Id).toBeTruthy();
  });

  test('Step 3: Create second worker for the bot', async ({ request }) => {
    expect(cascadeBotId).toBeTruthy();

    const response = await request.post('http://localhost:3000/api/workers', {
      data: {
        name: cascadeWorker2Name,
        description: 'Second worker for cascade delete test',
        bot: cascadeBotId,
      },
    });
    expect(response.ok()).toBeTruthy();
    const worker = await response.json();
    cascadeWorker2Id = worker.data.id;
    expect(cascadeWorker2Id).toBeTruthy();
  });

  test('Step 4: Create first log for worker 1', async ({ request }) => {
    expect(cascadeBotId).toBeTruthy();
    expect(cascadeWorker1Id).toBeTruthy();

    const response = await request.post('http://localhost:3000/api/logs', {
      data: {
        message: cascadeLog1Message,
        bot: cascadeBotId,
        worker: cascadeWorker1Id,
      },
    });
    expect(response.ok()).toBeTruthy();
    const log = await response.json();
    cascadeLog1Id = log.data.id;
    expect(cascadeLog1Id).toBeTruthy();
  });

  test('Step 5: Create second log for worker 1', async ({ request }) => {
    expect(cascadeBotId).toBeTruthy();
    expect(cascadeWorker1Id).toBeTruthy();

    const response = await request.post('http://localhost:3000/api/logs', {
      data: {
        message: cascadeLog2Message,
        bot: cascadeBotId,
        worker: cascadeWorker1Id,
      },
    });
    expect(response.ok()).toBeTruthy();
    const log = await response.json();
    cascadeLog2Id = log.data.id;
    expect(cascadeLog2Id).toBeTruthy();
  });

  test('Step 6: Create log for worker 2', async ({ request }) => {
    expect(cascadeBotId).toBeTruthy();
    expect(cascadeWorker2Id).toBeTruthy();

    const response = await request.post('http://localhost:3000/api/logs', {
      data: {
        message: cascadeLog3Message,
        bot: cascadeBotId,
        worker: cascadeWorker2Id,
      },
    });
    expect(response.ok()).toBeTruthy();
    const log = await response.json();
    cascadeLog3Id = log.data.id;
    expect(cascadeLog3Id).toBeTruthy();
  });

  test('Step 7: Verify all entities exist before deletion', async ({ page, request }) => {
    // Verify bot exists via API
    const botResponse = await request.get(`http://localhost:3000/api/bots/${cascadeBotId}`);
    expect(botResponse.ok()).toBeTruthy();

    // Verify workers exist via API
    const worker1Response = await request.get(`http://localhost:3000/api/workers/${cascadeWorker1Id}`);
    expect(worker1Response.ok()).toBeTruthy();
    const worker2Response = await request.get(`http://localhost:3000/api/workers/${cascadeWorker2Id}`);
    expect(worker2Response.ok()).toBeTruthy();

    // Verify logs exist via API
    const log1Response = await request.get(`http://localhost:3000/api/logs/${cascadeLog1Id}`);
    expect(log1Response.ok()).toBeTruthy();
    const log2Response = await request.get(`http://localhost:3000/api/logs/${cascadeLog2Id}`);
    expect(log2Response.ok()).toBeTruthy();
    const log3Response = await request.get(`http://localhost:3000/api/logs/${cascadeLog3Id}`);
    expect(log3Response.ok()).toBeTruthy();

    // Also verify via UI - bot detail page shows workers
    await page.goto(`/bot/${cascadeBotId}`);
    await page.waitForSelector('.bot-detail-page', { timeout: 15000 });

    // Verify workers are visible
    await expect(page.locator('[data-testid^="worker-card-"]').filter({ hasText: cascadeWorker1Name })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid^="worker-card-"]').filter({ hasText: cascadeWorker2Name })).toBeVisible({ timeout: 10000 });

    // Switch to logs tab and verify logs
    const logsTab = page.locator('.tab-btn.tab-btn--logs');
    await logsTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verify logs are visible (logs on bot detail page are in a table, not log-card)
    // Look for either table rows containing log messages or log-card elements
    const logsTable = page.locator('table');
    const logCards = page.locator('.log-card, [data-testid^="log-card-"]');

    // Check if either table with logs or log cards exist
    const hasTable = await logsTable.count() > 0;
    if (hasTable) {
      // Logs displayed in table format - look for rows with log content
      await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
    } else {
      // Logs displayed as cards
      await expect(logCards.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Step 8: Delete the bot via UI', async ({ page }) => {
    expect(cascadeBotId).toBeTruthy();

    await page.goto(`/bot/${cascadeBotId}`);
    await page.waitForSelector('.bot-detail-page', { timeout: 15000 });

    // Click delete button
    await page.locator('[data-testid="bot-delete-btn"]').click();
    await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

    // Confirm deletion (dialog renders in portal, don't use .q-dialog prefix)
    await page.getByRole('button', { name: /yes|confirm|ok|delete/i }).click();

    // Should navigate back to home page
    await expect(page).toHaveURL('/');
  });

  test('Step 9: Verify bot is deleted', async ({ request, page }) => {
    // Verify via API - should return 404
    const botResponse = await request.get(`http://localhost:3000/api/bots/${cascadeBotId}`);
    expect(botResponse.status()).toBe(404);

    // Verify via UI - bot should not appear in list
    await page.goto('/');
    await page.waitForSelector('.home-page', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const botCard = page.locator('[data-testid^="bot-card-"]').filter({ hasText: cascadeBotName });
    await expect(botCard).not.toBeVisible({ timeout: 5000 });
  });

  test('Step 10: Verify all workers are cascade deleted', async ({ request, page }) => {
    // Verify via API - workers should return 404
    const worker1Response = await request.get(`http://localhost:3000/api/workers/${cascadeWorker1Id}`);
    expect(worker1Response.status()).toBe(404);

    const worker2Response = await request.get(`http://localhost:3000/api/workers/${cascadeWorker2Id}`);
    expect(worker2Response.status()).toBe(404);

    // Verify via UI - workers should not appear in workers page
    await page.goto('/workers');
    await page.waitForSelector('.workers-page', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const worker1Card = page.locator('[class*="worker-card"], .q-card').filter({ hasText: cascadeWorker1Name });
    await expect(worker1Card).not.toBeVisible({ timeout: 5000 });

    const worker2Card = page.locator('[class*="worker-card"], .q-card').filter({ hasText: cascadeWorker2Name });
    await expect(worker2Card).not.toBeVisible({ timeout: 5000 });
  });

  test('Step 11: Verify all logs are cascade deleted', async ({ request, page }) => {
    // Verify via API - logs should return 404
    const log1Response = await request.get(`http://localhost:3000/api/logs/${cascadeLog1Id}`);
    expect(log1Response.status()).toBe(404);

    const log2Response = await request.get(`http://localhost:3000/api/logs/${cascadeLog2Id}`);
    expect(log2Response.status()).toBe(404);

    const log3Response = await request.get(`http://localhost:3000/api/logs/${cascadeLog3Id}`);
    expect(log3Response.status()).toBe(404);

    // Verify via UI - logs should not appear in logs page
    await page.goto('/logs');
    await page.waitForSelector('.logs-page', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const log1Card = page.locator('[class*="log-card"], .q-card').filter({ hasText: cascadeLog1Message });
    await expect(log1Card).not.toBeVisible({ timeout: 5000 });

    const log2Card = page.locator('[class*="log-card"], .q-card').filter({ hasText: cascadeLog2Message });
    await expect(log2Card).not.toBeVisible({ timeout: 5000 });

    const log3Card = page.locator('[class*="log-card"], .q-card').filter({ hasText: cascadeLog3Message });
    await expect(log3Card).not.toBeVisible({ timeout: 5000 });
  });
});

/**
 * Cascade Delete Tests - Worker removes Logs
 * Verifies that when a worker is deleted, all associated logs are also deleted
 */
test.describe('Cascade Delete - Worker removes Logs', () => {
  test.describe.configure({ mode: 'serial' });

  const workerCascadeTimestamp = Date.now();
  const workerCascadeBotName = `Worker Cascade Bot ${workerCascadeTimestamp}`;
  const workerCascadeWorkerName = `Worker Cascade Worker ${workerCascadeTimestamp}`;
  const workerCascadeLog1Message = `Worker Cascade Log 1 ${workerCascadeTimestamp}`;
  const workerCascadeLog2Message = `Worker Cascade Log 2 ${workerCascadeTimestamp}`;

  let workerCascadeBotId: string;
  let workerCascadeWorkerId: string;
  let workerCascadeLog1Id: string;
  let workerCascadeLog2Id: string;

  test('Setup: Create bot and worker with logs', async ({ request }) => {
    // Create bot
    const botResponse = await request.post('http://localhost:3000/api/bots', {
      data: {
        name: workerCascadeBotName,
        description: 'Bot for worker cascade delete test',
        status: 'ENABLED',
      },
    });
    expect(botResponse.ok()).toBeTruthy();
    const bot = await botResponse.json();
    workerCascadeBotId = bot.data.id;

    // Create worker
    const workerResponse = await request.post('http://localhost:3000/api/workers', {
      data: {
        name: workerCascadeWorkerName,
        description: 'Worker for cascade delete test',
        bot: workerCascadeBotId,
      },
    });
    expect(workerResponse.ok()).toBeTruthy();
    const worker = await workerResponse.json();
    workerCascadeWorkerId = worker.data.id;

    // Create logs
    const log1Response = await request.post('http://localhost:3000/api/logs', {
      data: {
        message: workerCascadeLog1Message,
        bot: workerCascadeBotId,
        worker: workerCascadeWorkerId,
      },
    });
    expect(log1Response.ok()).toBeTruthy();
    const log1 = await log1Response.json();
    workerCascadeLog1Id = log1.data.id;

    const log2Response = await request.post('http://localhost:3000/api/logs', {
      data: {
        message: workerCascadeLog2Message,
        bot: workerCascadeBotId,
        worker: workerCascadeWorkerId,
      },
    });
    expect(log2Response.ok()).toBeTruthy();
    const log2 = await log2Response.json();
    workerCascadeLog2Id = log2.data.id;
  });

  test('Verify entities exist before deletion', async ({ request }) => {
    const workerResponse = await request.get(`http://localhost:3000/api/workers/${workerCascadeWorkerId}`);
    expect(workerResponse.ok()).toBeTruthy();

    const log1Response = await request.get(`http://localhost:3000/api/logs/${workerCascadeLog1Id}`);
    expect(log1Response.ok()).toBeTruthy();

    const log2Response = await request.get(`http://localhost:3000/api/logs/${workerCascadeLog2Id}`);
    expect(log2Response.ok()).toBeTruthy();
  });

  test('Delete the worker via UI', async ({ page }) => {
    await page.goto(`/bot/${workerCascadeBotId}/worker/${workerCascadeWorkerId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.worker-detail-page, .q-page', { timeout: 15000 });

    // Click delete button - use button with delete icon text
    const deleteBtn = page.locator('button:has-text("delete")').first();
    await deleteBtn.click();
    await expect(page.locator('.q-dialog')).toBeVisible({ timeout: 5000 });

    // Confirm deletion - look for Yes/Confirm/OK (not "delete" to avoid matching the trigger button)
    // The confirm button should be in the dialog which just appeared
    await page.waitForTimeout(300);
    const confirmBtn = page.getByRole('button', { name: /^yes$|^confirm$|^ok$/i }).first();
    await confirmBtn.click();

    // Should navigate back to bot detail page
    await expect(page).toHaveURL(new RegExp(`/bot/${workerCascadeBotId}`), { timeout: 10000 });
  });

  test('Verify worker is deleted', async ({ request }) => {
    const workerResponse = await request.get(`http://localhost:3000/api/workers/${workerCascadeWorkerId}`);
    expect(workerResponse.status()).toBe(404);
  });

  test('Verify all logs are cascade deleted when worker is deleted', async ({ request, page }) => {
    // Verify via API
    const log1Response = await request.get(`http://localhost:3000/api/logs/${workerCascadeLog1Id}`);
    expect(log1Response.status()).toBe(404);

    const log2Response = await request.get(`http://localhost:3000/api/logs/${workerCascadeLog2Id}`);
    expect(log2Response.status()).toBe(404);

    // Verify via UI
    await page.goto('/logs');
    await page.waitForSelector('.logs-page', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const log1Card = page.locator('[class*="log-card"], .q-card').filter({ hasText: workerCascadeLog1Message });
    await expect(log1Card).not.toBeVisible({ timeout: 5000 });

    const log2Card = page.locator('[class*="log-card"], .q-card').filter({ hasText: workerCascadeLog2Message });
    await expect(log2Card).not.toBeVisible({ timeout: 5000 });
  });

  test('Verify bot still exists after worker deletion', async ({ request, page }) => {
    // Bot should still exist
    const botResponse = await request.get(`http://localhost:3000/api/bots/${workerCascadeBotId}`);
    expect(botResponse.ok()).toBeTruthy();

    // Cleanup - delete the bot
    await request.delete(`http://localhost:3000/api/bots/${workerCascadeBotId}`);
  });
});
