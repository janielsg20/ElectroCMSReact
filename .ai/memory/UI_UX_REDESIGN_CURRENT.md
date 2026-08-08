# UI/UX Redesign — Current Durable State

## Permanent contract
- Source of truth: `.ai/UI_UX_REDESIGN_MASTER.md`.
- Execution plan: `.ai/UI_UX_REDESIGN_PHASES.md`.
- This redesign is presentation-only. Functional phases/tracking remain independent.

## Current UI phase
**UI-01 — Foundation / Product Shell — IN_PROGRESS**

## Decisions
- Tailwind CSS v4 is the official visual styling foundation for the ElectroCMS application chrome.
- Do not create demo/preview UIs parallel to the product.
- Do not show red dots, development badges or permanent `coming soon` indicators.
- Future surfaces may exist structurally; unavailable actions are disabled/omitted discreetly.
- Preserve ProjectSession, canonical editor state, routing, persistence, registries and test contracts.
- New identity foundation: Graphite + Porcelain/Warm Neutral + Teal primary accent + restrained Violet secondary accent.
- Design uses semantic tokens instead of hard-coded colors wherever a surface is migrated.
- Canvas remains the dominant editor surface.

## UI-01 work started
- Added `.ai/UI_UX_REDESIGN_UI01_AUDIT.md`.
- Added `src/app/ui/ui-foundation.css` with semantic design tokens and shared control/panel foundation.
- Loaded the V2 foundation before Studio styling from `src/main.tsx`.

## UI-01 next steps
1. Remove `ImplementationState` / `ImplementationDot` visual development indicators from `ProductionStudio`.
2. Replace hard-coded blue/slate chrome colors with semantic ElectroCMS V2 tokens.
3. Recompose global bar + primary workspace navigation + Studio domains.
4. Rebalance navigation width and canvas priority.
5. Validate tablet/mobile drawers and root overflow.
6. Full GitHub Actions quality gate before UI-02.
