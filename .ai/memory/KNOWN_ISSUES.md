# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre de MF-037. GitHub Actions run #730 es completamente verde.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions continúa siendo el entorno oficial de `npm ci`, tests y build.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real se habilita únicamente en su microfase dedicada F05/F06.
- MF-037 implementa CPT model + editor, no Taxonomy, Custom Fields ni Records CRUD.
- Backend sigue siendo un workspace de autoría incremental: el editor de CPT es real, pero el backend final generado pertenece a fases posteriores.
- Preview/Export siguen siendo shells dedicados hasta sus fases de renderer/export.
- La biblioteca local de themes resuelve definiciones instaladas; el bundling final dentro de exporters pertenece a fases de export/publish.
- El clipboard de MF-024 sigue siendo transitorio a la sesión del editor; integración con System Clipboard no fue requisito de F03/F04/F05 actual.

## Persistence testing note
- Durante MF-037, el E2E de project themes expuso que observar `Saved locally` y recargar inmediatamente puede no ser una barrera suficientemente fuerte para una aserción de almacenamiento durable.
- El test ahora sondea directamente `electrocms/projects` en IndexedDB antes de reload. Esta es una mejora del contrato de prueba, no un cambio de schema o DB.
- Para futuros CRUD F05 que deban sobrevivir reload, preferir una aserción durable equivalente cuando el resultado dependa de que la escritura haya llegado realmente al store.

## Non-blocking maintenance
- `eslint` reporta warnings `react-refresh/only-export-components` en módulos registry-driven de widgets porque mezclan definiciones/factories exportadas con previews React internos. No son errores ni rompen el build; separar previews TSX de contratos/registries queda como refactor de higiene futura.
- El warning React de `GridPreview` propagando props internas al DOM quedó corregido durante el cierre F04.
- GitHub hosted runners muestran advertencias de transición del runtime interno Node usado por algunas versiones de `actions/*`; Node 22 configurado para ElectroCMS sigue funcionando correctamente.
