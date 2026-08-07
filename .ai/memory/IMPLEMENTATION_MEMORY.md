# IMPLEMENTATION_MEMORY.md

## F01 code map
- `src/core/domain/`: JSON primitives, typed errors, Result, EntityId.
- `src/core/project/`: canonical model v1, factory and validator.
- `src/core/persistence/project-repository.ts`: durable repository contract.
- `src/core/persistence/memory-project-repository.ts`: deterministic test adapter.
- `src/core/persistence/indexeddb/`: native IndexedDB DB/project/recovery adapters.
- `src/core/persistence/migrations/`: ordered migration registry and v0→v1 migration.
- `src/core/persistence/autosave/`: debounce/serialization/recovery coordinator.

## Critical invariants
- Never mutate payloads during validation/migration.
- Persisted projects must validate before create/save.
- Hydrate/migrate before exposing loaded payloads.
- Register `transactionDone(transaction)` before awaiting read requests.
- Preserve `ElectroCmsError` subclasses across infrastructure boundaries.
- Duplicate IndexedDB create maps `ConstraintError` to `ConflictError`.
- Recovery snapshot is written before project save.
- No React imports below presentation/app layers.

## Tests added
- Domain primitives.
- Canonical project factory/tree integrity.
- Memory project repository CRUD/reference isolation.
- IndexedDB CRUD/conflict.
- IndexedDB v0 hydration and future schema rejection.
- Migration registry purity/future version rejection.
- Autosave/recovery semantics.
- Browser reload persistence E2E.
