import { expect, test } from '@playwright/test';

test.describe('Studio Pro mobile builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editor');
  });

  test('keeps the canvas dominant with touch-safe header and bottom tools and no root overflow', async ({ page }) => {
    const app = page.locator('.electrocms-app');
    await expect(app).toHaveAttribute('data-editor-preset', 'studio-pro');
    await expect(page.getByRole('complementary', { name: 'Builder navigator' })).toHaveCount(0);

    const appearance = page.getByRole('group', { name: 'Editor appearance' });
    const lightAppearance = appearance.getByRole('button', { name: 'Use light appearance' });
    const darkAppearance = appearance.getByRole('button', { name: 'Use dark appearance' });
    await expect(appearance).toBeVisible();
    await expect(lightAppearance).toBeVisible();
    await expect(darkAppearance).toBeVisible();
    await expect(appearance.getByRole('button', { name: 'Use system appearance' })).toBeHidden();

    const stage = page.locator('.canvas-stage-v2');
    await expect(stage).toBeVisible();
    const stageBox = await stage.boundingBox();
    expect(stageBox).not.toBeNull();
    expect(stageBox!.height).toBeGreaterThan(500);

    const dock = page.getByRole('navigation', { name: 'Mobile builder tools' });
    await expect(dock).toBeVisible();
    for (const name of ['Pages', 'Add', 'Layers', 'Properties']) {
      const button = dock.getByRole('button', { name });
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(48);
      expect(box!.height).toBeGreaterThanOrEqual(52);
    }

    const dockVisuals = await dock.evaluate((element) => {
      const buttons = [...element.querySelectorAll<HTMLButtonElement>('button')];
      return {
        iconColors: buttons.flatMap((button) => {
          const icon = button.querySelector<SVGElement>('svg');
          return icon ? [getComputedStyle(icon).color] : [];
        }),
        transitionDurations: buttons.map((button) => getComputedStyle(button).transitionDuration),
      };
    });
    expect(new Set(dockVisuals.iconColors).size).toBe(1);
    expect(dockVisuals.transitionDurations.some((value) => !/^0s(?:, 0s)*$/.test(value))).toBe(true);

    const menu = page.getByRole('button', { name: 'Open navigation' });
    const menuBox = await menu.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.width).toBeGreaterThanOrEqual(44);
    expect(menuBox!.height).toBeGreaterThanOrEqual(44);

    const lightBox = await lightAppearance.boundingBox();
    const darkBox = await darkAppearance.boundingBox();
    expect(lightBox).not.toBeNull();
    expect(darkBox).not.toBeNull();
    expect(lightBox!.height).toBeGreaterThanOrEqual(34);
    expect(darkBox!.height).toBeGreaterThanOrEqual(34);

    const rootFitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(rootFitsViewport).toBe(true);
  });

  test('opens Pages and Add as accessible bottom sheets instead of permanent panels', async ({ page }) => {
    const dock = page.getByRole('navigation', { name: 'Mobile builder tools' });

    await dock.getByRole('button', { name: 'Pages' }).click();
    const pagesDialog = page.getByRole('dialog', { name: 'Pages panel' });
    await expect(pagesDialog).toBeVisible();
    const pagesNavigator = pagesDialog.getByRole('complementary', { name: 'Builder navigator' });
    await expect(pagesNavigator.getByRole('tab', { name: 'Pages' })).toHaveAttribute('aria-selected', 'true');
    await expect(pagesDialog.getByRole('button', { name: 'Close pages' })).toBeFocused();
    await pagesDialog.getByRole('button', { name: 'Close pages' }).click();
    await expect(pagesDialog).toHaveCount(0);

    await dock.getByRole('button', { name: 'Add' }).click();
    const addDialog = page.getByRole('dialog', { name: 'Add components panel' });
    await expect(addDialog).toBeVisible();
    const addNavigator = addDialog.getByRole('complementary', { name: 'Builder navigator' });
    await expect(addNavigator.getByRole('tab', { name: 'Components' })).toHaveAttribute('aria-selected', 'true');
    await expect(addNavigator.getByLabel('Search elements')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(addDialog).toHaveCount(0);
  });

  test('opens Layers and Properties as dismissible canvas sheets', async ({ page }) => {
    const dock = page.getByRole('navigation', { name: 'Mobile builder tools' });

    await dock.getByRole('button', { name: 'Layers' }).click();
    const layers = page.getByRole('dialog', { name: 'Layers panel' });
    await expect(layers).toBeVisible();
    await expect(layers.getByRole('button', { name: 'Close layers' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(layers).toHaveCount(0);

    await dock.getByRole('button', { name: 'Properties' }).click();
    const properties = page.getByRole('dialog', { name: 'Properties panel' });
    await expect(properties).toBeVisible();
    await expect(properties.getByRole('button', { name: 'Close properties' })).toBeFocused();
    await properties.getByRole('button', { name: 'Close properties' }).click();
    await expect(properties).toHaveCount(0);
  });

  test('keeps workspace settings contained inside the compact navigation drawer', async ({ page }) => {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
    await expect(drawer).toBeVisible();

    await drawer.getByText('Workspace settings', { exact: true }).click();
    const position = drawer.getByLabel('Navigation position');
    await expect(position).toBeVisible();

    const drawerBox = await drawer.boundingBox();
    const positionBox = await position.boundingBox();
    expect(drawerBox).not.toBeNull();
    expect(positionBox).not.toBeNull();
    expect(positionBox!.x).toBeGreaterThanOrEqual(drawerBox!.x);
    expect(positionBox!.x + positionBox!.width).toBeLessThanOrEqual(drawerBox!.x + drawerBox!.width + 1);

    const rootFitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(rootFitsViewport).toBe(true);
  });
});
