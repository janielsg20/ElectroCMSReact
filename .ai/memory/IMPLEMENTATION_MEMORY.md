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
- `src/app/routing/`: stable workspace definitions and History API external-store router.
- `src/app/project/`: project session context/provider above workspace routing.
- `src/app/workspace/workspace-preferences*`: UI preference model, repositories, provider and hook store.
- `src/app/workspace/use-media-query.ts`: media query external-store subscription.
- `src/app/workspace/editor-theme.ts`: editor-only light/dark/auto resolution.
- `src/app/workspace/workspace-responsive.css`: compact header containment rules.
- `src/app/components/AppHeader.tsx`: connected shell header.
- `src/app/components/WorkspaceNavigation.tsx`: configurable nav + accessible drawer/resizer.
- `src/app/components/WorkspaceSurface.tsx`: structural routed workspace surface; not a fake canvas.
- `src/app/components/Icon.tsx`: shell SVG icon set.

## Critical invariants
- Never mutate payloads during validation/migration.
- Persisted projects must validate before create/save.
- Hydrate/migrate before exposing loaded payloads.
- Register `transactionDone(transaction)` before awaiting read requests.
- Preserve `ElectroCmsError` subclasses across infrastructure boundaries.
- Duplicate IndexedDB create maps `ConstraintError` to `ConflictError`.
- Recovery snapshot is written before project save.
- No React imports below presentation/app layers.
- Workspace preferences never enter `CanonicalProject`.
- Route transitions never create a second project/session copy.
- Editor compact threshold does not alter canonical breakpoints.
- Do not enable Undo/Redo before F03 command history is real.
- Do not use root overflow hiding as a substitute for responsive layout fixes.

## Tests added through F02
- Domain primitives.
- Canonical project factory/tree integrity.
- Memory project repository CRUD/reference isolation.
- IndexedDB CRUD/conflict.
- IndexedDB v0 hydration and future schema rejection.
- Migration registry purity/future version rejection.
- Autosave/recovery semantics.
- Browser reload persistence E2E.
- Workspace route model.
- Workspace preference normalization/persistence/corrupt fallback.
- App shell state continuity and honest history controls.
- Playwright route continuity.
- Workspace/theme/collapse persistence after reload.
- Tablet 820×1180 compact shell.
- Mobile 390×844 drawer and root-overflow contract.
