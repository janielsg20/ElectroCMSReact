import { expect, test } from '@playwright/test';

test('taxonomies CRUD persists through the canonical local-first project runtime', async ({ page }) => {
  await page.goto('/editor/content');
  const studio = page.getByRole('region', { name: 'Dynamic Content Studio' });

  await studio.getByRole('button', { name: 'New content type' }).click();
  await studio.getByLabel('Content type id').fill('article');
  await studio.getByLabel('Content type slug').fill('articles');
  await studio.getByLabel('Content type label').fill('Articles');
  await studio.getByLabel('Content type singular label').fill('Article');
  await studio.getByRole('button', { name: 'Create content type' }).click();
  await expect(studio.getByText('Content type saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await studio.getByRole('tab', { name: /Taxonomies/i }).click();
  await expect(studio.getByLabel('Taxonomies CRUD enabled')).toBeVisible();
  await studio.getByRole('button', { name: 'New taxonomy' }).click();
  await studio.getByLabel('Taxonomy id').fill('topics');
  await studio.getByLabel('Taxonomy slug').fill('topics');
  await studio.getByLabel('Taxonomy label').fill('Topics');
  await studio.getByLabel('Taxonomy singular label').fill('Topic');
  await studio.getByLabel('Taxonomy description').fill('Editorial topic organization');
  await expect(studio.getByLabel('Target content type Articles')).toBeChecked();
  await studio.getByLabel('Taxonomy hierarchical').uncheck();
  await studio.getByRole('button', { name: 'Create taxonomy' }).click();
  await expect(studio.getByText('Taxonomy saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  await expect(page).toHaveURL(/\/editor\/content$/);
  const hydratedStudio = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await hydratedStudio.getByRole('tab', { name: /Taxonomies/i }).click();
  const topics = hydratedStudio.getByRole('button', { name: /Topics.*topics/i });
  await expect(topics).toBeVisible();
  await topics.click();
  await expect(hydratedStudio.getByLabel('Taxonomy description')).toHaveValue('Editorial topic organization');
  await expect(hydratedStudio.getByLabel('Taxonomy hierarchical')).not.toBeChecked();

  await hydratedStudio.getByLabel('Taxonomy label').fill('Knowledge Topics');
  await hydratedStudio.getByRole('button', { name: 'Save changes' }).click();
  await expect(hydratedStudio.getByText('Taxonomy saved.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  const updatedStudio = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await updatedStudio.getByRole('tab', { name: /Taxonomies/i }).click();
  const updatedTaxonomy = updatedStudio.getByRole('button', { name: /Knowledge Topics.*topics/i });
  await expect(updatedTaxonomy).toBeVisible();
  await updatedTaxonomy.click();
  await updatedStudio.getByRole('button', { name: 'Delete' }).click();
  await updatedStudio.getByRole('button', { name: 'Confirm delete' }).click();
  await expect(updatedStudio.getByText('Deleted Knowledge Topics.', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 5000 });

  await page.reload();
  const finalStudio = page.getByRole('region', { name: 'Dynamic Content Studio' });
  await finalStudio.getByRole('tab', { name: /Taxonomies/i }).click();
  await expect(finalStudio.getByText('No taxonomies yet')).toBeVisible();
  await expect(finalStudio.getByRole('button', { name: /Knowledge Topics.*topics/i })).toHaveCount(0);
});
