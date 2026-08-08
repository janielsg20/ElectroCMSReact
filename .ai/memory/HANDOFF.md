# HANDOFF.md

## Current state
F04 is fully closed and merged into `main` by squash at `57798d9e00f4a3bb87867a847c3bccfccc82f764` after GitHub Actions run #712 PASS.

F05 — Contenido dinámico is active on `agent/f05-dynamic-content` / draft PR #6.

MF-037 — CPT model + editor is DONE. Functional run #730 PASS; documentation closure run #740 PASS.

MF-038 — Taxonomy model + editor is DONE. Functional run #766 PASS; documentation closure run #776 PASS.

MF-039 — Field type registry is DONE. Functional run #786 PASS; documentation closure run #800 PASS.

Next microphase: MF-040 — Custom field groups.

## Durable F05 facts through MF-039
- Dynamic content uses existing `CanonicalProject` collections; do not create a second persistence model.
- `CanonicalProject.contentTypes` is the source of truth for CPT definitions.
- `CanonicalProject.taxonomies` is the source of truth for taxonomy definitions.
- `CanonicalProject.fieldGroups` remains the reserved canonical collection for MF-040; MF-039 does not persist registry callbacks there.
- `ContentTypeDefinition.version = 1`; `TaxonomyDefinition.version = 1`.
- CPT/taxonomy IDs are kebab-case and immutable after creation; slugs are editable and unique within their domain.
- CPT delete is rejected while records reference the CPT or while a taxonomy keeps that CPT in `contentTypeIds`.
- Every taxonomy targets one or more unique existing CPTs.
- Taxonomies support `hierarchical=true` for category/tree semantics and `false` for flat tag-like semantics.
- Taxonomies store `fieldGroupIds`, but MF-038 only associates already-existing groups; MF-040 will create/manage those groups.
- Taxonomies store optional `archiveTemplateId`, accepted only when it points to an existing `CanonicalDocument.kind === 'archive'`.
- Core content CRUD and registry contracts live in `src/core/content/` and remain React-free.
- `FieldTypeRegistry` resolves namespaced types by `type@version` and supports external registrations without modifying its core implementation.
- Every field type definition declares portable config schema/default config, config/value validation, default-value creation, feature capability states and one-step config migrations.
- MF-039 registers all 27 minimum field contracts from the master prompt.
- 20 field types are `available`: text, textarea, rich-text, number, currency, email, phone, url, date, time, datetime, color, select, radio, checkbox, switch, image, gallery, file, map.
- 7 advanced field contracts remain `modeled`: relation, user, taxonomy, repeater, group, calculated, conditional.
- `modeled` is an honesty boundary, not a completed runtime claim. MF-042/MF-043 own the advanced behavior.
- `plugin/rating` unit coverage proves plugin registration, validation, defaults and config migration without editing the core registry.
- Registry definitions return defensive clones; consumers cannot mutate stored definitions.
- React components/callbacks are never serialized into `CanonicalProject`.
- `ProjectSession` exposes typed CPT/taxonomy mutations and reads `projectRef.current` before shared project mutations.
- CPT/taxonomy changes reuse the existing autosave/recovery pipeline.
- Backend dynamic-content authoring is a dense no-code surface: `DynamicContentManager` tabs plus master-detail editors, inline validation and two-step destructive actions.
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
2. Confirm MF-039 closure evidence remains green: functional #786 and documentation #800.
3. Mark MF-040 active and recover its exact Custom Field Groups contract from the F05/master specification before editing code.
4. Reuse `FieldTypeRegistry`; do not introduce hardcoded field-type switches in the group editor/model.
5. Persist field/group instances only as versioned portable JSON inside `CanonicalProject.fieldGroups`; never persist registry callbacks or React components.
6. Define stable field IDs/names, ordering, type references + versions, common settings (default, placeholder, description, required, visibility/conditions as scope allows) and type-specific config validated through the registry.
7. Keep advanced field instances blocked or explicitly modeled if their registry definition is not `available`; do not activate MF-042/MF-043 behavior early.
8. Apply `design-system/electrocms-editor/MASTER.md` to the Backend group/field UI; prefer library + ordered list + contextual inspector over modal-heavy CRUD.
9. Add unit/E2E coverage for create/edit/reorder/persist/reload/delete and referential safety required by the exact MF-040 contract.
10. Update TRACKING/MEMORY/IMPLEMENTATION_MEMORY/KNOWN_ISSUES/HANDOFF/DECISIONS if needed before marking MF-040 DONE.
11. Do not begin MF-041 while any MF-040 gate is red.

## Phase sequence
- MF-037 — CPT model + editor — DONE — run #730; docs #740
- MF-038 — Taxonomy model + editor — DONE — run #766; docs #776
- MF-039 — Field type registry — DONE — run #786; docs #800
- MF-040 — Custom field groups — NEXT
- MF-041 — Records CRUD — BLOCKED
- MF-042 — Advanced fields — BLOCKED
- MF-043 — Relations — BLOCKED
- MF-044 — Dynamic bindings — BLOCKED
