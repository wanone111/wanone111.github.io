import { expect, test } from '@playwright/test';

test('mobile menu synchronizes state, manages focus, and closes predictably', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menu = page.locator('[data-site-header] .menu-toggle');
  const navigation = page.locator('#site-navigation');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(navigation).toBeHidden();

  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(navigation).toBeVisible();
  await expect(navigation.locator('a').first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeFocused();

  await menu.click();
  await page.mouse.click(10, 200);
  await expect(menu).toHaveAttribute('aria-expanded', 'false');

  await menu.click();
  await page.setViewportSize({ width: 1280, height: 844 });
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('theme preference stays consistent across Astro and Starlight', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  const themeToggle = page.locator('[data-theme-toggle]');
  await expect(themeToggle).toHaveCSS('position', 'fixed');
  await expect(themeToggle).toHaveAttribute('aria-label', '切换到深色主题');
  await expect(themeToggle.locator('.theme-toggle__icon--moon')).toHaveCSS('opacity', '1');
  await expect(themeToggle.locator('.theme-toggle__icon--sun')).toHaveCSS('opacity', '0');
  await expect(page.locator('#site-navigation a[href="/resume/"]')).toHaveCount(0);
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(themeToggle).toHaveAttribute('aria-label', '切换到浅色主题');
  await expect(themeToggle.locator('.theme-toggle__icon--sun')).toHaveCSS('opacity', '1');
  await expect(themeToggle.locator('.theme-toggle__icon--moon')).toHaveCSS('opacity', '0');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('starlight-theme'))).toBe('dark');

  await page.goto('/knowledge/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  const starlightTheme = page.locator('starlight-theme-select:visible select').first();
  await expect(starlightTheme).toBeVisible();
  await starlightTheme.selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('[data-theme-toggle]')).toHaveAttribute('aria-label', '切换到深色主题');
});

test('blog category filter updates pressed state and visible posts', async ({ page }) => {
  await page.goto('/blog/');

  const posts = page.locator('[data-post-category]');
  const categoryButtons = page.locator('[data-category]:not([data-category="all"])');
  expect(await posts.count()).toBeGreaterThan(0);
  expect(await categoryButtons.count()).toBeGreaterThan(0);

  const categoryButton = categoryButtons.first();
  const category = await categoryButton.getAttribute('data-category');
  expect(category).toBeTruthy();
  const expectedCount = await posts.evaluateAll(
    (items, selected) => items.filter((item) => item.getAttribute('data-post-category') === selected).length,
    category,
  );

  await categoryButton.click();
  await expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-post-category]:visible')).toHaveCount(expectedCount);
  await expect(page).toHaveURL(new RegExp(`\\?category=${category}$`));
  await expect(page.locator('[data-visible-count]')).toHaveText(`${expectedCount}`);

  await page.reload();
  await expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-post-category]:visible')).toHaveCount(expectedCount);

  const allButton = page.locator('[data-category="all"]');
  await allButton.click();
  await expect(allButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-post-category]:visible')).toHaveCount(await posts.count());
  await page.goBack();
  await expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
  await page.goForward();
  await expect(allButton).toHaveAttribute('aria-pressed', 'true');
});

test('homepage follows the 01–05 editorial sequence without duplicate systems', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.section-marker')).toHaveText([
    '01 / INTRO', '02 / CURRENT', '03 / SELECTED SYSTEMS', '04 / FIELD NOTES', '05 / KNOWLEDGE',
  ]);
  await expect(page.locator('.home-hero__actions a')).toHaveCount(2);
  await expect(page.locator('[data-tech-tags]')).toHaveCount(0);
});

test('workbench hotspots stay visually hidden while interactions remain available', async ({ page }) => {
  await page.goto('/');

  const hotspots = page.locator('[data-workbench] .workbench__hotspot');
  await expect(hotspots).toHaveCount(2);
  const visualStates = await hotspots.evaluateAll((items) =>
    items.map((item) => {
      const style = getComputedStyle(item);
      return { background: style.backgroundColor, border: style.borderStyle, shadow: style.boxShadow };
    }),
  );
  expect(visualStates.every((state) => state.background === 'rgba(0, 0, 0, 0)' && state.border === 'none' && state.shadow === 'none')).toBe(true);

  const note = page.locator('[data-desk-note]');
  await note.focus();
  await note.press('Enter');
  await expect(note).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#current-research')).toBeVisible();

  await expect(page.locator('#current-research a')).toHaveAttribute('href', '/projects/obsidian-astro-publishing/');
});

