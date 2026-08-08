import { expect, test } from '@playwright/test';

test('editor autosave persists commands and hydrates them after reload', async ({ page }) => {
  await page.goto('/editor');

  const insertButton = page.getByRole('button', { name: 'Insert container' });
  const nodes = page.locator('[data-canvas-node-type="core/container"]');
  await insertButton.click();
  await expect(nodes).toHaveCount(1);
  await expect(page.getByText('Unsaved changes')).toBeVisible();

  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 8_000 });

  const persisted = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('electrocms', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      const transaction = database.transaction(['projects', 'recoverySnapshots'], 'readonly');
      const projectsRequest = transaction.objectStore('projects').get('project_local_workspace');
      const recoveryRequest = transaction
        .objectStore('recoverySnapshots')
        .index('projectId')
        .getAll('project_local_workspace');
      const [project, recovery] = await Promise.all([
        new Promise<unknown>((resolve, reject) => {
          projectsRequest.onsuccess = () => resolve(projectsRequest.result);
          projectsRequest.onerror = () => reject(projectsRequest.error);
        }),
        new Promise<unknown[]>((resolve, reject) => {
          recoveryRequest.onsuccess = () => resolve(recoveryRequest.result as unknown[]);
          recoveryRequest.onerror = () => reject(recoveryRequest.error);
        }),
      ]);
      return { project, recoveryCount: recovery.length };
    } finally {
      database.close();
    }
  });

  expect(persisted.project).toBeTruthy();
  expect(persisted.recoveryCount).toBeGreaterThan(0);

  await page.reload();
  await expect(page.locator('[data-canvas-node-type="core/container"]')).toHaveCount(1, {
    timeout: 8_000,
  });
  await expect(page.getByText('Saved locally')).toBeVisible();
});
