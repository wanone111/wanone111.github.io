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

test('capture uses workflows and draggable 404 cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/uses/');
  const videoWorkflow = page.locator('[data-workflow="video"]');
  await videoWorkflow.locator('[data-workflow-node="video-transfer"]').focus();
  await videoWorkflow.locator('summary').click();
  await expect(videoWorkflow.getByText('通信压测框架')).toBeVisible();
  await page.screenshot({ path: resolve(outputDirectory, 'uses-workflows-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/uses/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: resolve(outputDirectory, 'uses-workflows-mobile.png'), fullPage: true });

  await page.goto('/404.html');
  await page.screenshot({ path: resolve(outputDirectory, '404-scatter-desktop.png'), fullPage: true });
});

test('capture engineering project, article rail, tags, and Pagefind search', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.goto('/projects/obsidian-astro-publishing/');
  await expect(page.locator('.engineering-summary')).toBeVisible();
  await page.screenshot({ path: resolve(outputDirectory, 'project-record-desktop.png'), fullPage: true });

  await page.goto('/blog/robotics/ros2-notes/');
  await expect(page.locator('.article-rail')).toBeVisible();
  await page.screenshot({ path: resolve(outputDirectory, 'engineering-article-desktop.png'), fullPage: true });

  await page.goto('/tags/');
  await expect(page.locator('[data-tag-section]').first()).toBeVisible();
  await page.screenshot({ path: resolve(outputDirectory, 'tag-browser-desktop.png'), fullPage: true });

  await page.goto('/');
  await page.locator('.header-search').click();
  await page.locator('[data-command-search]').fill('ROS2');
  await expect(page.locator('[data-pagefind-results] a').first()).toBeVisible();
  await page.screenshot({ path: resolve(outputDirectory, 'pagefind-command-palette.png'), fullPage: false });
});

test('capture side theme control in both theme states', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');

  const themeToggle = page.locator('[data-theme-toggle]');
  await expect(themeToggle).toHaveAttribute('aria-label', '切换到深色主题');
  await page.screenshot({ path: resolve(outputDirectory, 'side-theme-light.png'), fullPage: false });

  await themeToggle.click();
  await expect(themeToggle).toHaveAttribute('aria-label', '切换到浅色主题');
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(outputDirectory, 'side-theme-dark.png'), fullPage: false });
});
