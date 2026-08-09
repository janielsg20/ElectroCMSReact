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

## Monochrome color contract
The reference is predominantly neutral. The editor must not use a different accent hue per module.

- rail icons are neutral and consistent;
- component-library icons are neutral;
- mobile Pages/Add/Layers/Properties dock icons are neutral;
- Preview, breakpoint, Settings and secondary toolbar actions are neutral;
- active/current navigation is communicated by neutral surface/weight plus, when useful, one thin blue indicator;
- saturated blue is reserved mainly for primary actions such as Publish/Export and Insert Widget, plus precise selection/focus indicators;
- semantic save/error/warning status indicators may retain their status colors because they communicate state, not decoration.

Do not reintroduce violet/cyan/green/amber module icon palettes.

## Motion contract
Microinteraction target: 140–180ms, mostly transform/color/opacity. Icons may lift/scale slightly on hover; pressed states compress slightly and active destinations may use a short one-shot pop. Motion never changes precision hit geometry. Respect `prefers-reduced-motion`.

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
- phone dock controls >=52px;
- dock respects safe-area inset;
- root horizontal overflow forbidden.

Tablet keeps Active document + Preview breakpoint + Zoom visible. Phone remains intentionally more minimal to protect canvas space.

## Inspector
Visible tabs are **Properties** and **Design**. This is presentation language only; underlying canonical content/style mutation APIs remain unchanged.

## Invariants
- Canvas DOM remains projection of canonical state.
- DnD hit geometry remains stable.
- Widget Tree derives from canonical document nodes/children.
- Layers/Inspector mobile presentation does not create parallel project state.
- Project theme registry/package system remains separate from editor appearance.
- Browser zoom remains enabled.

## Files
- `src/app/ui/studio-pro-tailwind.css` → Tailwind-first base.
- `src/app/ui/studio-pro.css` → reference geometry, compatibility and interaction layer.
- `src/app/ui/studio-pro-compact.css` → final monochrome reference refinements + tablet compact-shell rules.
- `src/app/editor/inspector/WidgetInspector.tsx` → Properties/Design language.
- `e2e/reference-builder-fidelity.spec.ts` → desktop geometry, monochrome rail, primary CTA and motion contract.
- `e2e/studio-pro-mobile.spec.ts` → mobile canvas, monochrome dock, touch and sheet contract.

## Validation
GitHub Actions is authoritative: repository verification, zero-warning lint, TypeScript, unit/integration, coverage, production build and Playwright E2E must all pass.

Latest known fully green baseline before the monochrome pass: Quality Gate #1382. The monochrome pass must obtain a newer complete green gate before being considered final.

## Next action
1. Inspect the latest PR #38 Quality Gate for the current monochrome head.
2. Fix concrete regressions rather than weakening geometry/mobile accessibility tests.
3. Update PR #38 with the definitive green run.
4. Keep PR draft until the user explicitly asks to merge.
