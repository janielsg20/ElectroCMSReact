import { expect, test } from '@playwright/test';

test('edits a widget through the generated inspector and undo restores the prior props', async ({ page }) => {
  await page.goto('/editor');

  await page.getByLabel('Widget to insert').selectOption('core/heading');
  await page.getByRole('button', { name: 'Insert widget', exact: true }).click();

  const headingNode = page.locator('[data-canvas-node-type="core/heading"]').last();
  await expect(headingNode).toBeVisible();
  await headingNode.locator('.canvas-node-label').click();

  const inspector = page.getByRole('complementary', { name: 'Widget inspector' });
  await expect(inspector).toContainText('Heading');

  const textField = inspector.getByLabel('Text');
  await textField.fill('Inspector edited heading');
  await textField.blur();

  await expect(headingNode.locator('.widget-preview--heading')).toHaveText('Inspector edited heading');
  await expect(page.getByText('Unsaved changes')).toBeVisible();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(headingNode.locator('.widget-preview--heading')).toHaveText('Heading');
});
