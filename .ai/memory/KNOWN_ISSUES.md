# KNOWN_ISSUES.md

## Blocking
- **F05 quality gate blocked by GitHub Actions runner initialization / execution availability.** Historical runs #986, #990, #994, #1000, #1002, #1014 and #1018 completed as `failure` before either job executed a usable step. Run #1018 came from a brand-new quality PR (`pull_request.opened`) and still returned `steps=[]`; job log download returned `BlobNotFound`. These runs are not valid code-test results and must not be used to mark MF-042 or MF-043 PASS/FAIL.
- During the MF-043 recovery/hardening pass, `quality/f05` was moved to code head `d8694d083bb2896d16869c4909b356a302165636` while technical PR #7 was open. Inspection returned zero workflow runs associated with that commit: verify/lint/TypeScript/unit/coverage/Playwright/build did not execute.
- GitHub Status previously reported Actions operational on Aug 8, 2026. The available connector does not expose billing/quota/runner-allocation details, so the exact account/repo-side cause remains unproven.
- **MF-042 and MF-043 are implemented but unverified.** Neither may be marked DONE until a real full quality gate executes successfully.
- MF-044 remains blocked until MF-042/MF-043 can be closed honestly.

## Environment
- El sandbox local usado anteriormente no resolvía `github.com`; `git ls-remote` fallaba por DNS. El mirror npm disponible tampoco contenía las dependencias React del proyecto, por lo que no podía sustituir `npm ci`/CI.
- GitHub Actions sigue siendo el entorno oficial de instalación/test/build cuando sus runners están disponibles.
- La conexión actual no expone un runner Vercel Sandbox ejecutable para este repo. No convertir CI en deployment.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real se habilita únicamente en su microfase dedicada F05/F06.
- MF-037 implementa CPT model + editor.
- MF-038 implementa Taxonomy model + editor, incluyendo asociaciones a CPTs y referencias a field groups/archive templates existentes.
- MF-039 implementa `FieldTypeRegistry` y contratos versionados de tipos de campo.
- MF-040 implementa `FieldGroupDefinition`/`CustomFieldDefinition`, CRUD canónico y editor Field Library → Ordered Schema → Inspector.
- MF-041 implementa `ContentRecordDefinition`, CRUD, estados, filtros, Backend editor y persistencia de custom values.
- MF-042 activa `core/repeater`, `core/group`, `core/calculated` y `core/conditional` como v2 `available`.
- MF-043 activa `core/relation`, `core/user` y `core/taxonomy` como v2 `available`; sus v1 históricos permanecen `modeled` y no se ejecutan como v2.
- MF-042/MF-043 integran Advanced/Reference Fields dentro de **Field Groups + Records**. No mantener editores paralelos para las mismas fuentes canónicas.
- `conditions[]` y `roleVisibility[]` generales siguen siendo schema portable; MF-042 implementa el tipo Conditional concreto, no un motor global de permisos/visibilidad de backend.
- MF-038/MF-043 no implementan un catálogo CRUD de taxonomy terms. El Taxonomy reference field guarda IDs de terms como datos portables y valida el taxonomy/CPT scope, no la existencia de cada term en un catálogo inexistente.
- MF-041/MF-042/MF-043 no implementan Media Library; featured image/media refs no deben simular un picker inexistente.
- Preview/Export siguen siendo shells dedicados hasta sus fases correspondientes.

## Builder design boundary
- Editor visual principal: Insert/Elements Library izquierda + canvas central dominante + inspector derecho.
- El modelo mental puede resultar familiar a builders como Elementor, pero no copiar código, assets, branding, textos ni composición propietaria.
- En pantallas pequeñas, library/inspector pueden convertirse en drawers/sheets sin perder funcionalidad.
- Backend data CRUD puede usar master-detail denso; Records/Relations no deben convertirse en un canvas artificial.

## MF-042 advanced-field boundaries
- Repeater/Group/Conditional referencian `FieldGroupDefinition` por ID; no duplican schemas dentro de records.
- Direct/indirect Field Group cycles se rechazan.
- Profundidad máxima de referencias avanzadas: 8 niveles.
- Repeater aplica `minItems/maxItems` y hard cap runtime de 100 items.
- Group/Repeater normalizan recursivamente payloads anidados antes de persistir; Calculated y Conditional anidados no pueden quedar obsoletos solo porque validaron sobre una copia temporal.
- `isMf042AdvancedField()` hace el runtime version-aware; contratos históricos/modelados no se ejecutan solo por compartir el mismo `type`.
- Calculated usa un parser aritmético propio y nunca `eval`/Function/dynamic code.
- Calculated solo puede referenciar siblings Number/Currency; no se permiten cadenas Calculated→Calculated dependientes del orden del schema.
- Conditional se normaliza después de poblar siblings y cálculos; persiste `null` cuando la condición es falsa.
- Conditional source debe ser un sibling no avanzado. `greaterThan`/`lessThan` además requieren source Number/Currency y `compareValue` numérico finito; `equals`/`notEquals` requieren `compareValue`; `truthy`/`falsy` no lo requieren.
- Config defaults del registry pueden contener referencias vacías durante la edición; la validación contextual del Field Group exige referencias reales antes de guardar.
- `AdvancedRecordFieldControl` renderiza Group nested, Repeater rows, Calculated read-only y Conditional reactivo; además rechaza ejecutar versiones modeled/históricas como runtime MF-042.

