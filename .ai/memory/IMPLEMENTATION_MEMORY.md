# IMPLEMENTATION_MEMORY.md

## F01 code map
- `src/core/domain/`: JSON primitives, typed errors, Result, EntityId.
- `src/core/project/`: canonical model v1, factory and validator.
- `src/core/persistence/project-repository.ts`: durable repository contract.
- `src/core/persistence/memory-project-repository.ts`: deterministic test adapter.
- `src/core/persistence/indexeddb/`: native IndexedDB DB/project/recovery adapters.
- `src/core/persistence/migrations/`: ordered migration registry and v0→v1 migration.
- `src/core/persistence/autosave/`: debounce/serialization/recovery coordinator.

## F02 code map
- `src/app/routing/`: workspace definitions and History API router.
- `src/app/project/`: project session context/provider above workspace routing.
- `src/app/workspace/workspace-preferences*`: editor preference model/repository/provider.
- `src/app/workspace/use-media-query.ts`: media query external-store subscription.
- `src/app/workspace/editor-theme.ts`: editor-only light/dark/auto resolution.
- `src/app/components/AppHeader.tsx`: connected shell header.
- `src/app/components/WorkspaceNavigation.tsx`: configurable nav + drawer/resizer.

## F03 code map
- `src/core/project/document-tree.ts`: tree inspection, indexes, traversal and structural CRUD.
- `src/core/project/document-tree-move.ts`: validated reorder/reparent operations.
- `src/core/project/document-tree-editing.ts`: clipboard, group/ungroup, lock/hide operations.
- `src/core/project/node-geometry.ts`: responsive geometry + snapping engine.
- `src/app/editor/canvas/CanvasRenderer.tsx`: recursive canonical renderer.
- `src/app/editor/canvas/CanvasOverlayLayer.tsx`: transient guides/selection feedback layer.
- `src/app/editor/canvas/EditorCanvas.tsx`: interaction composition and contextual controls.
- `src/app/editor/canvas/use-canvas-selection.ts`: transient single/multi selection.
- `src/app/editor/canvas/use-canvas-document-actions.ts`: command-backed editor operations.
- `src/app/project/document-command-history.ts`: per-document reversible history.
- `src/app/project/use-document-history-shortcuts.ts`: Undo/Redo keyboard contract.
- `src/app/project/editor-project-persistence.ts`: F01 persistence runtime adapter for editor session.
- `src/app/project/project-session.tsx`: hydration, command execution, autosave lifecycle and metadata-safe save callbacks.

## F04 code map — widget runtime
- `src/core/widgets/widget-definition.ts`: framework-neutral widget contract including metadata, factory, schemas, child policy, capabilities and migrations.
- `src/core/widgets/widget-registry.ts`: `type@version` registry, factory/validation/migration lookup.
- `src/core/widgets/inspector-schema.ts`: inspector descriptor normalization and typed field contracts.
- `src/app/widgets/editor-widget-registry.ts`: React preview binding layered over core widget definitions.
- `src/app/widgets/EditorWidgetRegistryProvider.tsx`: application registry boundary.
- `src/app/widgets/core-structural-widgets.tsx`: 10 structural definitions/factories/previews.
- `src/app/widgets/core-basic-content-widgets.tsx`: 16 basic/content definitions/factories/previews.
- `src/app/widgets/core-dynamic-contract-widgets.tsx`: 19 modeled dynamic/commerce/form/filter contracts.
- `src/app/widgets/default-editor-widget-registry.ts`: composition of built-in widget sets.

## F04 code map — inspector/responsive
- `src/app/editor/inspector/WidgetInspector.tsx`: schema-generated property inspector.
- `src/app/editor/inspector/WidgetStyleInspector.tsx`: responsive visual style controls and inheritance actions.
- `src/core/project/style-engine.ts`: safe responsive style read/write/resolve engine.
- `src/core/project/breakpoint-engine.ts`: canonical breakpoint ordering, adjacency, validation and inheritance chain.
- `src/app/editor/canvas/canvas-node-style.ts`: conversion of resolved canonical styles to safe React CSS properties.
- `src/app/editor/canvas/use-canvas-document-actions.ts`: includes validated props/style commands in addition to F03 structure/geometry commands.

## F04 code map — editor design/themes
- `src/app/workspace/editor-theme-presets.ts`: editor-only preset catalog.
- `src/app/workspace/editor-theme-presets.css`: preset token overrides for ElectroCMS chrome.
- `design-system/electrocms-editor/MASTER.md`: editor design/interaction source of truth.
- `design-system/electrocms-editor/pages/editor.md`: no-code editor workspace-specific override.
- `src/core/themes/theme-system.ts`: framework-neutral project theme definition/registry/portable-token validation.
- `src/core/themes/builtin-project-themes.ts`: 8 frontend + 7 backend definitions.
- `src/core/themes/theme-package.ts`: versioned package envelope, selected project resources and 256 KB boundary.
- `src/core/themes/theme-package-merge.ts`: category-selective non-destructive merge with conflict report.
- `src/app/themes/ProjectThemeRegistryProvider.tsx`: combines base + local imported themes, duplicate/version operations and package library.
- `src/app/themes/project-theme-package-repository.ts`: local theme library persistence at `electrocms:project-theme-packages:v1`.
- `src/app/themes/ProjectThemeControls.tsx`: project theme selection, token preview and duplicate-to-edit flow.
- `src/app/themes/ProjectThemeTokenEditor.tsx`: versioned local theme editor.
- `src/app/themes/ProjectThemePackageTransfer.tsx`: two-step selective export/import review UI.
- `src/app/project/project-session.tsx`: theme selection and validated selective resource merge with autosave.

