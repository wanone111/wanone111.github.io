import { expect, test, type Page } from '@playwright/test';

const routes = [
  '/',
  '/projects/',
  '/projects/heterogeneous-video-pipeline/',
  '/projects/indoor-autonomous-drone/',
  '/projects/obsidian-astro-publishing/',
  '/notes/',
  '/notes/robotics/ros2-notes/',
  '/knowledge/',
  '/resume/',
  '/about/',
  '/links/',
  '/tags/',
  '/archive/',
  '/uses/',
  '/404.html',
];

test('/rss.xml returns a public RSS feed', async ({ request }) => {
  const response = await request.get('/rss.xml');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/(?:application\/rss\+xml|text\/xml)/);
  const body = await response.text();
  expect(body).toContain('<rss version="2.0">');
  expect(body).toContain('/notes/');
});

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
      await page.evaluate(() => [...document.images].forEach((image) => { image.loading = 'eager'; }));
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
      lang: document.documentElement.lang,
      socialTitle: document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '',
      socialDescription: document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content ?? '',
      socialUrl: document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content ?? '',
      socialImage: document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content ?? '',
      twitterCard: document.querySelector<HTMLMetaElement>('meta[name="twitter:card"]')?.content ?? '',
      rss: document.querySelector<HTMLLinkElement>('link[type="application/rss+xml"]')?.href ?? '',
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.brokenImages).toEqual([]);
    expect(metrics.canonical).not.toBe('');
    expect(metrics.description).not.toBe('');
    expect(metrics.lang).toBe('zh-CN');
    expect(metrics.socialTitle).not.toBe('');
    expect(metrics.socialDescription).not.toBe('');
    expect(metrics.socialUrl).not.toBe('');
    expect(metrics.socialImage).not.toBe('');
    expect(metrics.twitterCard).toBe('summary_large_image');
    expect(metrics.rss).toContain('/rss.xml');
    expect(runtimeErrors).toEqual([]);
  });
}

for (const schemaCase of [
  { route: '/', types: ['Person', 'WebSite'] },
  { route: '/notes/robotics/ros2-notes/', types: ['TechArticle'] },
  { route: '/projects/heterogeneous-video-pipeline/', types: ['CreativeWork'] },
  { route: '/projects/indoor-autonomous-drone/', types: ['CreativeWork'] },
  { route: '/projects/obsidian-astro-publishing/', types: ['CreativeWork'] },
]) {
  test(`${schemaCase.route} exposes the expected public JSON-LD`, async ({ page }) => {
    await page.goto(schemaCase.route);
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.flatMap((script) => {
      const value = JSON.parse(script.textContent ?? '{}');
      return (Array.isArray(value) ? value : [value]).map((entry) => entry['@type']);
    }));
    expect(types).toEqual(expect.arrayContaining(schemaCase.types));
  });
}
