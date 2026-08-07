# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre funcional de F01.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions es el entorno oficial de `npm ci`, tests y build.

## Non-blocking maintenance
- GitHub hosted runners muestran una advertencia de transición del runtime interno Node usado por algunas versiones de `actions/*`; no afecta Node 22 configurado para el proyecto. Revisar versiones de acciones cuando sea oportuno, sin mezclarlo con alcance funcional de F02.
