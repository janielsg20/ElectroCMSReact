# HANDOFF.md

## Current state
User-directed UI work is active on `agent/unified-bento-high-density-ui` / draft PR #36. The branch name is historical: **Bento is no longer the product visual system**.

## Active UI rule
One editor visual system only: **Studio Pro (`studio-pro`)**, Tailwind-first.

- No selectable editor visual presets.
- `light` / `dark` / `auto` are appearance modes of Studio Pro.
- Frontend/backend project themes remain independent.
- Legacy preference values such as `bento-high-density` normalize to `studio-pro`.

## Files / implementation
- `src/app/ui/studio-pro-tailwind.css` is the single final visual layer.
- Old Bento/polish/reference override CSS files were removed from the bundle/repository.
- `ProductionStudio` owns desktop rail/navigator and compact canvas-first dock/sheets.
- `EditorCanvas` supports controlled mobile Layers/Properties sheets without duplicating canonical state.
- `WidgetLibrary` supports initial Pages/Components tab for mobile sheets.

## Desktop Builder
Target layout follows the supplied professional visual-builder reference:
- ~60px top toolbar;
- ~60px icon rail;
- ~276–304px Pages/Components navigator;
- dominant flexible canvas;
- ~318–344px Properties inspector;
- aligned navigator tabs / canvas toolbar / inspector top edge.

## Compact/mobile Builder
At <=960px persistent left navigator and right inspector are removed from layout flow.

Default experience:
- canvas-first;
- bottom dock: Pages / Add / Layers / Properties;
- each destination opens a temporary accessible bottom sheet;
- `Escape`, explicit Close and backdrop dismissal supported;
- close action receives initial focus;
- compact touch targets >=48px;
- dock respects safe-area inset;
- command bar is hidden when there is no selection.

At phone widths the app header becomes one ~60px row: navigation + active document + primary action area.

## Invariants
- Canvas DOM remains projection of canonical state.
- DnD hit geometry remains stable.
- Widget Tree derives from canonical document nodes/children.
- Layers/Inspector mobile presentation does not create parallel project state.
- Project theme registry/package system remains separate from editor appearance.
- Root horizontal overflow is forbidden.
- Browser zoom remains enabled.

## Tests added/updated
- Studio Pro preset persistence/migration tests.
- Desktop professional geometry E2E.
- Mobile canvas dominance, 48px dock controls and no-root-overflow E2E.
- Pages/Add/Layers/Properties sheet open/close/focus/Escape E2E.
- Compact drawer/settings containment E2E.

## Validation
GitHub Actions is authoritative: repository verification, zero-warning lint, TypeScript, unit/integration, coverage, production build and Playwright E2E must all pass.

A first rebuild run exposed `react-hooks/set-state-in-effect` in `BuilderWorkspace`; it was corrected by remounting Builder across desktop/compact modes rather than synchronously resetting state in an effect.

## Next action
1. Inspect the latest PR #36 head and Quality Gate.
2. Fix any lint/type/unit/build/E2E regression exactly rather than weakening tests.
3. Record the definitive green run in PR/memory.
4. Keep PR draft until the user explicitly asks to merge.
5. Do not reintroduce Bento or selectable editor presets unless the user explicitly reverses this decision.
