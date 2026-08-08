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

**Why:** deterministic dependency graph and repeatable phase gates.

## ADR-006 — History API routing for editor workspaces
**Decision:** F02 uses the browser History API with `useSyncExternalStore` for Editor/Preview/Backend/Export routes instead of introducing a router dependency.

**Why:** the current routing surface is deliberately small, stays local-first, preserves back/forward navigation and avoids adding framework coupling before generated-project routing requirements are known.

## ADR-007 — Project session lives above workspace routing
**Decision:** project/document/breakpoint/zoom session state is owned above the routed workspace surface.

**Why:** switching Editor → Preview → Backend → Export must never reset the active project context or create independent copies of project state.

## ADR-008 — Editor workspace preferences are not project data
**Decision:** navigation layout, density, last workspace and editor theme mode are persisted through a dedicated workspace preferences repository.

**Why:** editor ergonomics belong to the ElectroCMS workspace and must not alter exported frontend/backend data or the canonical project model.

## ADR-009 — Compact shell breakpoint is editor-only
**Decision:** the shell switches to drawer mode at 960px independently of canonical project breakpoints.

**Why:** responsive behavior of CMS chrome and responsive properties of generated sites solve different problems.

## ADR-010 — Honest unavailable history controls
**Decision:** Undo/Redo were visible but disabled in F02 until F03 implemented real command/history behavior.

**Why:** ElectroCMS must not present simulated controls as completed functionality.

## ADR-011 — Scrollable compact header is locally contained
**Decision:** compact header overflow uses local scrolling with inline-size/paint containment rather than root overflow hiding.

**Why:** small screens retain important controls while the root remains overflow-safe.

## ADR-012 — Parent/depth are derived, never persisted
**Decision:** `DocumentNode` persists ordered `children`; parent, depth and traversals are runtime indexes.

**Why:** storing parent and children would create two structural sources of truth and complicate DnD/migrations.

## ADR-013 — DOM is renderer output, never editor state
**Decision:** canvas DOM, drop zones and overlay nodes are projections only.

**Why:** structural mutations must remain deterministic, testable and portable to preview/export renderers.

## ADR-014 — Document history uses reversible canonical commands
**Decision:** Undo/Redo stores before/after `CanonicalDocument` commands per document, never snapshots of DOM.

**Why:** history must follow canonical state, remain independent of rendering and avoid cross-document contamination.

## ADR-015 — Clipboard remaps every pasted node ID
**Decision:** clipboard payloads preserve source subtrees, but paste creates a fresh ID map for all nodes before insertion.

**Why:** copied subtrees must never introduce duplicate IDs or corrupt references.

## ADR-016 — Geometry extends ResponsiveStyleSet
**Decision:** node geometry uses `layout.x`, `layout.y`, `layout.width`, `layout.height` inside the existing responsive style model.

**Why:** adding a separate geometry store would create another responsive source of truth and diverge from future inspector/theme editing.

## ADR-017 — Semantic guides outrank grid snapping
**Decision:** viewport edges/center take precedence over the 8px grid when both candidates are within the 4px threshold.

**Why:** meaningful alignment anchors are more useful than a slightly closer generic grid point in a professional visual editor.

## ADR-018 — Autosave callbacks merge metadata only
**Decision:** a completed autosave updates persisted revision/timestamps in the live session but never replaces current project content.

**Why:** an older in-flight save can complete after a newer editor command; replacing the full project would silently lose the newer edit.
