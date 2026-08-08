# F03 — Canvas, nodos, DnD e historial

## Estado
`DONE` funcionalmente — gate de cierre documental pendiente antes del merge.

## Objetivo cumplido
Construir el motor estructural y de interacción del editor visual sobre el modelo canónico, manteniendo el DOM como proyección del estado y no como fuente de verdad.

## Microfases
- [MF-019 — Document node tree engine](MF-019_document_node_tree_engine.md) — DONE
- [MF-020 — Canvas renderer base](MF-020_canvas_renderer_base.md) — DONE
- [MF-021 — Insert/reorder/nesting](MF-021_insert_reorder_nesting.md) — DONE
- [MF-022 — Selection y multi-selection](MF-022_selection_multi_selection.md) — DONE
- [MF-023 — Commands + undo/redo](MF-023_commands_undo_redo.md) — DONE
- [MF-024 — Clipboard/group/lock/hide](MF-024_clipboard_group_lock_hide.md) — DONE
- [MF-025 — Resize/position/guides/snapping](MF-025_resize_position_guides_snapping.md) — DONE
- [MF-026 — Autosave integration](MF-026_autosave_integration.md) — DONE

## Resultado arquitectónico
- `CanonicalDocument` continúa siendo la única fuente persistente del árbol.
- `CanvasRenderer` proyecta el árbol recursivamente y no contiene APIs de mutación directa.
- Overlays, selección, guides y clipboard UI son transitorios.
- DnD usa IDs y targets semánticos, no coordenadas DOM como contrato de estructura.
- `DocumentCommand` implementa history reversible por documento.
- Clipboard remapea IDs antes de paste.
- Group/Ungroup/Lock/Hide son operaciones canónicas reversibles.
- Geometría se almacena en `ResponsiveStyleSet` por breakpoint activo.
- Snapping prioriza viewport edges/center y luego grid de 8px.
- Autosave del editor reutiliza `ProjectRepository`, `RecoveryRepository` y `AutosaveCoordinator` de F01.

## Evidencia
- MF-019: run #195 PASS.
- MF-020: run #211 PASS.
- MF-021: run #256 PASS.
- MF-022: run #276 PASS.
- MF-023: run #296 PASS.
- MF-024: run #320 PASS.
- MF-025: run #348 PASS.
- MF-026 / cierre funcional: run #368 PASS.

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

No iniciar F04 hasta que este estado documental vuelva a pasar el gate y PR #4 sea integrado a `main`.
