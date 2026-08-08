# HANDOFF.md

## Current state
ElectroCMS has completed the large Studio UI redesign and subsequent UI hardening on `main`. A new user-directed refinement is in progress on `agent/unified-bento-high-density-ui`.

The active UI rule is now: **one editor theme only — Bento High Density**. The former selectable editor presets (High Density, Bento, Minimal, Material, SaaS, Enterprise, Glass, Sophisticated Dark, Monochrome and Developer Console) are retired from the editor UI. Light/dark/auto remain appearance modes of the same Bento system.

## Current branch work
- Editor preset registry now exposes only `bento-high-density`.
- Legacy schema-v1 workspace preference payloads normalize old preset IDs to `bento-high-density`.
- The AppHeader no longer exposes an editor preset selector.
- A final override layer `src/app/ui/bento-high-density.css` is loaded after the existing V2 Studio/Builder CSS.
- The unified layer applies Bento grouping, high-density spacing, consistent surfaces, menu/button/icon motion, selected/pressed/focus states, drawer/popover transitions and responsive canvas adjustments.
- Canvas stage uses contained overscroll, stable top-center document transform origin, progressive mobile padding and bounded lower inspector behavior.
- Existing project frontend/backend themes remain untouched and independent.
- Design source of truth has been updated in `design-system/electrocms-editor/MASTER.md` and `pages/editor.md`.
- Unit/E2E expectations for the retired preset selector have been updated.

## Non-negotiable UI facts
- One editor visual language: Bento High Density.
- Light/dark/auto are appearance modes, not alternate editor themes.
- Primary workspace/module navigation uses shared iconography and accessible names.
- Motion explains hover/press/selected/open states and uses transforms/opacity where practical.
- `prefers-reduced-motion` and `prefers-contrast: more` are respected.
- Mobile critical controls target at least 44px.
- Root document must not overflow horizontally.
- Canvas/editor DOM remains a projection of canonical state.
- Native DnD hit-area geometry must stay stable during drag.
- Project frontend/backend theme registry and package system remain separate from editor appearance.

## Validation required before merge
Use GitHub Actions as the official quality gate because the ChatGPT sandbox cannot reach the npm registry. Required green checks remain repository verification, lint with zero unexpected warnings, TypeScript, unit/integration tests, coverage, Playwright E2E and production build.

## Next action
1. Open/inspect the draft PR for `agent/unified-bento-high-density-ui -> main`.
2. Run the complete GitHub Actions quality gate.
3. Fix any test/type/style regressions reported by CI.
4. Merge only after the complete gate is green.
5. Do not reintroduce selectable editor UI presets in later phases unless the user explicitly reverses this decision.
