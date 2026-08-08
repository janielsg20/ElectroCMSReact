import { expect, test } from '@playwright/test';

test.describe('Bento High Density modern layout', () => {
  test('keeps the mobile command hierarchy accessible without root overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editor');

    const app = page.locator('.electrocms-app');
    await expect(app).toHaveAttribute('data-editor-preset', 'bento-high-density');

    const menu = page.getByRole('button', { name: 'Open navigation' });
    const activeDocument = page.getByLabel('Active document');
    await expect(menu).toBeVisible();
    await expect(activeDocument).toBeVisible();

    const menuBox = await menu.boundingBox();
    const documentBox = await activeDocument.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(documentBox).not.toBeNull();
    expect(menuBox!.width).toBeGreaterThanOrEqual(44);
    expect(menuBox!.height).toBeGreaterThanOrEqual(44);
    expect(documentBox!.y).toBeGreaterThan(menuBox!.y + 20);

    const rootFitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(rootFitsViewport).toBe(true);
  });

  test('contains workspace settings inside the compact navigation drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/editor');

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
