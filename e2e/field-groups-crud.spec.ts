import { expect, test } from '@playwright/test';

async function openFieldGroups(page: import('@playwright/test').Page) {
  const studio = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await studio.getByRole('tab', { name: /Field Groups/i }).click();
  await expect(studio.getByLabel('Field Groups CRUD enabled')).toBeVisible();
  return studio;
}

test('field groups CRUD and ordered registry fields persist through the local-first runtime', async ({ page }) => {
  await page.goto('/editor/content');
  let studio = await openFieldGroups(page);

  await studio.getByRole('button', { name: 'New field group' }).click();
  await studio.getByLabel('Field group id').fill('product-details');
  await studio.getByLabel('Field group label').fill('Product details');
  await studio.getByLabel('Field group description').fill('Portable product schema');

  await studio.getByRole('button', { name: 'Add Text field' }).click();
  await studio.getByLabel('Field id').fill('sku');
  await studio.getByLabel('Field storage name').fill('sku');
  await studio.getByLabel('Field label').fill('SKU');
  await studio.getByLabel('Field placeholder').fill('SKU-001');
  await studio.getByLabel('Field required').check();

  await studio.getByRole('button', { name: 'Add Currency field' }).click();
  await studio.getByLabel('Field id').fill('price');
  await studio.getByLabel('Field storage name').fill('price');
  await studio.getByLabel('Field label').fill('Price');
  await studio.getByLabel('Field config Min').fill('0');
  await studio.getByLabel('Field default value').fill('19.99');
  await studio.getByRole('button', { name: 'Move Price up' }).click();

  await studio.getByRole('button', { name: 'Create field group' }).click();
  await expect(studio.getByRole('status')).toContainText('Field group saved.');
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  studio = await openFieldGroups(page);
  const productDetails = studio.getByRole('button', { name: /Product details.*product-details/i });
  await expect(productDetails).toBeVisible();
  await productDetails.click();

  await expect(studio.getByLabel('Field group description')).toHaveValue('Portable product schema');
  await expect(studio.getByLabel('Field label')).toHaveValue('Price');
  await expect(studio.getByLabel('Field storage name')).toHaveValue('price');
  await expect(studio.getByLabel('Field config Currency')).toHaveValue('USD');
  await expect(studio.getByLabel('Field default value')).toHaveValue('19.99');

  await studio.getByLabel('Field group label').fill('Product schema');
  await studio.getByLabel('Field group presentation').selectOption('tabs');
  await studio.getByRole('button', { name: 'Save changes' }).click();
  await expect(studio.getByRole('status')).toContainText('Field group saved.');
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  studio = await openFieldGroups(page);
  const productSchema = studio.getByRole('button', { name: /Product schema.*product-details/i });
  await expect(productSchema).toBeVisible();
  await productSchema.click();
  await expect(studio.getByLabel('Field group presentation')).toHaveValue('tabs');

  await studio.getByRole('button', { name: 'Delete' }).click();
  await studio.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(studio.getByRole('status')).toContainText('Deleted Product schema.');
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  studio = await openFieldGroups(page);
  await expect(studio.getByText('No field groups yet')).toBeVisible();
  await expect(studio.getByRole('button', { name: /Product schema.*product-details/i })).toHaveCount(0);
});
