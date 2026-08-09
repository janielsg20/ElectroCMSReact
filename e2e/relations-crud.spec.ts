import { expect, test, type Locator, type Page } from '@playwright/test';

async function readPersistedProject(page: Page) {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<{ relations: Record<string, unknown>; records: Record<string, unknown>; fieldGroups: Record<string, unknown> }>((resolve, reject) => {
        const transaction = database.transaction('projects', 'readonly');
        const request = transaction.objectStore('projects').get('project_local_workspace');
        request.onsuccess = () => resolve(request.result as { relations: Record<string, unknown>; records: Record<string, unknown>; fieldGroups: Record<string, unknown> });
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  });
}

async function openStudio(page: Page) {
  await page.goto('/editor/content');
  return page.getByRole('region', { name: 'Dynamic Content Studio' });
}

async function createContentType(root: Locator, id: string, label: string, singular: string) {
  await root.getByRole('tab', { name: /Content Types/i }).click();
  await root.getByRole('button', { name: 'New content type' }).click();
  await root.getByLabel('Content type id').fill(id);
  await root.getByLabel('Content type slug').fill(id);
  await root.getByLabel('Content type label').fill(label);
  await root.getByLabel('Content type singular label').fill(singular);
  await root.getByRole('button', { name: 'Create content type' }).click();
  await expect(root.getByText('Content type saved.', { exact: true })).toBeVisible();
}

async function createTaxonomy(root: Locator) {
  await root.getByRole('tab', { name: /Taxonomies/i }).click();
  await root.getByRole('button', { name: 'New taxonomy' }).click();
  await root.getByLabel('Taxonomy id').fill('categories');
  await root.getByLabel('Taxonomy slug').fill('categories');
  await root.getByLabel('Taxonomy label').fill('Categories');
  await root.getByLabel('Taxonomy singular label').fill('Category');
  await root.getByLabel('Target content type Products').check();
  await root.getByRole('button', { name: 'Create taxonomy' }).click();
  await expect(root.getByText('Taxonomy saved.', { exact: true })).toBeVisible();
}

async function createRelation(root: Locator) {
  await root.getByRole('tab', { name: /Relations/i }).click();
  await expect(root.getByLabel('Relations CRUD enabled')).toBeVisible();
  await root.getByRole('button', { name: 'New relation' }).click();
  const editor = root.getByLabel('Relation editor');
  await editor.getByLabel('Relation id').fill('product-brand');
  await editor.getByLabel('Relation label').fill('Product Brand');
  await editor.getByLabel('Relation source content type').selectOption('products');
  await editor.getByLabel('Relation target content type').selectOption('brands');
  await editor.getByLabel('Relation source cardinality').selectOption('one');
  await editor.getByLabel('Relation target cardinality').selectOption('many');
  await editor.getByRole('button', { name: 'Create relation' }).click();
  await expect(editor.getByText('Relation saved.', { exact: true })).toBeVisible();
}

async function configureField(editor: Locator, id: string, name: string, label: string) {
  await editor.getByLabel('Field id').fill(id);
  await editor.getByLabel('Field storage name').fill(name);
  await editor.getByLabel('Field label').fill(label);
}

async function createReferenceFieldGroup(root: Locator) {
  await root.getByRole('tab', { name: /Field Groups/i }).click();
  await root.getByRole('button', { name: 'New field group' }).click();
  const editor = root.getByLabel('Field group editor');
  await editor.getByLabel('Field group id').fill('product-links');
  await editor.getByLabel('Field group label').fill('Product Links');

  await editor.getByRole('button', { name: 'Add Relation field' }).click();
  await configureField(editor, 'brand', 'brand', 'Brand');
  await editor.getByLabel('Field config Relation Id').selectOption('product-brand');
  await editor.getByLabel('Field config Side').selectOption('source');

  await editor.getByRole('button', { name: 'Add Taxonomy field' }).click();
  await configureField(editor, 'categories', 'categories', 'Categories');
  await editor.getByLabel('Field config Taxonomy Id').selectOption('categories');

  await editor.getByRole('button', { name: 'Add User field' }).click();
  await configureField(editor, 'owner', 'owner', 'Owner');

  await expect(editor.getByRole('button', { name: 'Create field group' })).toBeEnabled();
  await editor.getByRole('button', { name: 'Create field group' }).click();
  await expect(editor.getByText('Field group saved.', { exact: true })).toBeVisible();
}

async function createBrandRecord(root: Locator) {
  await root.getByRole('tab', { name: /Records/i }).click();
  await root.getByRole('button', { name: 'New record' }).click();
  const editor = root.getByLabel('Record editor');
  await editor.getByLabel('Record content type').selectOption('brands');
  await editor.getByLabel('Record title').fill('Acme Brand');
  await editor.getByLabel('Record slug').fill('acme-brand');
  await editor.getByRole('button', { name: 'Create record' }).click();
  await expect(editor.getByText('Record saved.', { exact: true })).toBeVisible();
}

