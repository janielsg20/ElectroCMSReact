# MF-014 — Header superior

## Estado
`DONE`

## Objetivo cumplido
Header real conectado a application/session state.

## Implementación
- Nombre de proyecto y estado de guardado.
- Documento activo y breakpoint.
- Zoom 50–200.
- Preview y Export navegan a rutas reales.
- Undo/Redo permanecen visibles pero deshabilitados hasta el command history de F03; no se simula funcionalidad inexistente.
- Indicador local-first y selector de theme mode del editor.

## Validación
Component tests + Playwright — PASS en run #150.
