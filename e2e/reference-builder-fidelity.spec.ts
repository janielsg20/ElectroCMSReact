import { expect, test } from '@playwright/test';

test('Studio Pro desktop builder keeps professional reference proportions and aligned work surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/editor');

  const rail = page.locator('.workspace-navigation[data-studio-rail="true"]');
  const navigator = page.getByRole('complementary', { name: 'Builder navigator' });
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

    const railButtons = [...document.querySelectorAll<HTMLElement>('.studio-rail-button')].slice(0, 8);
    const railIconColors = railButtons.flatMap((button) => {
      const icon = button.querySelector<SVGElement>('svg');
      return icon ? [getComputedStyle(icon).color] : [];
    });
    const firstRailButton = railButtons[0];
    const stage = document.querySelector<HTMLElement>('.canvas-stage-v2');

    return {
      viewportWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      header: rect('.app-header'),
      rail: rect('.workspace-navigation[data-studio-rail="true"]'),
      navigator: rect('.builder-context-panel'),
      navigatorTabs: rect('.builder-context-tabs'),
      toolbar: rect('.canvas-command-bar-v2'),
      canvas: rect('.canvas-stage-v2'),
      inspector: rect('.canvas-inspector-dock'),
      contextDisplay: getComputedStyle(document.querySelector<HTMLElement>('.studio-context-bar')!).display,
      documentBarDisplay: getComputedStyle(document.querySelector<HTMLElement>('.builder-document-bar')!).display,
      railHeaderDisplay: getComputedStyle(document.querySelector<HTMLElement>('.studio-rail-header')!).display,
      railIconColors,
      railTransitionDuration: firstRailButton ? getComputedStyle(firstRailButton).transitionDuration : '',
      stageBackgroundImage: stage ? getComputedStyle(stage).backgroundImage : '',
    };
  });

  expect(geometry.rootScrollWidth).toBe(geometry.viewportWidth);
  expect(geometry.header?.height ?? 0).toBeGreaterThanOrEqual(60);
  expect(geometry.header?.height ?? 0).toBeLessThanOrEqual(65);
  expect(geometry.rail?.width ?? 0).toBeGreaterThanOrEqual(58);
  expect(geometry.rail?.width ?? 0).toBeLessThanOrEqual(62);
  expect(geometry.navigator?.width ?? 0).toBeGreaterThanOrEqual(294);
  expect(geometry.navigator?.width ?? 0).toBeLessThanOrEqual(306);
  expect(geometry.inspector?.width ?? 0).toBeGreaterThanOrEqual(330);
  expect(geometry.inspector?.width ?? 0).toBeLessThanOrEqual(342);
  expect(geometry.toolbar?.height ?? 0).toBeGreaterThanOrEqual(50);
  expect(geometry.toolbar?.height ?? 0).toBeLessThanOrEqual(54);
  expect(geometry.canvas?.width ?? 0).toBeGreaterThan(500);
  expect(Math.abs((geometry.navigatorTabs?.top ?? 0) - (geometry.toolbar?.top ?? 0))).toBeLessThanOrEqual(1);
  expect(Math.abs((geometry.toolbar?.top ?? 0) - (geometry.inspector?.top ?? 0))).toBeLessThanOrEqual(1);
  expect(geometry.contextDisplay).toBe('none');
  expect(geometry.documentBarDisplay).toBe('none');
  expect(geometry.railHeaderDisplay).toBe('none');
  expect(new Set(geometry.railIconColors).size).toBeGreaterThan(1);
  expect(geometry.railTransitionDuration).not.toMatch(/^0s(?:, 0s)*$/);
  expect(geometry.stageBackgroundImage).toContain('radial-gradient');

  await expect(contextBar).toBeHidden();
  await expect(documentBar).toBeHidden();
});
