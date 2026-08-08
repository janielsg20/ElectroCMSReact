import { expect, test, type Locator, type Page } from '@playwright/test';

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

async function createProductsCpt(page: Page) {
  await page.getByRole('tab', { name: 'Content Types' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Content Types' });
  await panel.getByRole('button', { name: 'New content type' }).click();
  await panel.getByLabel('Content type ID').fill('products');
  await panel.getByLabel('Content type plural label').fill('Products');
  await panel.getByLabel('Content type singular label').fill('Product');
  await panel.getByLabel('Content type slug').fill('products');
  await panel.getByRole('button', { name: 'Create content type' }).click();
  await expect(panel.getByText('Created Products.')).toBeVisible();
}

async function openNewFieldGroup(page: Page, id: string, label: string): Promise<Locator> {
  await page.getByRole('tab', { name: 'Field Groups' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Field Groups' });
  await panel.getByRole('button', { name: 'New field group' }).click();
  await panel.getByLabel('Field group ID').fill(id);
  await panel.getByLabel('Field group label').fill(label);
  return panel;
}

async function configureSelectedField(
  panel: Locator,
  input: { label: string; id: string; name: string; required?: boolean },
) {
  await panel.getByLabel('Field label').fill(input.label);
  await panel.getByLabel('Field ID').fill(input.id);
  await panel.getByLabel('Field name').fill(input.name);
  if (input.required) await panel.getByRole('checkbox', { name: 'Required field' }).check();
}

async function createAddressGroup(page: Page) {
  const panel = await openNewFieldGroup(page, 'address-fields', 'Address Fields');
  await panel.getByRole('button', { name: 'Add Text field' }).click();
  await configureSelectedField(panel, { label: 'City', id: 'city', name: 'city', required: true });
  await panel.getByRole('button', { name: 'Create field group' }).click();
  await expect(panel.getByText('Created Address Fields.')).toBeVisible();
}

async function createLineItemGroup(page: Page) {
  const panel = await openNewFieldGroup(page, 'line-item-fields', 'Line Item Fields');
  await panel.getByRole('button', { name: 'Add Text field' }).click();
  await configureSelectedField(panel, { label: 'Item name', id: 'item-name', name: 'item_name', required: true });
  await panel.getByRole('button', { name: 'Add Number field' }).click();
  await configureSelectedField(panel, { label: 'Amount', id: 'amount', name: 'amount', required: true });
  await panel.getByRole('button', { name: 'Create field group' }).click();
  await expect(panel.getByText('Created Line Item Fields.')).toBeVisible();
}

async function createOrderDataGroup(page: Page) {
  const panel = await openNewFieldGroup(page, 'order-data', 'Order Data');

  await panel.getByRole('button', { name: 'Add Number field' }).click();
  await configureSelectedField(panel, { label: 'Quantity', id: 'quantity', name: 'quantity', required: true });

  await panel.getByRole('button', { name: 'Add Currency field' }).click();
  await configureSelectedField(panel, { label: 'Unit price', id: 'unit-price', name: 'unit_price', required: true });

  await panel.getByRole('button', { name: 'Add Switch field' }).click();
  await configureSelectedField(panel, { label: 'Show extra address', id: 'show-extra', name: 'show_extra' });

  await panel.getByRole('button', { name: 'Add Calculated field' }).click();
  await configureSelectedField(panel, { label: 'Subtotal', id: 'subtotal', name: 'subtotal' });
  await panel.getByLabel('Field config Expression').fill('quantity * unit_price');

  await panel.getByRole('button', { name: 'Add Group field' }).click();
  await configureSelectedField(panel, { label: 'Shipping address', id: 'shipping-address', name: 'shipping_address' });
  await panel.getByLabel('Field config Field Group Id').selectOption('address-fields');

  await panel.getByRole('button', { name: 'Add Repeater field' }).click();
  await configureSelectedField(panel, { label: 'Items', id: 'items', name: 'items' });
  await panel.getByLabel('Field config Field Group Id').selectOption('line-item-fields');
  await panel.getByLabel('Field config Min Items').fill('1');
  await panel.getByLabel('Field config Max Items').fill('5');

  await panel.getByRole('button', { name: 'Add Conditional field' }).click();
  await configureSelectedField(panel, { label: 'Extra address', id: 'extra-address', name: 'extra_address' });
  await panel.getByLabel('Field config Field Group Id').selectOption('address-fields');
  await panel.getByLabel('Field config Source Field').selectOption('show_extra');
  await panel.getByLabel('Field config Operator').selectOption('truthy');

  await expect(panel.getByRole('button', { name: 'Create field group' })).toBeEnabled();
  await panel.getByRole('button', { name: 'Create field group' }).click();
  await expect(panel.getByText('Created Order Data.')).toBeVisible();
}

test('authors and persists Group Repeater Calculated and Conditional fields', async ({ page }) => {
  await page.goto('/backend');
  await createProductsCpt(page);
  await createAddressGroup(page);
  await createLineItemGroup(page);
  await createOrderDataGroup(page);

  await page.getByRole('tab', { name: 'Records' }).click();
  const records = page.getByRole('tabpanel', { name: 'Records' });
  await records.getByRole('button', { name: 'New record' }).click();
  await records.getByLabel('Record title').fill('Advanced Product');
  await records.getByLabel('Record slug').fill('advanced-product');
  await records.getByRole('checkbox', { name: /Order Data/ }).check();

  await records.getByLabel('Quantity').fill('2');
  await records.getByLabel('Unit price').fill('12.5');
  await expect(records.locator('.advanced-record-calculated strong')).toHaveText('25');

  await expect(records.getByText('Condition not met')).toBeVisible();
  await expect(records.getByLabel('City')).toHaveCount(1);
  await records.getByLabel('City').fill('Houston');

  await records.getByRole('button', { name: 'Add row' }).click();
  const row = records.getByRole('region', { name: 'Items row 1' });
  await row.getByLabel('Item name').fill('Needle cartridge');
  await row.getByLabel('Amount').fill('3');

  await records.getByLabel('Show extra address').check();
  await expect(records.getByText('Condition not met')).toHaveCount(0);
  await expect(records.getByLabel('City')).toHaveCount(2);
  await records.getByLabel('City').nth(1).fill('Austin');

  await expect(records.getByRole('button', { name: 'Create record' })).toBeEnabled();
  await records.getByRole('button', { name: 'Create record' }).click();
  await expect(records.getByText('Created Advanced Product.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await expect.poll(async () => {
    const record = await readPersistedRecord(page, 'products-record') as {
      fieldValues?: Record<string, Record<string, unknown>>;
    } | null;
    const values = record?.fieldValues?.['order-data'] as {
      subtotal?: number;
      shipping_address?: { city?: string };
      items?: Array<{ item_name?: string; amount?: number }>;
      extra_address?: { city?: string } | null;
    } | undefined;
    return values
      ? `${values.subtotal}|${values.shipping_address?.city}|${values.items?.length}|${values.items?.[0]?.item_name}|${values.items?.[0]?.amount}|${values.extra_address?.city}`
      : 'missing';
  }).toBe('25|Houston|1|Needle cartridge|3|Austin');

  await page.reload();
  await page.getByRole('tab', { name: 'Records' }).click();
  const reloaded = page.getByRole('tabpanel', { name: 'Records' });
  await reloaded.getByRole('button', { name: /Advanced Product.*advanced-product.*Product.*draft/ }).click();
  await expect(reloaded.locator('.advanced-record-calculated strong')).toHaveText('25');
  await expect(reloaded.getByRole('region', { name: 'Items row 1' }).getByLabel('Item name')).toHaveValue('Needle cartridge');
  await expect(reloaded.getByLabel('City')).toHaveCount(2);
  await expect(reloaded.getByLabel('City').nth(0)).toHaveValue('Houston');
  await expect(reloaded.getByLabel('City').nth(1)).toHaveValue('Austin');

  await reloaded.getByLabel('Show extra address').uncheck();
  await expect(reloaded.getByText('Condition not met')).toBeVisible();
  await reloaded.getByRole('button', { name: 'Save changes' }).click();
  await expect(reloaded.getByText('Saved Advanced Product.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => {
    const record = await readPersistedRecord(page, 'products-record') as {
      fieldValues?: Record<string, Record<string, unknown>>;
    } | null;
    return record?.fieldValues?.['order-data']?.extra_address ?? 'missing';
  }).toBeNull();

  // A child Field Group update that would invalidate the existing nested Record must be rejected.
  await page.getByRole('tab', { name: 'Field Groups' }).click();
  const groups = page.getByRole('tabpanel', { name: 'Field Groups' });
  await groups.getByRole('button', { name: /Address Fields.*address-fields.*1 field/ }).click();
  await groups.getByRole('button', { name: 'Add Email field' }).click();
  await configureSelectedField(groups, {
    label: 'Contact email',
    id: 'contact-email',
    name: 'contact_email',
    required: true,
  });
  await expect(groups.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  await groups.getByRole('button', { name: 'Save changes' }).click();
  await expect(groups.getByText(/address-fields cannot be updated because record products-record would become invalid/i)).toBeVisible();

  // Reload proves the rejected schema was never persisted and the original Record remains accessible.
  await page.reload();
  await page.getByRole('tab', { name: 'Field Groups' }).click();
  const groupsReloaded = page.getByRole('tabpanel', { name: 'Field Groups' });
  await expect(groupsReloaded.getByRole('button', { name: /Address Fields.*address-fields.*1 field/ })).toBeVisible();

  await page.getByRole('tab', { name: 'Records' }).click();
  const retainedRecords = page.getByRole('tabpanel', { name: 'Records' });
  await retainedRecords.getByRole('button', { name: /Advanced Product.*advanced-product.*Product.*draft/ }).click();
  await expect(retainedRecords.locator('.advanced-record-calculated strong')).toHaveText('25');
  await expect(retainedRecords.getByLabel('City')).toHaveCount(1);
  await expect(retainedRecords.getByLabel('City')).toHaveValue('Houston');
});
