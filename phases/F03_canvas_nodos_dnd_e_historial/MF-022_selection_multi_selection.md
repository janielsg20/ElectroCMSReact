# MF-022 — Selection y multi-selection

## Estado
`DONE`

## Objetivo cumplido
Añadir selección visual simple y múltiple sin persistir estado de interacción dentro de `CanonicalProject`.

## Implementación
- `useCanvasSelection()` mantiene selección transitoria y descarta IDs que ya no existen.
- Click normal reemplaza selección; Ctrl/Cmd-click agrega o elimina nodos.
- Escape limpia selección.
- Enter/Espacio permiten seleccionar desde teclado.
- `CanvasRenderer` expone `aria-selected`, listbox multiselect y `data-selected`.
- `CanvasOverlayLayer` recibe solo el count/IDs necesarios para feedback transitorio.
- La zona de selección está separada de la superficie draggable para no competir con DnD.

## Validación
- Unit tests de toggle aditivo.
- Playwright de single selection, multi-selection y Escape.
- Regresión DnD validada junto con selección.
- GitHub Actions run #276 — PASS completo.
