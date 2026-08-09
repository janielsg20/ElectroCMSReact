import { expect, test } from '@playwright/test';

test('compact navigation traps keyboard focus and Escape returns focus to its opener', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/editor');

  const opener = page.getByRole('button', { name: 'Open navigation' });
  await opener.click();

  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  const close = drawer.getByRole('button', { name: 'Close navigation' });
  await expect(drawer).toBeVisible();
  await expect(close).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  const activeInsideDrawer = await drawer.evaluate((element) => element.contains(document.activeElement));
  expect(activeInsideDrawer).toBe(true);

  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
});