## F05 code map — dynamic content
### MF-037 CPT
- `src/core/content/content-type.ts`: `ContentTypeDefinition` v1, validation, list/create/update/remove operations, slug uniqueness and referential delete guards.
- `src/core/content/content-type.test.ts`: unit coverage for valid/invalid definitions, CRUD, duplicate id/slug, record-reference and taxonomy-reference delete protection.
- `src/app/content/ContentTypeEditor.tsx`: Backend master-detail CPT authoring UI with inline validation, supports, public/hierarchical flags and two-step delete.
- `src/app/content/content-type-editor.css`: dense responsive/touch-aware CPT editor styling using semantic editor tokens.
- `src/app/project/project-session-context.ts`: typed CPT mutation surface.
- `src/app/project/project-session.tsx`: CPT mutations over `projectRef.current`, canonical validation and autosave.
- `e2e/content-types.spec.ts`: create → persist → reload → invalid edit → valid edit → persist → delete → reload.
- `e2e/project-themes.spec.ts`: durable IndexedDB assertion protects cross-workspace autosave before reload.

### MF-038 Taxonomy
- `src/core/content/taxonomy.ts`: `TaxonomyDefinition` v1, validation, list/create/update/remove, unique slug, multi-CPT references, field-group refs and archive-template refs.
- `src/core/content/taxonomy.test.ts`: hierarchy/flat validation, required unique CPT targets, CRUD, duplicate id/slug, reference integrity, valid archive/field-group refs and immutable id.
- `src/core/content/content-type.ts`: CPT deletion additionally blocked while any taxonomy targets that CPT.
- `src/app/content/DynamicContentManager.tsx`: accessible Content Types / Taxonomies tab shell for Backend authoring.
- `src/app/content/dynamic-content-manager.css`: dense responsive tab shell using semantic tokens.
- `src/app/content/TaxonomyEditor.tsx`: no-code master-detail taxonomy editor with hierarchy, multi-CPT associations, archive template and existing field-group associations.
- `src/app/content/taxonomy-editor.css`: responsive taxonomy editor styling with visible focus and 44px mobile touch targets.
- `src/app/components/WorkspaceSurface.tsx`: mounts `DynamicContentManager` in Backend while preserving honest later-phase boundaries.
- `src/app/project/project-session-context.ts`: typed taxonomy mutation surface.
- `src/app/project/project-session.tsx`: taxonomy create/update/remove over `projectRef.current` with autosave.
- `e2e/taxonomies.spec.ts`: two CPTs → multi-CPT hierarchical taxonomy → durable reload → invalid slug → flat one-target update → durable reload → delete.

### MF-039 Field type registry
- `src/core/content/field-type-definition.ts`: framework-neutral `FieldTypeDefinition`, categories, feature capabilities, availability, value shapes, validators and config migration hooks.
- `src/core/content/field-type-registry.ts`: namespaced `type@version` registration/resolution, defensive cloning, config/value validation, default-value creation and sequential config migration.
- `src/core/content/builtin-field-types.ts`: 27 master-prompt field contracts; 20 `available`, 7 advanced `modeled`.
- `src/core/content/field-type-registry.test.ts`: built-in completeness, config/value validation, malformed/duplicate registration, external `plugin/rating`, defensive clone and migration coverage.
- `src/core/content/index.ts`: public exports for CPT, taxonomy and field type systems.

