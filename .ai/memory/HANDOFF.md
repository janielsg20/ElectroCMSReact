# HANDOFF.md

## Current state
F02 implementation is functionally complete on `agent/f02-editor-shell` / PR #3. GitHub Actions run #150 is fully green, including desktop/tablet/mobile E2E. Closing documentation is being finalized and must pass one final CI run before merge.

## Durable F02 facts
- Internal workspace routes: `/editor`, `/preview`, `/backend`, `/export`.
- `ProjectSessionProvider` remains above routed workspace surfaces; route changes must not reset project context.
- Workspace preferences are separate from `CanonicalProject` and stored under `electrocms:workspace-preferences:v1`.
- Compact shell threshold is 960px and is NOT a canonical project breakpoint.
- Undo/Redo intentionally remain disabled until F03 command history exists.
- Mobile header uses local horizontal scrolling with inline-size/paint containment; do not replace this with root `overflow-x:hidden`.

## Resume protocol
1. Read `AI_ENTRYPOINT.md`, `RULES.md`, `MEMORY.md`, `TRACKING.md`.
2. Confirm PR #3 final closing CI is green and merge F02 to `main`.
3. Start F03 in a fresh `agent/f03-canvas-history` branch from merged `main`.
4. Read `phases/F03_canvas_nodos_dnd_e_historial/README.md` and MF-019 completely.
5. Implement MF-019 node tree engine before canvas rendering or DnD.
6. Do not introduce F04 widget registry/inspector/theme-builder scope while completing F03.

## Next microphase
MF-019 — Document node tree engine.
