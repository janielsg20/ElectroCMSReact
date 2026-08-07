import { expect, test } from '@playwright/test';

test('workspace navigation preserves session state between routes', async ({ page }) => {
  await page.goto('/editor');

  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.getByLabel('Zoom level')).toHaveText('110%');

  const navigation = page.getByRole('navigation', { name: 'Primary workspaces' });
  await navigation.getByRole('button', { name: 'Preview' }).click();

  await expect(page).toHaveURL(/\/preview$/);
  await expect(page.getByRole('heading', { name: 'Preview workspace' })).toBeVisible();
  await expect(page.getByLabel('Zoom level')).toHaveText('110%');

  await navigation.getByRole('button', { name: 'Editor' }).click();
  await expect(page.getByRole('heading', { name: 'Editor workspace' })).toBeVisible();
  await expect(page.getByLabel('Zoom level')).toHaveText('110%');
});

test('workspace layout and editor theme preferences survive reload', async ({ page }) => {
  await page.goto('/editor');

  await page.getByLabel('Editor theme mode').selectOption('dark');
  await page.getByText('Workspace settings', { exact: true }).click();
  await page.getByLabel('Navigation position').selectOption('right');
  await page.getByLabel('Navigation display mode').selectOption('icons');
  await page.getByLabel('Workspace density').selectOption('comfortable');
  await page.getByRole('button', { name: 'Collapse navigation' }).click();

  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-navigation-position', 'right');
  await expect(page.locator('.workspace-navigation')).toHaveAttribute('data-collapsed', 'true');
  await expect(page.getByRole('navigation', { name: 'Primary workspaces' }).getByRole('button', { name: 'Preview' })).toBeVisible();

  await page.reload();

  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-navigation-position', 'right');
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-density', 'comfortable');
  await expect(page.locator('.workspace-navigation')).toHaveAttribute('data-display-mode', 'icons');
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
  await expect(page.getByRole('heading', { name: 'Backend workspace' })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('mobile keeps navigation available through an accessible drawer without horizontal overflow', async ({ page }) => {
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
  await expect(page.getByRole('heading', { name: 'Preview workspace' })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
