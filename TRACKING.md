# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F04 — Widgets, inspector, responsive y themes
- Fase actual: F05 — Contenido dinámico
- Última microfase completada: MF-039 — Field type registry
- Siguiente microfase: MF-040 — Custom field groups
- Último quality gate funcional completo: GitHub Actions run #786 PASS
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
| MF-039 | DONE | `FieldTypeDefinition` + `FieldTypeRegistry` React-free, resolución `type@version`, config/value validation, defaults, feature matrix, migrations, 27 built-ins (20 available + 7 modeled) y plugin `plugin/rating`; run #786 PASS |
| MF-040 | NEXT | Custom field groups; no iniciado |
| MF-041 | BLOCKED | Records CRUD |
| MF-042 | BLOCKED | Advanced fields |
| MF-043 | BLOCKED | Relations |
| MF-044 | BLOCKED | Dynamic bindings |

## Design system del editor
- Fuente de verdad: `design-system/electrocms-editor/MASTER.md`.
- Override del workspace principal: `design-system/electrocms-editor/pages/editor.md`.
- Referencias externas seleccionadas: `ui-ux-pro-max`, `design-system` y `ui-styling` de `nextlevelbuilder/ui-ux-pro-max-skill`.
- Arquetipo: productivity tool + design-system tooling + data-dense SaaS.
- Base visual: Minimal/Flat + Data-Dense + Accessible, con micro-interacciones funcionales.
- El editor debe sentirse como un no-code builder profesional: header global, canvas dominante, navegación/paleta lateral e inspector/context panels.
- Los editores de modelos dinámicos en Backend usan master-detail denso, validación inline y no dependen de modales para tareas rutinarias.
- Backend Dynamic Content usa tabs para mantener herramientas extensas en un mismo workspace sin apilarlas verticalmente.
- No forzar migración a Tailwind/shadcn; adaptar las reglas al React/CSS actual salvo que una fase futura justifique explícitamente esa migración.

## Contenido dinámico F05
- `CanonicalProject.contentTypes` y `CanonicalProject.taxonomies` son las únicas fuentes persistentes de CPTs/taxonomías; no existen stores paralelos.
- `ContentTypeDefinition.version = 1` y `TaxonomyDefinition.version = 1`.
- IDs son kebab-case e inmutables después de crear; slugs son únicos y editables dentro de su dominio.
- Delete de CPT se bloquea si records lo referencian o si una taxonomía lo tiene asociado.
- Taxonomías deben asociarse a uno o más CPTs únicos y pueden ser jerárquicas o flat.
- Taxonomy model guarda `fieldGroupIds` y `archiveTemplateId`; solo acepta field groups existentes y documentos `kind=archive` existentes.
- MF-038 permite asociar field groups ya existentes; MF-039 define los tipos de campo, y MF-040 implementará las definiciones/grupos persistentes.
- `FieldTypeRegistry` vive en core y es framework-neutral. Los tipos se resuelven por `type@version` y pueden ser extendidos por plugins sin modificar el registro central.
- MF-039 cubre 27 contratos mínimos del prompt: 20 `available` para schema y 7 avanzados `modeled` hasta MF-042/MF-043.
- Cada Field Type declara metadata, categoría, shape de valor, config schema/default config, validación de config/valor, default-value factory, feature capability matrix y migraciones N→N+1.
- Los tipos avanzados `relation`, `user`, `taxonomy`, `repeater`, `group`, `calculated` y `conditional` NO se presentan como runtime completo en MF-039.
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
- Content model CRUD muta exclusivamente las colecciones canónicas existentes (`contentTypes`, `taxonomies`, luego `fieldGroups`/`records` según su MF), nunca clones de dominio paralelos.
- Field type behavior es registro core versionado, no `switch` distribuido por UI/exporters.
- Field type definitions deben ser JSON-portable en schemas/default config; los callbacks de validación/migración viven en runtime registry y no dentro de `CanonicalProject`.
- Relaciones referenciales conocidas se protegen de borrado destructivo silencioso.
- Los deployments de preview son manuales y solo se ejecutan bajo petición explícita del usuario.

## Regla de salida
Cada microfase F05 debe actualizar tracking/memory/decisions/handoff y pasar `verify:repo`, lint, TypeScript, unit, coverage, Playwright E2E y build antes de avanzar. MF-040 no debe comenzar hasta que el cierre documental de MF-039 también quede verde.
