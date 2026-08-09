# IMPLEMENTATION_MEMORY.md

## F01–F04 code map
- F01: `src/core/domain`, `src/core/project`, `src/core/persistence` — canonical model, repositories, migrations, autosave/recovery.
- F02: `src/app/routing`, `src/app/project`, `src/app/workspace`, shell components — persistent session and responsive workspaces.
- F03: `src/core/project/document-tree*.ts`, geometry, `src/app/editor/canvas`, command history — canonical visual editing.
- F04: `src/core/widgets`, `src/app/widgets`, inspector/style/breakpoint engines, `src/core/themes`, `src/app/themes`, `src/app/ui/studio-pro*.css`.

## F05 code map — modern line
Historical `agent/f05-dynamic-content` is contract/test reference only.

### MF-037 Content Types
- `src/core/content/content-type.ts`
- `src/app/studio/ContentTypesCrudPanel.tsx`
- ProjectSession mutations + `e2e/content-types-crud.spec.ts`
- PR #34 / Gate #1515 / merge `748c6e61af114640a176665903b5f3bc0336ca07`.

### MF-038 Taxonomies
- `src/core/content/taxonomy.ts`
- `src/app/studio/TaxonomiesCrudPanel.tsx`
- ProjectSession mutations + `e2e/taxonomies-crud.spec.ts`
- PR #41 / Gate #1517 / merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`.

### MF-039 Field Type Registry
- `field-type-definition.ts`, `field-type-registry.ts`, `builtin-field-types.ts`, tests.
- 27 contracts; 20 available and 7 modeled at MF-039 boundary.
- PR #42 / Gate #1519 / merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`.

### MF-040 Custom Field Groups
- `src/core/content/field-group.ts` + tests.
- `src/app/studio/FieldGroupsCrudPanel.tsx`.
- ProjectSession group mutations + `e2e/field-groups-crud.spec.ts`.
- PR #44 / Gate #1524 / merge `dcef1c3302c2520a1911884624fb059eef09f4c0`.

### MF-041 Records CRUD
- `src/core/content/content-record.ts`: record v1 validation/serialization/default normalization/list/search/filter/CRUD.
- `src/core/content/content-record.test.ts`: required/defaults, registry validation, unknown groups/fields, CRUD, slug scope, immutable id/createdAt.
- `src/core/content/field-group-record-integrity.ts`: public record-aware Field Group removal wrapper, delegating to taxonomy-aware base removal.
- `src/core/content/field-group-record-integrity.test.ts`: deletion integrity regressions.
- `src/core/content/index.ts`: public Records exports and `removeFieldGroup` alias to record-integrity wrapper.
- `src/app/project/project-session-context.ts` / `project-session.tsx`: typed record mutation surface, autosave and projectRef-current semantics.
- `src/app/studio/RecordsCrudPanel.tsx`: Studio Pro record authoring with search/filter/status/CPT/groups/value controls/validation/delete.
- `src/app/studio/DynamicContentWorkspace.tsx`: Records promoted from read-only to CRUD enabled.
- `e2e/records-crud.spec.ts`: CPT + required Text/Currency group → record create → direct IndexedDB check → filter/search → reload/edit/archive → durable check → delete → durable removal.
- PR #46 / Gate #1528 / merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`.

## Critical invariants
- Persisted projects validate before save; hydrate/migrate before edit exposure.
- Recovery precedes project save; save completion merges metadata only.
- No React imports below app/presentation layers.
- `CanonicalProject` collections are sole persistent truth; no F05 parallel stores.
- F05 shared project mutations read `projectRef.current` and queue the existing autosave runtime.
- Widgets and Field Types resolve by `type@version`.
- Field config/default/value validation remains delegated to `FieldTypeRegistry`.
- `modeled` means contract-only until its microphase.
- Record id/createdAt are immutable; record slug uniqueness is scoped to Content Type.
- Record values may only target selected valid Field Groups and known storage names.
- Field Group deletion is blocked by Taxonomy or Record references.
- Content Type deletion is blocked by Taxonomy or Record references.
- MF-042 must not pull MF-043 Relations/reference runtime forward.
- Studio Pro is the only active editor UI; no legacy F05 UI/CSS.
- Vercel deployment manual-only.

## Evidence summary
- F04 definitive gates: MF-027 #424; MF-028 #434; MF-029 #446; MF-030 #456; MF-031 #479; MF-032 #505; MF-033 #529; MF-034 #568; MF-035 #662; MF-036 #688.
- Modern F05: MF-037 #1515; MF-038 #1517; MF-039 #1519; MF-040 #1524; MF-041 #1528.

## Resume target
**MF-042 Advanced Fields.** Recover exact historical MF-042 runtime/types/tests, port only that boundary to fresh current `main`, integrate with current Field Groups/Records and Studio Pro, then require a new complete gate before MF-043.
