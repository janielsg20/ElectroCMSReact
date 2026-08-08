import { expect, test, type Page } from '@playwright/test';

async function readPersistedThemes(page: Page): Promise<{ frontendThemeId: string; backendThemeId: string }> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const project = await new Promise<{ frontendThemeId: string; backendThemeId: string }>((resolve, reject) => {
        const transaction = database.transaction('projects', 'readonly');
        const request = transaction.objectStore('projects').get('project_local_workspace');
        request.onsuccess = () => resolve(request.result as { frontendThemeId: string; backendThemeId: string });
        request.onerror = () => reject(request.error);
      });
      return {
        frontendThemeId: project.frontendThemeId,
        backendThemeId: project.backendThemeId,
      };
    } finally {
      database.close();
    }
  });
}

test('frontend and backend themes change independently and survive autosave reload', async ({ page }) => {
  await page.goto('/preview');

  const app = page.locator('.electrocms-app');
  const editorPreset = await app.getAttribute('data-editor-preset');
  expect(editorPreset).toBeTruthy();
  const frontendTheme = page.getByLabel('Frontend theme', { exact: true });

  await expect(frontendTheme).toHaveValue('frontend.minimal-clean');
  await frontendTheme.selectOption('frontend.bento-grid');
  await expect(page.locator('[data-theme-scope="frontend"] [data-project-theme-id]')).toHaveAttribute(
    'data-project-theme-id',
    'frontend.bento-grid',
  );
  await expect(app).toHaveAttribute('data-editor-preset', editorPreset!);
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => (await readPersistedThemes(page)).frontendThemeId).toBe('frontend.bento-grid');

  const navigation = page.getByRole('navigation', { name: 'Primary workspaces' });
  await navigation.getByRole('button', { name: 'Backend' }).click();
  await expect(page).toHaveURL(/\/backend$/);
  const backendTheme = page.getByLabel('Backend theme', { exact: true });
  await expect(backendTheme).toHaveValue('backend.high-density');

  await backendTheme.selectOption('backend.developer-console');
  await expect(page.locator('[data-theme-scope="backend"] [data-project-theme-id]')).toHaveAttribute(
    'data-project-theme-id',
    'backend.developer-console',
  );
  await expect(app).toHaveAttribute('data-editor-preset', editorPreset!);
  await expect(page.getByText('Unsaved changes')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => (await readPersistedThemes(page)).backendThemeId).toBe('backend.developer-console');

  await page.reload();
  await expect(page.getByLabel('Backend theme', { exact: true })).toHaveValue('backend.developer-console');

  await page.getByRole('navigation', { name: 'Primary workspaces' }).getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByLabel('Frontend theme', { exact: true })).toHaveValue('frontend.bento-grid');
  await expect(app).toHaveAttribute('data-editor-preset', editorPreset!);
});