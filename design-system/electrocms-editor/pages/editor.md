# Editor workspace override — Bento High Density

This file overrides `../MASTER.md` only for the main visual editor workspace.

## Primary task
Build and manipulate a page visually while preserving exact canonical structure, responsive behavior and a practical canvas viewport on desktop, tablet and mobile.

## Visual hierarchy
1. Canvas/document is the dominant surface.
2. Current selection is the strongest local signal.
3. Contextual commands and inspector are secondary to the selected object.
4. Insert library is discoverable but must not starve the canvas.
5. Navigation and global project controls remain visually quieter than editing state.

## Desktop composition
The editor uses a compact Bento workspace:

```text
┌──────────────────────────────────────────────────────────────┐
│ Global Bento header / project / breakpoint / history        │
├──────────┬───────────┬───────────────────────┬───────────────┤
│ Studio   │ Elements  │                       │ Inspector     │
│ rail     │ library   │    Visual canvas      │ properties    │
│          │           │                       │ styles        │
│          │           │                       │ responsive    │
└──────────┴───────────┴───────────────────────┴───────────────┘
```

Major zones read as related Bento modules through consistent gap, border, radius and elevation. Internal rows remain flatter for scan speed.

## Canvas rules
- Preserve a neutral workspace around the document so project design is not confused with editor chrome.
- Document boundary must remain obvious at every zoom level.
- Use a stable top-center transform origin for the scaled document.
- Contain canvas scroll/pan locally; the root document must never overflow horizontally.
- Use intentional `overscroll-behavior` so canvas scrolling does not unexpectedly chain into the app shell.
- Grid/guides/snapping are functional overlays, never persisted decoration.
- Selection outline remains legible over light, dark and colorful content.
- Locked and hidden states require text/icon/shape signals beyond opacity.
- Empty state teaches the next action without consuming excessive canvas area.

## Responsive canvas behavior
### Laptop
- Reduce inspector width before shrinking the document work area excessively.
- Low-priority geometry command groups may collapse before primary commands.

### Tablet
- Insert library becomes a compact horizontal strip.
- Inspector docks below the canvas.
- Canvas keeps local scrolling and usable vertical space.

### Mobile
- Use 44px critical targets.
- Command bar scrolls locally.
- Insert library remains horizontal and compact.
- Inspector stays below the canvas with a bounded viewport height.
- Canvas stage padding reduces to preserve usable working area.
- Do not force the full desktop document to fit width; preserve zoom/pan behavior instead.

## DnD rules
- While dragging, valid insertion zones become visible before pointer entry.
- Root/sibling insertion zones receive larger hit areas than idle spacers.
- Drag source receives reduced-emphasis styling but remains identifiable.
- Do not animate hit-area geometry during precision drag.
- Exact target index remains semantic `parentId + index`, never DOM position inference.
- Icon/button micro-motion must use transforms that do not change DnD layout geometry.

## Command bar
- Prioritize insert, clipboard, grouping, visibility/lock, layers, geometry and history-related actions.
- High-frequency actions use shared iconography.
- Define explicit hover/focus/pressed/selected/disabled states.
- Horizontal local scrolling is acceptable; root overflow is not.
- Touch layouts expand critical buttons to at least 44px.

## Element library
- Search remains immediately available.
- Category filtering stays compact.
- Element groups use icon + label.
- Tiles use dense Bento cells with clear hover/focus/press states.
- Tablet/mobile horizontal mode must remain keyboard-scrollable and touch-friendly.

## Inspector
- Persistent right-side panel on wide desktop.
- Lower dock on narrow layouts.
- Common fields remain visible; long schemas use accessible collapsible sections.
- Content/style tabs show a persistent selected state.
- Responsive source/inherited/unset state remains adjacent to responsive properties.
- Failed validation never silently mutates the canonical node.

## Motion
- Selection: immediate or ≤100ms.
- Hover/press/icon feedback: 80–140ms.
- Panel/drawer reveal: 140–220ms.
- DnD insertion feedback: immediate.
- Animate transform/opacity rather than layout dimensions.
- Respect `prefers-reduced-motion`.

## Acceptance signals
A professional user should be able to answer instantly:
- What document am I editing?
- What breakpoint am I viewing?
- What is selected?
- Where will this dragged node be inserted?
- Is this element locked or hidden?
- Are changes saved?
- Can I undo this operation?
- Where are elements, layers and properties?
- Can I still work comfortably when the viewport becomes tablet/mobile sized?
