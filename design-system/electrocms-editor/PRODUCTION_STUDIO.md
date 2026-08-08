# ElectroCMS Production Studio

This document defines the permanent ElectroCMS application shell. The temporary Final Product Demo and the previous Studio visual layer have been removed.

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
7. Permanent module surfaces — every product area has a stable place in the shell and receives its runtime implementation as development progresses.

## Progressive activation

Implementation status is not encoded as decorative dots, warning badges or temporary demo language in the product chrome.

Rules:
- product modules remain visible in their final navigation location;
- unavailable actions may be disabled until their application/domain contracts exist;
- implemented controls use canonical project/session APIs rather than parallel UI-only state;
- enabling a feature must not require redesigning or relocating its navigation surface;
- development completion remains documented in TRACKING/MEMORY and validated by quality gates, not exposed as visual noise in the editor.

## Current connected surfaces

- Builder: real EditorCanvas, real widget registry insertion, real WidgetInspector and real project history.
- Themes: real frontend/backend ProjectThemeControls.
- Header: real document, breakpoint, zoom, undo/redo, theme preferences and local save state.
- Workspace navigation: real routing, persistence, layout preferences and responsive drawer behavior.

## Visual system

The production shell uses Tailwind CSS v4 through the official Vite plugin.

Primary direction:
- deep navy application rail;
- cobalt blue primary action and selection color;
- neutral slate working surfaces;
- compact professional typography;
- low-noise borders and restrained elevation;
- SVG iconography throughout;
- no decorative status markers for unfinished development.

The direction intentionally resembles mature professional authoring tools rather than a marketing dashboard: strong hierarchy, dense controls, stable spatial zones and a canvas-first workflow.

## UI/UX rules

The shell follows the ElectroCMS MASTER design system, the public UI/UX Pro Max skill and the React/shadcn/Tailwind guidance used during implementation:
- Minimal/Swiss clarity for an enterprise authoring tool;
- high-density information architecture;
- Tailwind utilities and design tokens for the product chrome;
- SVG icons instead of emoji icons;
- visible hover, active and focus-visible states;
- WCAG-conscious contrast;
- touch targets and navigation adapt for small screens;
- responsive layouts considered at 375px, 768px, 1024px and 1440px;
- prefers-reduced-motion is respected;
- canvas remains the dominant flexible workspace on desktop;
- no DOM state is allowed to replace the canonical editor model.
