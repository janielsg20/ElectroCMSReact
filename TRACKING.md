# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F04 — Widgets, inspector, responsive y themes
- Fase actual: F05 — Contenido dinámico
- Última microfase completada con gate ejecutable: MF-041 — Records CRUD
- Microfase pendiente de cierre: MF-042 — Advanced fields (IMPLEMENTED / UNVERIFIED)
- Implementación recuperada actual: MF-043 — Relations (IMPLEMENTED / UNVERIFIED)
- Siguiente microfase bloqueada: MF-044 — Dynamic bindings
- Último quality gate funcional completo: GitHub Actions run #901 PASS
- Cierre documental MF-041: GitHub Actions run #915 PASS; evidence-sync #921 PASS
- MF-042: implementación, hardening y tests presentes; NO marcar DONE hasta un gate ejecutado completo.
- MF-043: Relation model/editor, reference field runtime, referential-integrity guards, contextual authoring selectors y tests unit/E2E presentes; NO marcar DONE hasta un gate ejecutado completo.
- GitHub Actions runs #986/#990/#994/#1000/#1002/#1014 y #1018 fallaron antes de ejecutar steps o sin logs utilizables. #1018 provino de un PR nuevo con evento `pull_request.opened` y también terminó con `steps=[]`/`BlobNotFound`; no son evidencia PASS/FAIL del código.
- Intento de recuperación MF-043: `quality/f05` sincronizado al code head `d8694d083bb2896d16869c4909b356a302165636` con PR técnico #7 abierto; inspección devolvió cero workflow runs asociados al commit, por lo que ningún step de verify/lint/types/unit/coverage/E2E/build llegó a ejecutarse.
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de fase: #6 `agent/f05-dynamic-content -> main` (draft)
- Preview deployment: MANUAL ONLY. `vercel.json` usa `git.deploymentEnabled: false`; no desplegar por push/PR.

## F00
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-000 | DONE | Inventario del proyecto completado |
| MF-001 | DONE | Gap analysis completado |
| MF-002 | DONE | Arquitectura React/TypeScript definida |
| MF-003 | DONE | Modelo canónico y versionado definido |
| MF-004 | DONE | Contratos de registries/renderers/exporters definidos |
| MF-005 | DONE | CI base con lint, types, tests, coverage, build y E2E |

## F01
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-006 | DONE | React/TypeScript strict, `package-lock.json`, CI reproducible con `npm ci` |
| MF-007 | DONE | Core domain independiente de React/DOM: JSON, errores, Result e IDs tipados |
| MF-008 | DONE | `CanonicalProject` schema v1, factory, seis breakpoints y validación de integridad del árbol |
| MF-009 | DONE | `ProjectRepository` + adapter in-memory con clones defensivos y conflicto en create duplicado |
| MF-010 | DONE | CRUD IndexedDB transaccional + recovery store + Playwright reload E2E |
| MF-011 | DONE | Migration registry ordenado, v0→v1, rechazo de schemas futuros e integración desde IndexedDB |
| MF-012 | DONE | Autosave debounced/serializado, revisión incremental y recovery snapshots limitados |

## F02
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-013 | DONE | History API router para Editor/Preview/Backend/Export y `ProjectSessionProvider`; E2E conserva zoom/estado |
| MF-014 | DONE | Header conectado a project/save/document/breakpoint/zoom y routing Preview/Export |
| MF-015 | DONE | Navegación izquierda/derecha, collapse, resize, reorder, icon/text modes y density |
| MF-016 | DONE | Estrategias desktop/tablet/mobile, drawer accesible y Playwright sin overflow raíz |
| MF-017 | DONE | Workspace preferences schema v1 separado de `CanonicalProject`; reload E2E |
| MF-018 | DONE | Editor light/dark/auto persistente e independiente de frontend/backend themes |

## F03
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-019 | DONE | Motor inmutable de árbol, indexes/traversals/invariants; run #195 PASS |
| MF-020 | DONE | Renderer recursivo del modelo canónico y overlay separado; run #211 PASS |
| MF-021 | DONE | Inserción, reorder/nesting y DnD semántico; run #256 PASS |
| MF-022 | DONE | Selección simple/múltiple transitoria y convivencia con DnD; run #276 PASS |
| MF-023 | DONE | `DocumentCommand` reversible, Undo/Redo y atajos; run #296 PASS |
| MF-024 | DONE | Copy/Cut/Paste, Group/Ungroup, Lock/Hide reversibles; run #320 PASS |
| MF-025 | DONE | Geometría responsive, snapping, guías y Undo; run #348 PASS |
| MF-026 | DONE | Autosave/hydration/recovery IndexedDB integrado; run #368 PASS y cierre final #396 PASS |

