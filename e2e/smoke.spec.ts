import { expect, test } from '@playwright/test';

test('editor shell loads into the last workspace route', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.getByRole('heading', { name: 'Editor workspace' })).toBeVisible();
  await expect(page.getByText('Local', { exact: true })).toBeVisible();
});
