import { expect, test, type Page } from '@playwright/test';

async function chooseBreakpoint(page: Page, id: string) {
  await page.locator(`.header-breakpoint-button[data-breakpoint-id="${id}"]`).click();
}

test('geometry controls snap position and resize per breakpoint with undo support', async ({ page }) => {
  await page.goto('/editor');
  await page.getByRole('button', { name: 'Insert container' }).click();

  const node = page.locator('[data-canvas-node-type="core/container"]');
  await expect(node).toHaveCount(1);
  await node.locator('.canvas-node-label').click();

  await page.getByLabel('X position').fill('17');
  await expect(node).toHaveAttribute('data-geometry-x', '16');
  await expect(node).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 16, 0)');
  await expect(page.getByTestId('canvas-overlay-layer')).toHaveAttribute('data-guide-count', '1');

  await page.getByLabel('Node width').fill('319');
  await expect(node).toHaveAttribute('data-geometry-width', '320');
  await expect(node).toHaveCSS('width', '320px');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(node).toHaveAttribute('data-geometry-width', '');
  await expect(node).toHaveAttribute('data-geometry-x', '16');

  await chooseBreakpoint(page, 'mobile-small');
  await expect(page.getByTestId('canvas-renderer')).toHaveAttribute('data-breakpoint-id', 'mobile-small');
  await expect(node).toHaveAttribute('data-geometry-x', '0');
  await page.getByLabel('X position').fill('9');
  await expect(node).toHaveAttribute('data-geometry-x', '8');

  await chooseBreakpoint(page, 'desktop');
  await expect(node).toHaveAttribute('data-geometry-x', '16');
});
