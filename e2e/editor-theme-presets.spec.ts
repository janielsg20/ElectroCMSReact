import { expect, test } from '@playwright/test';

test('uses one Bento High Density editor theme while appearance mode remains persistent', async ({ page }) => {
  await page.goto('/editor');

  const app = page.locator('.electrocms-app');
  await expect(app).toHaveAttribute('data-editor-preset', 'bento-high-density');
  await expect(page.getByLabel('Editor theme preset')).toHaveCount(0);

  const appearance = page.getByLabel('Editor theme mode');
  await appearance.selectOption('dark');
  await expect(app).toHaveAttribute('data-theme-mode', 'dark');
  await expect(app).toHaveAttribute('data-editor-preset', 'bento-high-density');

  await page.reload();
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-editor-preset', 'bento-high-density');
  await expect(page.getByLabel('Editor theme mode')).toHaveValue('dark');
});
