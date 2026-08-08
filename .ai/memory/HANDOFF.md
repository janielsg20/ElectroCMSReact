# HANDOFF.md

## Current state
F04 is fully closed and merged into `main` by squash at `57798d9e00f4a3bb87867a847c3bccfccc82f764` after GitHub Actions run #712 PASS.

F05 — Contenido dinámico is active on `agent/f05-dynamic-content` / draft PR #6.

MF-037 — CPT model + editor is DONE. Functional run #730 PASS; documentation closure run #740 PASS.

MF-038 — Taxonomy model + editor is functionally DONE. GitHub Actions run #766 is fully green across verify, lint, TypeScript, unit, coverage, Playwright E2E and production build. Documentation closure must pass one final HEAD gate before MF-039 begins.

Next microphase: MF-039 — Field type registry. Do not start until the MF-038 documentation HEAD is green.

## Durable F05 facts from MF-037/MF-038
- Dynamic content uses existing `CanonicalProject` collections; do not create a second persistence model.
- `CanonicalProject.contentTypes` is the source of truth for CPT definitions.
- `CanonicalProject.taxonomies` is the source of truth for taxonomy definitions.
- `ContentTypeDefinition.version = 1`; `TaxonomyDefinition.version = 1`.
- CPT/taxonomy IDs are kebab-case and immutable after creation; slugs are editable and unique within their domain.
- CPT delete is rejected while records reference the CPT or while a taxonomy keeps that CPT in `contentTypeIds`.
- Every taxonomy targets one or more unique existing CPTs.
- Taxonomies support `hierarchical=true` for category/tree semantics and `false` for flat tag-like semantics.
- Taxonomies store `fieldGroupIds`, but MF-038 only associates already-existing groups; field registry/group creation belongs to MF-039/MF-040.
- Taxonomies store optional `archiveTemplateId`, accepted only when it points to an existing `CanonicalDocument.kind === 'archive'`.
- Core CRUD lives in `src/core/content/` and remains React-free.
- `ProjectSession` exposes typed CPT/taxonomy mutations and reads `projectRef.current` before shared project mutations.
- CPT/taxonomy changes reuse the existing autosave/recovery pipeline.
- Backend dynamic-content authoring is a dense no-code surface: `DynamicContentManager` tabs plus master-detail editors, inline validation and two-step destructive actions.
- MF-038 does not implement field definitions, custom field groups, records CRUD or taxonomy-term records early.
- Persistence E2E polls the real `electrocms/projects` IndexedDB record before reload when durable write visibility matters.

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
2. Confirm the latest documentation HEAD after MF-038 is completely green.
3. Only then mark MF-039 active and recover its exact contract from the F05 phase/master specification.
4. Build field-type registry contracts in React-free `src/core/content` (or a dedicated core submodule) and do not persist UI component instances in `CanonicalProject`.
5. Keep field definitions versioned/portable and compatible with later Custom Field Groups and Records CRUD.
6. Apply `design-system/electrocms-editor/MASTER.md` to any new Backend UI; prefer registry/library + contextual inspector patterns over modal-heavy CRUD.
7. Add unit/E2E coverage required by the exact MF-039 contract.
8. Update TRACKING/MEMORY/IMPLEMENTATION_MEMORY/KNOWN_ISSUES/HANDOFF before marking MF-039 DONE.
9. Do not begin MF-040 while any MF-039 gate is red.

## Phase sequence
- MF-037 — CPT model + editor — DONE — run #730; docs #740
- MF-038 — Taxonomy model + editor — DONE functional — run #766; docs HEAD gate pending
- MF-039 — Field type registry — NEXT
- MF-040 — Custom field groups — BLOCKED
- MF-041 — Records CRUD — BLOCKED
- MF-042 — Advanced fields — BLOCKED
- MF-043 — Relations — BLOCKED
- MF-044 — Dynamic bindings — BLOCKED