## F04
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-027 | DONE | Registry framework-neutral + binding React, factories, validation, child policies, capabilities, migrations y plugin preview sin branching del editor; run #424 PASS |
| MF-028 | DONE | Container/Group/Section/Grid/Flex/Stack/Divider/Spacer/Tabs/Accordion registrados, inserción genérica y factories registry-driven; run #434 PASS |
| MF-029 | DONE | 16 widgets básicos/contenido con defaults, validación, previews e inserción registry-driven; run #446 PASS |
| MF-030 | DONE | 19 contratos dynamic/commerce/form/filter con capacidad `modeled`, previews honestos y validación; run #456 PASS |
| MF-031 | DONE | Inspector schema engine, controles generados, validación, edición canónica y Undo/Redo; run #479 PASS |
| MF-032 | DONE | Style engine responsive, resolución explicit/inherited/unset, renderer seguro, inspector y Undo; run #505 PASS |
| MF-033 | DONE | Breakpoint engine, cadena wider/narrower, herencia desde breakpoint superior y E2E; run #529 PASS |
| MF-034 | DONE | 10 presets de editor separados de proyecto + DnD con hit areas estables/no rerender durante gesto; run #568 PASS |
| MF-035 | DONE | Themes frontend/backend separados, 15 built-ins, duplicación editable local, versionado automático y autosave/reload; run #662 PASS |
| MF-036 | DONE | Paquetes versionados, export/import selectivo, demo data opt-in, merge no destructivo, biblioteca local y round-trip; run #688 PASS; cierre F04 #712 PASS |

## F05
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-037 | DONE | `ContentTypeDefinition` v1, CRUD canónico, unique id/slug, delete guard por records, editor master-detail Backend, autosave/reload/delete E2E; run #730 PASS; cierre documental #740 PASS |
| MF-038 | DONE | `TaxonomyDefinition` v1, hierarchy/flat, multi-CPT associations, field-group/archive refs, referential delete guard CPT, Dynamic Content tabs, autosave/reload/delete E2E; run #766 PASS; cierre documental #776 PASS |
| MF-039 | DONE | `FieldTypeDefinition` + `FieldTypeRegistry` React-free, resolución `type@version`, config/value validation, defaults, feature matrix, migrations, 27 built-ins (20 available + 7 modeled) y plugin `plugin/rating`; run #786 PASS; cierre documental #800 PASS |
| MF-040 | DONE | `FieldGroupDefinition`/`CustomFieldDefinition` v1, portable JSON en `CanonicalProject.fieldGroups`, library de 20 tipos disponibles, ordered schema, contextual inspector, config/default validation por registry, referential delete guard y persistencia E2E; run #834 PASS; cierre documental #850 PASS |
| MF-041 | DONE | `ContentRecordDefinition` v1, estados draft/published/archived, CRUD canónico, búsqueda/filtros, slug único por CPT, required/default/FieldType validation, Records master-detail Backend, field-group integrity guard y persistencia IndexedDB E2E; run #901 PASS; cierre documental #915 PASS; evidence-sync #921 PASS |
| MF-042 | IMPLEMENTED / UNVERIFIED | Repeater/Group/Calculated/Conditional v2 `available`; runtime React-free/version-aware; graph/depth guards; safe calculation parser; recursive normalization; Field Group + Records runtime; schema-update integrity; unit/safety/version/integrity + durable E2E presentes; gate ejecutable bloqueado externamente |
| MF-043 | IMPLEMENTED / UNVERIFIED | `RelationDefinition` + Relations tab/editor; Relation/User/Taxonomy v2 `available`; recursive contextual reference validation; Record/Relation/CPT/Taxonomy integrity guards; registry-driven contextual selectors; `reference-integrity.test.ts` + `reference-field-types.test.ts` hardening + durable `e2e/relations.spec.ts`; gate ejecutable bloqueado externamente |
| MF-044 | BLOCKED | Dynamic bindings; no iniciar hasta cerrar MF-042/MF-043 con gate real |

