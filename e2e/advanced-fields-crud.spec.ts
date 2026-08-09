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

async function studio(page: Page) {
  await page.goto('/editor/content');
  return page.getByRole('region', { name: 'Dynamic Content Studio' });
}

async function createProductsContentType(root: Locator) {
  await root.getByRole('tab', { name: /Content Types/i }).click();
  await root.getByRole('button', { name: 'New content type' }).click();
  await root.getByLabel('Content type id').fill('products');
  await root.getByLabel('Content type slug').fill('products');
  await root.getByLabel('Content type label').fill('Products');
  await root.getByLabel('Content type singular label').fill('Product');
  await root.getByRole('button', { name: 'Create content type' }).click();
  await expect(root.getByText('Content type saved.', { exact: true })).toBeVisible();
}

async function startFieldGroup(root: Locator, id: string, label: string) {
  await root.getByRole('tab', { name: /Field Groups/i }).click();
  await root.getByRole('button', { name: 'New field group' }).click();
  const editor = root.getByLabel('Field group editor');
  await editor.getByLabel('Field group id').fill(id);
  await editor.getByLabel('Field group label').fill(label);
  return editor;
}

async function configureSelectedField(editor: Locator, input: { id: string; name: string; label: string; required?: boolean }) {
  await editor.getByLabel('Field id').fill(input.id);
  await editor.getByLabel('Field storage name').fill(input.name);
  await editor.getByLabel('Field label').fill(input.label);
  if (input.required) await editor.getByLabel('Field required').check();
}

async function createAddressGroup(root: Locator) {
  const editor = await startFieldGroup(root, 'address-fields', 'Address Fields');
  await editor.getByRole('button', { name: 'Add Text field' }).click();
  await configureSelectedField(editor, { id: 'city', name: 'city', label: 'City', required: true });
  await editor.getByRole('button', { name: 'Create field group' }).click();
  await expect(editor.getByRole('status')).toContainText('Field group saved.');
}

async function createLineItemsGroup(root: Locator) {
  const editor = await startFieldGroup(root, 'line-item-fields', 'Line Item Fields');
  await editor.getByRole('button', { name: 'Add Text field' }).click();
  await configureSelectedField(editor, { id: 'item-name', name: 'item_name', label: 'Item name', required: true });
  await editor.getByRole('button', { name: 'Add Number field' }).click();
  await configureSelectedField(editor, { id: 'amount', name: 'amount', label: 'Amount', required: true });
  await editor.getByRole('button', { name: 'Create field group' }).click();
  await expect(editor.getByRole('status')).toContainText('Field group saved.');
}

async function createOrderDataGroup(root: Locator) {
  const editor = await startFieldGroup(root, 'order-data', 'Order Data');

  await editor.getByRole('button', { name: 'Add Number field' }).click();
  await configureSelectedField(editor, { id: 'quantity', name: 'quantity', label: 'Quantity', required: true });

  await editor.getByRole('button', { name: 'Add Currency field' }).click();
  await configureSelectedField(editor, { id: 'unit-price', name: 'unit_price', label: 'Unit price', required: true });

  await editor.getByRole('button', { name: 'Add Switch field' }).click();
  await configureSelectedField(editor, { id: 'show-extra', name: 'show_extra', label: 'Show extra address' });

  await editor.getByRole('button', { name: 'Add Calculated field' }).click();
  await configureSelectedField(editor, { id: 'subtotal', name: 'subtotal', label: 'Subtotal' });
  await editor.getByLabel('Field config Expression').fill('quantity * unit_price');

  await editor.getByRole('button', { name: 'Add Group field' }).click();
  await configureSelectedField(editor, { id: 'shipping-address', name: 'shipping_address', label: 'Shipping address' });
  await editor.getByLabel('Field config Field Group Id').selectOption('address-fields');

  await editor.getByRole('button', { name: 'Add Repeater field' }).click();
  await configureSelectedField(editor, { id: 'items', name: 'items', label: 'Items' });
  await editor.getByLabel('Field config Field Group Id').selectOption('line-item-fields');
  await editor.getByLabel('Field config Min Items').fill('1');
  await editor.getByLabel('Field config Max Items').fill('5');

  await editor.getByRole('button', { name: 'Add Conditional field' }).click();
  await configureSelectedField(editor, { id: 'extra-address', name: 'extra_address', label: 'Extra address' });
  await editor.getByLabel('Field config Field Group Id').selectOption('address-fields');
  await editor.getByLabel('Field config Source Field').selectOption('show_extra');
  await editor.getByLabel('Field config Operator').selectOption('truthy');

  await expect(editor.getByRole('button', { name: 'Create field group' })).toBeEnabled();
  await editor.getByRole('button', { name: 'Create field group' }).click();
  await expect(editor.getByRole('status')).toContainText('Field group saved.');
}

