import { expect, test } from '@playwright/test';

const customFrontendThemePackage = JSON.stringify({
  schemaVersion: 1,
  kind: 'electrocms-theme-package',
  theme: {
    id: 'frontend.custom-ocean',
    version: 1,
    scope: 'frontend',
    label: 'Custom Ocean',
    description: 'Imported test theme for local package workflow.',
    tokens: {
      color: {
        background: '#eef8ff',
        surface: '#ffffff',
        text: '#12324a',
        muted: '#55758b',
        accent: '#0077cc',
      },
      typography: { fontFamily: 'system-ui, sans-serif', headingWeight: 700, bodyWeight: 400 },
      shape: { radius: 12 },
      spacing: { density: 'comfortable', base: 8 },
    },
  },
});

test('imports a local theme package, persists selection and exports it again', async ({ page }) => {
  await page.goto('/preview');

  await page.getByLabel('Import theme package').setInputFiles({
    name: 'custom-ocean.electrocms-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(customFrontendThemePackage),
  });

  await expect(page.getByText(/Installed frontend\.custom-ocean/)).toBeVisible();
  const frontendTheme = page.getByLabel('Frontend theme', { exact: true });
  await expect(frontendTheme.locator('option[value="frontend.custom-ocean"]')).toHaveCount(1);
  await frontendTheme.selectOption('frontend.custom-ocean');

  await expect(page.locator('[data-theme-scope="frontend"] [data-project-theme-id]')).toHaveAttribute(
    'data-project-theme-id',
    'frontend.custom-ocean',
  );
  await expect(page.getByText('Imported · frontend.custom-ocean')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByLabel('Frontend theme', { exact: true })).toHaveValue('frontend.custom-ocean');
  await expect(page.getByText('Imported · frontend.custom-ocean')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selected' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('frontend-custom-ocean.electrocms-theme.json');
  await expect(page.getByText('Exported frontend.custom-ocean.')).toBeVisible();
});

test('rejects a package that collides with an installed built-in theme id', async ({ page }) => {
  await page.goto('/preview');

  const duplicatePackage = JSON.stringify({
    ...JSON.parse(customFrontendThemePackage),
    theme: {
      ...JSON.parse(customFrontendThemePackage).theme,
      id: 'frontend.minimal-clean',
      label: 'Collision',
    },
  });

  await page.getByLabel('Import theme package').setInputFiles({
    name: 'collision.json',
    mimeType: 'application/json',
    buffer: Buffer.from(duplicatePackage),
  });

  await expect(page.getByText('Theme frontend.minimal-clean is already installed.')).toBeVisible();
  await expect(page.getByLabel('Frontend theme', { exact: true }).locator('option[value="frontend.minimal-clean"]')).toHaveCount(1);
});
