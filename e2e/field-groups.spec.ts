import { expect, test, type Page } from '@playwright/test';

async function readPersistedFieldGroup(page: Page, id: string) {
  return page.evaluate(async (fieldGroupId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const project = await new Promise<{ fieldGroups: Record<string, unknown> }>((resolve, reject) => {
        const transaction = database.transaction('projects', 'readonly');
        const request = transaction.objectStore('projects').get('project_local_workspace');
        request.onsuccess = () => resolve(request.result as { fieldGroups: Record<string, unknown> });
        request.onerror = () => reject(request.error);
      });
      return project.fieldGroups[fieldGroupId] ?? null;
    } finally {
      database.close();
    }
  }, id);
}

test('creates reorders persists reloads and deletes a custom field group', async ({ page }) => {
  await page.goto('/backend');
  await page.getByRole('tab', { name: 'Field Groups' }).click();

  const panel = page.getByRole('tabpanel', { name: 'Field Groups' });
  await expect(panel.getByRole('heading', { name: 'Custom Field Groups' })).toBeVisible();
  await expect(panel.getByText('No field groups yet')).toBeVisible();

  await panel.getByRole('button', { name: 'New field group' }).click();
  await panel.getByLabel('Field group ID').fill('product-details');
  await panel.getByLabel('Field group label').fill('Product Details');
  await panel.getByLabel('Field group description').fill('Reusable catalog metadata.');
  await panel.getByLabel('Field group presentation').selectOption('tabs');

  await panel.getByRole('button', { name: 'Add Text field' }).click();
  await panel.getByLabel('Field label').fill('SKU');
  await panel.getByLabel('Field ID').fill('sku');
  await panel.getByLabel('Field name').fill('sku');
  await panel.getByLabel('Field placeholder').fill('ABC-123');
  await panel.getByRole('checkbox', { name: 'Required field' }).check();

  await panel.getByRole('button', { name: 'Add Number field' }).click();
  await panel.getByLabel('Field label').fill('Stock');
  await panel.getByLabel('Field ID').fill('stock');
  await panel.getByLabel('Field name').fill('stock');
  await panel.getByLabel('Field config Min').fill('0');
  await panel.getByLabel('Field config Step').fill('1');

  await panel.getByRole('button', { name: 'Move Stock up' }).click();
  const fieldLabels = panel.locator('.field-order-main strong');
  await expect(fieldLabels.nth(0)).toHaveText('Stock');
  await expect(fieldLabels.nth(1)).toHaveText('SKU');

  await panel.getByRole('button', { name: 'Create field group' }).click();
  await expect(panel.getByText('Created Product Details.')).toBeVisible();
  await expect(panel.getByRole('button', { name: /Product Details.*product-details.*Tabs.*2 fields/ })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedFieldGroup(page, 'product-details')).not.toBeNull();

  await expect.poll(async () => {
    const value = await readPersistedFieldGroup(page, 'product-details') as {
      presentation?: string;
      fields?: Array<{ id?: string; required?: boolean }>;
    } | null;
    return value
      ? `${value.presentation}|${value.fields?.map((field) => field.id).join(',')}|${String(value.fields?.[1]?.required)}`
      : 'missing';
  }).toBe('tabs|stock,sku|true');

  await page.reload();
  await page.getByRole('tab', { name: 'Field Groups' }).click();
  const reloadedPanel = page.getByRole('tabpanel', { name: 'Field Groups' });
  await reloadedPanel.getByRole('button', { name: /Product Details.*product-details.*Tabs.*2 fields/ }).click();
  await expect(reloadedPanel.getByLabel('Field group ID')).toHaveValue('product-details');
  await expect(reloadedPanel.locator('.field-order-main strong').nth(0)).toHaveText('Stock');
  await expect(reloadedPanel.locator('.field-order-main strong').nth(1)).toHaveText('SKU');

  await reloadedPanel.getByLabel('Field group label').fill('Product Metadata');
  await reloadedPanel.getByRole('button', { name: 'Save changes' }).click();
  await expect(reloadedPanel.getByText('Saved Product Metadata.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await reloadedPanel.getByRole('button', { name: 'Delete' }).click();
  await expect(reloadedPanel.getByText('Confirm deletion of Product Metadata.')).toBeVisible();
  await reloadedPanel.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(reloadedPanel.getByText('Deleted Product Metadata.')).toBeVisible();
  await expect(reloadedPanel.getByText('No field groups yet')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedFieldGroup(page, 'product-details')).toBeNull();
});
