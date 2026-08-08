# KNOWN_ISSUES.md

## Blocking
- **MF-042 gate blocked by GitHub Actions runner initialization.** Runs #986, #990, #994, #1000 and #1002 complete as `failure` with both jobs containing zero executed steps and no downloadable logs. These are not valid code-test results and must not be used to mark MF-042 PASS or FAIL.
- MF-043 remains blocked until a real MF-042 gate executes verify, lint, TypeScript, unit, coverage, Playwright and build successfully.

## Environment
- El sandbox local de esta sesión no resuelve `registry.npmjs.org` ni `github.com`; no puede sustituir el gate mediante `npm ci` local.
- GitHub Actions sigue siendo el entorno oficial de instalación/test/build cuando sus runners están disponibles.
- La conexión actual de Vercel expone documentación de Sandbox, pero no una acción de ejecución de Sandbox. No convertir CI en deployment.
- Vercel auto-deploy está desactivado con `git.deploymentEnabled=false`; desplegar solo bajo petición explícita.

## Known scope boundaries
- Widgets dynamic/commerce/form/filter de F04 son contratos `modeled`; su comportamiento real se habilita únicamente en su microfase dedicada F05/F06.
- MF-037 implementa CPT model + editor.
- MF-038 implementa Taxonomy model + editor, incluyendo asociaciones a CPTs y referencias a field groups/archive templates existentes.
- MF-039 implementa `FieldTypeRegistry` y contratos versionados de tipos de campo.
- MF-040 implementa `FieldGroupDefinition`/`CustomFieldDefinition`, CRUD canónico y editor Field Library → Ordered Schema → Inspector.
- MF-041 implementa `ContentRecordDefinition`, CRUD, estados, filtros, Backend editor y persistencia de custom values.
- MF-042 activa únicamente `core/repeater`, `core/group`, `core/calculated` y `core/conditional` como v2 `available`.
- `core/relation`, `core/user` y `core/taxonomy` siguen `modeled` hasta MF-043; no deben aparecer como runtime funcional antes de esa microfase.
- MF-042 integra Advanced Fields dentro de **Field Groups + Records**. No mantener una pestaña/editor paralelo `AdvancedFieldEditor` para la misma fuente canónica.
- `conditions[]` y `roleVisibility[]` generales siguen siendo schema portable; MF-042 implementa el tipo Conditional concreto, no un motor global de permisos/visibilidad de backend.
- MF-038 no implementa taxonomy-term records.
- MF-041/MF-042 no implementan Media Library; featured image/media refs no deben simular un picker inexistente.
- Preview/Export siguen siendo shells dedicados hasta sus fases correspondientes.

## Builder design boundary
- Editor visual principal: Insert/Elements Library izquierda + canvas central dominante + inspector derecho.
- El modelo mental puede resultar familiar a builders como Elementor, pero no copiar código, assets, branding, textos ni composición propietaria.
- En pantallas pequeñas, library/inspector pueden convertirse en drawers/sheets sin perder funcionalidad.
- Backend data CRUD puede usar master-detail denso; Records no debe convertirse en un canvas artificial.

## MF-042 advanced-field boundaries
- Repeater/Group/Conditional referencian `FieldGroupDefinition` por ID; no duplican schemas dentro de records.
- Direct/indirect Field Group cycles se rechazan.
- Profundidad máxima de referencias avanzadas: 8 niveles.
- Repeater aplica `minItems/maxItems` y hard cap runtime de 100 items.
- Calculated usa un parser aritmético propio y nunca `eval`/Function/dynamic code.
- Calculated solo puede referenciar siblings Number/Currency; no se permiten cadenas Calculated→Calculated dependientes del orden del schema.
- Conditional se normaliza después de los cálculos y persiste `null` cuando la condición es falsa.
- Config defaults del registry pueden contener referencias vacías durante la edición; la validación contextual del Field Group exige referencias reales antes de guardar.
- `AdvancedRecordFieldControl` renderiza Group nested, Repeater rows, Calculated read-only y Conditional reactivo; el core sigue siendo React-free.

## Field type / field group / record boundaries
- `FieldTypeDefinition` contiene callbacks runtime; nunca se serializan dentro de `CanonicalProject`.
- `configSchema`/`defaultConfig` sí son JSON-portable y se clonan defensivamente.
- `FieldGroupDefinition`, `CustomFieldDefinition` y `ContentRecordDefinition` son datos portables sin componentes React/callbacks.
- Field IDs/names son únicos dentro del grupo; el orden canónico vive directamente en `fields[]`.
- Config/default/value validation se delega al registry + validadores contextuales de referencias; no duplicar reglas persistentes en UI.
- Record statuses: draft, published, archived.
- Record slug es único dentro del CPT; ID y `createdAt` son inmutables.

## Referential integrity
- CPT no puede eliminarse mientras records o taxonomías lo referencien.
- Taxonomías rechazan CPT/field-group/archive refs desconocidas.
- Field Group no puede eliminarse mientras taxonomy, record u otro advanced field lo referencie.
- No inventar cascadas destructivas para relaciones/terms antes de sus microfases.

## Persistence testing note
- Un texto `Saved locally` no es suficiente como barrera durable antes de reload.
- E2E de Taxonomies, Field Groups, Records y MF-042 sondean `electrocms/projects` en IndexedDB cuando la afirmación depende de persistencia real.

## Non-blocking maintenance
- Existen warnings `react-refresh/only-export-components` históricos en módulos registry-driven de widgets. No son errores de MF-042; refactor de higiene futuro.
- El warning React de `GridPreview` quedó corregido en F04.
- GitHub hosted runners también muestran warnings de transición de runtime interno de algunas `actions/*`; Node 22 del proyecto permanece válido.
