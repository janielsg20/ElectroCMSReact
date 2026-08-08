# MF-025 — Resize/position/guides/snapping

## Estado
`DONE`

## Objetivo cumplido
Añadir geometría responsive editable sin crear una segunda fuente de layout y con feedback de snapping transitorio.

## Implementación
- Geometría usa `ResponsiveStyleSet`: `layout.x`, `layout.y`, `layout.width`, `layout.height`.
- Valores se escriben como slots explícitos para el breakpoint activo.
- Resolver geometry soporta slots `explicit/inherited/unset`.
- Inputs X/Y/W/H y nudge de 8 px actualizan el nodo mediante comandos reversibles.
- Width/height respetan mínimo de 32 px.
- Snapping usa threshold 4 px, grid de 8 px y anclas de viewport.
- Bordes/centro del viewport tienen prioridad sobre grid cuando ambos están dentro del threshold.
- Guides se muestran en `CanvasOverlayLayer` y nunca se persisten.

## Validación
- Unit tests de aislamiento por breakpoint, inheritance, snapping y min size.
- Component test de geometría renderizada para breakpoint activo.
- Playwright de 17→16, 319→320, Undo y Desktop/Mobile isolation.
- GitHub Actions run #348 — PASS completo.
