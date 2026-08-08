# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre funcional de F04. GitHub Actions run #622 es completamente verde.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions continúa siendo el entorno oficial de `npm ci`, tests y build.
- Vercel permanece conectado, pero los auto-deploys están desactivados con `git.deploymentEnabled=false` para ahorrar cuota. Solo desplegar bajo petición explícita.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real de datos, queries, forms y filters pertenece a fases posteriores.
- Preview/Backend/Export siguen siendo shells dedicados. F04 añade controles/preview de theme tokens, no renderers/exporters finales.
- `ProjectThemeRegistry` y package library resuelven themes instalados localmente; empaquetado final de esos themes dentro de exporters pertenece a las fases de export/publish.
- El clipboard de MF-024 sigue siendo transitorio a la sesión del editor; integración con System Clipboard no fue requisito de F03/F04.

## Non-blocking maintenance
- `eslint` reporta 22 warnings `react-refresh/only-export-components` en los tres módulos registry-driven de widgets porque mezclan definiciones/factories exportadas con previews React internos. No son errores, no rompen Fast Refresh en producción ni el build, pero conviene separar previews TSX de contratos/registries en una refactorización de higiene sin cambiar comportamiento.
- El test de preview estructural ha mostrado un warning React histórico porque `GridPreview` propaga `breakpointId` al DOM mediante un spread. Debe eliminarse en la higiene final de F04 o al tocar ese módulo; no afecta el modelo ni los gates actuales.
- GitHub hosted runners muestran advertencias de transición del runtime interno Node usado por algunas versiones de `actions/*`; Node 22 configurado para ElectroCMS sigue funcionando correctamente.
