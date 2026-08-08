import { expect, test } from '@playwright/test';

test('duplicates a built-in theme into an editable versioned local theme', async ({ page }) => {
  await page.goto('/preview');

  const app = page.locator('.electrocms-app');
  const editorPreset = await app.getAttribute('data-editor-preset');
  const themeSelect = page.getByLabel('Frontend theme', { exact: true });
  await expect(themeSelect).toHaveValue('frontend.minimal-clean');

  await page.getByRole('button', { name: 'Duplicate to edit' }).click();
  await expect(themeSelect).toHaveValue('frontend.minimal-clean-copy');
  await expect(page.getByText('Imported · frontend.minimal-clean-copy · v1')).toBeVisible();
  await expect(page.getByText('Version 1')).toBeVisible();
  await expect(app).toHaveAttribute('data-editor-preset', editorPreset!);

  await page.getByLabel('Theme label').fill('Ocean Builder');
  await page.getByLabel('Theme description').fill('Editable local theme for a no-code builder workflow.');
  await page.getByLabel('Accent token').fill('#00aaff');
  await page.getByLabel('Radius token').fill('14');
  await page.getByRole('button', { name: 'Save as v2' }).click();

  await expect(page.getByText('Saved frontend.minimal-clean-copy as version 2.')).toBeVisible();
  await expect(page.getByText('Imported · frontend.minimal-clean-copy · v2')).toBeVisible();
  await expect(page.getByText('Version 2')).toBeVisible();
  await expect(themeSelect.locator('option[value="frontend.minimal-clean-copy"]')).toContainText('Ocean Builder · v2');
  await expect(page.locator('[data-project-theme-id="frontend.minimal-clean-copy"]')).toHaveCSS(
    'border-radius',
    '14px',
  );
  await expect(app).toHaveAttribute('data-editor-preset', editorPreset!);
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByLabel('Frontend theme', { exact: true })).toHaveValue('frontend.minimal-clean-copy');
  await expect(page.getByText('Imported · frontend.minimal-clean-copy · v2')).toBeVisible();
  await expect(page.getByLabel('Theme label')).toHaveValue('Ocean Builder');
  await expect(page.getByLabel('Accent token')).toHaveValue('#00aaff');
  await expect(app).toHaveAttribute('data-editor-preset', editorPreset!);
});
