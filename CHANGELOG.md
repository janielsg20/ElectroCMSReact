# CHANGELOG.md

## Unreleased

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
