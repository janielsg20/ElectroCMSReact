import { expect, test } from '@playwright/test';

test('edits an explicit responsive style, keeps breakpoint isolation and supports undo', async ({ page }) => {
  await page.goto('/editor');

  await page.getByLabel('Widget to insert').selectOption('core/heading');
  await page.getByRole('button', { name: 'Insert widget', exact: true }).click();

  const headingNode = page.locator('[data-canvas-node-type="core/heading"]').last();
  await headingNode.locator('.canvas-node-label').click();

  const inspector = page.getByRole('complementary', { name: 'Widget inspector' });
  await inspector.getByRole('tab', { name: 'Style' }).click();
  const fontSize = inspector.getByLabel('Style Font size');
  await fontSize.fill('36');
  await fontSize.blur();

  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('36px');
  await expect(inspector.getByText('Explicit on desktop')).toBeVisible();

  await page.getByLabel('Preview breakpoint').selectOption('mobile-small');
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('');
  await expect(inspector.getByText('Unset').first()).toBeVisible();

  await page.getByLabel('Preview breakpoint').selectOption('desktop');
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('36px');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('');
});