## Design system del editor
- Fuente de verdad: `design-system/electrocms-editor/MASTER.md`.
- Override del workspace principal: `design-system/electrocms-editor/pages/editor.md`.
- Referencias externas seleccionadas: `ui-ux-pro-max`, `design-system` y `ui-styling` de `nextlevelbuilder/ui-ux-pro-max-skill`.
- Arquetipo: productivity tool + design-system tooling + data-dense SaaS.
- Base visual: Minimal/Flat + Data-Dense + Accessible, con micro-interacciones funcionales.
- El editor debe sentirse como un no-code builder profesional: header global, **Insert/Elements Library lateral**, canvas dominante e inspector contextual derecho.
- El patrón de interacción debe resultar familiar a builders profesionales tipo Elementor sin copiar identidad, assets, textos ni implementación propietaria.
- La biblioteca de inserción es una superficie principal: búsqueda, categorías, icono+label, click/drag para insertar, estados modeled/disabled honestos y futuras vistas Elements/Layers/Templates.
- Los editores de modelos dinámicos en Backend usan master-detail denso, validación inline y no dependen de modales para tareas rutinarias.
- Backend Dynamic Content usa tabs para mantener Content Types, Taxonomies, Relations, Field Groups y Records en un mismo workspace sin apilar herramientas extensas.
- MF-042/MF-043 se integran dentro de Field Groups + Records; Relations usa su editor canónico propio, sin crear un store o value-editor paralelo.
- No forzar migración a Tailwind/shadcn; adaptar las reglas al React/CSS actual salvo que una fase futura justifique explícitamente esa migración.

## Contenido dinámico F05
- `CanonicalProject.contentTypes`, `CanonicalProject.taxonomies`, `CanonicalProject.fieldGroups`, `CanonicalProject.records` y `CanonicalProject.relations` son las únicas fuentes persistentes de sus respectivos modelos; no existen stores paralelos.
- `ContentTypeDefinition.version = 1`, `TaxonomyDefinition.version = 1`, `FieldGroupDefinition.version = 1`, `CustomFieldDefinition.version = 1`, `ContentRecordDefinition.version = 1` y `RelationDefinition.version = 1`.
- IDs son kebab-case e inmutables después de crear; field `name` usa lowercase snake_case y debe ser único dentro del grupo.
- Delete de CPT se bloquea si records, taxonomías o Relations lo referencian.
- Taxonomías deben asociarse a uno o más CPTs únicos y pueden ser jerárquicas o flat.
- Taxonomy model guarda `fieldGroupIds` y `archiveTemplateId`; solo acepta field groups existentes y documentos `kind=archive` existentes.
- `FieldTypeRegistry` vive en core y es framework-neutral. Los tipos se resuelven por `type@version` y pueden ser extendidos por plugins sin modificar el registro central.
- MF-039 cubre 27 contratos mínimos del prompt: 20 `available` para schema y 7 avanzados inicialmente `modeled`.
- MF-042 promueve `core/repeater`, `core/group`, `core/calculated` y `core/conditional` a v2 `available`.
- MF-043 promueve `core/relation`, `core/user` y `core/taxonomy` a v2 `available`; v1 históricos permanecen modeled.
- `isMf042AdvancedField()` / `isMf043ReferenceField()` evitan ejecutar contratos históricos/modelados por coincidencia de nombre; cada runtime requiere su versión disponible.
- Cada custom field persiste `type`, `typeVersion`, `id`, `name`, `label`, description, placeholder, required, portable default value, type-specific config, conditions[] y roleVisibility[].
- Repeater/Group/Conditional referencian Field Groups reutilizables por ID; ciclos y profundidad > 8 se rechazan.
- Repeater aplica límites `minItems/maxItems` y hard cap runtime de 100 filas.
- Group/Repeater normalizan recursivamente payloads anidados; valores Calculated/Conditional derivados no quedan stale en persistencia.
- Calculated usa parser aritmético seguro, nunca `eval`; las expresiones solo pueden usar siblings Number/Currency para evitar dependencia del orden del schema.
- Conditional se normaliza después de poblar siblings/cálculos; cuando la condición es falsa su valor canónico se normaliza a `null`.
- Conditional source debe ser sibling no avanzado; operadores numéricos requieren source Number/Currency y compareValue finito; equals/notEquals requieren compareValue.
- Relation field configura una Relation existente + lado source/target; valida owner endpoint, cardinalidad, Record existence y CPT opuesto.
- User field referencia `CanonicalProject.users`; Taxonomy field valida taxonomy existente + asociación con el CPT owner. MF-043 no inventa un catálogo de taxonomy terms.
- `FieldGroupEditor` resuelve `relation-id`, `relation-side` y `taxonomy-id` mediante selectores contextuales registry-driven; la validación core sigue siendo autoridad.
- Las referencias MF-043 se validan recursivamente dentro de Group/Repeater/Conditional de MF-042.
- Relation update, Relation delete, referenced Record delete, endpoint CPT delete y referenced Taxonomy delete aplican guards antes de commit; no hay cascadas destructivas implícitas.
- El orden de `fields[]` es canónico y editable; reorder no crea otra representación paralela.
- `presentation` del grupo soporta `group` y `tabs` como metadata portable de composición.
- Config y default value se validan por `FieldTypeRegistry` + validación contextual del Field Group; no existe un `switch` de validación distribuido en el modelo persistente.
- Records guardan `contentTypeId`, `status`, `title`, `slug`, `excerpt`, `content`, `fieldGroupIds`, `fieldValues`, `createdAt` y `updatedAt` como JSON portable dentro de `CanonicalProject.records`.
- Estados de record: `draft`, `published`, `archived`; el Backend permite filtrar por CPT/status y buscar por title/slug.
- Slug de record es único dentro de su CPT; ID y `createdAt` se protegen como identidad estable.
- Los valores de custom fields se normalizan con defaults, required y validación real del `FieldTypeRegistry`; fields desconocidos o grupos inexistentes se rechazan.
- Records MF-042 renderiza Group anidado, filas Repeater, Calculated read-only y Conditional reactivo sin crear stores paralelos; MF-043 añade controles Relation/User/Taxonomy contextuales.
- `AdvancedRecordFieldControl` / `ReferenceRecordFieldControl` no ejecutan contratos históricos/modelados como runtime moderno.
- El editor de Records respeta los `supports` del CPT y no finge un Media Picker: featured image queda explícitamente reservado al Media Library cuando corresponda.
- El editor Records usa master-detail denso porque es un flujo de gestión de contenido, mientras el visual editor principal conserva Insert Library → Canvas → Inspector.
- Eliminar un field group se bloquea si una taxonomía, un content record, un advanced field o un reference field conserva una referencia válida a ese grupo/entidad relacionada.
- Actualizar un Field Group o Relation revalida Records existentes afectados; cambios incompatibles se rechazan antes del commit para evitar Records invisibles/inválidos.
- `ProjectSession` ejecuta mutations core sobre `projectRef.current` y encola autosave para modelos persistentes.
- Tests de persistencia que dependen de IndexedDB comprueban el estado durable real antes de reload; un texto `Saved locally` no sustituye esa verificación.

