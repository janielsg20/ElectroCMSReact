import { expect, test } from '@playwright/test';

test('workspace navigation preserves session state between routes', async ({ page }) => {
  await page.goto('/editor');

  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByLabel('Zoom level')).toHaveText('110%');

  const navigation = page.getByRole('navigation', { name: 'Primary workspaces' });
  await navigation.getByRole('button', { name: 'Preview' }).click();

  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole('heading', { name: 'Preview workspace', level: 2 })).toBeVisible();
  await expect(page.getByLabel('Zoom level')).toHaveText('110%');

  await navigation.getByRole('button', { name: 'Editor' }).click();
  await expect(page.getByRole('heading', { name: 'Editor workspace' })).toBeVisible();
  await expect(page.getByLabel('Zoom level')).toHaveText('110%');
});

test('workspace layout and editor theme preferences survive reload with the fixed reference rail', async ({ page }) => {
  await page.goto('/editor');

  await page.getByLabel('Editor theme mode').selectOption('dark');
  await page.locator('summary').filter({ hasText: 'Workspace settings' }).click();
  await page.getByLabel('Navigation position').selectOption('right');
  await page.getByLabel('Navigation display mode').selectOption('icons');
  await page.getByLabel('Workspace density').selectOption('comfortable');

  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-navigation-position', 'right');
  await expect(page.locator('.workspace-navigation')).toHaveAttribute('data-reference-rail', 'true');
  await expect(page.locator('.workspace-navigation')).toHaveAttribute('data-collapsed', 'true');
  await expect(page.getByRole('button', { name: 'Collapse navigation' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Primary workspaces' }).getByRole('button', { name: 'Preview' })).toBeVisible();

  await page.reload();

  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-navigation-position', 'right');
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-density', 'comfortable');
  await expect(page.locator('.workspace-navigation')).toHaveAttribute('data-display-mode', 'icons');
  await expect(page.locator('.workspace-navigation')).toHaveAttribute('data-reference-rail', 'true');
  await expect(page.locator('.workspace-navigation')).toHaveAttribute('data-collapsed', 'true');
});

test('tablet keeps every primary function available through the compact workspace layout', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/editor');

  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  await expect(page.getByLabel('Active document')).toBeVisible();
  await expect(page.getByLabel('Preview breakpoint')).toBeVisible();
  await expect(page.getByLabel('Zoom level')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();

  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Backend' }).click();
  await expect(page).toHaveURL(/\/backend$/);
  await expect(page.getByRole('heading', { name: 'Backend Builder', level: 2 })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('mobile keeps navigation available through an accessible drawer without root overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/editor');

  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Workspace navigation' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  await expect(drawer).toBeVisible();

  await drawer.getByRole('button', { name: 'Preview' }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Preview workspace', level: 2 })).toBeVisible();

  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const controls = document.querySelector<HTMLElement>('.header-controls');
    const outsideRoot = [...document.querySelectorAll<HTMLElement>('body *')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          parentClassName:
            element.parentElement && typeof element.parentElement.className === 'string'
              ? element.parentElement.className
              : '',
          insideHeaderControls: Boolean(element.closest('.header-controls')),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          overflowX: getComputedStyle(element).overflowX,
        };
      })
      .filter((rect) => rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1))
      .slice(0, 24);

    return {
      viewportWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      headerClientWidth: controls?.clientWidth ?? 0,
      headerScrollWidth: controls?.scrollWidth ?? 0,
      outsideRoot,
    };
  });

  expect(
    layout.rootScrollWidth,
    JSON.stringify(layout, null, 2),
  ).toBe(layout.viewportWidth);
  expect(layout.headerClientWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.headerScrollWidth).toBeGreaterThanOrEqual(layout.headerClientWidth);
});
