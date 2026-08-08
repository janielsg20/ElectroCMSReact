import { expect, test, type Page } from '@playwright/test';

async function createContentType(
  page: Page,
  input: { id: string; plural: string; singular: string; slug: string },
) {
  await page.getByRole('button', { name: 'New content type' }).click();
  await page.getByLabel('Content type ID').fill(input.id);
  await page.getByLabel('Content type plural label').fill(input.plural);
  await page.getByLabel('Content type singular label').fill(input.singular);
  await page.getByLabel('Content type slug').fill(input.slug);
  await page.getByRole('button', { name: 'Create content type' }).click();
  await expect(page.getByText(`Created ${input.plural}.`)).toBeVisible();
}

async function readPersistedTaxonomy(page: Page, id: string) {
  return page.evaluate(async (taxonomyId) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const project = await new Promise<{ taxonomies: Record<string, unknown> }>((resolve, reject) => {
        const transaction = database.transaction('projects', 'readonly');
        const request = transaction.objectStore('projects').get('project_local_workspace');
        request.onsuccess = () => resolve(request.result as { taxonomies: Record<string, unknown> });
        request.onerror = () => reject(request.error);
      });
      return project.taxonomies[taxonomyId] ?? null;
    } finally {
      database.close();
    }
  }, id);
}

test('creates a multi-CPT taxonomy, persists hierarchy changes and deletes it', async ({ page }) => {
  await page.goto('/backend');

  await createContentType(page, {
    id: 'products',
    plural: 'Products',
    singular: 'Product',
    slug: 'products',
  });
  await createContentType(page, {
    id: 'articles',
    plural: 'Articles',
    singular: 'Article',
    slug: 'articles',
  });

  await page.getByRole('tab', { name: 'Taxonomies' }).click();
  const taxonomyPanel = page.getByRole('tabpanel', { name: 'Taxonomies' });
  await expect(taxonomyPanel.getByRole('heading', { name: 'Taxonomies' })).toBeVisible();
  await expect(taxonomyPanel.getByText('No taxonomies yet')).toBeVisible();

  await taxonomyPanel.getByRole('button', { name: 'New taxonomy' }).click();
  await taxonomyPanel.getByLabel('Taxonomy ID').fill('categories');
  await taxonomyPanel.getByLabel('Taxonomy plural label').fill('Categories');
  await taxonomyPanel.getByLabel('Taxonomy singular label').fill('Category');
  await taxonomyPanel.getByLabel('Taxonomy slug').fill('categories');
  await taxonomyPanel.getByLabel('Taxonomy description').fill('Shared category classification.');

  await expect(taxonomyPanel.getByRole('checkbox', { name: /Articles/ })).toBeChecked();
  await taxonomyPanel.getByRole('checkbox', { name: /Products/ }).check();
  await expect(taxonomyPanel.getByRole('checkbox', { name: /Products/ })).toBeChecked();
  await expect(taxonomyPanel.getByRole('checkbox', { name: /Hierarchical taxonomy/ })).toBeChecked();

  await taxonomyPanel.getByRole('button', { name: 'Create taxonomy' }).click();
  await expect(taxonomyPanel.getByText('Created Categories.')).toBeVisible();
  await expect(taxonomyPanel.getByRole('button', { name: /Categories.*categories.*Hierarchical.*2 targets/ })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedTaxonomy(page, 'categories')).not.toBeNull();

  await page.reload();
  await page.getByRole('tab', { name: 'Taxonomies' }).click();
  const reloadedPanel = page.getByRole('tabpanel', { name: 'Taxonomies' });
  await reloadedPanel.getByRole('button', { name: /Categories.*categories.*Hierarchical.*2 targets/ }).click();
  await expect(reloadedPanel.getByLabel('Taxonomy ID')).toHaveValue('categories');
  await expect(reloadedPanel.getByRole('checkbox', { name: /Articles/ })).toBeChecked();
  await expect(reloadedPanel.getByRole('checkbox', { name: /Products/ })).toBeChecked();

  await reloadedPanel.getByLabel('Taxonomy slug').fill('Bad Slug');
  await expect(reloadedPanel.getByText(/Slug must be lowercase kebab-case/)).toBeVisible();
  await expect(reloadedPanel.getByRole('button', { name: 'Save changes' })).toBeDisabled();

  await reloadedPanel.getByLabel('Taxonomy slug').fill('catalog-categories');
  await reloadedPanel.getByRole('checkbox', { name: /Hierarchical taxonomy/ }).uncheck();
  await reloadedPanel.getByRole('checkbox', { name: /Articles/ }).uncheck();
  await reloadedPanel.getByRole('button', { name: 'Save changes' }).click();
  await expect(reloadedPanel.getByText('Saved Categories.')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => {
    const value = await readPersistedTaxonomy(page, 'categories') as {
      hierarchical?: boolean;
      contentTypeIds?: string[];
      slug?: string;
    } | null;
    return value
      ? `${String(value.hierarchical)}|${value.contentTypeIds?.join(',')}|${value.slug}`
      : 'missing';
  }).toBe('false|products|catalog-categories');

  await page.reload();
  await page.getByRole('tab', { name: 'Taxonomies' }).click();
  const finalPanel = page.getByRole('tabpanel', { name: 'Taxonomies' });
  await finalPanel.getByRole('button', { name: /Categories.*catalog-categories.*Flat.*1 target/ }).click();
  await expect(finalPanel.getByRole('checkbox', { name: /Hierarchical taxonomy/ })).not.toBeChecked();
  await expect(finalPanel.getByRole('checkbox', { name: /Articles/ })).not.toBeChecked();
  await expect(finalPanel.getByRole('checkbox', { name: /Products/ })).toBeChecked();

  await finalPanel.getByRole('button', { name: 'Delete' }).click();
  await expect(finalPanel.getByText('Confirm deletion of Categories.')).toBeVisible();
  await finalPanel.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(finalPanel.getByText('Deleted Categories.')).toBeVisible();
  await expect(finalPanel.getByText('No taxonomies yet')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedTaxonomy(page, 'categories')).toBeNull();
});
