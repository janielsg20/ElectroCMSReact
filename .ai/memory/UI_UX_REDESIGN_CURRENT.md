# UI/UX Redesign — Current Durable State

## Permanent contract
- Source of truth: `.ai/UI_UX_REDESIGN_MASTER.md`.
- Execution plan: `.ai/UI_UX_REDESIGN_PHASES.md`.
- This redesign is presentation-only. Functional phases/tracking remain independent.

## Current UI phase
**UI-01 — Foundation / Product Shell — DONE**

Next: **UI-02 — Builder Workspace**.

## Durable decisions
- Tailwind CSS v4 is the official visual styling foundation for the ElectroCMS application chrome.
- Do not create demo/preview UIs parallel to the product.
- Do not show red dots, development badges or permanent `coming soon` indicators.
- Future surfaces may exist structurally; unavailable actions are disabled/omitted discreetly.
- Preserve ProjectSession, canonical editor state, routing, persistence, registries and test contracts.
- Identity foundation: Graphite + Porcelain/Warm Neutral + Teal primary accent + restrained Violet secondary accent.
- Migrated surfaces use semantic tokens instead of hard-coded product colors.
- Canvas remains the dominant editor surface.

## UI-01 completed
- Added `.ai/UI_UX_REDESIGN_UI01_AUDIT.md`.
- Added `src/app/ui/ui-foundation.css` with semantic design tokens and shared control/panel foundation.
- Loaded the V2 foundation from `src/main.tsx`.
- Rebuilt `AppHeader` as the V2 Project Bar while preserving document, breakpoint, zoom, history, theme-mode, Preview and Publish controls.
- Rebuilt `ProductionStudio` shell, workspace navigation and module navigation.
- Migrated Insert Library shell styling while preserving the real widget registry and insertion behavior.
- Migrated Preview, Backend and Export shell surfaces to the V2 identity.
- Removed `ImplementationState`, `ImplementationDot` and all red development-state indicators from the product UI.
- Preserved workspace position/collapse/display/density/order preferences and responsive drawer behavior.
- Quality Gate #1132 PASS: verify:repo, lint, TypeScript, unit, coverage, build and Playwright E2E all green.

## UI-02 target
Redesign the real Builder Workspace around a canvas-first professional no-code workflow:
1. Recompose Insert Library / Layers / Canvas / Inspector relationships.
2. Reduce permanent chrome around the canvas.
3. Create contextual editing surfaces instead of static tool clutter.
4. Redesign selection, commands, geometry and inspector presentation without changing canonical behavior.
5. Preserve drag/drop, selection, multiselection, snapping, responsive styles, undo/redo and generated inspector contracts.
6. Validate desktop/tablet/mobile plus the full GitHub Actions quality gate before UI-03.
