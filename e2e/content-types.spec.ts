import { expect, test } from '@playwright/test';

test('creates edits persists and deletes a canonical content type from Backend', async ({ page }) => {
  await page.goto('/backend');

  await expect(page.getByRole('heading', { name: 'Content Types' })).toBeVisible();
  await expect(page.getByText('No content types yet')).toBeVisible();

  await page.getByRole('button', { name: 'New content type' }).click();
  await page.getByLabel('Content type ID').fill('products');
  await page.getByLabel('Content type plural label').fill('Products');
  await page.getByLabel('Content type singular label').fill('Product');
  await page.getByLabel('Content type slug').fill('products');
  await page.getByLabel('Content type description').fill('Reusable catalog products for dynamic pages.');
  await page.getByRole('checkbox', { name: /Featured image/ }).check();

  const createButton = page.getByRole('button', { name: 'Create content type' });
  await expect(createButton).toBeEnabled();
  await createButton.click();

  await expect(page.getByText('Created Products.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Products.*products.*Public.*0 records/ })).toBeVisible();
  await expect(page.getByLabel('Content type ID')).toBeDisabled();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await page.getByRole('button', { name: /Products.*products.*Public.*0 records/ }).click();
  await expect(page.getByLabel('Content type ID')).toHaveValue('products');
  await expect(page.getByLabel('Content type slug')).toHaveValue('products');
  await expect(page.getByRole('checkbox', { name: /Featured image/ })).toBeChecked();

  await page.getByLabel('Content type plural label').fill('Catalog Products');
  await page.getByRole('checkbox', { name: /Public/ }).uncheck();
  await page.getByLabel('Content type slug').fill('Bad Slug');
  await expect(page.getByText(/Slug must be lowercase kebab-case/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  await page.getByLabel('Content type slug').fill('catalog-products');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Saved Catalog Products.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await page.getByRole('button', { name: /Catalog Products.*catalog-products.*Private.*0 records/ }).click();
  await expect(page.getByLabel('Content type plural label')).toHaveValue('Catalog Products');
  await expect(page.getByLabel('Content type slug')).toHaveValue('catalog-products');
  await expect(page.getByRole('checkbox', { name: /Public/ })).not.toBeChecked();

  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText(/Confirm deletion of Catalog Products/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(page.getByText('Deleted Catalog Products.')).toBeVisible();
  await expect(page.getByText('No content types yet')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByText('No content types yet')).toBeVisible();
});
