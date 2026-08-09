import { expect, test, type Locator, type Page } from '@playwright/test';

interface PersistedReferenceState {
  relation: {
    sourceContentTypeId?: string;
    targetContentTypeId?: string;
    sourceCardinality?: string;
    targetCardinality?: string;
  } | null;
  productBrandIds: string[] | null;
  brandExists: boolean;
}

async function readPersistedReferenceState(page: Page): Promise<PersistedReferenceState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const project = await new Promise<{
        relations: Record<string, unknown>;
        records: Record<string, unknown>;
      }>((resolve, reject) => {
        const transaction = database.transaction('projects', 'readonly');
        const request = transaction.objectStore('projects').get('project_local_workspace');
        request.onsuccess = () => resolve(request.result as {
          relations: Record<string, unknown>;
          records: Record<string, unknown>;
        });
        request.onerror = () => reject(request.error);
      });

      const relation = project.relations['product-brand'];
      const product = project.records['products-record'] as {
        fieldValues?: Record<string, Record<string, unknown>>;
      } | undefined;
      const rawBrandIds = product?.fieldValues?.['product-relations']?.brand;
      return {
        relation: relation && typeof relation === 'object'
          ? relation as PersistedReferenceState['relation']
          : null,
        productBrandIds: Array.isArray(rawBrandIds)
          ? rawBrandIds.filter((value): value is string => typeof value === 'string')
          : null,
        brandExists: Boolean(project.records['brands-record']),
      };
    } finally {
      database.close();
    }
  });
}

async function studio(page: Page): Promise<Locator> {
  await page.goto('/editor/content');
  return page.getByRole('region', { name: 'Dynamic Content Studio' });
}

async function createContentType(
  root: Locator,
  input: { id: string; plural: string; singular: string; slug: string },
) {
  await root.getByRole('tab', { name: /Content Types/i }).click();
  await root.getByRole('button', { name: 'New content type' }).click();
  const editor = root.getByLabel('Content type editor');
  await editor.getByLabel('Content type id').fill(input.id);
  await editor.getByLabel('Content type slug').fill(input.slug);
  await editor.getByLabel('Content type label').fill(input.plural);
  await editor.getByLabel('Content type singular label').fill(input.singular);
  await editor.getByRole('button', { name: 'Create content type' }).click();
  await expect(editor.getByText('Content type saved.', { exact: true })).toBeVisible();
}

async function createProductBrandRelation(root: Locator) {
  await root.getByRole('tab', { name: /Relations/i }).click();
  await expect(root.getByLabel('Relations CRUD enabled')).toBeVisible();
  await root.getByRole('button', { name: 'New relation' }).click();
  const editor = root.getByLabel('Relation editor');
  await editor.getByLabel('Relation ID').fill('product-brand');
  await editor.getByLabel('Relation label').fill('Product brand');
  await editor.getByLabel('Relation source content type').selectOption('products');
  await editor.getByLabel('Relation source cardinality').selectOption('one');
  await editor.getByLabel('Relation target content type').selectOption('brands');
  await editor.getByLabel('Relation target cardinality').selectOption('many');
  await editor.getByRole('button', { name: 'Create relation' }).click();
  await expect(editor.getByRole('status')).toContainText('Relation created.');
}

async function createProductRelationFieldGroup(root: Locator) {
  await root.getByRole('tab', { name: /Field Groups/i }).click();
  await root.getByRole('button', { name: 'New field group' }).click();
  const editor = root.getByLabel('Field group editor');
  await editor.getByLabel('Field group id').fill('product-relations');
  await editor.getByLabel('Field group label').fill('Product Relations');
  await editor.getByRole('button', { name: 'Add Relation field' }).click();
  await editor.getByLabel('Field id').fill('brand');
  await editor.getByLabel('Field storage name').fill('brand');
  await editor.getByLabel('Field label').fill('Brand');
  await editor.getByLabel('Field config Relation Id').selectOption('product-brand');
  await editor.getByLabel('Field config Side').selectOption('source');
  await expect(editor.getByRole('button', { name: 'Create field group' })).toBeEnabled();
  await editor.getByRole('button', { name: 'Create field group' }).click();
  await expect(editor.getByRole('status')).toContainText('Field group saved.');
}