## Critical invariants
- Never mutate payloads during validation/migration.
- Persisted projects must validate before create/save.
- Hydrate/migrate before exposing loaded payloads.
- Recovery snapshot is written before project save.
- No React imports below presentation/app layers.
- Workspace preferences never enter `CanonicalProject`.
- Route transitions never create a second project/session copy.
- Canonical tree persists children only; parent/depth are derived.
- Canvas DOM/drop zones/overlays are never canonical state.
- Structural edits go through pure project functions and command history.
- Selection, clipboard UI and guides are transient.
- Paste must remap every copied node ID.
- Geometry and visual styles must use `ResponsiveStyleSet`; do not add parallel responsive storage.
- Undo/Redo is per-document and command based.
- Save completion merges metadata only; never overwrite newer editor content.
- Autosave revisions must remain monotonic across stale pending payloads.
- Shared project mutations read `projectRef.current`; do not use render-snapshot closures when several workspaces can mutate one project session.
- Durable persistence E2E should verify IndexedDB when correctness depends on data actually reaching storage before reload.
- Widget core definitions never import React; preview binding belongs to app/presentation.
- Adding a widget must not require branching `CanvasRenderer` by type.
- Inspector patches validate candidate props before commands enter history.
- Dynamic/commerce/form/filter widgets stay `modeled` until their dedicated later microphase implements behavior.
- Native drag feedback must not cause a React rerender during the active gesture.
- Editor mode/preset never alter `frontendThemeId`/`backendThemeId`.
- Project themes are scope-validated and store only selected IDs in canonical project.
- Built-in project themes are immutable; local copies are editable/versioned.
- Imported theme definitions are editor-library data, not canonical-project payload duplication.
- Imported tokens must be deep portable JSON; non-plain prototypes are rejected.
- Package import must validate and review before mutating project state.
- Demo records are opt-in, never imported by default.
- Resource merge never overwrites existing IDs/keys.
- Dynamic content CRUD uses existing canonical collections (`contentTypes`, `taxonomies`, `fieldGroups`, `records`, `relations`), never parallel stores.
- CPT IDs and taxonomy IDs are immutable after creation.
- CPT deletion is blocked while records or taxonomies reference it.
- Every taxonomy must target at least one existing unique CPT.
- Taxonomy field-group references must already exist; MF-038 does not create field groups early.
- Taxonomy archive template references must resolve to an existing `CanonicalDocument` whose `kind` is `archive`.
- Field types are runtime registry contracts, never persisted callbacks/component instances.
- Field type IDs are namespaced (`namespace/name`) and definitions resolve by version.
- Advanced field contracts stay `modeled` until MF-042/MF-043; do not infer runtime completeness from registration.
- Vercel deployments are manual-only.
- Do not use root overflow hiding as a substitute for responsive layout fixes.

## Tests added through F03
- Domain/model/persistence/migration/autosave coverage from F01.
- Responsive workspace and mobile/tablet E2E from F02.
- 240-operation deterministic tree property sequence.
- Tree invariant/reorder/reparent tests.
- Canvas recursive rendering/empty/invalid tree tests.
- DnD insert/nesting/reorder E2E.
- Single/multi selection and Escape E2E.
- Document command history unit/component/E2E.
- Clipboard/group/lock/hide unit + E2E.
- Responsive geometry inheritance/snapping unit tests.
- Geometry breakpoint isolation + Undo E2E.
- Autosave lifecycle/recovery freshness/revision monotonicity unit tests.
- IndexedDB autosave → reload → hydration E2E.

## Tests added in F04
- WidgetRegistry registration/factory/validation/migrations/plugin preview tests.
- Structural/basic/dynamic widget definition + preview tests.
- Generated inspector controls + validation + Undo E2E.
- Style engine explicit/inherited/unset unit tests and breakpoint-isolation E2E.
- Breakpoint ordering/adjacency/inheritance unit tests and dynamic inheritance E2E.
- Editor preset persistence E2E.
- DnD regression coverage after stable-hit-area fix.
- ProjectThemeRegistry scope/clone/portable-token validation tests.
- Frontend/backend theme independence + autosave/reload E2E.
- Built-in duplicate → local edit → automatic v2 → reload E2E.
- Theme package parse/version/size/resource validation tests.
- Local package repository corruption/dedup/clone tests.
- Selective resource merge tests: category filtering, demo opt-in and conflict preservation.
- Package validate → review → selective apply → select → reload → export E2E.
- Package collision preservation E2E.

## Tests added in F05
- MF-037 ContentType definition/CRUD/slug uniqueness/delete-in-use unit tests.
- MF-037 Backend CPT authoring/persistence/validation/delete E2E.
- Durable theme persistence test polls `electrocms/projects` before reload, preventing false confidence from UI save text alone.
- MF-038 Taxonomy definition/reference integrity/CRUD unit tests.
- MF-038 Backend multi-CPT taxonomy authoring, hierarchy/flat transition, durable IndexedDB persistence and delete E2E.
- CPT regression verifies taxonomy association blocks destructive CPT delete.
- MF-039 registry completeness for all 27 minimum field types.
- MF-039 per-type config/value validation for text, number, select and map.
- MF-039 external `plugin/rating` registration/default/validation plus versioned config migration.
- MF-039 defensive clone and invalid-definition/duplicate regression coverage.

## Functional evidence
### F04
- MF-027: run #424 PASS.
- MF-028: run #434 PASS.
- MF-029: run #446 PASS.
- MF-030: run #456 PASS.
- MF-031: run #479 PASS.
- MF-032: run #505 PASS.
- MF-033: run #529 PASS.
- MF-034: run #568 PASS.
- MF-035 definitive original contract: run #662 PASS.
- MF-036 definitive original contract: run #688 PASS.
- F04 closing gate: run #712 PASS; merged PR #5.

### F05
- MF-037 CPT model + editor: run #730 PASS; documentation closure #740 PASS.
- MF-038 Taxonomy model + editor: run #766 PASS; documentation closure #776 PASS.
- MF-039 Field type registry: run #786 PASS; documentation closure pending final HEAD gate.
- MF-040 Custom field groups: NEXT, not started.
