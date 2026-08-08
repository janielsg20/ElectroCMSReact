import { expect, test } from '@playwright/test';

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
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByLabel('Backend theme', { exact: true })).toHaveValue('backend.developer-console');

  await page.getByRole('navigation', { name: 'Primary workspaces' }).getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByLabel('Frontend theme', { exact: true })).toHaveValue('frontend.bento-grid');
  await expect(app).toHaveAttribute('data-editor-preset', editorPreset!);
});
