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
  await nodes.nth(0).locator('.canvas-node-label').click();
  await expect(nodes.nth(0)).toHaveAttribute('data-selected', 'true');
  await expect(nodes.nth(1)).toHaveAttribute('data-selected', 'false');
  await expect(page.getByTestId('canvas-overlay-layer')).toHaveAttribute('data-selection-count', '1');

  await nodes.nth(1).locator('.canvas-node-label').click({ modifiers: ['Control'] });
  await expect(nodes.nth(0)).toHaveAttribute('data-selected', 'true');
  await expect(nodes.nth(1)).toHaveAttribute('data-selected', 'true');
  await expect(page.getByTestId('canvas-overlay-layer')).toHaveAttribute('data-selection-count', '2');

  await page.keyboard.press('Escape');
  await expect(nodes.nth(0)).toHaveAttribute('data-selected', 'false');
  await expect(nodes.nth(1)).toHaveAttribute('data-selected', 'false');
  await expect(page.getByTestId('canvas-overlay-layer')).toHaveAttribute('data-selection-count', '0');
});

test('document commands undo and redo through keyboard and header controls', async ({ page }) => {
  await page.goto('/editor');
  const insertButton = page.getByRole('button', { name: 'Insert container' });
  const undoButton = page.getByRole('button', { name: 'Undo' });
  const redoButton = page.getByRole('button', { name: 'Redo' });
  const nodes = page.locator('[data-canvas-node-type="core/container"]');

  await expect(undoButton).toBeDisabled();
  await expect(redoButton).toBeDisabled();
  await insertButton.click();
  await expect(nodes).toHaveCount(1);
  await expect(undoButton).toBeEnabled();

  await page.keyboard.press('Control+z');
  await expect(nodes).toHaveCount(0);
  await expect(redoButton).toBeEnabled();

  await page.keyboard.press('Control+Shift+z');
  await expect(nodes).toHaveCount(1);
  await expect(redoButton).toBeDisabled();

  await undoButton.click();
  await expect(nodes).toHaveCount(0);
  await redoButton.click();
  await expect(nodes).toHaveCount(1);
});

test('clipboard copy paste cut uses fresh canonical ids and remains undoable', async ({ page }) => {
  await page.goto('/editor');
  const insertButton = page.getByRole('button', { name: 'Insert container' });
  const containers = page.locator('[data-canvas-node-type="core/container"]');

  await insertButton.click();
  await expect(containers).toHaveCount(1);
  const originalId = await containers.nth(0).getAttribute('data-canvas-node-id');
  if (!originalId) throw new Error('Expected original container id.');

  await containers.nth(0).locator('.canvas-node-label').click();
  await page.getByRole('button', { name: 'Copy' }).click();
  await page.getByRole('button', { name: /^Paste/ }).click();
  await expect(containers).toHaveCount(2);
  const pastedId = await containers.nth(1).getAttribute('data-canvas-node-id');
  expect(pastedId).not.toBe(originalId);
  await expect(containers.nth(1)).toContainText('Copy');

  await page.getByRole('button', { name: 'Cut' }).click();
  await expect(containers).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(containers).toHaveCount(2);
});

test('group ungroup lock and hide are canonical reversible editor commands', async ({ page }) => {
  await page.goto('/editor');
  const insertButton = page.getByRole('button', { name: 'Insert container' });
  await insertButton.click();
  await insertButton.click();

  const containers = page.locator('[data-canvas-node-type="core/container"]');
  await containers.nth(0).locator('.canvas-node-label').click();
  await containers.nth(1).locator('.canvas-node-label').click({ modifiers: ['Control'] });
  await page.getByRole('button', { name: 'Group' }).click();

  const group = page.locator('[data-canvas-node-type="core/group"]');
  await expect(group).toHaveCount(1);
  await expect(group).toHaveAttribute('data-selected', 'true');
  await expect(group.locator('[data-canvas-node-type="core/container"]')).toHaveCount(2);

  await page.getByRole('button', { name: 'Lock' }).click();
  await expect(group).toHaveAttribute('data-locked', 'true');
  await expect(group).toHaveAttribute('draggable', 'false');
  await page.getByRole('button', { name: 'Hide' }).click();
  await expect(group).toHaveAttribute('data-hidden', 'true');
  await expect(page.getByRole('button', { name: 'Show' })).toBeEnabled();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(group).toHaveAttribute('data-hidden', 'false');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(group).toHaveAttribute('data-locked', 'false');

  await page.getByRole('button', { name: 'Ungroup' }).click();
  await expect(group).toHaveCount(0);
  const rootChildren = page
    .locator('[data-canvas-node-type="core/root"]')
    .locator('[data-canvas-node-type="core/container"][data-depth="1"]');
  await expect(rootChildren).toHaveCount(2);
});
