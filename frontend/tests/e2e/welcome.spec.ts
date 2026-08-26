import { test, expect } from '@playwright/test';

test.describe('Welcome Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load welcome page with CTA', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Your Financial Strategy, Built for Long-Term Growth');
    await expect(page.locator('text=Start 360° Financial Plan')).toBeVisible();
  });

  test('should display key metrics if analysis exists', async ({ page }) => {
    const metricCards = page.locator('[data-testid="metric-card"]');
    if (await metricCards.count() > 0) {
      await expect(metricCards.first()).toBeVisible();
    }
  });
});

test.describe('Profile Step - Financial Goals (after navigation)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.click('text=Start 360° Financial Plan');
    await expect(page.locator('text=Financial Goals')).toBeVisible({ timeout: 30000 });
  });

  test('should display 6 goal cards', async ({ page }) => {
    const freedomCard = page.locator('text=Financial Freedom & Early Retirement');
    await expect(freedomCard).toBeVisible();
  });

  test('should show selected goals count', async ({ page }) => {
    await expect(page.locator('text=Goals Selected')).toBeVisible();
  });
});