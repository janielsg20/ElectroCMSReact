import { expect, test } from '@playwright/test';

test('desktop builder keeps professional reference proportions and aligned work surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/editor');

  const rail = page.locator('.workspace-navigation[data-reference-rail="true"]');
  const navigator = page.getByRole('complementary', { name: 'Builder navigator' });
  const navigatorTabs = page.getByRole('tablist', { name: 'Builder navigator views' });
  const canvasToolbar = page.getByRole('toolbar', { name: 'Canvas commands' });
  const canvasStage = page.locator('.canvas-stage-v2');
  const inspectorDock = page.locator('.canvas-inspector-dock');
  const contextBar = page.locator('.studio-context-bar');
  const documentBar = page.locator('.builder-document-bar');

  await expect(rail).toBeVisible();
  await expect(navigator).toBeVisible();
  await expect(canvasToolbar).toBeVisible();
  await expect(canvasStage).toBeVisible();
  await expect(inspectorDock).toBeVisible();

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      const bounds = element?.getBoundingClientRect();
      return bounds
        ? { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height }
        : null;
    };

    return {
      viewportWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      header: rect('.app-header'),
      rail: rect('.workspace-navigation[data-reference-rail="true"]'),
      navigator: rect('.builder-context-panel'),
      navigatorTabs: rect('.builder-context-tabs'),
      toolbar: rect('.canvas-command-bar-v2'),
      canvas: rect('.canvas-stage-v2'),
      inspector: rect('.canvas-inspector-dock'),
      contextDisplay: getComputedStyle(document.querySelector<HTMLElement>('.studio-context-bar')!).display,
      documentBarDisplay: getComputedStyle(document.querySelector<HTMLElement>('.builder-document-bar')!).display,
    };
  });

  expect(geometry.rootScrollWidth).toBe(geometry.viewportWidth);
  expect(geometry.header?.height ?? 0).toBeGreaterThanOrEqual(58);
  expect(geometry.header?.height ?? 0).toBeLessThanOrEqual(64);
  expect(geometry.rail?.width ?? 0).toBeGreaterThanOrEqual(58);
  expect(geometry.rail?.width ?? 0).toBeLessThanOrEqual(62);
  expect(geometry.navigator?.width ?? 0).toBeGreaterThanOrEqual(284);
  expect(geometry.navigator?.width ?? 0).toBeLessThanOrEqual(314);
  expect(geometry.inspector?.width ?? 0).toBeGreaterThanOrEqual(322);
  expect(geometry.inspector?.width ?? 0).toBeLessThanOrEqual(346);
  expect(geometry.toolbar?.height ?? 0).toBeGreaterThanOrEqual(48);
  expect(geometry.toolbar?.height ?? 0).toBeLessThanOrEqual(52);
  expect(geometry.canvas?.width ?? 0).toBeGreaterThan(500);
  expect(Math.abs((geometry.navigatorTabs?.top ?? 0) - (geometry.toolbar?.top ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((geometry.toolbar?.top ?? 0) - (geometry.inspector?.top ?? 0))).toBeLessThanOrEqual(1);
  expect(geometry.contextDisplay).toBe('none');
  expect(geometry.documentBarDisplay).toBe('none');

  await expect(contextBar).toBeHidden();
  await expect(documentBar).toBeHidden();
});

test('reference builder keeps compact touch-safe layout on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/editor');

  const openNavigation = page.getByRole('button', { name: 'Open navigation' });
  const navigator = page.getByRole('complementary', { name: 'Builder navigator' });
  const canvasToolbar = page.getByRole('toolbar', { name: 'Canvas commands' });

  await expect(openNavigation).toBeVisible();
  await expect(navigator).toBeVisible();
  await expect(canvasToolbar).toBeVisible();

  const geometry = await page.evaluate(() => {
    const navButton = document.querySelector<HTMLElement>('button[aria-label="Open navigation"]')?.getBoundingClientRect();
    const tabs = [...document.querySelectorAll<HTMLElement>('.builder-context-tabs button')].map((button) => button.getBoundingClientRect().height);
    const toolbarControls = [...document.querySelectorAll<HTMLElement>('.canvas-command-bar-v2 button, .canvas-command-bar-v2 select')]
      .filter((element) => getComputedStyle(element).display !== 'none')
      .map((element) => element.getBoundingClientRect().height);

    return {
      viewportWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      navWidth: navButton?.width ?? 0,
      navHeight: navButton?.height ?? 0,
      tabHeights: tabs,
      toolbarControlHeights: toolbarControls,
    };
  });

  expect(geometry.rootScrollWidth).toBe(geometry.viewportWidth);
  expect(geometry.navWidth).toBeGreaterThanOrEqual(44);
  expect(geometry.navHeight).toBeGreaterThanOrEqual(44);
  expect(geometry.tabHeights.every((height) => height >= 44)).toBe(true);
  expect(geometry.toolbarControlHeights.every((height) => height >= 44)).toBe(true);
});
