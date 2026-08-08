# HANDOFF.md

## Current state
F03 implementation is functionally complete on `agent/f03-canvas-history` / PR #4. GitHub Actions run #368 is fully green, including IndexedDB autosave/reload E2E. Closing documentation is being finalized and must pass one final CI run before merge.

## Durable F03 facts
- Canonical structure remains `nodes` + ordered `children`; parent/depth/traversals are derived.
- Canvas DOM and overlays are projections only; never read DOM back into canonical structure.
- DnD uses node IDs and semantic `{parentId,index}` targets.
- Selection, clipboard UI and snap guides are transient editor state.
- `DocumentCommand` history is per document and drives Undo/Redo/buttons/shortcuts.
- Copy/Paste remaps IDs; Group/Ungroup/Lock/Hide are canonical reversible operations.
- Geometry extends `ResponsiveStyleSet` using `layout.x/y/width/height` per breakpoint.
- Viewport semantic guides outrank 8px grid snapping inside the 4px threshold.
- `EditorProjectPersistence` reuses F01 IndexedDB/recovery/autosave contracts.
- Autosave lifecycle is `dirty → saving → saved/error` and revisions remain monotonic.
- Save completion only merges persistence metadata; it never replaces newer editor content.
- Vercel previews deploy automatically from GitHub branches/PRs.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`.
2. Confirm PR #4 final closing CI is green and merge F03 to `main`.
3. Verify Vercel production deployment from merged `main` and `/editor` route.
4. Start F04 from merged `main` in a fresh phase branch.
5. Begin at MF-027 and preserve all F03 contracts above.
6. Do not replace the canonical tree, command history, responsive geometry or persistence runtime with widget-specific alternatives.

## Next phase
F04 — Widgets, inspector, responsive y themes.

## Next microphase
MF-027.
