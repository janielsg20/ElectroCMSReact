# HANDOFF.md

## Current state
User-directed visual refinement is active on `agent/studio-reference-ui-polish` / draft PR #38.

## Active UI rule
One editor visual system only: **Studio Pro (`studio-pro`)**.

- No selectable editor visual presets.
- `light` / `dark` / `auto` are appearance modes of Studio Pro.
- Frontend/backend project themes remain independent.
- Unknown persisted editor preset IDs normalize to `studio-pro`.

## Product reference
The supplied professional visual-builder screenshot is the primary composition reference.

Desktop target:
- continuous application toolbar ≈64px;
- technical icon rail ≈60px;
- Pages/Components navigator ≈300px;
- dominant flexible canvas;
- Properties inspector ≈336px;
- navigator tabs / canvas toolbar / inspector aligned at the same top edge.

The rail must not repeat the application logo. Use restrained 1px separators, modest radii and minimal elevation.

## Color and motion contract
Color is functional and intentionally limited:
- blue → navigation/editor selection;
- violet → creation/publishing;
- cyan/green → data/actions;
- amber → settings/state;
- neutral slate → secondary commands.

Microinteraction target: 140–180ms, mostly transform/color/opacity. Icon hover may lift/scale slightly; pressed states compress slightly. Active destination icons can use a short one-shot pop. Respect `prefers-reduced-motion` and never animate precision canvas geometry.

## Compact/mobile Builder
At <=960px persistent left navigator and right inspector stay out of layout flow.

Default experience:
- one-row compact header;
- canvas-first;
- bottom dock: Pages / Add / Layers / Properties;
- each destination opens an accessible bottom sheet;
- `Escape`, explicit Close and backdrop dismissal supported;
- close action receives initial focus;
- touch targets >=48px;
- dock respects safe-area inset;
- root horizontal overflow forbidden.

The mobile dock uses the same restrained functional tones as desktop, not a separate mobile theme.

## Inspector
Visible tabs are now **Properties** and **Design**. This is presentation language only; underlying canonical content/style mutation APIs remain unchanged.

## Invariants
- Canvas DOM remains projection of canonical state.
- DnD hit geometry remains stable.
- Widget Tree derives from canonical document nodes/children.
- Layers/Inspector mobile presentation does not create parallel project state.
- Project theme registry/package system remains separate from editor appearance.
- Browser zoom remains enabled.

## Files
- `src/app/ui/studio-pro-tailwind.css` → Tailwind-first base.
- `src/app/ui/studio-pro.css` → final reference fidelity, compatibility resets, functional color and motion.
- `src/app/editor/inspector/WidgetInspector.tsx` → Properties/Design language.
- `src/app/studio/ProductionStudio.test.tsx` → updated inspector semantics.
- `design-system/electrocms-editor/MASTER.md` → visual contract.

## Validation
GitHub Actions is authoritative: repository verification, zero-warning lint, TypeScript, unit/integration, coverage, production build and Playwright E2E must all pass.

Latest known intermediate run #1361 proved repository/lint/types green and exposed one obsolete unit expectation for old inspector tab names. That expectation was corrected on the current branch. Use the latest PR #38 head/run as the only final validation source.

## Next action
1. Wait for the latest PR #38 Quality Gate.
2. Fix concrete regressions rather than weakening geometry/mobile accessibility tests.
3. Record the definitive green run in PR/memory.
4. Keep PR draft until the user explicitly asks to merge.
