# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre funcional definitivo de F04. GitHub Actions run #688 es completamente verde.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions continúa siendo el entorno oficial de `npm ci`, tests y build.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real pertenece a fases posteriores.
- Preview/Backend/Export siguen siendo shells dedicados. F04 añade controles y previews de theme tokens, no renderers/exporters finales.
- La biblioteca local de themes resuelve definiciones instaladas; el bundling final dentro de exporters pertenece a fases de export/publish.
- Los paquetes F04 transfieren solo los grupos modelados explícitamente soportados por `ProjectThemePackageResources`.
- El clipboard de MF-024 sigue siendo transitorio a la sesión del editor; integración con System Clipboard no fue requisito de F03/F04.

## Non-blocking maintenance
- `eslint` reporta warnings `react-refresh/only-export-components` en módulos registry-driven de widgets porque mezclan definiciones/factories exportadas con previews React internos. No son errores ni rompen el build; separar previews TSX de contratos/registries queda como refactor de higiene futura.
- El warning React de `GridPreview` propagando props internas al DOM quedó corregido durante el cierre F04.
- GitHub hosted runners muestran advertencias de transición del runtime interno Node usado por algunas versiones de `actions/*`; Node 22 configurado para ElectroCMS sigue funcionando correctamente.
