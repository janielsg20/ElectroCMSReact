import { expect, test } from '@playwright/test';

test('IndexedDB adapter survives a browser reload', async ({ page }) => {
  await page.goto('/');

  const projectId = await page.evaluate(async () => {
    const repositoryUrl = '/src/core/persistence/indexeddb/indexeddb-project-repository.ts';
    const factoryUrl = '/src/core/project/project-factory.ts';
    const { IndexedDbProjectRepository } = await import(/* @vite-ignore */ repositoryUrl);
    const { createCanonicalProject } = await import(/* @vite-ignore */ factoryUrl);
    const repository = new IndexedDbProjectRepository(indexedDB, 'electrocms-e2e');
    const project = createCanonicalProject({ name: 'Reload proof' });
    await repository.save(project);
    return project.id as string;
  });

  await page.reload();

  const persistedName = await page.evaluate(async (id) => {
    const repositoryUrl = '/src/core/persistence/indexeddb/indexeddb-project-repository.ts';
    const { IndexedDbProjectRepository } = await import(/* @vite-ignore */ repositoryUrl);
    const repository = new IndexedDbProjectRepository(indexedDB, 'electrocms-e2e');
    return (await repository.load(id))?.name ?? null;
  }, projectId);

  expect(persistedName).toBe('Reload proof');
});
