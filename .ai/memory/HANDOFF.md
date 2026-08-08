# HANDOFF.md

## Current state
F04 is fully closed and merged into `main` by squash at `57798d9e00f4a3bb87867a847c3bccfccc82f764` after GitHub Actions run #712 PASS.

F05 — Contenido dinámico is active on `agent/f05-dynamic-content` / draft PR #6.

MF-037 — CPT model + editor is DONE. Functional run #730 PASS; documentation closure run #740 PASS.

MF-038 — Taxonomy model + editor is DONE. Functional run #766 PASS; documentation closure run #776 PASS.

MF-039 — Field type registry is DONE. Functional run #786 PASS; documentation closure run #800 PASS.

MF-040 — Custom field groups is DONE. Functional run #834 PASS; documentation closure run #850 PASS.

MF-041 — Records CRUD is DONE. Functional run #901 PASS; documentation closure is pending on the current documentation commits.

Next microphase after a green documentation closure: MF-042 — Advanced fields.

## Durable F05 facts through MF-041
- Dynamic content uses existing `CanonicalProject` collections; never create a second persistence model.
- `CanonicalProject.contentTypes`, `taxonomies`, `fieldGroups` and `records` are the canonical sources of truth for their domains.
- `ContentTypeDefinition.version = 1`; `TaxonomyDefinition.version = 1`; `FieldGroupDefinition.version = 1`; `CustomFieldDefinition.version = 1`; `ContentRecordDefinition.version = 1`.
- CPT/taxonomy/field-group/record IDs use stable canonical identity rules. Record ID and `createdAt` are immutable after creation.
- Record states are `draft`, `published`, `archived`.
- Record slugs are unique within their Content Type.
- Records persist portable `contentTypeId`, status, title, slug, excerpt, content, `fieldGroupIds`, `fieldValues`, `createdAt`, `updatedAt` in `CanonicalProject.records`.
- Record validation resolves an existing CPT, normalizes selected Field Groups, applies field defaults/required rules and validates values via `FieldTypeRegistry`.
- Unknown field groups/fields and invalid field values are rejected; no React components/callbacks enter record data.
- Records list supports CPT filter, status filter and title/slug search.
- `ProjectSession` exposes typed record create/update/remove mutations using `projectRef.current` and the existing autosave/recovery pipeline.
- Backend `RecordsEditor` is a dense master-detail tool because this is list/edit content management, not a visual canvas task.
- Records UI respects CPT supports. Featured image support is acknowledged but Media Library binding is not faked before its owning phase.
- Field value controls cover current available primitive/media/location shapes while core registry validation remains authoritative.
- Field Group deletion now routes through `removeFieldGroupWithRecordIntegrity`; deletion is blocked while either a taxonomy or a content record references the group.
- Durable Records E2E performs create → required validation → save → real IndexedDB assertion → search/filter → reload → edit/archive → durable save → delete → durable removal.
- MF-041 functional evidence: GitHub Actions run #901 PASS with lint, TypeScript, unit tests, coverage, production build and Playwright E2E green.

## Durable editor design direction
- Editor design source of truth is `design-system/electrocms-editor/MASTER.md` + `pages/editor.md`.
- The main authoring model must feel like a professional visual page builder, comparable in interaction mental model to Elementor while remaining original ElectroCMS UI/code/identity.
- Desktop anatomy: top command bar + **left Insert/Elements Library** + dominant central canvas + right contextual inspector.
- The left insert panel is first-class, not generic navigation: search, categories, recognizable icon+label, click-to-insert, drag-to-canvas, honest modeled/disabled states, and future Elements/Layers/Templates modes.
- Builder composition takes precedence over generic dashboard-card layouts for visual authoring tasks.
- Responsive layouts may collapse the library/inspector into drawers, but may not remove access to insertion or inspection.
- Data-management workspaces such as Records may use dense master-detail because their primary task is list/filter/edit rather than spatial page composition.

## Durable F04 facts still binding
- Widget contracts are framework-neutral in `src/core/widgets`; React preview binding lives in `src/app/widgets`.
- Widgets resolve by `type@version`; adding a plugin widget must not require branching `CanvasRenderer` by type.
- Dynamic/commerce/form/filter widgets remain honestly `modeled` until their dedicated engines are implemented.
- Inspector writes validated reversible commands only.
- `DocumentNode.styles` / `ResponsiveStyleSet` remains the only responsive style source.
- Editor mode/preset are workspace preferences and never alter generated project themes.
- Vercel auto-deploy is disabled. Never deploy unless the user explicitly asks.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`, then this handoff; follow root `DECISIONS.md` and `.ai/memory/DECISIONS_LOG.md`.
2. Confirm MF-041 functional run #901 and its documentation closure are green before starting MF-042.
3. Recover the exact MF-042 Advanced Fields contract from the F05/master specification before editing code.
4. Reuse the existing `FieldTypeRegistry` and field/group/record schemas; do not create a separate advanced-field storage model.
5. MF-042 should activate only the advanced types owned by that microphase (for example repeater/group/calculated/conditional as defined by the contract). Relations remain owned by MF-043.
6. Any newly activated advanced field must define portable config/value shape, validation/default behavior, authoring UI, record editing/runtime behavior and migration/export-safe semantics without serializing callbacks.
7. Preserve registry extensibility; no distributed field-type `switch` in core record/group engines.
8. Keep the visual editor’s Insert Library → Canvas → Inspector anatomy. Advanced-field schema editors may use library/order/inspector patterns; Records remains dense master-detail.
9. Add unit/E2E coverage for each activated field’s schema authoring, record value validation/persistence/reload and failure states.
10. Update TRACKING/MEMORY/IMPLEMENTATION_MEMORY/KNOWN_ISSUES/HANDOFF/DECISIONS before marking MF-042 DONE.
11. Do not begin MF-043 while any MF-042 gate is red.

## Phase sequence
- MF-037 — CPT model + editor — DONE — run #730; docs #740
- MF-038 — Taxonomy model + editor — DONE — run #766; docs #776
- MF-039 — Field type registry — DONE — run #786; docs #800
- MF-040 — Custom field groups — DONE — run #834; docs #850
- MF-041 — Records CRUD — DONE — run #901; docs pending
- MF-042 — Advanced fields — NEXT after docs gate
- MF-043 — Relations — BLOCKED
- MF-044 — Dynamic bindings — BLOCKED