async function createRecord(
  root: Locator,
  input: {
    contentTypeId: string;
    title: string;
    slug: string;
    relationBrandId?: string;
  },
) {
  await root.getByRole('tab', { name: /Records/i }).click();
  await root.getByRole('button', { name: 'New record' }).click();
  const editor = root.getByLabel('Record editor');
  await editor.getByLabel('Record content type').selectOption(input.contentTypeId);
  await editor.getByLabel('Record title').fill(input.title);
  await editor.getByLabel('Record slug').fill(input.slug);

  if (input.relationBrandId) {
    await editor.getByLabel('Record field group Product Relations').check();
    await editor.getByLabel('Brand').selectOption(input.relationBrandId);
  }

  await expect(editor.getByRole('button', { name: 'Create record' })).toBeEnabled();
  await editor.getByRole('button', { name: 'Create record' }).click();
  await expect(editor.getByText('Record saved.', { exact: true })).toBeVisible();
}

test('authors persists and protects canonical relations and record references', async ({ page }) => {
  let root = await studio(page);
  await createContentType(root, { id: 'products', plural: 'Products', singular: 'Product', slug: 'products' });
  await createContentType(root, { id: 'brands', plural: 'Brands', singular: 'Brand', slug: 'brands' });
  await createProductBrandRelation(root);
  await createProductRelationFieldGroup(root);
  await createRecord(root, { contentTypeId: 'brands', title: 'Nike', slug: 'nike' });
  await createRecord(root, {
    contentTypeId: 'products',
    title: 'Shoe',
    slug: 'shoe',
    relationBrandId: 'brands-record',
  });

  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedReferenceState(page)).toMatchObject({
    relation: {
      sourceContentTypeId: 'products',
      targetContentTypeId: 'brands',
      sourceCardinality: 'one',
      targetCardinality: 'many',
    },
    productBrandIds: ['brands-record'],
    brandExists: true,
  });

  await page.reload();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Records/i }).click();
  const records = root.getByLabel('Record editor');
  await root.getByRole('button', { name: /Shoe shoe draft/i }).click();
  await expect(records.getByLabel('Brand')).toHaveValue('brands-record');

  await root.getByRole('button', { name: /Nike nike draft/i }).click();
  await records.getByRole('button', { name: 'Delete' }).click();
  await records.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(records.getByRole('alert')).toContainText(/brands-record is referenced by relation fields in record products-record/i);
  await expect.poll(async () => (await readPersistedReferenceState(page)).brandExists).toBe(true);

  await root.getByRole('tab', { name: /Relations/i }).click();
  const relations = root.getByLabel('Relation editor');
  await root.getByRole('button', { name: /Product brand product-brand products brands/i }).click();
  await relations.getByLabel('Relation target content type').selectOption('products');
  await relations.getByRole('button', { name: 'Save changes' }).click();
  await expect(relations.getByRole('alert')).toContainText(/product-brand cannot be updated because record products-record would become invalid/i);

  await relations.getByLabel('Relation target content type').selectOption('brands');
  await relations.getByRole('button', { name: 'Delete' }).click();
  await relations.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(relations.getByRole('alert')).toContainText(/product-brand is referenced by a Field Group and cannot be deleted/i);

  await page.reload();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Relations/i }).click();
  const reloadedRelations = root.getByLabel('Relation editor');
  await root.getByRole('button', { name: /Product brand product-brand products brands/i }).click();
  await expect(reloadedRelations.getByLabel('Relation source content type')).toHaveValue('products');
  await expect(reloadedRelations.getByLabel('Relation target content type')).toHaveValue('brands');

  await root.getByRole('tab', { name: /Records/i }).click();
  const reloadedRecords = root.getByLabel('Record editor');
  await root.getByRole('button', { name: /Shoe shoe draft/i }).click();
  await expect(reloadedRecords.getByLabel('Brand')).toHaveValue('brands-record');
  await expect.poll(async () => readPersistedReferenceState(page)).toMatchObject({
    relation: {
      sourceContentTypeId: 'products',
      targetContentTypeId: 'brands',
    },
    productBrandIds: ['brands-record'],
    brandExists: true,
  });
});
