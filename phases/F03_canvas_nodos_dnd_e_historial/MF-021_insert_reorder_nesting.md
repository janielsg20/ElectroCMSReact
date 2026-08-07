# MF-021 — Insert/reorder/nesting

## Estado
`IN_PROGRESS`

## Objetivo
Conectar inserción por clic y drag-and-drop semántico al árbol canónico sin permitir mutaciones estructurales directas desde el DOM.

## Implementación en validación
- `moveDocumentNode()` reordena o reparenta nodos de forma inmutable.
- Validación previa bloquea root, self-parent, descendant-parent e índices inválidos.
- `ProjectSession.replaceDocument()` es la frontera controlada para sustituir el documento activo y marcar la sesión `dirty`.
- `useCanvasDocumentActions()` expone `insertContainer()` y `moveNode()`; el canvas no recibe `setProject` ni acceso a persistencia.
- Click `Insert container` crea un `core/container` real.
- DnD serializa únicamente el node ID y usa drop targets `{ parentId, index }`.
- El renderer sigue siendo una proyección del árbol; drop zones no forman parte del modelo persistido.

## Validación requerida antes de DONE
- Unit tests de reorder/nesting y destinos inválidos.
- Component test de inserción real + save state `dirty`.
- Playwright: insertar, anidar y reordenar nodos usando drag-and-drop.
- Gate completo `verify/lint/typecheck/test/coverage/build/e2e` verde.
