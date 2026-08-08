# ElectroCMS Production Studio

This document defines the permanent application shell that replaces the previous legacy workspace chrome and the temporary Final Product Demo mode.

## Status

The Production Studio is the real ElectroCMS interface. It is not a demo mode and does not require a query parameter.

## Architecture

The permanent shell contains:

1. Top command bar — project identity, local save state, active document, breakpoint, zoom, undo/redo, editor theme, preview and publish.
2. Primary workspace rail — Editor, Preview, Backend and Export.
3. Studio module rail — Builder, Pages, Content, Queries, Forms, Filters, Media, Themes, Roles, Blueprints and Settings.
4. Builder Insert Library — generated from the real widget registry.
5. Real EditorCanvas — canonical canvas, selection, move, insert, history and snapping.
6. Real WidgetInspector — generated from widget schemas.
7. Permanent module surfaces — future modules stay visible in the real product shell while their runtime implementations are delivered.

## Progressive activation

A small red dot means the underlying capability is not fully production-ready yet.

Rules:
- never hide a planned product module merely because implementation is pending;
- never report a red-dot capability as complete;
- remove the dot only when the relevant implementation has a valid quality gate;
- implemented controls must use the canonical project/session APIs rather than parallel demo state;
- production surfaces may contain disabled/reserved controls until their application/domain contracts exist.

## Current connected surfaces

- Builder: real EditorCanvas, real widget registry insertion, real WidgetInspector, real project history.
- Themes: real frontend/backend ProjectThemeControls.
- Header: real document, breakpoint, zoom, undo/redo, theme preferences and local save state.

## Current reserved surfaces

Pages, Content, Queries, Forms, Filters, Media, Roles, Blueprints, full Preview renderer, Backend Builder runtime and Export targets remain permanently visible and carry red-dot implementation markers until their phases are complete.

## UI/UX rules

The shell follows the ElectroCMS MASTER design system and public UI/UX Pro Max guidance:
- Minimal/Swiss clarity for an enterprise authoring tool;
- high-density information architecture;
- SVG icons instead of emoji icons;
- visible hover, active and focus-visible states;
- WCAG-conscious contrast;
- touch targets expand on small screens;
- responsive layouts considered at 375px, 768px, 1024px and 1440px;
- prefers-reduced-motion is respected;
- canvas remains the dominant flexible workspace on desktop.
