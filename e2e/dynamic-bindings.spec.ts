import { expect, test, type Locator, type Page } from '@playwright/test';

interface PersistedBindingState {
  binding: {
    source?: string;
    target?: string;
    kind?: string;
    fallback?: unknown;
  } | null;
  recordTitle: string | null;
}

async function readPersistedBindingState(page: Page): Promise<PersistedBindingState> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const project = await new Promise<{
        documents: Record<string, { nodes?: Record<string, { type?: string; bindings?: Array<Record<string, unknown>> }> }>;
        records: Record<string, { title?: string }>;
      }>((resolve, reject) => {
        const transaction = database.transaction('projects', 'readonly');
        const request = transaction.objectStore('projects').get('project_local_workspace');
        request.onsuccess = () => resolve(request.result as {
          documents: Record<string, { nodes?: Record<string, { type?: string; bindings?: Array<Record<string, unknown>> }> }>;
          records: Record<string, { title?: string }>;
        });
        request.onerror = () => reject(request.error);
      });

      const heading = Object.values(project.documents)
        .flatMap((document) => Object.values(document.nodes ?? {}))
        .find((node) => node.type === 'core/heading' && Array.isArray(node.bindings) && node.bindings.length > 0);
      const rawBinding = heading?.bindings?.[0];
      return {
        binding: rawBinding
          ? {
              source: typeof rawBinding.source === 'string' ? rawBinding.source : undefined,
              target: typeof rawBinding.target === 'string' ? rawBinding.target : undefined,
              kind: typeof rawBinding.kind === 'string' ? rawBinding.kind : undefined,
              fallback: rawBinding.fallback,
            }
          : null,
        recordTitle: typeof project.records['products-record']?.title === 'string'
          ? project.records['products-record'].title ?? null
          : null,
      };
    } finally {
      database.close();
    }
  });
}

async function contentStudio(page: Page): Promise<Locator> {
  await page.goto('/editor/content');
  return page.getByRole('region', { name: 'Dynamic Content Studio' });
}

async function createProductRecord(root: Locator) {
  await root.getByRole('tab', { name: /Content Types/i }).click();
  await root.getByRole('button', { name: 'New content type' }).click();
  const contentTypeEditor = root.getByLabel('Content type editor');
  await contentTypeEditor.getByLabel('Content type id').fill('products');
  await contentTypeEditor.getByLabel('Content type slug').fill('products');
  await contentTypeEditor.getByLabel('Content type label').fill('Products');
  await contentTypeEditor.getByLabel('Content type singular label').fill('Product');
  await contentTypeEditor.getByRole('button', { name: 'Create content type' }).click();
  await expect(contentTypeEditor.getByText('Content type saved.', { exact: true })).toBeVisible();

  await root.getByRole('tab', { name: /Records/i }).click();
  await root.getByRole('button', { name: 'New record' }).click();
  const recordEditor = root.getByLabel('Record editor');
  await recordEditor.getByLabel('Record content type').selectOption('products');
  await recordEditor.getByLabel('Record title').fill('Dynamic Lamp');
  await recordEditor.getByLabel('Record slug').fill('dynamic-lamp');
  await recordEditor.getByRole('button', { name: 'Create record' }).click();
  await expect(recordEditor.getByText('Record saved.', { exact: true })).toBeVisible();
}

async function openBuilder(page: Page) {
  const modules = page.getByRole('navigation', { name: 'Studio modules' });
  await modules.getByRole('button', { name: 'Builder' }).click();
  await expect(page.getByTestId('editor-canvas')).toBeVisible();
}

async function selectBoundHeading(page: Page): Promise<Locator> {
  const heading = page.locator('article[data-canvas-node-type="core/heading"]').last();
  await expect(heading).toBeVisible();
  await heading.locator('.canvas-node-label').click();
  await expect(page.getByRole('complementary', { name: 'Widget inspector' })).toBeVisible();
  return heading;
}