test('authors Group Repeater Calculated and Conditional fields with durable integrity', async ({ page }) => {
  let root = await studio(page);
  await createProductsContentType(root);
  await createAddressGroup(root);
  await createLineItemsGroup(root);
  await createOrderDataGroup(root);

  await root.getByRole('tab', { name: /Records/i }).click();
  const recordEditor = root.getByLabel('Record editor');
  await root.getByRole('button', { name: 'New record' }).click();
  await recordEditor.getByLabel('Record title').fill('Advanced Product');
  await recordEditor.getByLabel('Record slug').fill('advanced-product');
  await recordEditor.getByLabel('Record field group Order Data').check();

  await recordEditor.getByLabel('Quantity').fill('2');
  await recordEditor.getByLabel('Unit price').fill('12.5');
  await expect(recordEditor.getByLabel('Calculated Subtotal')).toContainText('25');

  await expect(recordEditor.getByText('Condition not met')).toBeVisible();
  await expect(recordEditor.getByLabel('City')).toHaveCount(1);
  await recordEditor.getByLabel('City').fill('Houston');

  await recordEditor.getByRole('button', { name: 'Add row' }).click();
  const row = recordEditor.getByRole('region', { name: 'Items row 1' });
  await row.getByLabel('Item name').fill('Needle cartridge');
  await row.getByLabel('Amount').fill('3');

  await recordEditor.getByLabel('Show extra address').check();
  await expect(recordEditor.getByText('Condition not met')).toHaveCount(0);
  await expect(recordEditor.getByLabel('City')).toHaveCount(2);
  await recordEditor.getByLabel('City').nth(1).fill('Austin');

  await expect(recordEditor.getByRole('button', { name: 'Create record' })).toBeEnabled();
  await recordEditor.getByRole('button', { name: 'Create record' }).click();
  await expect(recordEditor.getByText('Record saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await expect.poll(async () => {
    const record = await readPersistedRecord(page, 'products-record') as { fieldValues?: Record<string, Record<string, unknown>> } | null;
    const values = record?.fieldValues?.['order-data'] as {
      subtotal?: number;
      shipping_address?: { city?: string };
      items?: Array<{ item_name?: string; amount?: number }>;
      extra_address?: { city?: string } | null;
    } | undefined;
    return values ? `${values.subtotal}|${values.shipping_address?.city}|${values.items?.length}|${values.items?.[0]?.item_name}|${values.items?.[0]?.amount}|${values.extra_address?.city}` : 'missing';
  }).toBe('25|Houston|1|Needle cartridge|3|Austin');

  await page.reload();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Records/i }).click();
  const reloadedEditor = root.getByLabel('Record editor');
  await root.getByRole('button', { name: /Advanced Product advanced-product draft/i }).click();
  await expect(reloadedEditor.getByLabel('Calculated Subtotal')).toContainText('25');
  await expect(reloadedEditor.getByRole('region', { name: 'Items row 1' }).getByLabel('Item name')).toHaveValue('Needle cartridge');
  await expect(reloadedEditor.getByLabel('City')).toHaveCount(2);
  await expect(reloadedEditor.getByLabel('City').nth(0)).toHaveValue('Houston');
  await expect(reloadedEditor.getByLabel('City').nth(1)).toHaveValue('Austin');

  await reloadedEditor.getByLabel('Show extra address').uncheck();
  await expect(reloadedEditor.getByText('Condition not met')).toBeVisible();
  await reloadedEditor.getByRole('button', { name: 'Save changes' }).click();
  await expect(reloadedEditor.getByText('Record saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => {
    const record = await readPersistedRecord(page, 'products-record') as { fieldValues?: Record<string, Record<string, unknown>> } | null;
    return record?.fieldValues?.['order-data']?.extra_address;
  }).toBeNull();

  await root.getByRole('tab', { name: /Field Groups/i }).click();
  const groupEditor = root.getByLabel('Field group editor');
  await root.getByRole('button').filter({ hasText: 'Address Fields' }).first().click();
  await groupEditor.getByRole('button', { name: 'Add Email field' }).click();
  await configureSelectedField(groupEditor, { id: 'contact-email', name: 'contact_email', label: 'Contact email', required: true });
  await expect(groupEditor.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  await groupEditor.getByRole('button', { name: 'Save changes' }).click();
  await expect(groupEditor.getByRole('alert')).toContainText(/address-fields cannot be updated because record products-record would become invalid/i);

  await page.reload();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Field Groups/i }).click();
  const addressRow = root.getByRole('button').filter({ hasText: 'Address Fields' }).first();
  await expect(addressRow).toContainText('1');

  await root.getByRole('tab', { name: /Records/i }).click();
  const retainedEditor = root.getByLabel('Record editor');
  await root.getByRole('button', { name: /Advanced Product advanced-product draft/i }).click();
  await expect(retainedEditor.getByLabel('Calculated Subtotal')).toContainText('25');
  await expect(retainedEditor.getByLabel('City')).toHaveCount(1);
  await expect(retainedEditor.getByLabel('City')).toHaveValue('Houston');
});
