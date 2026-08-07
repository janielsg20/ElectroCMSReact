import { expect, test } from '@playwright/test';

test('foundation shell loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ElectroCMS' })).toBeVisible();
  await expect(page.getByText('Local-first', { exact: true })).toBeVisible();
});
