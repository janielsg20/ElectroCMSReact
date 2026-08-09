import { expect, test, type Page } from '@playwright/test';

async function chooseBreakpoint(page: Page, id: string) {
  await page.locator(`.header-breakpoint-button[data-breakpoint-id="${id}"]`).click();
}

test('inherits a style from the nearest wider resolved breakpoint and follows later source edits', async ({ page }) => {
  await page.goto('/editor');

  await page.getByLabel('Widget to insert').selectOption('core/heading');
  await page.getByRole('button', { name: 'Insert widget', exact: true }).click();
  const headingNode = page.locator('[data-canvas-node-type="core/heading"]').last();
  await headingNode.locator('.canvas-node-label').click();

  const inspector = page.getByRole('complementary', { name: 'Widget inspector' });
  await inspector.getByRole('tab', { name: 'Design' }).click();
  const desktopFontSize = inspector.getByLabel('Style Font size');
  await desktopFontSize.fill('40');
  await desktopFontSize.blur();
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('40px');

  await chooseBreakpoint(page, 'tablet-portrait');
  await inspector.getByRole('button', { name: 'Inherit Font size from Desktop' }).click();
  await expect(inspector.getByText('Inherited from desktop')).toBeVisible();
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('40px');

  await chooseBreakpoint(page, 'desktop');
  const updatedDesktopFontSize = inspector.getByLabel('Style Font size');
  await updatedDesktopFontSize.fill('44');
  await updatedDesktopFontSize.blur();

  await chooseBreakpoint(page, 'tablet-portrait');
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('44px');

  await inspector.getByRole('button', { name: 'Unset Font size' }).click();
  await expect(inspector.getByText('Unset').first()).toBeVisible();
  await expect.poll(async () => headingNode.evaluate((element) => (element as HTMLElement).style.fontSize)).toBe('');
});
