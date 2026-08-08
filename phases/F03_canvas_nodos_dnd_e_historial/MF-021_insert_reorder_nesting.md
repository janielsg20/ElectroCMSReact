# MF-021 — Insert/reorder/nesting

## Estado
`DONE`

## Objetivo cumplido
Conectar inserción por clic y drag-and-drop semántico al árbol canónico sin permitir mutaciones estructurales directas desde el DOM.

## Implementación
- `moveDocumentNode()` reordena o reparenta nodos de forma inmutable.
- Validación previa bloquea root, self-parent, descendant-parent e índices inválidos.
- `ProjectSession` mantiene una frontera controlada para reemplazar el documento mediante comandos.
- `useCanvasDocumentActions()` expone inserción y movimiento; el canvas no accede a IndexedDB.
- Click `Insert container` crea un `core/container` canónico real.
- DnD serializa únicamente node ID y usa targets `{ parentId, index }`.
- Drop zones son UI auxiliar y no forman parte del modelo persistido.
- Targets de inserción tienen hit-area física estable para evitar drops intermitentes en Chromium.

## Validación
- Unit tests de reorder/nesting y destinos inválidos.
- Component test de inserción real.
- Playwright de insert, nesting y same-parent reorder.
- GitHub Actions run #256 — PASS completo.
