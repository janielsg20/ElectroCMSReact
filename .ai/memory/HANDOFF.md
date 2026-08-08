# HANDOFF.md

## Current state
F04 is fully closed and merged into `main` by squash at `57798d9e00f4a3bb87867a847c3bccfccc82f764` after GitHub Actions run #712 PASS.

F05 — Contenido dinámico is active on `agent/f05-dynamic-content` / draft PR #6.

MF-037 — CPT model + editor is DONE. Functional run #730 PASS; documentation closure run #740 PASS.

MF-038 — Taxonomy model + editor is DONE. Functional run #766 PASS; documentation closure run #776 PASS.

MF-039 — Field type registry is DONE. Functional run #786 PASS; documentation closure run #800 PASS.

MF-040 — Custom field groups is DONE. Functional run #834 PASS; documentation closure run #850 PASS.

Next microphase: MF-041 — Records CRUD, after the current evidence-sync HEAD is fully green.

## Durable F05 facts through MF-040
- Dynamic content uses existing `CanonicalProject` collections; do not create a second persistence model.
- `CanonicalProject.contentTypes` is the source of truth for CPT definitions.
- `CanonicalProject.taxonomies` is the source of truth for taxonomy definitions.
- `CanonicalProject.fieldGroups` is now the source of truth for custom field group instances and field schemas.
- `ContentTypeDefinition.version = 1`; `TaxonomyDefinition.version = 1`; `FieldGroupDefinition.version = 1`; `CustomFieldDefinition.version = 1`.
- CPT/taxonomy/field-group IDs are kebab-case and immutable after creation. Field `name` is lowercase snake_case and unique within each group.
- CPT delete is rejected while records reference the CPT or while a taxonomy keeps that CPT in `contentTypeIds`.
- Every taxonomy targets one or more unique existing CPTs.
- Taxonomies support `hierarchical=true` for category/tree semantics and `false` for flat tag-like semantics.
- Taxonomies store `fieldGroupIds`; MF-040 now creates/manages the referenced groups.
- Taxonomies store optional `archiveTemplateId`, accepted only when it points to an existing `CanonicalDocument.kind === 'archive'`.
- Core content CRUD and registry contracts live in `src/core/content/` and remain React-free.
- `FieldTypeRegistry` resolves namespaced types by `type@version` and supports external registrations without modifying its core implementation.
- Every field type definition declares portable config schema/default config, config/value validation, default-value creation, feature capability states and one-step config migrations.
- 20 field types are `available`: text, textarea, rich-text, number, currency, email, phone, url, date, time, datetime, color, select, radio, checkbox, switch, image, gallery, file, map.
- 7 advanced field contracts remain `modeled`: relation, user, taxonomy, repeater, group, calculated, conditional.
- MF-040 only permits field instances backed by `availability=available`; modeled advanced types remain blocked until MF-042/MF-043.
- A custom field persists `type`, `typeVersion`, stable `id`, storage `name`, label, description, placeholder, required, portable `defaultValue`, portable type config, `conditions[]` and `roleVisibility[]`.
- `conditions[]` and `roleVisibility[]` are versioned portable placeholders in MF-040. Their runtime behavior/editors are not falsely presented as complete.
- Field order in `fields[]` is canonical. Reordering updates the stored schema directly without a parallel order store.
- Field group `presentation` supports `group` and `tabs` as portable composition metadata.
- Field config and default values are validated through `FieldTypeRegistry`; do not add a hardcoded type switch to group CRUD.
- Deleting a field group is blocked while a taxonomy references it in `fieldGroupIds`.
- `ProjectSession` exposes typed CPT/taxonomy/field-group mutations and reads `projectRef.current` before shared project mutations.
- CPT/taxonomy/field-group changes reuse the existing autosave/recovery pipeline.
- Backend dynamic-content authoring is a dense no-code surface: `DynamicContentManager` tabs plus master-detail/builder editors, inline validation and two-step destructive actions.
- `FieldGroupEditor` follows a three-zone builder: searchable Field Library → ordered stored schema → contextual Field Inspector.
- Persistence E2E polls the real `electrocms/projects` IndexedDB record before reload when durable write visibility matters.
- MF-040 functional evidence: GitHub Actions #834 PASS with lint, TypeScript, unit, coverage, build and 24 Playwright E2E tests green.
- MF-040 documentation closure evidence: GitHub Actions #850 PASS.

## Durable editor design direction
- Editor design source of truth is `design-system/electrocms-editor/MASTER.md` + `pages/editor.md`.
- The main authoring model must feel like a professional visual page builder, comparable in interaction mental model to Elementor while remaining original ElectroCMS UI/code/identity.
- Desktop anatomy: top command bar + **left Insert/Elements Library** + dominant central canvas + right contextual inspector.
- The left insert panel is first-class, not generic navigation. It should grow toward search, categories, recognizable icon+label, click-to-insert, drag-to-canvas, recent/favorites when useful, and modes such as Elements/Layers/Templates.
- Builder composition takes precedence over generic dashboard-card layouts for visual authoring tasks.
- Responsive layouts may collapse the library/inspector into drawers, but may not remove access to insertion or inspection.

## Durable F04 facts still binding
- Widget contracts are framework-neutral in `src/core/widgets`; React preview binding lives in `src/app/widgets`.
- Widgets resolve by `type@version`; adding a plugin widget must not require branching `CanvasRenderer` by type.
- Dynamic/commerce/form/filter widgets remain honestly `modeled` until their dedicated engines are implemented.
- Inspector writes validated reversible commands only.
- `DocumentNode.styles` / `ResponsiveStyleSet` remains the only responsive style source.
- Editor mode/preset are workspace preferences and never alter generated project themes.
- Vercel auto-deploy is disabled. Never deploy unless the user explicitly asks.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, then this handoff; follow root `DECISIONS.md` and `.ai/memory/DECISIONS_LOG.md` for architectural decisions.
2. Confirm MF-040 functional #834 and documentation closure #850 remain green, and confirm the current HEAD gate is green before starting MF-041.
3. Recover the exact MF-041 Records CRUD contract from F05/master specification before editing code.
4. Reuse `CanonicalProject.records`; do not introduce a second record store or UI-only copy.
5. Records must resolve an existing CPT and validate their custom field payload against the groups/fields applicable to that record context.
6. Reuse `FieldTypeRegistry` for field value validation/defaults; do not hardcode per-type record validation in UI.
7. Keep advanced field behavior blocked until MF-042/MF-043 even if schemas contain modeled placeholders.
8. Continue applying the builder design rule: left insertion/library surfaces for composable elements, central working context, right inspector. Backend list/edit tasks can use dense master-detail where spatial canvas is not the primary task.
9. Add unit/E2E coverage for create/edit/persist/reload/delete, invalid field values, required behavior if owned by MF-041, CPT/group reference integrity and durable IndexedDB writes.
10. Update TRACKING/MEMORY/IMPLEMENTATION_MEMORY/KNOWN_ISSUES/HANDOFF/DECISIONS before marking MF-041 DONE.
11. Do not begin MF-042 while any MF-041 gate is red.

## Phase sequence
- MF-037 — CPT model + editor — DONE — run #730; docs #740
- MF-038 — Taxonomy model + editor — DONE — run #766; docs #776
- MF-039 — Field type registry — DONE — run #786; docs #800
- MF-040 — Custom field groups — DONE — run #834; docs #850
- MF-041 — Records CRUD — NEXT after current HEAD gate
- MF-042 — Advanced fields — BLOCKED
- MF-043 — Relations — BLOCKED
- MF-044 — Dynamic bindings — BLOCKED
