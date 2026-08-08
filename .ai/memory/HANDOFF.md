# HANDOFF.md

## Current state
F04 implementation is functionally complete on `agent/f04-widgets-inspector-themes` / PR #5. GitHub Actions run #622 is fully green, including widget registry, inspector, style/breakpoint, theme selection and theme package import/export E2E. Closing documentation/hygiene must pass one final CI run before merge.

## Durable F04 facts
- Widget contracts are framework-neutral in `src/core/widgets`; React preview binding lives in `src/app/widgets`.
- Widgets resolve by `type@version`; adding a plugin widget must not require branching `CanvasRenderer` by type.
- Built-ins include 10 structural + 16 basic/content + 19 modeled dynamic/commerce/form/filter contracts.
- Dynamic/commerce/form/filter remain honestly `modeled`; do not fake F05/F06 behavior inside F04 widgets.
- Inspector is generated from widget schema and writes validated reversible commands only.
- `DocumentNode.styles` / `ResponsiveStyleSet` remains the only responsive style source.
- Breakpoint engine resolves wider/narrower and dynamic inherited values.
- DnD hit areas remain stable during a native drag; transient `data-*` paint state is allowed, React rerender during `dragstart` is not.
- Editor design source of truth: `design-system/electrocms-editor/MASTER.md` + `pages/editor.md`.
- Design references selected from `nextlevelbuilder/ui-ux-pro-max-skill`: `ui-ux-pro-max`, `design-system`, `ui-styling`.
- Editor product archetype: productivity tool + component/design-system tooling + data-dense SaaS; it must feel like a professional no-code builder, not a generic card dashboard.
- Editor mode/preset are workspace preferences and never alter generated project themes.
- `frontendThemeId` and `backendThemeId` are canonical project data and autosave independently.
- `ProjectThemeRegistry` validates scope, IDs, versions and portable JSON tokens.
- Built-in project themes: 8 frontend + 7 backend.
- Theme packages use `kind=electrocms-theme-package`, `schemaVersion=1`, max 256 KB.
- Imported theme definitions live locally at `electrocms:project-theme-packages:v1`; canonical projects store only selected IDs.
- Theme package IDs cannot collide with built-ins/installed packages.
- Vercel auto-deploy is disabled. Never deploy unless the user explicitly asks.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, then this handoff.
2. Confirm PR #5 final closing CI is green.
3. Merge PR #5 to `main` by squash only after that final gate.
4. Re-read the exact F05 phase README/microphase contract from `phases/`; do not infer its scope from F04.
5. Create a fresh F05 branch from merged `main`.
6. Preserve widget registry, inspector, responsive style engine, theme registries and package boundaries; do not introduce parallel versions.
7. Apply `design-system/electrocms-editor/MASTER.md` to every new editor UI surface.
8. Keep Preview/Backend/Export scope honest until their dedicated render/export phases.

## Next phase
F05 — resolve exact title from the phase contract before implementation.

## Next microphase
Resolve the first MF listed by the F05 README after merge; do not guess the identifier or title.
