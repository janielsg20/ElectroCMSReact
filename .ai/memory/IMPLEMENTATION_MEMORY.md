# IMPLEMENTATION_MEMORY.md

## F01 code map
- `src/core/domain/`: JSON primitives, typed errors, Result, EntityId.
- `src/core/project/`: canonical project/document model v1 and validation.
- `src/core/persistence/`: repository contracts, memory/IndexedDB adapters, migrations, autosave and recovery.

## F02 code map
- `src/app/routing/`: workspace routing.
- `src/app/project/`: persistent project session above workspace routing.
- `src/app/workspace/`: workspace preferences, compact layout and editor appearance.
- `src/app/components/AppHeader.tsx` and `WorkspaceNavigation.tsx`: responsive shell chrome.

## F03 code map
- `src/core/project/document-tree*.ts`: tree inspection/mutation/reorder/editing.
- `src/core/project/node-geometry.ts`: responsive geometry/snapping.
- `src/app/editor/canvas/`: canonical renderer, overlays and interaction composition.
- `src/app/project/document-command-history.ts`: reversible per-document history.
- `src/app/project/editor-project-persistence.ts`: editor persistence bridge.

## F04 code map
- `src/core/widgets/`: framework-neutral widget contracts, registry and inspector schemas.
- `src/app/widgets/`: React preview bindings and built-in widget catalogs.
- `src/app/editor/inspector/`: schema-driven properties/design editors.
- `src/core/project/style-engine.ts` + `breakpoint-engine.ts`: responsive style resolution.
- `src/core/themes/`: project theme registry/package contracts.
- `src/app/themes/`: Studio controls, local theme library and package transfer.
- `src/app/ui/studio-pro*.css`: only active editor visual system.

## F05 code map — Dynamic Content modern line
Historical `agent/f05-dynamic-content` is contract/test reference only. Do not merge its UI/CSS wholesale.

### MF-037 Content Types
- `src/core/content/content-type.ts`: canonical Content Type v1 validation/serialization/CRUD.
- `src/app/project/project-session-context.ts` + `project-session.tsx`: public Content Type mutations and autosave.
- `src/app/studio/ContentTypesCrudPanel.tsx`: Studio Pro CRUD.
- `e2e/content-types-crud.spec.ts`: create/edit/delete persistence across reload.
- Evidence: PR #34, Quality Gate #1515 PASS, merge `748c6e61af114640a176665903b5f3bc0336ca07`.

### MF-038 Taxonomies
- `src/core/content/taxonomy.ts`: taxonomy v1, Content Type associations, optional Field Groups/archive template, immutable ids and duplicate guards.
- ProjectSession exposes taxonomy create/update/remove.
- `src/app/studio/TaxonomiesCrudPanel.tsx`: Studio Pro CRUD.
- `e2e/taxonomies-crud.spec.ts`: persistence flow.
- Evidence: PR #41, Quality Gate #1517 PASS, merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`.

### MF-039 Field Type Registry
- `src/core/content/field-type-definition.ts`: versioned field type contract and feature matrix.
- `src/core/content/field-type-registry.ts`: React-free `type@version` registry, defensive clones and one-step config migrations.
- `src/core/content/builtin-field-types.ts`: 27 built-ins; 20 `available`, 7 `modeled`.
- `src/core/content/field-type-registry.test.ts`: registry, plugins, validation and migration coverage.
- Evidence: PR #42, Quality Gate #1519 PASS, merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`.

### MF-040 Custom Field Groups
- `src/core/content/field-group.ts`: versioned Field Group/Custom Field contracts, ordered fields, unique field ids/storage names, registry-backed config/default validation, immutable group ids and dependency-safe delete.
- `src/core/content/field-group.test.ts`: portable definitions, duplicate guards, modeled-type blocking, reorder/update/remove and taxonomy dependency protection.
- ProjectSession exposes Field Group create/update/remove and queues canonical autosave.
- `src/app/studio/FieldGroupsCrudPanel.tsx`: Studio Pro group CRUD, field ordering, 20-type library, metadata/config/default editing and honest modeled-type messaging.
- `src/app/studio/DynamicContentWorkspace.tsx`: Field Groups promoted from read-only to CRUD-enabled.
- `e2e/field-groups-crud.spec.ts`: create Text/Currency fields → autosave → reload → edit/order/config/default persistence → delete → reload.
- Evidence: PR #44, Quality Gate #1524 PASS, merge `dcef1c3302c2520a1911884624fb059eef09f4c0`.

## Critical invariants
- Persisted projects validate before create/save and migrations run before edit exposure.
- Recovery snapshot precedes project save; save completion merges metadata only and never overwrites newer content.
- No React imports below app/presentation layers.
- `CanonicalProject` collections are the only persistent source of truth; F05 must not introduce parallel stores.
- Canvas DOM/drop zones/overlays, selection, guides and mobile sheets are transient projections.
- Structural document edits use reversible commands; F05 resource mutations use public core APIs through `ProjectSession`.
- Responsive geometry/styles remain in the canonical `ResponsiveStyleSet` path.
- Widgets and Field Types resolve by `type@version`.
- `modeled` means contract-only, not runtime availability.
- MF-040 Field Groups instantiate only the 20 Field Types currently marked `available`.
- Field Group deletion is blocked while referenced by a Taxonomy.
- Native DnD feedback must not cause React structural rerenders mid-gesture.
- Editor appearance never changes frontend/backend project theme selections.
- Imported theme definitions remain editor-library data, not duplicated project payloads.
- Resource/package merges never silently overwrite existing ids/keys.
- Vercel deployments are manual-only.
- Do not import historical F05 UI/CSS into Studio Pro.

## Test/evidence summary
- F01–F04 retain their existing domain, unit, integration and Playwright coverage.
- F04 definitive historical gates: MF-027 #424; MF-028 #434; MF-029 #446; MF-030 #456; MF-031 #479; MF-032 #505; MF-033 #529; MF-034 #568; MF-035 #662; MF-036 #688.
- Modern F05 gates: MF-037 #1515; MF-038 #1517; MF-039 #1519; MF-040 #1524.

## Resume target
Next microphase is **MF-041 — Records CRUD**. Recover only its historical core/tests first, then port to fresh current `main`, route through ProjectSession, adapt to Studio Pro and require a new full quality gate before MF-042.
