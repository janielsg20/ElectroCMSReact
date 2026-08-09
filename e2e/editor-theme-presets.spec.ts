import { expect, test } from '@playwright/test';

test('uses one Studio Pro editor system while appearance mode remains persistent', async ({ page }) => {
  await page.goto('/editor');

  const app = page.locator('.electrocms-app');
  await expect(app).toHaveAttribute('data-editor-preset', 'studio-pro');
  await expect(page.getByLabel('Editor theme preset')).toHaveCount(0);

  const appearance = page.getByLabel('Editor theme mode');
  await appearance.selectOption('dark');
  await expect(app).toHaveAttribute('data-theme-mode', 'dark');
  await expect(app).toHaveAttribute('data-editor-preset', 'studio-pro');

  await page.reload();
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-editor-preset', 'studio-pro');
  await expect(page.getByLabel('Editor theme mode')).toHaveValue('dark');
});
