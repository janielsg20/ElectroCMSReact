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

## ADR-019 — Widgets resolve through a framework-neutral registry
**Decision:** widget definitions/factories/validation live in a framework-neutral `WidgetRegistry`, while React preview components live in `EditorWidgetRegistry` and resolve by `type@version`.

**Why:** exporters, migrations and the canonical model must not depend on React, and adding a plugin widget must not require adding type branches to the canvas core.

## ADR-020 — Inspector is generated from widget schema and writes commands
**Decision:** routine widget property controls are generated from `inspectorSchema`; edits create a validated candidate node and execute a reversible canonical document command.

**Why:** a schema-driven inspector scales to plugins while retaining one validation/history path and avoiding parallel component-local project state.

## ADR-021 — Responsive visual styles remain in ResponsiveStyleSet
**Decision:** the F04 style engine generalizes `DocumentNode.styles` with explicit/inherited/unset resolution rather than introducing a new style store.

**Why:** geometry, visual styles, breakpoints, preview and future exporters need one canonical responsive source of truth.

## ADR-022 — Native drag gestures must not trigger structural React rerenders
**Decision:** insertion hit areas remain geometrically stable during a native drag. Ephemeral `data-*` attributes may change source/target paint state, but React state must not rerender the canvas during `dragstart`.

**Why:** rerendering during the native browser gesture can cancel or destabilize DnD. Stable hit areas also provide more predictable no-code-builder interaction.

## ADR-023 — Editor appearance and project themes are three separate planes
**Decision:** editor light/dark mode, editor preset, and frontend/backend project themes are distinct systems. Editor mode/preset are workspace preferences; frontend/backend IDs are canonical project data.

**Why:** changing how ElectroCMS looks must never alter the site/admin UI being authored, while project themes must autosave and export with the project.

## ADR-024 — Project themes use an extensible framework-neutral registry
**Decision:** `ProjectThemeRegistry` owns definitions/tokens and validates scope-specific IDs, versions and portable JSON tokens. `CanonicalProject` stores only selected frontend/backend theme IDs.

**Why:** theme definitions are reusable packages and should evolve independently from individual project payloads and React UI.

## ADR-025 — Imported theme library is local editor data
**Decision:** imported theme definitions are persisted under `electrocms:project-theme-packages:v1`, outside `CanonicalProject`; projects reference installed themes by ID.

**Why:** installing a reusable theme is an editor/library concern. Duplicating full theme definitions inside every project would bloat project data and create update/collision ambiguity.

## ADR-026 — Theme packages are versioned, bounded and portable JSON
**Decision:** export/import uses `kind=electrocms-theme-package`, schemaVersion 1, a 256 KB ceiling and deep plain-JSON validation. IDs cannot collide with installed definitions.

**Why:** package boundaries are untrusted file boundaries and need deterministic validation before they enter the local registry.

## ADR-027 — No-code editor design principles are adapted, not framework-copied
**Decision:** ElectroCMS adopts relevant principles from `nextlevelbuilder/ui-ux-pro-max-skill` (`ui-ux-pro-max`, `design-system`, `ui-styling`) through its own design-system docs, without forcing a Tailwind/shadcn migration.

**Why:** the external material provides useful accessibility, token, density and interaction guidance, but ElectroCMS already has a working React/CSS architecture. Product principles should improve the system rather than trigger an unrelated rewrite.

## ADR-028 — Preview deployments are manual-only
**Decision:** `vercel.json` sets `git.deploymentEnabled=false`; Vercel deployments only occur after explicit user instruction.

**Why:** automatic deployments consumed daily preview quota during phase development. GitHub Actions remains the continuous quality gate; deployment is a separate, deliberate action.

## ADR-029 — Field types resolve through a framework-neutral versioned registry
**Decision:** custom-field type behavior is described by `FieldTypeDefinition` contracts and resolved through `FieldTypeRegistry` by `type@version`. Definitions own portable config/value validation, default-value factories, feature capability states and one-step config migrations. React components and project field instances are not stored in the registry.

**Why:** the master contract requires new field types to be addable through registries/adapters. Keeping the registry React-free lets Custom Field Groups, Records, exporters and plugins share one field-type contract without type switches or UI coupling. Advanced types can be registered honestly as `modeled` until MF-042/MF-043 activate their runtime behavior.
