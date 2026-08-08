import { expect, test } from '@playwright/test';

test('applies and persists an editor-only theme preset independently from project theme mode', async ({ page }) => {
  await page.goto('/editor');

  const preset = page.getByLabel('Editor theme preset');
  await expect(preset).toHaveValue('high-density');
  await preset.selectOption('developer-console');

  const app = page.locator('.electrocms-app');
  await expect(app).toHaveAttribute('data-editor-preset', 'developer-console');

  await page.getByLabel('Editor theme mode').selectOption('dark');
  await expect(app).toHaveAttribute('data-theme-mode', 'dark');
  await expect(app).toHaveAttribute('data-editor-preset', 'developer-console');

  await page.reload();
  await expect(page.getByLabel('Editor theme preset')).toHaveValue('developer-console');
  await expect(page.locator('.electrocms-app')).toHaveAttribute('data-editor-preset', 'developer-console');
  await expect(page.getByLabel('Editor theme mode')).toHaveValue('dark');
});
