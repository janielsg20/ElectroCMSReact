# F03 — Canvas, nodos, DnD e historial

## Estado
`IN_PROGRESS`

## Objetivo
Construir el motor estructural y de interacción del editor visual sobre el modelo canónico, manteniendo el DOM como proyección del estado y no como fuente de verdad.

## Microfases
- [MF-019 — Document node tree engine](MF-019_document_node_tree_engine.md) — DONE
- MF-020 — Canvas renderer base — IN_PROGRESS
- MF-021 — Insert/reorder/nesting — TODO
- MF-022 — Selection y multi-selection — TODO
- MF-023 — Commands + undo/redo — TODO
- MF-024 — Clipboard/group/lock/hide — TODO
- MF-025 — Resize/position/guides/snapping — TODO
- MF-026 — Autosave integration del editor — TODO

## Invariantes de fase
- El árbol persistido sigue siendo `nodes: Record<id, node>` + `children` ordenados.
- `parentId`, depth y traversals son derivados y no se persisten.
- Canvas, overlays y selección no alteran la semántica del documento.
- DnD opera por IDs/targets semánticos y valida parent/cycles antes de commit.
- Undo/redo se implementa mediante commands reversibles; no mediante snapshots DOM.
- No introducir widget registry/inspector/theme-builder de F04 durante esta fase.

## Gate
```bash
npm run verify:repo
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

La fase completa solo se cierra tras MF-026 y un gate final verde.
