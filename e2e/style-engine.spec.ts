import { expect, test, type Page } from '@playwright/test';

async function chooseBreakpoint(page: Page, id: string) {
  await page.locator(`.header-breakpoint-button[data-breakpoint-id="${id}"]`).click();
}

test('edits an explicit responsive style, keeps breakpoint isolation and supports undo', async ({ page }) => {
  await page.goto('/editor');

  await page.getByLabel('Widget to insert').selectOption('core/heading');
  await page.getByRole('button', { name: 'Insert widget', exact: true }).click();

  const headingNode = page.locator('[data-canvas-node-type="core/heading"]').last();
  await headingNode.locator('.canvas-node-label').click();

  const inspector = page.getByRole('complementary', { name: 'Widget inspector' });
  await inspector.getByRole('tab', { name: 'Design' }).click();
  const fontSize = inspector.getByLabel('Style Font size');
  await fontSize.fill('36');
  await fontSize.blur();

  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('36px');
  await expect(inspector.getByText('Explicit on desktop')).toBeVisible();

  await chooseBreakpoint(page, 'mobile-small');
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('');
  await expect(inspector.getByText('Unset').first()).toBeVisible();

  await chooseBreakpoint(page, 'desktop');
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('36px');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('');
});
