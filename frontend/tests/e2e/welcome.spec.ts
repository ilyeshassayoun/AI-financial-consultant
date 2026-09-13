import { test, expect } from '@playwright/test';

test.describe('Welcome Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load welcome page with CTA', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Your German Finances');
    await expect(page.getByRole('button', { name: 'Launch Actuarial Analysis' })).toBeVisible();
  });

  test('should display key metrics if analysis exists', async ({ page }) => {
    const metricCards = page.locator('[data-testid="metric-card"]');
    if (await metricCards.count() > 0) {
      await expect(metricCards.first()).toBeVisible();
    }
  });

  test('privacy dialog traps focus and closes with Escape', async ({ page }) => {
    const privacyButton = page.getByRole('button', { name: 'Open GDPR Data Privacy Controls' });
    await privacyButton.click();
    await expect(page.getByRole('dialog', { name: /Data Privacy/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Data Privacy/ })).toBeHidden();
    await expect(privacyButton).toBeFocused();
  });

  test('restores a saved dark theme and toggles it back to light', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();

    const themeToggle = page.getByRole('button', { name: 'Switch to light theme' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(themeToggle).toHaveAttribute('aria-pressed', 'true');
    await themeToggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('mobile navigation exposes the AI Concierge entry point', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('button', { name: 'Open AI Concierge' })).toBeVisible();
    await page.getByRole('button', { name: 'Open AI Concierge' }).click();
    await expect(page.getByRole('dialog', { name: 'AI Support Desk' })).toBeVisible();
  });

  test('investment analysis failure offers a retry', async ({ page }) => {
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });
    await page.getByRole('button', { name: 'Asset Allocation' }).click();
    await expect(page.getByRole('alert')).toContainText('Investment model unavailable', { timeout: 30000 });
    await expect(page.getByRole('button', { name: 'Retry analysis' })).toBeVisible();
  });
});

test.describe('Profile Step - Financial Goals (after navigation)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: 'Launch Actuarial Analysis' }).click();
    await expect(page.getByRole('heading', { name: 'Select Your Financial Goals' })).toBeVisible({ timeout: 30000 });
  });

  test('should display 6 goal cards', async ({ page }) => {
    await expect(page.locator('.profile-goal-card')).toHaveCount(6);
    const freedomCard = page.locator('text=Financial Freedom & Early Retirement');
    await expect(freedomCard).toBeVisible();
  });

  test('should show selected goals count', async ({ page }) => {
    await expect(page.locator('text=Goals Selected')).toBeVisible();
  });
});
