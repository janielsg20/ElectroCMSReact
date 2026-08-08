# HANDOFF.md

## Current state
F04 is fully closed and merged into `main` by squash at `57798d9e00f4a3bb87867a847c3bccfccc82f764` after GitHub Actions run #712 PASS.

F05 — Contenido dinámico is active on `agent/f05-dynamic-content` / draft PR #6.

MF-037 — CPT model + editor is DONE. GitHub Actions run #730 is fully green across verify, lint, TypeScript, unit, coverage, Playwright E2E and production build.

Current microphase: MF-038 — Taxonomy model + editor.

## Durable F05 facts from MF-037
- Dynamic content uses existing `CanonicalProject` collections; do not create a second persistence model.
- `CanonicalProject.contentTypes` is the source of truth for CPT definitions.
- `ContentTypeDefinition.version = 1`.
- CPT IDs are kebab-case and immutable after creation; slugs are unique and editable.
- Delete is rejected while records reference the CPT through `contentTypeId` or `contentType`.
- Core CRUD lives in `src/core/content/content-type.ts` and remains React-free.
- `ProjectSession` exposes typed CPT mutations and reads `projectRef.current` before shared project mutations.
- CPT changes use the existing autosave/recovery pipeline.
- Backend CPT authoring is a dense master-detail no-code surface: compact model list + contextual settings panel, inline validation, Public/Hierarchical flags, supports and two-step delete.
- MF-037 does not implement taxonomies, field groups or records CRUD early; those remain later F05 microphases.
- The persistence regression test for frontend/backend themes now polls the real `electrocms/projects` IndexedDB record before reload. Do not replace durable-storage assertions with UI save text when storage timing matters.

## Durable F04 facts still binding
- Widget contracts are framework-neutral in `src/core/widgets`; React preview binding lives in `src/app/widgets`.
- Widgets resolve by `type@version`; adding a plugin widget must not require branching `CanvasRenderer` by type.
- Dynamic/commerce/form/filter widgets remain honestly `modeled` until their dedicated engines are implemented.
- Inspector writes validated reversible commands only.
- `DocumentNode.styles` / `ResponsiveStyleSet` remains the only responsive style source.
- Editor design source of truth: `design-system/electrocms-editor/MASTER.md` + `pages/editor.md`.
- Design references adapted from `nextlevelbuilder/ui-ux-pro-max-skill`: `ui-ux-pro-max`, `design-system`, `ui-styling`.
- Editor/backend authoring must feel like a professional no-code builder, not a generic card dashboard.
- Editor mode/preset are workspace preferences and never alter generated project themes.
- Vercel auto-deploy is disabled. Never deploy unless the user explicitly asks.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, then this handoff.
2. Confirm latest branch CI is green before advancing a microphase.
3. Work only MF-038 until its exact contract is implemented and green.
4. Build taxonomy core in the React-free content domain and persist into canonical `project.taxonomies`.
5. Reuse `ProjectSession` + autosave; do not bypass repository/persistence contracts.
6. Apply `design-system/electrocms-editor/MASTER.md` to Backend taxonomy UI; prefer master-detail/progressive disclosure over modal-heavy CRUD.
7. Add unit + Playwright coverage, including reload persistence and relation to compatible content types if required by the MF contract.
8. Update TRACKING/MEMORY/IMPLEMENTATION_MEMORY/KNOWN_ISSUES/HANDOFF before marking MF-038 DONE.
9. Do not begin MF-039 while any MF-038 gate is red.

## Phase sequence
- MF-037 — CPT model + editor — DONE — run #730 PASS
- MF-038 — Taxonomy model + editor — CURRENT
- MF-039 — Field type registry — BLOCKED
- MF-040 — Custom field groups — BLOCKED
- MF-041 — Records CRUD — BLOCKED
- MF-042 — Advanced fields — BLOCKED
- MF-043 — Relations — BLOCKED
- MF-044 — Dynamic bindings — BLOCKED
