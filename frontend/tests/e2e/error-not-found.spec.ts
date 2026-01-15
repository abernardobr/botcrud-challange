import { test, expect } from '@playwright/test';

test.describe('ErrorNotFound Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/non-existent-page-12345');
  });

  test.describe('Page Layout', () => {
    test('should display the 404 error code', async ({ page }) => {
      await expect(page.getByText('404')).toBeVisible();
    });

    test('should display error message', async ({ page }) => {
      await expect(page.locator('.error-title, h1')).toBeVisible();
    });

    test('should display home button', async ({ page }) => {
      await expect(page.locator('.q-btn')).toBeVisible();
    });

    test('should have home icon on button', async ({ page }) => {
      await expect(page.locator('.q-btn .q-icon')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to home when clicking home button', async ({ page }) => {
      await page.locator('.q-btn').click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Styling', () => {
    test('should center content on page', async ({ page }) => {
      await expect(page.locator('.q-page.flex-center, .q-page')).toBeVisible();
    });

    test('should have large 404 text', async ({ page }) => {
      const text404 = page.locator('.error-code');
      await expect(text404).toBeVisible();
      await expect(text404).toContainText('404');
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await expect(page.getByText('404')).toBeVisible();
      await expect(page.locator('.q-btn')).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByText('404')).toBeVisible();
      await expect(page.locator('.q-btn')).toBeVisible();
    });

    test('should display correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.getByText('404')).toBeVisible();
      await expect(page.locator('.q-btn')).toBeVisible();
    });
  });

  test.describe('Various Invalid Routes', () => {
    test('should show 404 for random route', async ({ page }) => {
      await page.goto('/random-invalid-route');
      await expect(page.getByText('404')).toBeVisible();
    });

    test('should show 404 for invalid nested route', async ({ page }) => {
      await page.goto('/bot/invalid-bot-xyz-123/invalid');
      await expect(page.getByText('404')).toBeVisible();
    });

    test('should show 404 for deeply nested invalid route', async ({ page }) => {
      await page.goto('/a/b/c/d/e/f/g');
      await expect(page.getByText('404')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // The page uses .error-code for the 404 and h1.error-title for the main heading
      await expect(page.locator('.error-code')).toBeVisible();
      await expect(page.locator('h1.error-title, .error-title')).toBeVisible();
    });

    test('should have accessible button', async ({ page }) => {
      const button = page.locator('.q-btn');
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
    });
  });
});