test('knowledge garden exposes real paths and maturity definitions', async ({ page }) => {
  await page.goto('/knowledge/');

  await expect(page.locator('[data-knowledge-garden] .garden-path')).toHaveCount(4);
  await expect(page.getByText('Seed', { exact: true })).toBeVisible();
  await expect(page.getByText('Growing', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Evergreen', { exact: true })).toBeVisible();
  await expect(page.locator('[data-knowledge-garden] .garden-path').first()).toHaveAttribute('href', '/knowledge/embedded/');
});

test('PID tuning lab updates its response metrics and resets', async ({ page }) => {
  await page.goto('/blog/algorithms/pid/');

  const integral = page.getByRole('slider', { name: 'Ki 积分参数' });
  const overshoot = page.locator('[data-pid-metric="overshoot"]');
  const summary = page.locator('[data-pid-summary]');
  await expect(integral).toHaveValue('0.35');
  await expect(overshoot).toHaveText('4.5%');

  await integral.fill('1.5');
  await expect(integral).toHaveValue('1.5');
  await expect(overshoot).toHaveText('22.8%');
  await expect(summary).toContainText('超调偏大');

  await page.getByRole('button', { name: '恢复建议值' }).click();
  await expect(integral).toHaveValue('0.35');
  await expect(overshoot).toHaveText('4.5%');
});

test('reduced motion keeps knowledge paths visible without staged transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/knowledge/');

  const paths = page.locator('[data-knowledge-garden] .garden-path');
  await expect(paths).toHaveCount(4);
  await expect(paths.first()).toBeVisible();
  const transitionDurations = await paths.evaluateAll((items) =>
    items.map((item) => getComputedStyle(item, '::before').transitionDuration),
  );
  expect(
    transitionDurations
      .flatMap((duration) => duration.split(','))
      .every((duration) => Number.parseFloat(duration) <= 0.001),
  ).toBe(true);
});

test('critical content and navigation remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.locator('h1')).toBeVisible();
  await expect(page.getByRole('link', { name: '项目', exact: true })).toBeVisible();
  await expect(page.locator('.section-marker')).toHaveCount(5);
  await expect(page.locator('[data-post-category]:visible')).toHaveCount(0);

  await page.goto('/blog/?category=robotics');
  await expect(page.locator('[data-post-category]:visible')).toHaveCount(await page.locator('[data-post-category]').count());

  await page.goto('/knowledge/');
  await expect(page.getByRole('heading', { name: '公开知识库', level: 1 })).toBeVisible();
  await expect(page.locator('[data-knowledge-garden] .garden-path')).toHaveCount(4);

  await page.goto('/uses/');
  await expect(page.getByRole('heading', { name: /工具本身不重要/, level: 1 })).toBeVisible();
  await expect(page.locator('[data-use-panel]:visible')).toHaveCount(4);
  await context.close();
});

test('publishing tabs support pointer and arrow-key activation', async ({ page }) => {
  await page.goto('/projects/obsidian-astro-publishing/');

  const privateTab = page.locator('#tab-private');
  const publicTab = page.locator('#tab-public');
  const privatePanel = page.locator('#stage-private');
  const publicPanel = page.locator('#stage-public');

  await publicTab.click();
  await expect(publicTab).toHaveAttribute('aria-selected', 'true');
  await expect(publicPanel).toBeVisible();
  await expect(privatePanel).toBeHidden();

  await publicTab.press('ArrowLeft');
  await expect(privateTab).toHaveAttribute('aria-selected', 'true');
  await expect(privatePanel).toBeVisible();
  await expect(privateTab).toBeFocused();
});

