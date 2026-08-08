# KNOWN_ISSUES.md

## Blocking
Ninguno conocido al cierre funcional de MF-041. GitHub Actions run #901 es completamente verde.

## Environment
- El sandbox actual no resuelve `registry.npmjs.org`; no es un defecto de ElectroCMS.
- GitHub Actions continúa siendo el entorno oficial de `npm ci`, tests y build.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real se habilita únicamente en su microfase dedicada F05/F06.
- MF-037 implementa CPT model + editor.
- MF-038 implementa Taxonomy model + editor, incluyendo asociaciones a CPTs y referencias a field groups/archive templates existentes.
- MF-039 implementa el `FieldTypeRegistry` y los contratos de tipos de campo.
- MF-040 implementa `FieldGroupDefinition`/`CustomFieldDefinition`, CRUD canónico, editor de grupos/campos y persistencia en `CanonicalProject.fieldGroups`.
- MF-041 implementa `ContentRecordDefinition`, CRUD canónico, estados, búsqueda/filtros, edición Backend y validación/persistencia de valores custom en `CanonicalProject.records`.
- Los 27 tipos mínimos del prompt están registrados; 20 están disponibles para schema/records básicos y 7 avanzados permanecen `modeled`.
- `relation`, `user`, `taxonomy`, `repeater`, `group`, `calculated` y `conditional` no deben tratarse como runtime completo solo por estar registrados.
- MF-040/041 rechazan instancias runtime de tipos `modeled`; MF-042 implementará Advanced Fields y MF-043 implementará Relations.
- `conditions[]` y `roleVisibility[]` forman parte del schema portable, pero su runtime/editor avanzado todavía no está activo.
- MF-038 NO implementa CRUD de taxonomy terms/term records. El alcance actual modela la definición de la taxonomía, no sus entradas de contenido.
- MF-038 NO crea archive templates; `archiveTemplateId` solo referencia un documento existente de `kind=archive`.
- MF-041 NO implementa Media Library. Cuando un CPT soporta featured image, Records UI lo indica honestamente en vez de simular un picker inexistente.
- MF-041 NO implementa relaciones, repeaters, calculated/conditional runtime ni taxonomy/user references; pertenecen MF-042/MF-043.
- Backend sigue siendo un workspace de autoría incremental: Content Types, Taxonomies, Field Groups y Records son reales, pero el backend generado/publicable final pertenece a fases posteriores.
- Preview/Export siguen siendo shells dedicados hasta sus fases de renderer/export.
- La biblioteca local de themes resuelve definiciones instaladas; el bundling final dentro de exporters pertenece a fases de export/publish.
- El clipboard de MF-024 sigue siendo transitorio a la sesión del editor; integración con System Clipboard no fue requisito de F03/F04/F05 actual.

## Builder design boundary
- El editor principal debe conservar patrón de visual builder profesional: Insert/Elements Library izquierda + canvas central dominante + inspector derecho.
- La comparación con Elementor describe el modelo mental de interacción, no autoriza copiar código, assets, branding, textos ni composición propietaria.
- En pantallas pequeñas, library/inspector pueden pasar a drawers/sheets, pero no desaparecer como funciones.
- Backend CRUD que no necesita canvas puede usar master-detail denso; Records usa este patrón porque su tarea primaria es buscar/listar/editar contenido, no composición espacial.

## Field type / field group / record boundaries
- `FieldTypeDefinition` contiene callbacks runtime de validación/default/migración; esos callbacks nunca deben serializarse dentro de `CanonicalProject`.
- `configSchema` y `defaultConfig` sí deben ser JSON-portable y se clonan defensivamente al resolver una definición.
- `availability=available` permite schema/record values básicos; no implica que advanced behavior, render/export o media binding estén terminados.
- `availability=modeled` significa que el contrato existe para modelos futuros, pero su comportamiento se reserva para MF-042/MF-043.
- `FieldGroupDefinition`, `CustomFieldDefinition` y `ContentRecordDefinition` son datos portables; no contienen callbacks ni componentes React.
- Field IDs/names deben ser únicos dentro del grupo; field order se conserva directamente en `fields[]`.
- Config/default/value validation se delega al registry. No añadir validadores de tipo duplicados al model/UI de Field Groups o Records.
- Record statuses actuales: draft, published, archived.
- Record slug debe ser único dentro de su CPT; record ID y `createdAt` son inmutables.
- El editor de settings derivado de `configSchema` cubre los descriptors actuales mínimos; schemas JSON más ricos pueden requerir renderers dedicados sin romper el contrato core.

## Referential integrity
- Un CPT no puede eliminarse mientras existan records que lo referencien.
- Un CPT tampoco puede eliminarse mientras una taxonomy conserve su ID en `contentTypeIds`.
- Una taxonomy no puede guardar content type IDs desconocidos.
- Una taxonomy no puede guardar field group IDs desconocidos.
- Una taxonomy solo puede guardar como archive template un documento existente de `kind=archive`.
- Un field group no puede eliminarse mientras una taxonomy conserve su ID en `fieldGroupIds`.
- Desde MF-041, un field group tampoco puede eliminarse mientras un content record conserve su ID en `fieldGroupIds`; la API pública de content core enruta removal por `removeFieldGroupWithRecordIntegrity`.
- La eliminación de taxonomy terms y la migración de relations todavía no existen; no inventar cascadas destructivas antes de sus microfases.

## Persistence testing note
- Durante MF-037, el E2E de project themes expuso que observar `Saved locally` y recargar inmediatamente puede no ser una barrera suficientemente fuerte para una aserción de almacenamiento durable.
- Los tests relevantes sondean directamente `electrocms/projects` en IndexedDB antes de reload.
- MF-038 aplica la regla a Taxonomies, MF-040 a Field Groups y MF-041 a Records.
- Para futuros CRUD F05, mantener una aserción durable equivalente cuando el resultado dependa de que la escritura haya llegado realmente al store.

## Non-blocking maintenance
- `eslint` reporta warnings `react-refresh/only-export-components` en módulos registry-driven de widgets porque mezclan definiciones/factories exportadas con previews React internos. No son errores ni rompen el build; separar previews TSX de contratos/registries queda como refactor de higiene futura.
- El warning React de `GridPreview` propagando props internas al DOM quedó corregido durante el cierre F04.
- GitHub hosted runners muestran advertencias de transición del runtime interno Node usado por algunas versiones de `actions/*`; Node 22 configurado para ElectroCMS sigue funcionando correctamente.
