import { test, expect } from '@playwright/test';

import { mockFullAnalysis } from '../../src/__tests__/fixtures/mockAnalysisData.js';

test.describe('Welcome Step', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFullAnalysis) });
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load welcome page with CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/A clearer plan\s*for your money\./);
    await expect(page.getByRole('button', { name: 'Build my financial plan' })).toBeVisible();
  });

  test('explains the four planning outcomes', async ({ page }) => {
    await expect(page.getByText('Protect your income', { exact: true })).toBeVisible();
    await expect(page.getByText('Pay the right tax', { exact: true })).toBeVisible();
    await expect(page.getByText('Invest with confidence', { exact: true })).toBeVisible();
    await expect(page.getByText('Plan your retirement', { exact: true })).toBeVisible();
  });

  test('privacy dialog traps focus and closes with Escape', async ({ page }) => {
    const privacyButton = page.getByRole('button', { name: 'Open GDPR Data Privacy Controls' });
    await privacyButton.click();
    await expect(page.getByRole('dialog', { name: /Data Privacy/ })).toBeVisible({ timeout: 15000 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /Data Privacy/ })).toBeHidden();
    await expect(privacyButton).toBeFocused();
  });

  test('uses the single light portal theme without a theme control', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: /theme/i })).toHaveCount(0);
  });

  test('mobile navigation exposes the AI Concierge entry point', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('button', { name: 'Open AI Concierge' })).toBeVisible();
    await page.getByRole('button', { name: 'Open AI Concierge' }).click();
    await expect(page.getByRole('dialog', { name: 'AI Wealth Concierge Advisory Drawer' })).toBeVisible({ timeout: 15000 });
  });

  test('investment analysis failure offers a retry', async ({ page }) => {
    await page.unroute('**/api/analyze');
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
    await page.getByRole('button', { name: 'Build my financial plan' }).click();
    await expect(page.getByRole('heading', { name: 'Financial Goals', exact: true })).toBeVisible({ timeout: 30000 });
  });

  test('should display 6 goal cards', async ({ page }) => {
    await expect(page.locator('.profile-goal-card')).toHaveCount(6);
    const freedomCard = page.locator('text=Financial Freedom & Early Retirement');
    await expect(freedomCard).toBeVisible();
  });

  test('should show selected goals count', async ({ page }) => {
    await expect(page.locator('.profile-goal-card[data-selected="true"]')).toHaveCount(2);
  });
});
