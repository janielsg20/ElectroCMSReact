import { expect, test } from '@playwright/test';

test('uses one Studio Pro editor system while header appearance selector remains persistent', async ({ page }) => {
  await page.goto('/editor');

  const app = page.locator('.electrocms-app');
  await expect(app).toHaveAttribute('data-editor-preset', 'studio-pro');
  await expect(page.getByLabel('Editor theme preset')).toHaveCount(0);

  const appearance = page.getByRole('group', { name: 'Editor appearance' });
  const light = appearance.getByRole('button', { name: 'Use light appearance' });
  const dark = appearance.getByRole('button', { name: 'Use dark appearance' });
  const system = appearance.getByRole('button', { name: 'Use system appearance' });

  await expect(appearance).toBeVisible();
  await expect(light).toBeVisible();
  await expect(dark).toBeVisible();
  await expect(system).toBeVisible();

  await dark.click();
  await expect(dark).toHaveAttribute('aria-pressed', 'true');
  await expect(app).toHaveAttribute('data-theme-mode', 'dark');
  await expect(app).toHaveAttribute('data-editor-preset', 'studio-pro');

  await page.reload();
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-editor-preset', 'studio-pro');
  await expect(page.getByRole('button', { name: 'Use dark appearance' })).toHaveAttribute('aria-pressed', 'true');
});
