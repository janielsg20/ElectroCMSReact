import { expect, test } from '@playwright/test';

test('click insertion plus drag and drop nests and reorders canonical nodes', async ({ page }) => {
  await page.goto('/editor');

  const insertButton = page.getByRole('button', { name: 'Insert container' });
  await insertButton.click();
  await insertButton.click();

  const containers = page.locator('[data-canvas-node-type="core/container"]');
  await expect(containers).toHaveCount(2);
  const firstId = await containers.nth(0).getAttribute('data-canvas-node-id');
  const secondId = await containers.nth(1).getAttribute('data-canvas-node-id');
  if (!firstId || !secondId) throw new Error('Expected canonical container ids.');

  const secondChildSlot = page.locator(
    `[data-drop-parent-id="${secondId}"][data-drop-index="0"]`,
  );
  await containers.nth(0).dragTo(secondChildSlot);

  const secondNode = page.locator(`[data-canvas-node-id="${secondId}"]`);
  await expect(secondNode.locator(`[data-canvas-node-id="${firstId}"]`)).toHaveCount(1);

  const root = page.locator('[data-canvas-node-type="core/root"]');
  let rootChildren = root.locator('[data-canvas-node-id][data-depth="1"]');
  await expect(rootChildren).toHaveCount(1);
  await expect(rootChildren.nth(0)).toHaveAttribute('data-canvas-node-id', secondId);

  await insertButton.click();
  const thirdNode = page.locator('[data-canvas-node-type="core/container"]', {
    hasText: 'Container 3',
  });
  const thirdId = await thirdNode.getAttribute('data-canvas-node-id');
  const rootId = await root.getAttribute('data-canvas-node-id');
  if (!thirdId || !rootId) throw new Error('Expected root and third container ids.');

  const rootFirstSlot = page.locator(
    `[data-drop-parent-id="${rootId}"][data-drop-index="0"]`,
  );
  await thirdNode.dragTo(rootFirstSlot);

  rootChildren = root.locator('[data-canvas-node-id][data-depth="1"]');
  await expect(rootChildren).toHaveCount(2);
  await expect(rootChildren.nth(0)).toHaveAttribute('data-canvas-node-id', thirdId);
  await expect(rootChildren.nth(1)).toHaveAttribute('data-canvas-node-id', secondId);
  await expect(page.getByText('Unsaved changes')).toBeVisible();
});

test('canvas supports single and additive multi-selection and Escape clear', async ({ page }) => {
  await page.goto('/editor');
  const insertButton = page.getByRole('button', { name: 'Insert container' });
  await insertButton.click();
  await insertButton.click();

  const nodes = page.locator('[data-canvas-node-type="core/container"]');
  await nodes.nth(0).click();
  await expect(nodes.nth(0)).toHaveAttribute('data-selected', 'true');
  await expect(nodes.nth(1)).toHaveAttribute('data-selected', 'false');
  await expect(page.getByTestId('canvas-overlay-layer')).toHaveAttribute('data-selection-count', '1');

  await nodes.nth(1).click({ modifiers: ['Control'] });
  await expect(nodes.nth(0)).toHaveAttribute('data-selected', 'true');
  await expect(nodes.nth(1)).toHaveAttribute('data-selected', 'true');
  await expect(page.getByTestId('canvas-overlay-layer')).toHaveAttribute('data-selection-count', '2');

  await page.keyboard.press('Escape');
  await expect(nodes.nth(0)).toHaveAttribute('data-selected', 'false');
  await expect(nodes.nth(1)).toHaveAttribute('data-selected', 'false');
  await expect(page.getByTestId('canvas-overlay-layer')).toHaveAttribute('data-selection-count', '0');
});