## MF-043 relation/reference boundaries
- `RelationDefinition` vive únicamente en `CanonicalProject.relations`; no crear stores de edges paralelos.
- Relation define source/target Content Type, cardinalidad one/many por lado y flag bidirectional. El ID es estable después de crear.
- `core/relation` v2 guarda un array único de Record IDs y configura `relationId` + `side`.
- El owner Record debe pertenecer al endpoint configurado por `side`; los Records referenciados deben pertenecer al endpoint opuesto.
- Cardinalidad `one` limita el array a un solo Record desde ese lado.
- `core/user` v2 referencia un ID existente en `CanonicalProject.users` o null.
- `core/taxonomy` v2 referencia un taxonomy existente y solo puede usarse para Records cuyo CPT esté asignado a ese taxonomy.
- `FieldGroupEditor` usa selectores contextuales registry-driven: `relation-id`, `relation-side` y `taxonomy-id`; la UI no debe convertirse en autoridad de integridad.
- `ReferenceRecordFieldControl` es solo el renderer/editor de valores; las reglas de integridad viven en core.
- Relation update debe revalidar Field Groups + Records antes de commit. Un cambio incompatible se rechaza atómicamente.
- Eliminar un Record referenciado por Relation field se bloquea; no hay cascada destructiva implícita.
- Eliminar una Relation referenciada por Field Group se bloquea.
- Eliminar un CPT usado como endpoint de Relation se bloquea.
- Eliminar una Taxonomy referenciada por un field v2 se bloquea.
- Referencias MF-043 se validan recursivamente dentro de Group/Repeater/Conditional de MF-042.

## Field type / field group / record boundaries
- `FieldTypeDefinition` contiene callbacks runtime; nunca se serializan dentro de `CanonicalProject`.
- `configSchema`/`defaultConfig` sí son JSON-portable y se clonan defensivamente.
- `FieldGroupDefinition`, `CustomFieldDefinition` y `ContentRecordDefinition` son datos portables sin componentes React/callbacks.
- Field IDs/names son únicos dentro del grupo; el orden canónico vive directamente en `fields[]`.
- Config/default/value validation se delega al registry + validadores contextuales de referencias; no duplicar reglas persistentes en UI.
- Record statuses: draft, published, archived.
- Record slug es único dentro del CPT; ID y `createdAt` son inmutables.
- `listContentRecords()` valida contra el schema actual y omite records inválidos; por eso mutations de schema/Relation deben impedir de forma preventiva cambios incompatibles.
- El `updateFieldGroup` público revalida Records que dependan directa o transitivamente del grupo candidato y rechaza el cambio antes del commit/autosave si alguno quedaría inválido.

## Referential integrity
- CPT no puede eliminarse mientras records, taxonomías o Relations lo referencien.
- Taxonomías rechazan CPT/field-group/archive refs desconocidas.
- Field Group no puede eliminarse mientras taxonomy, record u otro advanced/reference field lo referencie.
- Field Group no puede actualizarse a un schema que invalide Records existentes que dependan directa o transitivamente de él.
- Relation no puede eliminarse mientras un Field Group la referencie ni actualizarse si el cambio invalida Records existentes.
- Referenced Records no pueden eliminarse mientras otro Record mantenga un `core/relation` v2 apuntando a ellos.
- No inventar cascadas destructivas para relaciones/terms.

## Persistence testing note
- Un texto `Saved locally` no es suficiente como barrera durable antes de reload.
- E2E de Taxonomies, Field Groups, Records, MF-042 y MF-043 sondean `electrocms/projects` en IndexedDB cuando la afirmación depende de persistencia real.
- `e2e/relations.spec.ts` usa IDs deterministas y comprueba que los guards rechazados no alteran el estado durable original.

## Non-blocking maintenance
- Existen warnings `react-refresh/only-export-components` históricos en módulos registry-driven de widgets. No son errores específicos de MF-042/MF-043; refactor de higiene futuro.
- El warning React de `GridPreview` quedó corregido en F04.
- GitHub hosted runners también han mostrado warnings de transición de runtime interno de algunas `actions/*`; Node 22 del proyecto permanece válido.
