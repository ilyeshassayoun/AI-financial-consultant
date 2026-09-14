import { test, expect } from '@playwright/test';

import { mockFullAnalysis } from '../../src/__tests__/fixtures/mockAnalysisData.js';

test.describe('End-to-End Wizard Workflow & Viewport Scaling', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockFullAnalysis) });
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('completes welcome CTA navigation to mandate and verifies route integrity', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Build my financial plan' })).toBeVisible();
    await page.getByRole('button', { name: 'Build my financial plan' }).click();

    // Verify transition into Profile Step
    await expect(page.getByRole('heading', { name: 'Financial Goals', exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('navigates through wizard sections via TopNav on desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Click through each primary section
    const navSections = [
      { name: 'Mandate & Cashflow', expectedText: /Financial Goals|Personal Timeline/i },
      { name: 'Risk Shield', expectedText: /Protect the balance sheet|protection needs analysis/i },
      { name: 'Tax Optimization', expectedText: /Build a defensible tax position|tax scenario lab/i },
      { name: 'Asset Allocation', expectedText: /Core Quantitative Comparison|Investment Laboratory/i },
      { name: 'Solvency', expectedText: /Design retirement income|retirement adequacy lab/i }
    ];

    for (const section of navSections) {
      await page.getByRole('button', { name: section.name }).click();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('main')).toContainText(section.expectedText, { timeout: 15000 });
    }
  });

  test('operates on mobile viewport (360px) without horizontal scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    // Check no horizontal scroll on body
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of error for sub-pixel rendering

    // Open mobile menu
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(page.getByRole('button', { name: 'Solvency' })).toBeVisible();
  });

  test('simulates offline backend gracefully surfaces retry action', async ({ page }) => {
    await page.unroute('**/api/analyze');
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail": "Backend unavailable"}' });
    });

    // Navigate to Asset Allocation
    await page.getByRole('button', { name: 'Asset Allocation' }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Retry analysis' })).toBeVisible();
  });
});