test('MF-044 binds Builder and Preview to real Records with persisted fallback states', async ({ page }) => {
  let root = await contentStudio(page);
  await createProductRecord(root);
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await openBuilder(page);
  const toolbar = page.getByRole('toolbar', { name: 'Canvas commands' });
  await toolbar.getByLabel('Widget to insert').selectOption('core/heading');
  await toolbar.getByRole('button', { name: 'Insert widget' }).click();

  let heading = await selectBoundHeading(page);
  const inspector = page.getByRole('complementary', { name: 'Widget inspector' });
  await inspector.getByRole('tab', { name: 'Bindings' }).click();
  const bindings = inspector.getByRole('tabpanel', { name: 'Bindings inspector' });
  await bindings.getByRole('button', { name: 'Add dynamic binding' }).click();
  await expect(bindings.getByLabel('Binding 1 target')).toHaveValue('text');
  await expect(bindings.getByLabel('Binding 1 record')).toHaveValue('products-record');
  await expect(bindings.getByLabel('Binding 1 field path')).toHaveValue('title');
  await expect(bindings.getByText('State: resolved')).toBeVisible();
  await expect(heading).toHaveAttribute('data-binding-state', 'resolved');
  await expect(heading).toContainText('Dynamic Lamp');

  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => readPersistedBindingState(page)).toMatchObject({
    binding: {
      source: 'record:products-record:title',
      target: 'text',
      kind: 'text',
    },
    recordTitle: 'Dynamic Lamp',
  });

  const primary = page.getByRole('navigation', { name: 'Primary workspaces' });
  await primary.getByRole('button', { name: 'Preview' }).click();
  const preview = page.getByRole('main', { name: 'Live document preview' });
  await expect(preview).toContainText('Dynamic Lamp');

  await page.reload();
  await expect(page.getByRole('main', { name: 'Live document preview' })).toContainText('Dynamic Lamp');

  const modules = page.getByRole('navigation', { name: 'Studio modules' });
  await modules.getByRole('button', { name: 'Content' }).click();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Records/i }).click();
  const recordEditor = root.getByLabel('Record editor');
  await root.getByRole('button', { name: /Dynamic Lamp dynamic-lamp draft/i }).click();
  await recordEditor.getByLabel('Record title').fill('Updated Lamp');
  await recordEditor.getByRole('button', { name: 'Save changes' }).click();
  await expect(recordEditor.getByText('Record saved.', { exact: true })).toBeVisible();

  await openBuilder(page);
  heading = await selectBoundHeading(page);
  await expect(heading).toContainText('Updated Lamp');
  await expect(heading).not.toContainText('Dynamic Lamp');

  const updatedInspector = page.getByRole('complementary', { name: 'Widget inspector' });
  await updatedInspector.getByRole('tab', { name: 'Bindings' }).click();
  const updatedBindings = updatedInspector.getByRole('tabpanel', { name: 'Bindings inspector' });
  await updatedBindings.getByLabel('Binding 1 fallback').fill('Missing product');
  await expect(updatedBindings.getByText('State: resolved')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await modules.getByRole('button', { name: 'Content' }).click();
  root = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await root.getByRole('tab', { name: /Records/i }).click();
  const deleteEditor = root.getByLabel('Record editor');
  await root.getByRole('button', { name: /Updated Lamp dynamic-lamp draft/i }).click();
  await deleteEditor.getByRole('button', { name: 'Delete' }).click();
  await deleteEditor.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(deleteEditor.getByText('Deleted Updated Lamp.', { exact: true })).toBeVisible();

  await openBuilder(page);
  heading = await selectBoundHeading(page);
  await expect(heading).toHaveAttribute('data-binding-state', 'fallback');
  await expect(heading).toContainText('Missing product');

  await primary.getByRole('button', { name: 'Preview' }).click();
  const fallbackPreview = page.getByRole('main', { name: 'Live document preview' });
  await expect(fallbackPreview).toContainText('Missing product');
  const previewHeading = fallbackPreview.locator('article[data-canvas-node-type="core/heading"]').last();
  await expect(previewHeading).toHaveAttribute('data-binding-state', 'fallback');

  await expect.poll(async () => readPersistedBindingState(page)).toMatchObject({
    binding: {
      source: 'record:products-record:title',
      target: 'text',
      kind: 'text',
      fallback: 'Missing product',
    },
    recordTitle: null,
  });
});
