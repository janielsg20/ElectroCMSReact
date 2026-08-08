# MF-024 — Clipboard/group/lock/hide

## Estado
`DONE`

## Objetivo cumplido
Añadir operaciones de edición contextual canónicas y reversibles sobre la selección.

## Implementación
- Copy serializa subárboles seleccionados sin mutar el documento.
- Cut elimina roots efectivas evitando duplicar descendants seleccionados.
- Paste remapea todos los IDs antes de insertar y conserva relaciones internas.
- Group exige siblings directos del mismo parent y conserva orden canónico.
- Ungroup restaura children en la posición del grupo.
- Lock/Unlock y Hide/Show actualizan flags canónicos sin mutar estructura.
- Barra contextual usa selección transitoria y clipboard de UI.
- Todas las operaciones mutantes entran por `DocumentCommand`, por lo que son Undo/Redo.

## Validación
- Unit tests de copy/paste fresh IDs, cut, group/ungroup y flags.
- Playwright de Copy/Paste/Cut + Undo.
- Playwright de Group/Ungroup, Lock/Unlock, Hide/Show + Undo.
- GitHub Actions run #320 — PASS completo.