async function createProductRecord(root: Locator) {
  await root.getByRole('button', { name: 'New record' }).click();
  const editor = root.getByLabel('Record editor');
  await editor.getByLabel('Record content type').selectOption('products');
  await editor.getByLabel('Record title').fill('Reference Product');
  await editor.getByLabel('Record slug').fill('reference-product');
  await editor.getByLabel('Record field group Product Links').check();
  await editor.getByLabel('Brand').selectOption({ label: /Acme Brand/ });
  await editor.getByLabel('Categories').fill('featured, summer');
  await expect(editor.getByLabel('Owner')).toHaveValue('');
  await editor.getByRole('button', { name: 'Create record' }).click();
  await expect(editor.getByText('Record saved.', { exact: true })).toBeVisible();
}

test('Relations and reference fields persist and protect referenced resources', async ({ page }) => {
  let root = await openStudio(page);
  await createContentType(root, 'products', 'Products', 'Product');
  await createContentType(root, 'brands', 'Brands', 'Brand');
  await createTaxonomy(root);
  await createRelation(root);
  await createReferenceFieldGroup(root);
  await createBrandRecord(root);
  await createProductRecord(root);
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await expect.poll(async () => {
    const project = await readPersistedProject(page);
    const relation = project.relations['product-brand'] as { sourceContentTypeId?: string; targetContentTypeId?: string } | undefined;
    const product = Object.values(project.records).find((raw) => (raw as { slug?: string }).slug === 'reference-product') as { fieldValues?: Record<string, Record<string, unknown>> } | undefined;
    const values = product?.fieldValues?.['product-links'] as { brand?: string[]; categories?: string[]; owner?: unknown } | undefined;
    return `${relation?.sourceContentTypeId}|${relation?.targetContentTypeId}|${values?.brand?.length}|${values?.categories?.join(',')}|${String(values?.owner)}`;
  }).toBe('products|brands|1|featured,summer|null');

  await page.reload();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Records/i }).click();
  const productRow = root.getByRole('button', { name: /Reference Product reference-product draft/i });
  await productRow.click();
  const editor = root.getByLabel('Record editor');
  await expect(editor.getByLabel('Brand')).toHaveValue(/brands-record/);
  await expect(editor.getByLabel('Categories')).toHaveValue('featured, summer');
  await expect(editor.getByLabel('Owner')).toHaveValue('');

  const brandRow = root.getByRole('button', { name: /Acme Brand acme-brand draft/i });
  await brandRow.click();
  await editor.getByRole('button', { name: 'Delete' }).click();
  await editor.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(editor.getByRole('alert')).toContainText(/referenced by relation fields/i);

  await root.getByRole('tab', { name: /Relations/i }).click();
  const relationEditor = root.getByLabel('Relation editor');
  await root.getByRole('button').filter({ hasText: 'Product Brand' }).first().click();
  await relationEditor.getByLabel('Relation source content type').selectOption('brands');
  await relationEditor.getByRole('button', { name: 'Save changes' }).click();
  await expect(relationEditor.getByRole('alert')).toContainText(/cannot be updated/i);

  await relationEditor.getByLabel('Relation source content type').selectOption('products');
  await relationEditor.getByRole('button', { name: 'Delete' }).click();
  await relationEditor.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(relationEditor.getByRole('alert')).toContainText(/referenced by a Field Group/i);

  await root.getByRole('tab', { name: /Taxonomies/i }).click();
  const taxonomyEditor = root.getByLabel('Taxonomy editor');
  await root.getByRole('button').filter({ hasText: 'Categories' }).first().click();
  await taxonomyEditor.getByRole('button', { name: 'Delete' }).click();
  await taxonomyEditor.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(taxonomyEditor.getByRole('alert')).toContainText(/referenced by Field Group product-links/i);

  await root.getByRole('tab', { name: /Content Types/i }).click();
  const contentEditor = root.getByLabel('Content type editor');
  await root.getByRole('button').filter({ hasText: 'Brands' }).first().click();
  await contentEditor.getByRole('button', { name: 'Delete' }).click();
  await contentEditor.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(contentEditor.getByRole('alert')).toContainText(/used by relation product-brand/i);

  await page.reload();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Relations/i }).click();
  await expect(root.getByText('Product Brand', { exact: true })).toBeVisible();
  await root.getByRole('tab', { name: /Records/i }).click();
  await expect(root.getByRole('button', { name: /Acme Brand acme-brand draft/i })).toBeVisible();
  await expect(root.getByRole('button', { name: /Reference Product reference-product draft/i })).toBeVisible();
});
