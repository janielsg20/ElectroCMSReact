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

async function openStudio(page: Page) {
  await page.goto('/editor/content');
  return page.getByRole('region', { name: 'Dynamic Content Studio' });
}

async function createProductsContentType(studio: ReturnType<Page['getByRole']>) {
  await studio.getByRole('tab', { name: /Content Types/i }).click();
  await studio.getByRole('button', { name: 'New content type' }).click();
  await studio.getByLabel('Content type id').fill('products');
  await studio.getByLabel('Content type slug').fill('products');
  await studio.getByLabel('Content type label').fill('Products');
  await studio.getByLabel('Content type singular label').fill('Product');
  await studio.getByRole('button', { name: 'Create content type' }).click();
  await expect(studio.getByText('Content type saved.', { exact: true })).toBeVisible();
}

async function createProductFieldGroup(studio: ReturnType<Page['getByRole']>) {
  await studio.getByRole('tab', { name: /Field Groups/i }).click();
  await studio.getByRole('button', { name: 'New field group' }).click();
  await studio.getByLabel('Field group id').fill('product-details');
  await studio.getByLabel('Field group label').fill('Product Details');

  await studio.getByRole('button', { name: 'Add Text field' }).click();
  await studio.getByLabel('Field id').fill('sku');
  await studio.getByLabel('Field storage name').fill('sku');
  await studio.getByLabel('Field label').fill('SKU');
  await studio.getByLabel('Field required').check();

  await studio.getByRole('button', { name: 'Add Currency field' }).click();
  await studio.getByLabel('Field id').fill('price');
  await studio.getByLabel('Field storage name').fill('price');
  await studio.getByLabel('Field label').fill('Price');
  await studio.getByLabel('Field config Min').fill('0');
  await studio.getByLabel('Field default value').fill('0');

  await studio.getByRole('button', { name: 'Create field group' }).click();
  await expect(studio.getByRole('status')).toContainText('Field group saved.');
}

async function openRecords(studio: ReturnType<Page['getByRole']>) {
  await studio.getByRole('tab', { name: /Records/i }).click();
  await expect(studio.getByLabel('Records CRUD enabled')).toBeVisible();
  return studio.getByLabel('Record editor');
}

test('records CRUD validates schemas and persists through the local-first runtime', async ({ page }) => {
  let studio = await openStudio(page);
  await createProductsContentType(studio);
  await createProductFieldGroup(studio);
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  let recordEditor = await openRecords(studio);
  await studio.getByRole('button', { name: 'New record' }).click();
  await expect(recordEditor.getByLabel('Record content type')).toHaveValue('products');
  await expect(recordEditor.getByLabel('Record ID')).toHaveValue('products-record');
  await recordEditor.getByLabel('Record title').fill('Product Alpha');
  await recordEditor.getByLabel('Record slug').fill('product-alpha');
  await recordEditor.getByLabel('Record status').selectOption('published');

  await recordEditor.getByLabel('Record field group Product Details').check();
  const createButton = recordEditor.getByRole('button', { name: 'Create record' });
  await expect(createButton).toBeDisabled();
  await expect(recordEditor.getByRole('alert')).toContainText('SKU is required.');

  await recordEditor.getByLabel('SKU').fill('SKU-001');
  await recordEditor.getByLabel('Price').fill('25');
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(recordEditor.getByRole('status')).toContainText('Record saved.');
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

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

  await studio.getByLabel('Filter records by status').selectOption('published');
  await studio.getByLabel('Search dynamic content').fill('alpha');
  await expect(studio.getByRole('button', { name: /Product Alpha product-alpha published/i })).toBeVisible();
  await studio.getByLabel('Search dynamic content').fill('missing');
  await expect(studio.getByText('No records match')).toBeVisible();

  await page.reload();
  studio = page.getByRole('region', { name: 'Dynamic Content Studio' });
  recordEditor = await openRecords(studio);
  const persistedRecord = studio.getByRole('button', { name: /Product Alpha product-alpha published/i });
  await expect(persistedRecord).toBeVisible();
  await persistedRecord.click();
  await expect(recordEditor.getByLabel('Record ID')).toBeDisabled();
  await expect(recordEditor.getByLabel('Record content type')).toBeDisabled();
  await expect(recordEditor.getByLabel('SKU')).toHaveValue('SKU-001');
  await expect(recordEditor.getByLabel('Price')).toHaveValue('25');

  await recordEditor.getByLabel('Record title').fill('Product Alpha Updated');
  await recordEditor.getByLabel('Price').fill('30');
  await recordEditor.getByLabel('Record status').selectOption('archived');
  await recordEditor.getByRole('button', { name: 'Save changes' }).click();
  await expect(recordEditor.getByRole('status')).toContainText('Record saved.');
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

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

  await recordEditor.getByRole('button', { name: 'Delete' }).click();
  await recordEditor.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(recordEditor.getByRole('status')).toContainText('Deleted Product Alpha Updated.');
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });
  await expect.poll(async () => readPersistedRecord(page, 'products-record')).toBeNull();

  await page.reload();
  studio = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await openRecords(studio);
  await expect(studio.getByText('No records yet')).toBeVisible();
});