test('Starlight sidebar works on desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/knowledge/');
  const sidebar = page.locator('#starlight__sidebar');
  await expect(sidebar).toBeVisible();
  expect(await sidebar.locator('[aria-current="page"]').count()).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const menuHost = page.locator('starlight-menu-button');
  const menuButton = menuHost.locator('button');
  await menuButton.click();
  await expect(menuHost).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-mobile-menu-expanded', '');
  await expect(sidebar).toBeVisible();

  await menuButton.press('Escape');
  await expect(menuHost).toHaveAttribute('aria-expanded', 'false');
});

test('long code blocks scroll inside the article without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/blog/robotics/ros2-notes/');

  const codeBlocks = page.locator('pre');
  expect(await codeBlocks.count()).toBeGreaterThan(0);
  const overflowCount = await codeBlocks.evaluateAll(
    (blocks) => blocks.filter((block) => block.scrollWidth > block.clientWidth + 1).length,
  );
  expect(overflowCount).toBeGreaterThan(0);

  const pageWidths = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(pageWidths.scrollWidth).toBeLessThanOrEqual(pageWidths.clientWidth + 1);
});

test('logo easter egg activates a temporary theme without replacing home navigation', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('[data-logo-egg]');
  const home = page.locator('.brand__text');
  await expect(home).toHaveAttribute('href', '/');
  await logo.click({ clickCount: 4, delay: 70 });
  await expect(page.locator('html')).toHaveAttribute('data-experiment-theme', 'true');
  await expect(page.locator('[data-logo-toast]')).toContainText('实验主题已开启');
});

test('command palette searches Pagefind content and restores trigger focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('.header-search');
  await trigger.click();
  const palette = page.locator('[data-command-palette]');
  await expect(palette).toHaveAttribute('open', '');
  await page.locator('[data-command-search]').fill('uses');
  await expect(palette.locator('[data-command]:visible')).toHaveCount(1);
  await expect(palette.getByRole('link', { name: /\/uses/ })).toBeVisible();
  await page.locator('[data-command-search]').fill('ROS2');
  await expect(palette.locator('[data-pagefind-results] a').first()).toBeVisible();
  await expect(palette.locator('[data-search-status]')).toContainText('条结果');
  await page.keyboard.press('Escape');
  await expect(palette).not.toHaveAttribute('open', '');
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Control+k');
  await expect(palette).toHaveAttribute('open', '');
});

test('tags expose article lists and long articles expose engineering navigation', async ({ page }) => {
  await page.goto('/tags/');
  expect(await page.locator('[data-tag-section]').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-tag-section] li').first()).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/blog/robotics/ros2-notes/');
  await expect(page.locator('.engineering-summary')).toBeVisible();
  await expect(page.locator('.article-rail')).toBeVisible();
  expect(await page.locator('.article-rail a[href^="#"]').count()).toBeGreaterThan(0);
  await expect(page.locator('.article-rail progress')).toHaveAttribute('max', '100');
});

test('uses explorer keeps details stable while switching real tool purposes', async ({ page }) => {
  await page.goto('/uses/');
  const notebook = page.locator('.uses-explorer__tabs [data-use="notebook"]');
  await notebook.click();
  await expect(notebook).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-use-title]:visible')).toContainText('私有知识库');
  await expect(page.locator('[data-use-detail]:visible')).toContainText('Obsidian');
});

test('code copy feedback and reading plant reward completion', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/blog/robotics/ros2-notes/');
  const copyButton = page.locator('.code-copy-button').first();
  await copyButton.click();
  await expect(copyButton).not.toHaveText('复制');

  const plant = page.locator('[data-reading-plant]');
  await plant.scrollIntoViewIfNeeded();
  await expect(plant).toHaveAttribute('data-complete', 'true');
  await expect(plant.locator('[data-reading-plant-image]')).toHaveAttribute('src', '/images/brand/knowledge-evergreen-v1.webp');
});

test('404 knowledge cards drag without removing direct navigation', async ({ page }) => {
  await page.goto('/404.html');
  const card = page.locator('[data-scatter-card]').first();
  await expect(card).toHaveAttribute('href', '/knowledge/embedded/');
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 65);
  await page.mouse.up();
  await expect.poll(async () => Number(await card.getAttribute('data-drag-x'))).toBeGreaterThan(20);
  await expect(card).not.toHaveAttribute('data-dragging', 'true');
});
