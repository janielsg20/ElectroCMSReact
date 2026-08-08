import { expect, test } from '@playwright/test';

test('live preview renders the canonical document and follows breakpoint changes', async ({ page }) => {
  await page.goto('/preview');

  await expect(page.getByRole('heading', { name: 'Preview workspace', level: 2 })).toBeVisible();
  const preview = page.getByRole('main', { name: 'Live document preview' });
  await expect(preview).toBeVisible();

  const renderer = preview.getByTestId('canvas-renderer');
  await expect(renderer).toHaveAttribute('data-breakpoint-id', 'desktop');
  await page.getByLabel('Preview device').selectOption('tablet-portrait');
  await expect(renderer).toHaveAttribute('data-breakpoint-id', 'tablet-portrait');
  await expect(page.getByText('Document tree')).toBeVisible();
  await expect(page.getByText('Widget previews')).toBeVisible();
});

test('publishing center exposes destinations without simulating exporters', async ({ page }) => {
  await page.goto('/export');

  await expect(page.getByRole('heading', { name: 'Export workspace', level: 2 })).toBeVisible();
  await expect(page.getByText('No simulated publishing')).toBeVisible();
  for (const destination of ['Local', 'React', 'LAMP', 'WordPress']) {
    await expect(page.getByRole('button', { name: `Configure ${destination} export` })).toBeDisabled();
  }
});

test('command palette opens with keyboard and routes to existing systems', async ({ page }) => {
  await page.goto('/editor');

  await page.keyboard.press('Control+K');
  const palette = page.getByRole('dialog', { name: 'Command palette' });
  await expect(palette).toBeVisible();
  await expect(palette.getByLabel('Search commands')).toBeFocused();

  await palette.getByRole('button', { name: /Settings/ }).click();
  await expect(page.getByRole('region', { name: 'Global systems studio' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Project' })).toHaveAttribute('aria-selected', 'true');
});
