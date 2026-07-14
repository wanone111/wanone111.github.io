import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'home', route: '/' },
  { name: 'blog', route: '/blog/' },
  { name: 'long article', route: '/blog/robotics/ros2-notes/' },
  { name: 'PID experiment', route: '/blog/algorithms/pid/' },
  { name: 'projects', route: '/projects/' },
  { name: 'resume', route: '/resume/' },
  { name: 'tags', route: '/tags/' },
  { name: 'knowledge', route: '/knowledge/' },
  { name: 'uses', route: '/uses/' },
  { name: 'not found', route: '/404.html' },
  { name: 'home mobile', route: '/', viewport: { width: 390, height: 844 } },
  { name: 'knowledge mobile', route: '/knowledge/', viewport: { width: 390, height: 844 } },
  { name: 'PID experiment mobile', route: '/blog/algorithms/pid/', viewport: { width: 390, height: 844 } },
  { name: 'uses mobile', route: '/uses/', viewport: { width: 390, height: 844 } },
];

for (const pageCase of pages) {
  test(`${pageCase.name} has no automatically detectable WCAG A/AA violations`, async ({ page }) => {
    if (pageCase.viewport) await page.setViewportSize(pageCase.viewport);
    await page.goto(pageCase.route, { waitUntil: 'domcontentloaded' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    await test.info().attach(`${pageCase.name.replaceAll(' ', '-')}-axe.json`, {
      body: Buffer.from(JSON.stringify(results, null, 2)),
      contentType: 'application/json',
    });

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
