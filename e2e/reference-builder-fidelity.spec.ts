import { expect, test } from '@playwright/test';

test('Studio Pro desktop builder keeps the supplied flat visual-builder geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/editor');

  const rail = page.locator('.workspace-navigation[data-studio-rail="true"]');
  const navigator = page.getByRole('complementary', { name: 'Builder navigator' });
  const pagesTab = navigator.getByRole('tab', { name: 'Pages' });
  const componentsTab = navigator.getByRole('tab', { name: 'Components' });
  const canvasToolbar = page.getByRole('toolbar', { name: 'Canvas commands' });
  const canvasStage = page.locator('.canvas-stage-v2');
  const inspectorDock = page.locator('.canvas-inspector-dock');
  const contextBar = page.locator('.studio-context-bar');
  const documentBar = page.locator('.builder-document-bar');

  await expect(rail).toBeVisible();
  await expect(navigator).toBeVisible();
  await expect(pagesTab).toBeVisible();
  await expect(componentsTab).toBeVisible();
  await expect(navigator.locator('.builder-page-row').first()).toBeVisible();
  await expect(navigator.getByRole('tree', { name: 'Current document widget tree' })).toBeVisible();
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
    const radius = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      return element ? Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) : null;
    };

    const railButtons = [...document.querySelectorAll<HTMLElement>('.studio-rail-button')].slice(0, 8);
    const railIconColors = railButtons.flatMap((button) => {
      const icon = button.querySelector<SVGElement>('svg');
      return icon ? [getComputedStyle(icon).color] : [];
    });
    const firstRailButton = railButtons[0];
    const stage = document.querySelector<HTMLElement>('.canvas-stage-v2');
    const publish = document.querySelector<HTMLElement>('.header-actions button:last-child');
    const insert = document.querySelector<HTMLElement>('.canvas-command-primary');
    const navigatorElement = document.querySelector<HTMLElement>('.builder-context-panel');

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
      navigatorDisplay: navigatorElement ? getComputedStyle(navigatorElement).display : '',
      navigatorVisibility: navigatorElement ? getComputedStyle(navigatorElement).visibility : '',
      railIconColors,
      railTransitionDuration: firstRailButton ? getComputedStyle(firstRailButton).transitionDuration : '',
      stageBackgroundImage: stage ? getComputedStyle(stage).backgroundImage : '',
      publishBackground: publish ? getComputedStyle(publish).backgroundColor : '',
      insertBackground: insert ? getComputedStyle(insert).backgroundColor : '',
      railButtonRadius: radius('.studio-rail-button'),
      headerControlRadius: radius('.header-controls > div'),
      pageRowRadius: radius('.builder-page-row'),
      canvasDocumentRadius: radius('.canvas-scaled-document'),
      inspectorTabRadius: radius('.widget-inspector-tabs button'),
    };
  });

  expect(geometry.rootScrollWidth).toBe(geometry.viewportWidth);
  expect(geometry.header?.height ?? 0).toBeGreaterThanOrEqual(60);
  expect(geometry.header?.height ?? 0).toBeLessThanOrEqual(65);
  expect(geometry.rail?.width ?? 0).toBeGreaterThanOrEqual(58);
  expect(geometry.rail?.width ?? 0).toBeLessThanOrEqual(62);
  expect(geometry.navigator?.width ?? 0).toBeGreaterThanOrEqual(298);
  expect(geometry.navigator?.width ?? 0).toBeLessThanOrEqual(302);
  expect(geometry.navigator?.height ?? 0).toBeGreaterThan(850);
  expect(geometry.navigatorDisplay).toBe('flex');
  expect(geometry.navigatorVisibility).toBe('visible');
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
  expect(new Set(geometry.railIconColors).size).toBe(1);
  expect(geometry.railTransitionDuration).not.toMatch(/^0s(?:, 0s)*$/);
  expect(geometry.stageBackgroundImage).toContain('radial-gradient');
  expect(geometry.publishBackground).toBe('rgb(37, 99, 235)');
  expect(geometry.insertBackground).toBe('rgb(37, 99, 235)');
  expect(geometry.railButtonRadius ?? 99).toBeLessThanOrEqual(4.5);
  expect(geometry.headerControlRadius ?? 99).toBeLessThanOrEqual(4.5);
  expect(geometry.pageRowRadius ?? 99).toBeLessThanOrEqual(3.5);
  expect(geometry.canvasDocumentRadius ?? 99).toBeLessThanOrEqual(4.5);
  expect(geometry.inspectorTabRadius ?? 99).toBeLessThanOrEqual(3.5);

  await componentsTab.click();
  await expect(navigator.getByLabel('Search elements')).toBeVisible();
  const firstComponent = navigator.locator('button[aria-label^="Add "]').first();
  await expect(firstComponent).toBeVisible();
  const componentRadius = await firstComponent.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
  );
  expect(componentRadius).toBeLessThanOrEqual(4.5);

  await pagesTab.click();
  await expect(navigator.locator('.builder-page-row').first()).toBeVisible();
  await expect(contextBar).toBeHidden();
  await expect(documentBar).toBeHidden();
});
