# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre funcional de F03.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions continúa siendo el entorno oficial de `npm ci`, tests y build.
- Vercel está conectado para previews automáticos y producción desde `main`.

## Known scope boundaries
- F03 implementa canvas/nodos/DnD/history, pero no debe presentarse todavía como biblioteca completa de widgets ni inspector profesional; eso pertenece a F04.
- Los nodos actuales `core/container`/`core/group` son primitives estructurales; widget registry y renderers específicos se incorporan en F04.
- Geometry F03 cubre X/Y/W/H responsive + snapping; inspector avanzado, tokens/theme controls y propiedades widget-specific pertenecen a F04.
- Preview/Backend/Export siguen siendo shells dedicados hasta sus fases correspondientes; no deben confundirse con exporters terminados.

## Non-blocking maintenance
- GitHub hosted runners muestran una advertencia de transición del runtime interno Node usado por algunas versiones de `actions/*`; no afecta Node 22 configurado para el proyecto. Revisar versiones de acciones de forma separada al alcance funcional.
- El clipboard de MF-024 es transitorio a la sesión del editor; integración con System Clipboard no fue requisito de F03.
