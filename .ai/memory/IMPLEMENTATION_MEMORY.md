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
- Geometry must use `ResponsiveStyleSet`; do not add parallel geometry storage.
- Undo/Redo is per-document and command based.
- Save completion merges metadata only; never overwrite newer editor content.
- Autosave revisions must remain monotonic across stale pending payloads.
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
