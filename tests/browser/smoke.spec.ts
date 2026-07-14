import { expect, test, type Page } from '@playwright/test';

const routes = [
  '/',
  '/projects/',
  '/blog/',
  '/knowledge/',
  '/resume/',
  '/about/',
  '/links/',
  '/tags/',
  '/archive/',
  '/uses/',
  '/404.html',
];

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}

for (const route of routes) {
  test(`${route} renders without browser errors`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

    expect(response, `No response received for ${route}`).not.toBeNull();
    expect(response?.status(), `Unexpected status for ${route}`).toBe(200);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);

    const imageCount = await page.locator('img').count();
    if (imageCount > 0) {
      await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    }

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      brokenImages: [...document.images]
        .filter((image) => image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? '',
      description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? '',
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.brokenImages).toEqual([]);
    expect(metrics.canonical).not.toBe('');
    expect(metrics.description).not.toBe('');
    expect(runtimeErrors).toEqual([]);
  });
}
