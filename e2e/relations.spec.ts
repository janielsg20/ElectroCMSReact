import { expect, test, type Page } from '@playwright/test';

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

async function createContentType(
  page: Page,
  input: { id: string; plural: string; singular: string; slug: string },
) {
  await page.getByRole('tab', { name: 'Content Types' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Content Types' });
  await panel.getByRole('button', { name: 'New content type' }).click();
  await panel.getByLabel('Content type ID').fill(input.id);
  await panel.getByLabel('Content type plural label').fill(input.plural);
  await panel.getByLabel('Content type singular label').fill(input.singular);
  await panel.getByLabel('Content type slug').fill(input.slug);
  await panel.getByRole('button', { name: 'Create content type' }).click();
  await expect(panel.getByText(`Created ${input.plural}.`)).toBeVisible();
}

async function createProductBrandRelation(page: Page) {
  await page.getByRole('tab', { name: 'Relations' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Relations' });
  await panel.getByRole('button', { name: 'New relation' }).click();
  await panel.getByLabel('Relation ID').fill('product-brand');
  await panel.getByLabel('Relation label').fill('Product brand');
  await panel.getByLabel('Relation source content type').selectOption('products');
  await panel.getByLabel('Relation source cardinality').selectOption('one');
  await panel.getByLabel('Relation target content type').selectOption('brands');
  await panel.getByLabel('Relation target cardinality').selectOption('many');
  await panel.getByRole('button', { name: 'Create relation' }).click();
  await expect(panel.getByText('Created Product brand.')).toBeVisible();
}

async function createProductRelationFieldGroup(page: Page) {
  await page.getByRole('tab', { name: 'Field Groups' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Field Groups' });
  await panel.getByRole('button', { name: 'New field group' }).click();
  await panel.getByLabel('Field group ID').fill('product-relations');
  await panel.getByLabel('Field group label').fill('Product Relations');
  await panel.getByRole('button', { name: 'Add Relation field' }).click();
  await panel.getByLabel('Field label').fill('Brand');
  await panel.getByLabel('Field ID').fill('brand');
  await panel.getByLabel('Field name').fill('brand');
  await panel.getByLabel('Field config Relation Id').fill('product-brand');
  await panel.getByLabel('Field config Side').fill('source');
  await expect(panel.getByRole('button', { name: 'Create field group' })).toBeEnabled();
  await panel.getByRole('button', { name: 'Create field group' }).click();
  await expect(panel.getByText('Created Product Relations.')).toBeVisible();
}

async function createRecord(
  page: Page,
  input: {
    id: string;
    contentTypeId: string;
    title: string;
    slug: string;
    relationBrandId?: string;
  },
) {
  await page.getByRole('tab', { name: 'Records' }).click();
  const panel = page.getByRole('tabpanel', { name: 'Records' });
  await panel.getByRole('button', { name: 'New record' }).click();
  await panel.getByLabel('Record content type').selectOption(input.contentTypeId);
  await panel.getByLabel('Record ID').fill(input.id);
  await panel.getByLabel('Record title').fill(input.title);
  await panel.getByLabel('Record slug').fill(input.slug);

  if (input.relationBrandId) {
    await panel.getByRole('checkbox', { name: /Product Relations/ }).check();
    await panel.getByLabel('Brand').selectOption(input.relationBrandId);
  }

  await expect(panel.getByRole('button', { name: 'Create record' })).toBeEnabled();
  await panel.getByRole('button', { name: 'Create record' }).click();
  await expect(panel.getByText(`Created ${input.title}.`)).toBeVisible();
}

test('authors persists and protects canonical relations and record references', async ({ page }) => {
  await page.goto('/backend');
  await createContentType(page, { id: 'products', plural: 'Products', singular: 'Product', slug: 'products' });
  await createContentType(page, { id: 'brands', plural: 'Brands', singular: 'Brand', slug: 'brands' });
  await createProductBrandRelation(page);
  await createProductRelationFieldGroup(page);
  await createRecord(page, {
    id: 'brands-record',
    contentTypeId: 'brands',
    title: 'Nike',
    slug: 'nike',
  });
  await createRecord(page, {
    id: 'products-record',
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
  await page.getByRole('tab', { name: 'Records' }).click();
  const records = page.getByRole('tabpanel', { name: 'Records' });
  await records.getByRole('button', { name: /Shoe.*shoe.*Product.*draft/ }).click();
  await expect(records.getByLabel('Brand')).toHaveValue('brands-record');

  // Referenced Records cannot be removed while another Record keeps a relation-field reference.
  await records.getByRole('button', { name: /Nike.*nike.*Brand.*draft/ }).click();
  await records.getByRole('button', { name: 'Delete' }).click();
  await records.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(records.getByText(/brands-record is referenced by relation fields in record products-record/i)).toBeVisible();
  await expect.poll(async () => (await readPersistedReferenceState(page)).brandExists).toBe(true);

  // A relation update that would invalidate an existing Record is rejected atomically.
  await page.getByRole('tab', { name: 'Relations' }).click();
  const relations = page.getByRole('tabpanel', { name: 'Relations' });
  await relations.getByRole('button', { name: /Product brand.*product-brand/ }).click();
  await relations.getByLabel('Relation target content type').selectOption('products');
  await relations.getByRole('button', { name: 'Save changes' }).click();
  await expect(relations.getByText(/product-brand cannot be updated because record products-record would become invalid/i)).toBeVisible();

  // Relation deletion is independently protected while a Field Group references its id.
  await relations.getByLabel('Relation target content type').selectOption('brands');
  await relations.getByRole('button', { name: 'Delete' }).click();
  await relations.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(relations.getByText(/product-brand is referenced by a Field Group and cannot be deleted/i)).toBeVisible();

  await page.reload();
  await page.getByRole('tab', { name: 'Relations' }).click();
  const reloadedRelations = page.getByRole('tabpanel', { name: 'Relations' });
  await reloadedRelations.getByRole('button', { name: /Product brand.*product-brand/ }).click();
  await expect(reloadedRelations.getByLabel('Relation source content type')).toHaveValue('products');
  await expect(reloadedRelations.getByLabel('Relation target content type')).toHaveValue('brands');

  await page.getByRole('tab', { name: 'Records' }).click();
  const reloadedRecords = page.getByRole('tabpanel', { name: 'Records' });
  await reloadedRecords.getByRole('button', { name: /Shoe.*shoe.*Product.*draft/ }).click();
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
