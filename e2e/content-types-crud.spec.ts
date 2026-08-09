import { expect, test } from '@playwright/test';

test('content types CRUD persists through the local-first project runtime', async ({ page }) => {
  await page.goto('/editor/content');
  const studio = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await expect(studio.getByLabel('Content Types CRUD enabled')).toBeVisible();

  await studio.getByRole('button', { name: 'New content type' }).click();
  await studio.getByLabel('Content type id').fill('article');
  await studio.getByLabel('Content type slug').fill('articles');
  await studio.getByLabel('Content type label').fill('Articles');
  await studio.getByLabel('Content type singular label').fill('Article');
  await studio.getByLabel('Content type description').fill('Editorial articles');
  await studio.getByRole('button', { name: 'Create content type' }).click();
  await expect(studio.getByText('Content type saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  await expect(page).toHaveURL(/\/editor\/content$/);
  await expect(page.getByRole('button', { name: /Articles article/i })).toBeVisible();
  await page.getByRole('button', { name: /Articles article/i }).click();
  await expect(page.getByLabel('Content type description')).toHaveValue('Editorial articles');

  await page.getByLabel('Content type label').fill('Knowledge Articles');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Content type saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  await expect(page.getByRole('button', { name: /Knowledge Articles article/i })).toBeVisible();
  await page.getByRole('button', { name: /Knowledge Articles article/i }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(page.getByText('Deleted Knowledge Articles.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  await expect(page.getByText('No content types yet')).toBeVisible();
  await expect(page.getByRole('button', { name: /Knowledge Articles article/i })).toHaveCount(0);
});
