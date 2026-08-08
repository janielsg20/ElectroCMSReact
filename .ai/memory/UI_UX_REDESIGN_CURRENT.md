# UI/UX Redesign — Current Durable State

## Permanent contract
- Source of truth: `.ai/UI_UX_REDESIGN_MASTER.md`.
- Execution plan: `.ai/UI_UX_REDESIGN_PHASES.md`.
- This redesign is presentation-only. Functional phases/tracking remain independent.

## Current UI phase
**UI-03 — Pages / Templates / Assets — DONE pending final documented-HEAD gate and merge**

Next after merge: **UI-04** as defined in `.ai/UI_UX_REDESIGN_PHASES.md`.

## Durable decisions
- Tailwind CSS v4 is the official visual styling foundation for the ElectroCMS application chrome.
- Do not create demo/preview UIs parallel to the product.
- Do not show red dots, development badges or permanent `coming soon` indicators.
- Future surfaces may exist structurally; unavailable actions are disabled/omitted discreetly.
- Preserve ProjectSession, canonical editor state, routing, persistence, registries and test contracts.
- Identity foundation: Graphite + Porcelain/Warm Neutral + Teal primary accent + restrained Violet secondary accent.
- Migrated surfaces use semantic tokens instead of hard-coded product colors.
- Canvas remains the dominant editor surface.
- UI must not bypass canonical project/document APIs just to make a control appear functional.

## UI-01 completed
- Added semantic V2 UI foundation and durable redesign documentation.
- Rebuilt Project Bar and Production Studio shell/navigation.
- Removed development-state dots/badges.
- Preserved workspace preferences and responsive navigation.
- Final validation: Quality Gate #1134 PASS.

## UI-02 completed
- Re-composed the real EditorCanvas command bar into Insert, Selection and Geometry clusters without changing command implementations.
- Added `role="toolbar"` / `Canvas commands` as the accessible command surface.
- Added a floating Layers navigator generated directly from `CanonicalDocument.rootNodeId`, `nodes` and `children`.
- Layers reuses `useCanvasSelection`; no parallel selection state or structural store exists.
- Reorganized Widget Inspector into Content and Style tabs while keeping schema-driven props and the existing responsive style engine.
- Refined Inherit/Unset responsive style controls using semantic V2 tokens.
- Added `builder-v2.css` and Builder finishing overrides for the professional canvas-first layout.
- Desktop keeps the canvas dominant with a compact right inspector; tablet/mobile move the inspector below the canvas.
- Redundant non-functional UI-01 Builder buttons are no longer visible.
- Added unit coverage for Layers -> canonical selection -> Content/Style inspector flow.
- Existing style-engine and breakpoint-engine E2E tests were updated only for the intentional UX step of opening Style; their functional assertions remain unchanged.
- Final validation: Quality Gate #1148 PASS; merged into `main` as `149276347a6d9a5c53d547aa1aace100ed18fcc4`.

## UI-03 completed
- Replaced generic Pages and Media feature cards with `PagesAssetsWorkspace`.
- Pages derive from canonical documents where `kind === 'page'`.
- Templates derive from canonical `template`, `header`, `footer`, `single`, `archive` and `404` document kinds.
- Assets derive directly from `CanonicalProject.media`.
- Added dense table/grid views, search, canonical counts, node counts, active-document highlighting and responsive empty states.
- Opening a canonical page/template uses the existing `setActiveDocumentId` and returns to the real Builder.
- Pages and Media module navigation now point to the canonical resource manager.
- No parallel document/media catalog exists.
- ProjectSession currently has no validated project-level command for adding/removing documents or media; therefore UI-03 intentionally keeps `New` disabled rather than mutating `project.documents`, `documentOrder` or `media` directly.
- Initial implementation validation: Quality Gate #1150 PASS.
- Final documented-HEAD gate is required before merge and UI-04.
