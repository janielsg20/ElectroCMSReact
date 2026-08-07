# CHANGELOG.md

## Unreleased

### F02 — Editor shell y workspace responsive
- Added internal History API routing for Editor, Preview, Backend and Export workspaces.
- Added persistent project session context above routed workspace surfaces.
- Added connected high-density top header for project/save/document/breakpoint/zoom and real Preview/Export navigation.
- Added configurable navigation position, width, collapse, reorder, icon/text mode and density.
- Added dedicated workspace preferences repository separated from `CanonicalProject`.
- Added editor light/dark/auto appearance independent from frontend/backend themes.
- Added responsive desktop/tablet/mobile shell with accessible navigation drawer and locally scrollable compact header controls.
- Added component/unit tests for routes, session continuity and workspace preference persistence.
- Added Playwright coverage for route continuity, reload persistence, collapsed icon navigation, tablet 820×1180 and mobile 390×844.
- Resolved mobile root overflow using local scroll containment instead of hiding document overflow.

### F01 — Foundation, estado y persistencia
- Added reproducible npm lockfile and `npm ci` GitHub Actions workflow.
- Added framework-independent domain primitives and typed errors.
- Added canonical project schema v1, factory, responsive breakpoint defaults and structural validator.
- Added repository contracts and defensive in-memory implementation.
- Added native IndexedDB project and recovery repositories with transactional completion semantics.
- Added migration registry, legacy v0→v1 migration and future-schema rejection.
- Added debounced serialized autosave with bounded recovery snapshots and revision metadata.
- Added unit/integration coverage for domain, model, persistence, migrations and autosave.
- Added Playwright browser reload proof for real IndexedDB persistence.
- Preserved constraint, migration and validation diagnostics across the infrastructure boundary.

### F00 — Discovery y arquitectura
- Initialized React + TypeScript strict foundation.
- Added Vite, Vitest, Playwright, ESLint and GitHub quality gates.
- Established phase/microphase development protocol and architectural boundaries.
