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

## ADR-006 — History API routing for editor workspaces
**Decision:** F02 uses the browser History API with `useSyncExternalStore` for Editor/Preview/Backend/Export routes instead of introducing a router dependency.

**Why:** the current routing surface is deliberately small, stays local-first, preserves back/forward navigation and avoids adding framework coupling before generated-project routing requirements are known.

## ADR-007 — Project session lives above workspace routing
**Decision:** project/document/breakpoint/zoom session state is owned above the routed workspace surface.

**Why:** switching Editor → Preview → Backend → Export must never reset the active project context or create independent copies of the demo/project state.

## ADR-008 — Editor workspace preferences are not project data
**Decision:** navigation layout, density, last workspace and editor theme mode are persisted through a dedicated workspace preferences repository, currently backed by localStorage.

**Why:** editor ergonomics belong to the ElectroCMS user workspace and must not alter exported frontend/backend data or the canonical project model.

## ADR-009 — Compact shell breakpoint is editor-only
**Decision:** the shell switches to drawer mode at 960px independently of the canonical project breakpoints.

**Why:** responsive behavior of the CMS chrome and responsive properties of generated sites solve different problems and must not be conflated.

## ADR-010 — Honest unavailable history controls
**Decision:** Undo/Redo are visible in F02 but remain disabled until F03 implements a real command/history engine.

**Why:** ElectroCMS must not present simulated controls as completed functionality.

## ADR-011 — Scrollable compact header is locally contained
**Decision:** when compact view cannot fit all header controls, `.header-controls` uses local horizontal scrolling with inline-size/paint containment rather than causing root overflow or removing controls.

**Why:** small screens retain every important function while the document root remains free of accidental horizontal overflow.
