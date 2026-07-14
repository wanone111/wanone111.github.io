import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const outputDirectory = resolve('qa-artifacts', 'screenshots');

test.beforeAll(async () => {
  await mkdir(outputDirectory, { recursive: true });
});

for (const viewport of [
  { width: 1440, height: 1100 },
  { width: 1024, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`capture homepage at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({
      path: resolve(outputDirectory, `home-${viewport.width}.png`),
      fullPage: true,
    });
  });
}

test('capture mobile navigation, blog filter, and Starlight sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await page.locator('[data-site-header] .menu-toggle').click();
  await page.screenshot({ path: resolve(outputDirectory, 'mobile-menu.png'), fullPage: false });

  await page.goto('/blog/');
  const categoryButtons = page.locator('[data-category]:not([data-category="all"])');
  expect(await categoryButtons.count()).toBeGreaterThan(0);
  await categoryButtons.first().click();
  await page.screenshot({ path: resolve(outputDirectory, 'blog-filter.png'), fullPage: true });

  await page.goto('/knowledge/');
  await page.locator('starlight-menu-button button').click();
  await page.screenshot({ path: resolve(outputDirectory, 'starlight-sidebar.png'), fullPage: false });
});

test('capture knowledge garden and PID experiment', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/knowledge/');
  await expect(page.locator('[data-knowledge-garden]')).toBeVisible();
  await page.screenshot({ path: resolve(outputDirectory, 'knowledge-garden-desktop.png'), fullPage: true });

  await page.goto('/blog/algorithms/pid/');
  await page.getByRole('slider', { name: 'Ki 积分参数' }).fill('1.5');
  await expect(page.locator('[data-pid-metric="overshoot"]')).toHaveText('22.8%');
  await page.screenshot({ path: resolve(outputDirectory, 'pid-lab-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/knowledge/');
  await page.screenshot({ path: resolve(outputDirectory, 'knowledge-garden-mobile.png'), fullPage: true });
});

test('capture uses explorer and draggable 404 cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/uses/');
  await page.locator('.uses-explorer__tabs [data-use="bench"]').click();
  await expect(page.locator('[data-use-title]:visible')).toContainText('小实验');
  await page.screenshot({ path: resolve(outputDirectory, 'uses-explorer-desktop.png'), fullPage: true });

  await page.goto('/404.html');
  await page.screenshot({ path: resolve(outputDirectory, '404-scatter-desktop.png'), fullPage: true });
});
