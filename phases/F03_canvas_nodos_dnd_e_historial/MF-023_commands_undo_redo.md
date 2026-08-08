# MF-023 — Commands + undo/redo

## Estado
`DONE`

## Objetivo cumplido
Implementar historial real y reversible por documento sin snapshots del DOM.

## Implementación
- `DocumentCommand` almacena `before/after` de `CanonicalDocument`, label y document ID.
- Historial separado por documento con stacks `past/future`.
- Ejecutar un comando nuevo limpia redo.
- `ProjectSession` expone `executeDocumentCommand`, `undo`, `redo`, `canUndo`, `canRedo`.
- Insert y Move pasan por command history.
- Header activa Undo/Redo reales.
- Atajos: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z y Ctrl+Y; se ignoran inputs/select/contenteditable.

## Validación
- Unit tests record→undo→redo y clear-redo tras nuevo comando.
- Component test de botones Undo/Redo.
- Playwright de botones y shortcuts sincronizados con el canvas.
- GitHub Actions run #296 — PASS completo.