## Invariantes consolidadas
- El DOM nunca es fuente de verdad; el canvas es una proyección de `CanonicalDocument`.
- Los widgets se resuelven por `type@version` mediante registries explícitos.
- El editor core no contiene branching por cada tipo de widget.
- Factories producen `DocumentNode` canónicos y las props se validan antes de aceptar el nodo.
- Widgets dinámicos/commerce/form/filter de F04 permanecen `modeled` hasta que su microfase F05/F06 implemente comportamiento real.
- Inspector UI es transitorio; solo los patches de props validados entran al modelo mediante comandos reversibles.
- Undo/Redo usa comandos canónicos reversibles por documento.
- Geometría usa `ResponsiveStyleSet` por breakpoint.
- Autosave reutiliza repositorios F01 y no reemplaza contenido nuevo con callbacks stale.
- Mutaciones de proyecto compartidas leen `projectRef.current` para evitar closures stale entre workspaces/acciones rápidas.
- Editor theme/preset vive en workspace preferences; frontend/backend theme IDs viven en `CanonicalProject`.
- Imported theme library es local al editor; solo IDs seleccionados entran al proyecto.
- Theme resource merge nunca sobrescribe IDs existentes.
- Content model CRUD muta exclusivamente las colecciones canónicas existentes (`contentTypes`, `taxonomies`, `fieldGroups`, `records`, `relations`), nunca clones de dominio paralelos.
- Field type behavior es registro core versionado, no `switch` distribuido por UI/exporters.
- Field type definitions deben ser JSON-portable en schemas/default config; los callbacks de validación/migración viven en runtime registry y no dentro de `CanonicalProject`.
- Field group/record instances son portable JSON; nunca serializan callbacks, componentes React ni registry definitions completas.
- Relaciones referenciales conocidas se protegen de borrado destructivo silencioso.
- Un cambio de schema o Relation no puede invalidar silenciosamente Records persistidos; la mutación debe ser compatible o rechazarse antes de commit/autosave.
- El patrón visual principal de autoría es Insert Library izquierda + Canvas central + Inspector derecho; no degradarlo a dashboard genérico.
- Los deployments de preview son manuales y solo se ejecutan bajo petición explícita del usuario.

## Regla de salida
Cada microfase F05 debe actualizar tracking/memory/implementation-memory/known-issues/handoff y pasar `verify:repo`, lint, TypeScript, unit, coverage, Playwright E2E y build antes de marcarse DONE o avanzar oficialmente. **MF-042 y MF-043 tienen implementación presente pero siguen UNVERIFIED porque los últimos intentos de Actions no ejecutaron jobs/steps reales. MF-044 no puede comenzar hasta que ambas puedan cerrarse con un gate real completamente verde.**
