# MF-026 — Autosave integration del editor

## Estado
`DONE`

## Objetivo cumplido
Integrar las mutaciones reales del editor con la persistencia local-first implementada en F01, sin crear un segundo sistema de storage.

## Implementación
- `EditorProjectPersistence` compone `ProjectRepository`, `RecoveryRepository` y `AutosaveCoordinator`.
- Producción usa IndexedDB automáticamente; tests pueden inyectar repositorios in-memory.
- Hydration compara proyecto principal y recovery y elige el más fresco por revision + `updatedAt`.
- `ProjectSession` encola autosave tras command/undo/redo.
- Save state real: `dirty → saving → saved` o `error`.
- Autosave conserva revisiones monotónicas aun si una edición pendiente contiene metadata stale.
- Snapshot recovery se escribe antes del proyecto principal.
- Callback `saved` fusiona solo metadata de persistencia; nunca sobrescribe contenido editor más nuevo.
- `visibilitychange/pagehide` intenta flush de cambios pendientes.
- Reload del navegador rehidrata el proyecto persistido.

## Validación
- Unit tests de lifecycle saving/saved y revision monotónica.
- Unit tests de elección de recovery más reciente.
- Component test de dirty→saved con repositorios in-memory.
- Playwright real: editar → autosave → IndexedDB/recovery → reload → nodo restaurado.
- GitHub Actions run #368 — PASS completo.
