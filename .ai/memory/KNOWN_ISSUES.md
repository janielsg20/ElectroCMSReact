# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre funcional de MF-038. GitHub Actions run #766 es completamente verde.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions continúa siendo el entorno oficial de `npm ci`, tests y build.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real se habilita únicamente en su microfase dedicada F05/F06.
- MF-037 implementa CPT model + editor.
- MF-038 implementa Taxonomy model + editor, incluyendo asociaciones a CPTs y referencias a field groups/archive templates existentes.
- MF-038 NO crea Custom Field definitions/groups; `fieldGroupIds` solo puede apuntar a grupos ya presentes. El registry y editor de campos pertenecen a MF-039/MF-040.
- MF-038 NO implementa CRUD de taxonomy terms/term records. El alcance actual modela la definición de la taxonomía, no sus entradas de contenido.
- MF-038 NO crea archive templates; `archiveTemplateId` solo referencia un documento existente de `kind=archive`.
- Records CRUD sigue reservado para MF-041.
- Backend sigue siendo un workspace de autoría incremental: Content Types y Taxonomies son reales, pero el backend final generado pertenece a fases posteriores.
- Preview/Export siguen siendo shells dedicados hasta sus fases de renderer/export.
- La biblioteca local de themes resuelve definiciones instaladas; el bundling final dentro de exporters pertenece a fases de export/publish.
- El clipboard de MF-024 sigue siendo transitorio a la sesión del editor; integración con System Clipboard no fue requisito de F03/F04/F05 actual.

## Referential integrity
- Un CPT no puede eliminarse mientras existan records que lo referencien.
- Desde MF-038, un CPT tampoco puede eliminarse mientras una taxonomy conserve su ID en `contentTypeIds`.
- Una taxonomy no puede guardar content type IDs desconocidos.
- Una taxonomy no puede guardar field group IDs desconocidos.
- Una taxonomy solo puede guardar como archive template un documento existente de `kind=archive`.
- La eliminación de taxonomy terms y la migración de records/relations todavía no existen; no inventar cascadas destructivas antes de sus microfases.

## Persistence testing note
- Durante MF-037, el E2E de project themes expuso que observar `Saved locally` y recargar inmediatamente puede no ser una barrera suficientemente fuerte para una aserción de almacenamiento durable.
- Los tests relevantes ahora sondean directamente `electrocms/projects` en IndexedDB antes de reload.
- MF-038 aplica la misma regla a Taxonomies. Para futuros CRUD F05, preferir una aserción durable equivalente cuando el resultado dependa de que la escritura haya llegado realmente al store.

## Non-blocking maintenance
- `eslint` reporta warnings `react-refresh/only-export-components` en módulos registry-driven de widgets porque mezclan definiciones/factories exportadas con previews React internos. No son errores ni rompen el build; separar previews TSX de contratos/registries queda como refactor de higiene futura.
- El warning React de `GridPreview` propagando props internas al DOM quedó corregido durante el cierre F04.
- GitHub hosted runners muestran advertencias de transición del runtime interno Node usado por algunas versiones de `actions/*`; Node 22 configurado para ElectroCMS sigue funcionando correctamente.
