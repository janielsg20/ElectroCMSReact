import { expect, test } from '@playwright/test';

test('editor modules support deep links reload and browser history', async ({ page }) => {
  await page.goto('/editor/content');
  await expect(page).toHaveURL(/\/editor\/content$/);
  await expect(page.getByRole('heading', { name: 'Dynamic Content Studio' })).toBeVisible();

  const modules = page.getByRole('navigation', { name: 'Studio modules' });
  await modules.getByRole('button', { name: 'Forms' }).click();
  await expect(page).toHaveURL(/\/editor\/forms$/);
  await expect(page.getByRole('heading', { name: 'Forms, filters & workflow' })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/editor\/content$/);
  await expect(page.getByRole('heading', { name: 'Dynamic Content Studio' })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/editor\/content$/);
  await expect(page.getByRole('heading', { name: 'Dynamic Content Studio' })).toBeVisible();
});
