# DECISIONS.md

## ADR-001 — Native IndexedDB behind repositories
**Decision:** use native IndexedDB as the primary web persistence adapter, hidden behind `ProjectRepository` and `RecoveryRepository`.

**Why:** local-first, no SaaS dependency, browser-native persistence and clear portability boundary. `fake-indexeddb` is test-only and never ships as the production storage engine.

## ADR-002 — Project schema and IndexedDB schema are independent
**Decision:** `CanonicalProject.schemaVersion` and IndexedDB database version evolve separately.

**Why:** data-format migrations must not be coupled to storage-container upgrades.

## ADR-003 — Hydration migrates before editability
**Decision:** persisted payloads pass through `hydrateProjectPayload` before being returned from the repository.

**Why:** the editor must never receive a legacy or future payload as if it were canonical.

## ADR-004 — Recovery is separate from primary project storage
**Decision:** recovery snapshots live in their own store and are bounded.

**Why:** recovery history must not inflate the canonical project or couple transient resilience data to exportable project data.

## ADR-005 — Reproducible npm installs
**Decision:** version `package-lock.json` and use `npm ci` in GitHub Actions.

**Why:** deterministic dependency graph and repeatable phase gates. The initial lockfile was generated in GitHub because the sandbox cannot access the public npm registry; the workflow immediately returned to read-only permissions afterward.
