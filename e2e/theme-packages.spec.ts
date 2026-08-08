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
  resources: {
    documents: {
      document_package_page: {
        id: 'document_package_page',
        kind: 'page',
        name: 'Package Landing',
        slug: '/package-landing',
        rootNodeId: 'node_package_root',
        nodes: {
          node_package_root: {
            id: 'node_package_root',
            type: 'core/root',
            version: 1,
            props: {},
            styles: {},
            children: [],
          },
        },
        metadata: {},
      },
    },
    documentOrder: ['document_package_page'],
    contentTypes: {
      product: { label: 'Product' },
    },
    records: {
      demo_product: { title: 'Demo product' },
    },
  },
});

test('reviews a package, imports selected resources, persists theme and exports it again', async ({ page }) => {
  await page.goto('/preview');

  const activeDocument = page.getByLabel('Active document');
  await expect(activeDocument.locator('option')).toHaveCount(1);

  await page.getByLabel('Choose theme package').setInputFiles({
    name: 'custom-ocean.electrocms-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(customFrontendThemePackage),
  });

  const review = page.getByTestId('theme-import-review');
  await expect(review).toBeVisible();
  await expect(page.getByText('Package validated. Review the selected contents before applying import.')).toBeVisible();
  await expect(review.getByRole('checkbox', { name: /Demo data/ })).not.toBeChecked();
  await expect(review.getByRole('checkbox', { name: /Pages & templates/ })).toBeChecked();
  await review.getByRole('checkbox', { name: /Pages & templates/ }).uncheck();

  await page.getByRole('button', { name: 'Apply selected import' }).click();
  await expect(page.getByText(/Installed frontend\.custom-ocean\./)).toBeVisible();
  await expect(page.getByText(/1 resources imported; 0 existing IDs preserved/)).toBeVisible();
  await expect(activeDocument.locator('option')).toHaveCount(1);

  const frontendTheme = page.getByLabel('Frontend theme', { exact: true });
  await expect(frontendTheme.locator('option[value="frontend.custom-ocean"]')).toHaveCount(1);
  await frontendTheme.selectOption('frontend.custom-ocean');
  await expect(page.locator('[data-theme-scope="frontend"] [data-project-theme-id]')).toHaveAttribute(
    'data-project-theme-id',
    'frontend.custom-ocean',
  );
  await expect(page.getByText('Imported · frontend.custom-ocean · v1')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

  await page.reload();
  await expect(page.getByLabel('Frontend theme', { exact: true })).toHaveValue('frontend.custom-ocean');
  await expect(page.getByText('Imported · frontend.custom-ocean · v1')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export selected package' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('frontend-custom-ocean.electrocms-theme.json');
  await expect(page.getByText('Exported frontend.custom-ocean with the selected project resources.')).toBeVisible();
});

test('preserves an installed theme definition while still completing reviewed import', async ({ page }) => {
  await page.goto('/preview');

  const duplicatePackage = JSON.stringify({
    ...JSON.parse(customFrontendThemePackage),
    theme: {
      ...JSON.parse(customFrontendThemePackage).theme,
      id: 'frontend.minimal-clean',
      label: 'Collision',
    },
    resources: {},
  });

  await page.getByLabel('Choose theme package').setInputFiles({
    name: 'collision.json',
    mimeType: 'application/json',
    buffer: Buffer.from(duplicatePackage),
  });
  await page.getByRole('button', { name: 'Apply selected import' }).click();

  await expect(
    page.getByText(/Theme definition already installed; existing definition preserved\./),
  ).toBeVisible();
  await expect(page.getByLabel('Frontend theme', { exact: true }).locator('option[value="frontend.minimal-clean"]')).toHaveCount(1);
});
