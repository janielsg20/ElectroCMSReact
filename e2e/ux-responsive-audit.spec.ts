import { expect, test } from '@playwright/test';

async function expectNoRootOverflow(page: import('@playwright/test').Page) {
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    root: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(geometry.root, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewport + 1);
  expect(geometry.body, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewport + 1);
}

async function expectTouchTarget(locator: import('@playwright/test').Locator, minimum = 44) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(minimum);
  expect(box!.height).toBeGreaterThanOrEqual(minimum);
}

test('1024px tablet uses the compact canvas-first shell with touch-safe authoring controls', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/editor');

  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Builder navigator' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Mobile builder tools' })).toBeVisible();
  await expect(page.getByLabel('Zoom level')).toBeVisible();

  const breakpointPicker = page.getByRole('group', { name: 'Preview breakpoint' });
  const breakpointButtons = breakpointPicker.getByRole('button');
  await expect(breakpointButtons).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expectTouchTarget(breakpointButtons.nth(index));
  }

  await expectTouchTarget(page.getByRole('button', { name: 'Open navigation' }));
  await expectTouchTarget(page.getByRole('button', { name: 'Active document' }));
  await expectTouchTarget(page.getByRole('button', { name: 'Use light appearance' }));
  await expectTouchTarget(page.getByRole('button', { name: 'Use dark appearance' }));
  await expectTouchTarget(page.getByRole('button', { name: 'Export' }));

  const stage = page.locator('.canvas-stage-v2');
  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(stageBox!.width).toBeGreaterThan(700);
  expect(stageBox!.height).toBeGreaterThan(500);
  await expectNoRootOverflow(page);
});

test('375px phone keeps every critical header action touch-safe and mobile forms readable', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/editor');

  const menu = page.getByRole('button', { name: 'Open navigation' });
  const pagePicker = page.getByRole('button', { name: 'Active document' });
  const breakpointButtons = page.getByRole('group', { name: 'Preview breakpoint' }).getByRole('button');
  const light = page.getByRole('button', { name: 'Use light appearance' });
  const dark = page.getByRole('button', { name: 'Use dark appearance' });
  const publish = page.getByRole('button', { name: 'Export' });

  await expect(breakpointButtons).toHaveCount(3);
  for (const control of [menu, pagePicker, light, dark, publish]) {
    await expectTouchTarget(control);
  }
  for (let index = 0; index < 3; index += 1) {
    await expectTouchTarget(breakpointButtons.nth(index));
  }
  await expectNoRootOverflow(page);

  const dock = page.getByRole('navigation', { name: 'Mobile builder tools' });
  await dock.getByRole('button', { name: 'Add' }).click();
  const sheet = page.getByRole('dialog', { name: 'Add components panel' });
  const search = sheet.getByLabel('Search elements');
  await expect(search).toBeVisible();
  const searchFontSize = await search.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(searchFontSize).toBeGreaterThanOrEqual(16);

  const firstCategory = sheet.getByLabel('Element categories').getByRole('button').first();
  await expectTouchTarget(firstCategory);
  await expectTouchTarget(sheet.getByRole('button', { name: 'Close components' }));
  await expectNoRootOverflow(page);
});

test('short landscape moves builder destinations to a vertical rail and preserves canvas height', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/editor');

  const dock = page.getByRole('navigation', { name: 'Mobile builder tools' });
  const dockBox = await dock.boundingBox();
  expect(dockBox).not.toBeNull();
  expect(dockBox!.width).toBeLessThanOrEqual(80);
  expect(dockBox!.height).toBeGreaterThan(220);
  expect(dockBox!.x).toBeGreaterThan(740);

  for (const name of ['Pages', 'Add', 'Layers', 'Properties']) {
    await expectTouchTarget(dock.getByRole('button', { name }), 48);
  }

  const stageBox = await page.locator('.canvas-stage-v2').boundingBox();
  expect(stageBox).not.toBeNull();
  expect(stageBox!.height).toBeGreaterThan(250);
  await expectNoRootOverflow(page);
});

test('appearance has one effective state and reduced motion collapses decorative transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/editor');

  const appearance = page.getByRole('group', { name: 'Editor appearance' });
  await expect(appearance.locator('[aria-pressed="true"]')).toHaveCount(1);

  const railButton = page.locator('.studio-rail-button').first();
  const duration = await railButton.evaluate((element) => {
    const raw = getComputedStyle(element).transitionDuration.split(',')[0]?.trim() ?? '0s';
    return raw.endsWith('ms') ? Number.parseFloat(raw) / 1000 : Number.parseFloat(raw);
  });
  expect(duration).toBeLessThan(0.01);

  await page.getByRole('button', { name: 'Use dark appearance' }).click();
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-theme', 'dark');
  const headerBorder = await page.getByTestId('app-header').evaluate((element) => getComputedStyle(element).borderBottomColor);
  expect(headerBorder).not.toBe('rgba(0, 0, 0, 0)');
  expect(headerBorder).not.toBe('transparent');
});
