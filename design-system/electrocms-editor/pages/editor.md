# Editor workspace override — Studio Pro

This file specializes `../MASTER.md` for the visual Builder.

## Primary task
Build and manipulate a page visually while preserving canonical structure, responsive behavior and a practical canvas viewport at every editor size.

## Visual reference contract
The supplied professional visual-builder screenshot is the direct layout reference. The authoring chrome is a flat precision workspace, not a card-grid/dashboard composition.

Required visual rules:
- continuous white/light-gray work surfaces;
- fine 1px separators;
- no decorative card mosaics or card-grid composition;
- control radii are intentionally small: roughly 2–6px;
- larger radii are reserved only for transient mobile sheets/dialogs and stay restrained;
- secondary icons and menus remain monochrome;
- saturated blue is concentrated in primary actions plus precise focus/selection indicators;
- shadows are minimal and used mainly for transient overlays or authored-document separation.

## Desktop composition

```text
┌──────────────────────────────────────────────────────────────────┐
│ App toolbar                                                      │
├──────┬────────────────┬────────────────────────┬─────────────────┤
│ Rail │ Pages /        │ Canvas toolbar         │ Properties      │
│      │ Components     ├────────────────────────┤ inspector       │
│      │ + Widget Tree  │ Visual canvas          │                 │
└──────┴────────────────┴────────────────────────┴─────────────────┘
```

Target geometry:
- app toolbar ≈64px;
- global rail ≈60px;
- navigator = 300px desktop column;
- inspector ≈336px;
- canvas receives all remaining width.

Pages/Components tabs, canvas toolbar and inspector align to one top edge. No negative toolbar offsets or redundant Builder rows are allowed.

### Pages / Components navigator
On desktop the navigator is a persistent, full-height 300px column. It must never collapse, disappear behind the canvas, inherit opacity/visibility from compact mode or shrink below its contract width.

Pages view contains:
- visible Pages/Components tabs;
- real project document rows;
- active-document state;
- canonical Widget Tree with hierarchy guides.

Components view contains:
- search field;
- category filters;
- actual insertable registry widgets;
- compact neutral tiles with small radii and no category color palette.

## Compact/mobile composition
Compact mode (`<=960px`) is not a stacked desktop layout.

```text
┌──────────────────────────┐
│ Menu | Document | Actions│
├──────────────────────────┤
│                          │
│      Visual canvas       │
│                          │
│                          │
├──────────────────────────┤
│ Pages | Add | Layers |   │
│              Properties  │
└──────────────────────────┘
```

The four bottom destinations open temporary sheets. Only the requested sheet occupies space; the canvas remains the default workspace.

### Pages
Opens page navigation + canonical Widget Tree.

### Add
Opens component search/categories. Successful insertion closes the sheet and returns focus/context to the canvas workflow.

### Layers
Opens the existing Layers navigator as a modal sheet, without creating parallel hierarchy state.

### Properties
Opens the existing schema-driven inspector as a modal sheet. If nothing is selected, the normal empty inspector state is shown.

## Mobile accessibility
- dock controls >=48px;
- sheet Close controls >=48px;
- sheets use dialog semantics and `aria-modal`;
- Close receives initial focus;
- Escape dismisses the current sheet;
- backdrop provides an additional dismissal path;
- gesture-only dismissal is forbidden;
- hidden panels are not left as hidden focusable DOM regions;
- root horizontal overflow is forbidden;
- safe-area bottom inset is respected by the dock.

## Canvas
- neutral/dotted workspace remains distinct from authored content;
- stable top-center scaling origin;
- local overscroll containment;
- browser zoom remains enabled;
- compact mode reserves bottom canvas padding for the dock;
- contextual command bar is hidden when there is no selection on compact layouts;
- when visible on touch layouts, contextual controls use >=48px targets and local horizontal scrolling.

## Header on phone
The phone header becomes a single 60px row:
- 48px navigation trigger;
- flexible active-document selector;
- touch-safe primary action(s).

Desktop-only secondary controls may leave the phone header to protect the canvas; they must remain available through another explicit UI path when they are required for mobile authoring.

## DnD and canonical behavior
- valid insertion zones are visible during drag;
- hit-area geometry does not animate;
- target semantics remain `parentId + index`;
- all structural changes use canonical commands;
- DOM placement is never project structure source of truth;
- mobile sheets only change presentation, never project data architecture.

## Acceptance signals
A professional user can immediately answer:
- What document is open?
- What is selected?
- Where are Pages, Add, Layers and Properties?
- Are Pages and Components visibly available on desktop without opening another workspace?
- Can I close the active panel without knowing a gesture?
- Is the canvas still large enough to work on a phone/tablet?
- Can I navigate with keyboard/touch without horizontal page overflow?
- Are changes still using the same canonical undoable commands as desktop?
