import { expect, test, type Page } from '@playwright/test';

async function readPersistedRecord(page: Page, id: string) {
  return page.evaluate(async (recordId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const project = await new Promise<{ records: Record<string, unknown> }>((resolve, reject) => {
        const transaction = database.transaction('projects', 'readonly');
        const request = transaction.objectStore('projects').get('project_local_workspace');
        request.onsuccess = () => resolve(request.result as { records: Record<string, unknown> });
        request.onerror = () => reject(request.error);
      });
      return project.records[recordId] ?? null;
    } finally {
      database.close();
    }
  }, id);
}

async function createProductsContentType(page: Page) {
  await page.getByRole('tab', { name: 'Content Types' }).click();
  await page.getByRole('button', { name: 'New content type' }).click();
  await page.getByLabel('Content type ID').fill('products');
  await page.getByLabel('Content type plural label').fill('Products');
  await page.getByLabel('Content type singular label').fill('Product');
  await page.getByLabel('Content type slug').fill('products');
  await page.getByRole('button', { name: 'Create content type' }).click();
  await expect(page.getByText('Created Products.')).toBeVisible();
}

async function createProductFieldGroup(page: Page) {
  await page.getByRole('tab', { name: 'Field Groups' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Field Groups' });
  await panel.getByRole('button', { name: 'New field group' }).click();
  await panel.getByLabel('Field group ID').fill('product-details');
  await panel.getByLabel('Field group label').fill('Product Details');

  await panel.getByRole('button', { name: 'Add Text field' }).click();
  await panel.getByLabel('Field label').fill('SKU');
  await panel.getByLabel('Field ID').fill('sku');
  await panel.getByLabel('Field name').fill('sku');
  await panel.getByRole('checkbox', { name: 'Required field' }).check();

  await panel.getByRole('button', { name: 'Add Currency field' }).click();
  await panel.getByLabel('Field label').fill('Price');
  await panel.getByLabel('Field ID').fill('price');
  await panel.getByLabel('Field name').fill('price');
  await panel.getByLabel('Field config Min').fill('0');

  await panel.getByRole('button', { name: 'Create field group' }).click();
  await expect(panel.getByText('Created Product Details.')).toBeVisible();
}

test('creates filters persists reloads edits and deletes a canonical record', async ({ page }) => {
  await page.goto('/backend');
  await createProductsContentType(page);
  await createProductFieldGroup(page);

  await page.getByRole('tab', { name: 'Records' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Records' });
  await expect(panel.getByRole('heading', { name: 'Content Records' })).toBeVisible();
  await panel.getByRole('button', { name: 'New record' }).click();

  await expect(panel.getByLabel('Record content type')).toHaveValue('products');
  await expect(panel.getByLabel('Record ID')).toHaveValue('products-record');
  await panel.getByLabel('Record title').fill('Product Alpha');
  await panel.getByLabel('Record slug').fill('product-alpha');
  await panel.getByLabel('Record status').selectOption('published');

  await panel.getByRole('checkbox', { name: /Product Details/ }).check();
  const createButton = panel.getByRole('button', { name: 'Create record' });
  await expect(createButton).toBeDisabled();
  await expect(panel.getByText(/Resolve 1 validation issue/)).toBeVisible();

  await panel.getByLabel('SKU').fill('SKU-001');
  await panel.getByLabel('Price').fill('25');
  await expect(createButton).toBeEnabled();
  await createButton.click();

  await expect(panel.getByText('Created Product Alpha.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedRecord(page, 'products-record')).not.toBeNull();
  await expect.poll(async () => {
    const record = await readPersistedRecord(page, 'products-record') as {
      status?: string;
      title?: string;
      fieldValues?: Record<string, Record<string, unknown>>;
    } | null;
    return record
      ? `${record.status}|${record.title}|${String(record.fieldValues?.['product-details']?.sku)}|${String(record.fieldValues?.['product-details']?.price)}`
      : 'missing';
  }).toBe('published|Product Alpha|SKU-001|25');

  await panel.getByLabel('Search records').fill('alpha');
  await panel.getByLabel('Filter records by status').selectOption('published');
  await expect(panel.getByRole('button', { name: /Product Alpha.*product-alpha.*published/ })).toBeVisible();
  await panel.getByLabel('Search records').fill('missing');
  await expect(panel.getByText('No records match')).toBeVisible();

  await page.reload();
  await page.getByRole('tab', { name: 'Records' }).click();
  const reloadedPanel = page.getByRole('tabpanel', { name: 'Records' });
  await reloadedPanel.getByRole('button', { name: /Product Alpha.*product-alpha.*published/ }).click();
  await expect(reloadedPanel.getByLabel('Record ID')).toBeDisabled();
  await expect(reloadedPanel.getByLabel('Record content type')).toBeDisabled();
  await expect(reloadedPanel.getByLabel('SKU')).toHaveValue('SKU-001');
  await expect(reloadedPanel.getByLabel('Price')).toHaveValue('25');

  await reloadedPanel.getByLabel('Record title').fill('Product Alpha Updated');
  await reloadedPanel.getByLabel('Price').fill('30');
  await reloadedPanel.getByLabel('Record status').selectOption('archived');
  await reloadedPanel.getByRole('button', { name: 'Save changes' }).click();
  await expect(reloadedPanel.getByText('Saved Product Alpha Updated.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => {
    const record = await readPersistedRecord(page, 'products-record') as {
      status?: string;
      title?: string;
      fieldValues?: Record<string, Record<string, unknown>>;
    } | null;
    return record
      ? `${record.status}|${record.title}|${String(record.fieldValues?.['product-details']?.price)}`
      : 'missing';
  }).toBe('archived|Product Alpha Updated|30');

  await reloadedPanel.getByRole('button', { name: 'Delete' }).click();
  await expect(reloadedPanel.getByText('Confirm deletion of Product Alpha Updated.')).toBeVisible();
  await reloadedPanel.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(reloadedPanel.getByText('Deleted Product Alpha Updated.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedRecord(page, 'products-record')).toBeNull();
});
