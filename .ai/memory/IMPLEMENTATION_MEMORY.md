# IMPLEMENTATION_MEMORY.md

## F01–F04 code map
- F01: `src/core/domain`, `src/core/project`, `src/core/persistence` — canonical model, repositories, migrations, autosave/recovery.
- F02: `src/app/routing`, `src/app/project`, `src/app/workspace`, shell — persistent session/responsive workspaces.
- F03: document tree/geometry/canvas/command history — canonical visual editing.
- F04: widget/inspector/style/breakpoint/theme runtimes + Studio Pro UI.

## F05 code map — modern line
Historical `agent/f05-dynamic-content` is contract/test reference only.

### MF-037…MF-041
- Content Types: `src/core/content/content-type.ts`, `ContentTypesCrudPanel.tsx`, PR #34 / Gate #1515.
- Taxonomies: `taxonomy.ts`, `TaxonomiesCrudPanel.tsx`, PR #41 / Gate #1517.
- Field Type Registry: `field-type-definition.ts`, `field-type-registry.ts`, `builtin-field-types.ts`, PR #42 / Gate #1519.
- Field Groups: `field-group.ts`, `FieldGroupsCrudPanel.tsx`, PR #44 / Gate #1524.
- Records: `content-record.ts`, `field-group-record-integrity.ts`, `RecordsCrudPanel.tsx`, `e2e/records-crud.spec.ts`, PR #46 / Gate #1528.

### MF-042 Advanced Fields
- `src/core/content/advanced-field-runtime.ts`: v2 detection, referenced-group helpers, depth/repeater/expression constants, recursive normalize/validate, calculated/conditional evaluation and safe arithmetic parser.
- `src/core/content/advanced-field-types.ts`: v2 available definitions for Group/Repeater/Calculated/Conditional and `createContentFieldTypeRegistry()` composition. Historical v1 entries remain modeled.
- `src/core/content/advanced-field-group.ts`: contextual reusable-group validation, reference existence, direct/indirect cycle detection, max depth 8, conditional/calculated sibling restrictions.
- `src/core/content/advanced-content-record.ts`: advanced Record normalize/validate/create/update/list wrappers; ordering Group/Repeater → Calculated → Conditional.
- `src/core/content/advanced-field-group-integrity.ts`: blocks deletion of Field Groups referenced by advanced fields, then delegates record/taxonomy integrity.
- `src/core/content/field-group-update-integrity.ts`: validates all reusable-group ancestors and direct/nested Records against candidate schemas before committing updates.
- `src/core/content/index.ts`: public MF-042 APIs alias advanced wrappers while preserving base schema/types/serialization exports.
- Tests: `advanced-field-versioning.test.ts`, `advanced-fields.test.ts`, `advanced-field-safety.test.ts`, `advanced-field-integrity.test.ts`.
- `src/app/studio/FieldGroupsCrudPanel.tsx`: current full registry, 24 available latest types, advanced config descriptors and contextual validation.
- `src/app/studio/AdvancedRecordFieldControl.tsx`: recursive Studio Pro Group/Repeater/Conditional authoring and live Calculated display.
- `src/app/studio/RecordsCrudPanel.tsx`: uses full MF-042 registry and delegates advanced values to recursive control.
- `e2e/advanced-fields-crud.spec.ts`: creates dependent schemas + Record, verifies direct IndexedDB nested/calculated state, conditional null normalization, and rejected destructive child schema update.
- PR #48 / Gate #1533 / merge `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`.

## Critical invariants
- Persisted projects validate before save; hydrate/migrate before edit exposure.
- No React imports below app/presentation layers.
- `CanonicalProject` collections are sole persistent truth; no F05 parallel stores.
- Project mutations use current ProjectSession state and existing autosave runtime.
- Widgets/Field Types resolve by `type@version`.
- Advanced runtime is active only for the dedicated v2 definitions.
- Relation/User/Taxonomy remain modeled until MF-043.
- Advanced reusable-group references are acyclic and max depth 8.
- Repeater hard cap 100.
- Calculated uses safe arithmetic only and cannot depend on advanced siblings.
- Schema changes must not invalidate reusable-group ancestors or existing Records.
- Field Group deletion honors advanced references, Records and Taxonomies.
- Studio Pro is the only active editor UI; no legacy F05 UI/CSS.
- Vercel deployment manual-only.

## Evidence summary
- F04 definitive gates: MF-027 #424; MF-028 #434; MF-029 #446; MF-030 #456; MF-031 #479; MF-032 #505; MF-033 #529; MF-034 #568; MF-035 #662; MF-036 #688.
- Modern F05: MF-037 #1515; MF-038 #1517; MF-039 #1519; MF-040 #1524; MF-041 #1528; MF-042 #1533.

## Resume target
**MF-043 Relations.** Recover exact historical relation/reference definitions, runtime, integrity and E2E; port onto fresh current `main`, preserve all MF-042 safety rules, adapt Studio Pro, then require a complete new gate before MF-044.
