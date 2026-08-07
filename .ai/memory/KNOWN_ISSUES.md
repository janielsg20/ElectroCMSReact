# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre funcional de F02.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions es el entorno oficial de `npm ci`, tests y build.

## Known scope boundaries
- Undo/Redo están visibles pero deshabilitados por diseño hasta MF-023 en F03.
- `WorkspaceSurface` es el shell estructural; el canvas renderer real comienza en MF-020. No presentarlo como constructor visual terminado.
- El editor theme de F02 es solo la base light/dark/auto; presets profesionales/theme packages pertenecen a F04.

## Non-blocking maintenance
- GitHub hosted runners muestran una advertencia de transición del runtime interno Node usado por algunas versiones de `actions/*`; no afecta Node 22 configurado para el proyecto. Revisar versiones de acciones cuando sea oportuno, sin mezclarlo con el alcance funcional de F03.
