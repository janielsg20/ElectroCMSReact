# HANDOFF.md

## Current state
ElectroCMS has completed the large Studio UI redesign and subsequent UI hardening on `main`. The user-directed refinement continues on `agent/unified-bento-high-density-ui` / PR #36.

The active UI rule is: **one editor theme only — Bento High Density**. Former selectable editor presets remain retired. Light/dark/auto are appearance modes of the same Bento system.

## Current branch work
- Editor preset registry exposes only `bento-high-density`; legacy workspace payloads normalize old preset IDs to it.
- AppHeader exposes no editor preset selector and now models editor commands as an accessible toolbar, zoom/history as command groups and save state as a live status.
- `src/app/ui/bento-high-density.css` defines the unified base treatment.
- `src/app/ui/bento-modern-polish.css` is a final composition layer for the same theme, not a second theme.
- Modern polish aligns app header, workspace frame, navigation rail, module headers, tabs, project panels, element library, canvas and inspector around one Bento rhythm.
- Mobile header uses two rows: project/actions first, editor controls second, avoiding competition for horizontal space.
- Compact navigation settings stay contained inside the drawer rather than rendering outside the viewport.
- Workspace module headers use clearer task hierarchy and full usable width; repeated legacy panel/card styles normalize to shared Bento surfaces.
- Capability labels render as informational status chips, not disabled-action lookalikes.
- Canvas stage remains locally scrollable with contained overscroll, stable top-center document transform origin, adaptive padding and bounded lower inspector behavior.
- Tablet/mobile element library uses a horizontal strip with increased usable height.
- Focusable controls receive scroll margin so keyboard focus is less likely to be obscured by dense/sticky chrome.
- Forced-colors, increased-contrast and reduced-motion modes are respected.
- Existing project frontend/backend themes remain untouched and independent.
- E2E coverage includes mobile no-root-overflow, >=44px navigation target and compact drawer containment.

## Design guidance applied
- Preserve context and predictable control positions while adapting layout across sizes.
- Group related controls/surfaces and give the primary task the strongest visual priority.
- Use motion for state explanation only, primarily transform/opacity.
- WCAG 2.2 focus visibility and target-size guidance informs keyboard/touch behavior.
- Do not migrate framework/component architecture merely for styling; retain the current React/TypeScript/Tailwind/CSS contracts.

## Non-negotiable UI facts
- One editor visual language: Bento High Density.
- Light/dark/auto are appearance modes, not alternate editor themes.
- Primary workspace/module navigation uses shared iconography and accessible names.
- Mobile critical controls target at least 44px; desktop high-density controls may remain smaller when spacing and alternate input support are sufficient.
- Keyboard focus must remain visible and should not be hidden behind author-created chrome.
- Root document must not overflow horizontally.
- Canvas/editor DOM remains a projection of canonical state.
- Native DnD hit-area geometry must stay stable during drag.
- Project frontend/backend theme registry and package system remain separate from editor appearance.

## Validation required before merge
GitHub Actions remains the official quality gate. Required green checks: repository verification, lint with zero unexpected warnings, TypeScript, unit/integration tests, coverage, Playwright E2E and production build.

## Next action
1. Inspect the latest PR #36 head and its GitHub Actions run.
2. Fix any regression reported by lint/types/unit/coverage/build/E2E.
3. Update durable memory with the definitive green run number.
4. Keep PR draft until the branch is fully green and reviewed.
5. Merge only after the user explicitly asks to merge or the project workflow explicitly requires it.
6. Do not reintroduce selectable editor UI presets unless the user explicitly reverses this decision.
