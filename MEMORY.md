# MEMORY.md — Memoria técnica durable

## Proyecto
ElectroCMS es un CMS visual local-first construido en React + TypeScript. El proyecto se desarrolla por fases y ninguna fase se considera cerrada con quality gates rojos.

## Toolchain confirmado
- React 19 + TypeScript strict + Vite.
- Vitest para unit/integration.
- Playwright para E2E en navegador real.
- GitHub Actions como entorno oficial de instalación/test/build porque el sandbox de ChatGPT no alcanza el registry npm público.
- `package-lock.json` versionado; CI usa `npm ci` y permisos `contents: read`.
- Vercel está disponible solo para previews manuales bajo petición explícita. `vercel.json` usa `git.deploymentEnabled=false`; no desplegar por push/PR.

## Arquitectura durable
- Dependencias: Domain → Application → Infrastructure → Presentation.
- El modelo canónico no depende de React ni del DOM.
- UI/editor, renderer y exporters permanecen desacoplados.
- Persistencia se consume mediante contratos; componentes no acceden directamente a IndexedDB.
- Registries explícitos resuelven widgets/themes/field types; el core del editor no debe crecer mediante `switch` por cada tipo.
- Los modelos dinámicos F05 se implementan como motores puros sobre las colecciones existentes de `CanonicalProject`; no crear stores paralelos.

## Estado del modelo
- `CanonicalProject.schemaVersion = 1`.
- `DocumentNode.version = 1`.
- `ContentTypeDefinition.version = 1` desde MF-037.
- `TaxonomyDefinition.version = 1` desde MF-038.
- `FieldTypeDefinition` es runtime-registry data versionada por `type@version`; no se persiste una copia de callbacks en `CanonicalProject`.
- Proyecto inicial crea una página Home con nodo `core/root`.
- Breakpoints iniciales: desktop, laptop, tablet landscape, tablet portrait, mobile large y mobile small.
- Responsive distingue explícitamente `explicit`, `inherited` y `unset`.
- Capacidades de fases futuras existen solo como mapas JSON portables hasta que sus módulos especializados sean implementados.

## Persistencia
- Web primary adapter: IndexedDB nativo.
- DB v1: stores `projects` y `recoverySnapshots`.
- `ProjectRepository` tiene adapters IndexedDB e in-memory.
- `create` duplicado produce `CONFLICT`; `save` es upsert validado.
- `load` pasa siempre por hydration/migration antes de exponer datos editables.
- Versionado IndexedDB y `CanonicalProject.schemaVersion` son independientes.
- E2E que dependa de persistencia durable debe poder comprobar IndexedDB antes del reload; el texto visual `Saved locally` no es por sí solo prueba de escritura durable observable.

## Migraciones
- Registry puro y secuencial N→N+1.
- Rechaza schemas futuros.
- Clona input antes de migrar.
- F01 soporta legacy v0 del scaffold inicial y lo transforma a canonical v1.
- Errores de migración/validación se conservan; persistencia no los oculta.
- `FieldTypeRegistry` permite migraciones explícitas de config N→N+1 y rechaza rutas faltantes o output no portable.

## Autosave y recovery
- Autosave debounced y serializado.
- Incrementa `historyMetadata.revision` y `lastSavedAt`.
- Guarda recovery snapshot antes del proyecto principal.
- Recovery snapshots son limitados por configuración.
- F03 integra autosave al `ProjectSession`: commands/undo/redo encolan cambios y el header muestra `dirty/saving/saved/error` real.
- F04 usa el mismo autosave para `frontendThemeId`, `backendThemeId` y merges selectivos de recursos.
- F05 reutiliza el mismo flujo para content model CRUD.
- `EditorProjectPersistence` elige al hidratar el candidato más fresco entre project store y recovery por revision + `updatedAt`.
- Revisiones permanecen monotónicas incluso si un payload pendiente trae metadata stale.
- Un callback de save fusiona metadata; nunca reemplaza contenido editor más nuevo.
- Mutaciones compartidas de `ProjectSession` leen `projectRef.current` para evitar closures stale entre workspaces o acciones consecutivas.

## Editor shell F02
- Routing interno usa History API + `useSyncExternalStore`, sin dependencia de router externa.
- Rutas estables: `/editor`, `/preview`, `/backend`, `/export`.
- `ProjectSessionProvider` vive por encima del outlet lógico; cambiar workspace no remonta proyecto, documento activo, breakpoint ni zoom.
- El header superior está conectado al estado real de proyecto/documento/breakpoint/zoom y al routing Preview/Export.

## Workspace preferences
- `WorkspacePreferences.schemaVersion = 1`.
- Se persisten en `electrocms:workspace-preferences:v1`, separadas de `CanonicalProject`.
- Incluyen posición, ancho, collapse, icon/text mode, orden, density, last workspace, editor theme mode y editor theme preset.
- La separación es no negociable: apariencia/layout del editor no altera el frontend o backend generado.

## Responsive shell
- El threshold compacto del shell es `960px`; es una decisión de layout del editor y NO un breakpoint canónico del proyecto generado.
- Desktop usa navegación lateral simultánea.
- Tablet/móvil usan drawer accesible; funciones principales permanecen disponibles.
- En móvil, la segunda fila del header conserva controles mediante scroll horizontal local.
- `contain: inline-size paint` impide que ese scroll interno cree overflow del documento raíz.

## Canvas y árbol F03/F04
- `CanonicalDocument.nodes + children` es la única fuente estructural persistente.
- `parentId`, depth y traversals se derivan runtime; no se persisten.
- Validator y tree engine rechazan missing/duplicate children, multiple parents, root-parent, cycles y orphans.
- `CanvasRenderer` es una proyección recursiva; overlays y drop targets no son datos del proyecto.
- DnD usa `{nodeId,parentId,index}` y operaciones puras; nunca reordena DOM como fuente de verdad.
- Regla F04: no usar React state que provoque re-render durante `dragstart`; el feedback efímero de drag puede usar `data-*` DOM transitorio mientras la estructura sigue siendo canónica.
- Drop hit areas permanecen geométricamente estables durante el gesto; durante drag cambia pintura, no layout.

## Selección e historial F03
- Selección simple/múltiple es estado transitorio y accesible por teclado.
- `DocumentCommand` guarda before/after de `CanonicalDocument`, nunca snapshots DOM.
- History es por documento; ejecutar un nuevo command limpia redo.
- Undo/Redo del header y shortcuts están conectados al command engine real.
- Copy/Cut/Paste, Group/Ungroup, Lock/Hide y geometry edits son reversibles.
- Paste remapea IDs de todos los nodos copiados antes de insertar.

## Geometría F03
- X/Y/W/H usan `ResponsiveStyleSet` existente con keys `layout.x/y/width/height`.
- No existe un modelo geométrico paralelo.
- Ediciones se escriben explícitamente en el breakpoint activo.
- Grid snapping por defecto: 8px; threshold: 4px.
- Viewport edges/center tienen prioridad sobre grid si ambos están dentro del threshold.
- Guides son transitorias y viven en overlay.

## Widget system F04
- `WidgetRegistry` core es framework-neutral y resuelve `type@version`.
- Cada definición incluye metadata, factory, props validation/schema, inspector schema, child policy, capabilities, preview renderer id y migrations.
- Binding React vive en `EditorWidgetRegistry`; el core no importa React.
- Un plugin/widget externo puede registrar definición + preview sin editar `CanvasRenderer` por tipo.
- F04 registra 10 widgets estructurales, 16 básicos/contenido y 19 contratos dynamic/commerce/form/filter.
- Widgets de datos/forms/filters permanecen explícitamente `modeled`; comportamiento real se activa solo en sus microfases F05/F06.

## Inspector F04
- `WidgetInspector` se genera desde schema; no mantiene una copia persistente de props.
- Patch de props → nodo candidato → validación registry → `DocumentCommand` reversible.
- Campos soportados: text, number, boolean, select, JSON y descriptors normalizados.
- Errores aparecen junto al control y no mutan silenciosamente el modelo.
- Inspector UI es transitorio y no entra a `CanonicalProject`.

## Style + breakpoint engine F04
- `DocumentNode.styles` sigue siendo la única fuente de estilo responsive.
- Style engine generaliza propiedades con slots `explicit`, `inherited`, `unset` por breakpoint.
- Renderer convierte solo un subconjunto seguro a `CSSProperties`.
- Breakpoint engine ordena/valida los seis breakpoints, resuelve wider/narrower e inheritance chain nearest-first.
- Heredar desde breakpoint superior es una relación dinámica; cambios futuros de la fuente se reflejan en el descendiente.
- Geometría `layout.*` y estilos visuales comparten `ResponsiveStyleSet` pero conservan responsabilidades claras.

## Editor design system F04+
- Fuentes de verdad: `design-system/electrocms-editor/MASTER.md` y `pages/editor.md`.
- Referencias seleccionadas de `nextlevelbuilder/ui-ux-pro-max-skill`: `ui-ux-pro-max`, `design-system`, `ui-styling`.
- Arquetipo del editor: Productivity Tool + Design System tooling + Data-Dense SaaS.
- Lenguaje base: Minimal/Swiss + Flat + Data-Dense + Accessible, con micro-interacciones funcionales.
- Editor = entorno de autoría no-code, no un dashboard genérico de cards.
- Anatomía objetivo: header global, navegación/insert/layers lateral, canvas dominante y inspector/context panels.
- Ritmo: micro-grid 4px, base 8px; desktop denso, touch crítico >=44px.
- Editores de modelos dinámicos usan master-detail cuando la tarea es list + inspect/edit; formularios rutinarios no deben forzar modales.
- `DynamicContentManager` agrupa Content Types/Taxonomies mediante tabs para mantener densidad sin apilar herramientas extensas.
- Tokens siguen primitive → semantic → component.
- No forzar Tailwind/shadcn; adaptar principios al stack React/CSS existente salvo decisión futura explícita.

## Sistemas de theme F04
Hay tres conceptos separados:
1. **Editor theme mode** (`light`/`dark`/`auto`) — workspace preference.
2. **Editor theme preset** — workspace preference que modifica solo tokens/composición del chrome de ElectroCMS.
3. **Project themes frontend/backend** — IDs persistidos en `CanonicalProject`.

Nunca mezclar estos tres niveles.

### Editor presets
- Presets disponibles incluyen High Density, Bento, Minimal, Material Expressive, SaaS, Enterprise, Glass, Sophisticated Dark, Monochrome y Developer Console.
- Un preset puede cambiar color/elevación/radius/énfasis/density dentro de límites, pero no comportamiento canónico, accesibilidad ni funciones.

### ProjectThemeRegistry
- Framework-neutral.
- Valida ID por scope (`frontend.*` / `backend.*`), versión positiva, metadata y tokens JSON portables.
- Rechaza objetos con prototipos no JSON (`Date`, `Map`, class instances), incluso anidados.
- Built-ins al cierre F04: 8 frontend + 7 backend.
- Built-ins son inmutables; se duplican antes de editar.
- Copias locales usan IDs collision-safe y empiezan en v1.
- `ProjectThemeTokenEditor` edita metadata y semantic tokens; cada save crea vN+1.
- `ProjectSession.setProjectTheme()` valida scope, actualiza solo el ID correspondiente y encola autosave.

### Theme package library
- Formato: `kind=electrocms-theme-package`, `schemaVersion=1`.
- Tamaño máximo: 256 KB.
- Parse valida envelope, theme definition y recursos opcionales.
- Imports se guardan localmente en `electrocms:project-theme-packages:v1`, fuera de `CanonicalProject`.
- El proyecto guarda solo el ID activo; el catálogo local resuelve la definición.
- IDs importados no pueden colisionar con built-ins o paquetes ya instalados.
- Export genera `*.electrocms-theme.json` versionado.

### Recursos transferibles y merge
- Recursos opcionales: documents/templates, content models, queries/forms/filters, roles/dashboards/backend y records demo.
- Demo data está desactivada por defecto tanto en export selection como en import review.
- Importar es dos pasos: elegir archivo solo valida y muestra review; `Apply selected import` realiza mutaciones.
- Cada categoría puede desactivarse antes de importar.
- Merge es no destructivo: si un ID/key ya existe en el proyecto, el valor existente se preserva y el conflicto se contabiliza.
- Usuarios, credenciales y media binaries quedan fuera del formato F04.
- El merge resultante vuelve a pasar `validateCanonicalProject` antes de commit/autosave.

## Contenido dinámico F05 — MF-037 CPT
- `CanonicalProject.contentTypes` es la única fuente persistente de content types.
- `ContentTypeDefinition` v1 incluye: `id`, `label`, `singularLabel`, `slug`, `description`, `public`, `hierarchical` y supports `title/editor/excerpt/featuredImage`.
- ID usa kebab-case, comienza por letra, máximo 64 y es inmutable después de creación.
- Slug usa lowercase kebab-case, máximo 80 y debe ser único.
- Labels máximo 80; description máximo 280.
- `createContentType`, `updateContentType`, `removeContentType` son operaciones core puras que devuelven un proyecto canónico validado.
- Delete se rechaza si records referencian el CPT mediante `contentTypeId` o `contentType`.
- Desde MF-038, delete también se rechaza si una taxonomy conserva ese CPT en `contentTypeIds`.
- `ProjectSession` expone mutations y autosave; lee `projectRef.current` para evitar estado stale.
- `ContentTypeEditor` usa patrón master-detail responsive con validación inline, flags, supports y delete de dos pasos.
- Evidencia funcional MF-037: run #730 PASS; cierre documental #740 PASS.

## Contenido dinámico F05 — MF-038 Taxonomy
- `CanonicalProject.taxonomies` es la única fuente persistente de taxonomías.
- `TaxonomyDefinition` v1 incluye: `id`, `label`, `singularLabel`, `slug`, `description`, `hierarchical`, `contentTypeIds`, `fieldGroupIds`, `archiveTemplateId`.
- Cada taxonomía debe asociarse a uno o más CPT IDs únicos existentes.
- `hierarchical=true` modela categorías/árbol; `false` modela taxonomías planas tipo tags.
- ID es inmutable tras crear y slug debe ser único entre taxonomías.
- `fieldGroupIds` solo acepta IDs presentes en `project.fieldGroups`; MF-038 permite enlazar grupos existentes, MF-039 define field types y MF-040 implementará grupos/campos persistentes.
- `archiveTemplateId` solo puede apuntar a un `CanonicalDocument.kind === 'archive'` existente.
- `createTaxonomy`, `updateTaxonomy`, `removeTaxonomy` son operaciones core React-free que validan referencias y el proyecto resultante.
- `TaxonomyEditor` ofrece identity, hierarchy/flat, multi-CPT associations, archive template y field-group associations en master-detail responsive.
- `DynamicContentManager` usa tabs Content Types / Taxonomies y mantiene cada editor en el mismo Backend workspace.
- E2E prueba 2 CPTs → multi-CPT taxonomy → persistencia → slug inválido → flat + 1 target → persistencia → delete, verificando IndexedDB.
- Evidencia funcional MF-038: run #766 PASS; cierre documental #776 PASS.

## Contenido dinámico F05 — MF-039 Field Type Registry
- `FieldTypeRegistry` vive en `src/core/content` y no importa React ni estado de proyecto.
- Tipos se identifican con namespace, por ejemplo `core/text` o `plugin/rating`, y se resuelven por `type@version`.
- Cada `FieldTypeDefinition` declara metadata, category, availability, `valueShape`, `configSchema`, `defaultConfig`, `validateConfig`, `createDefaultValue`, `validateValue`, feature capability matrix y migrations N→N+1.
- Registry rechaza definiciones inválidas, duplicados, configs/values no JSON-portable, rutas de migración incompletas y outputs de migración inválidos.
- `resolve()` devuelve clones defensivos; consumidores no pueden mutar la definición almacenada.
- Built-ins mínimos del prompt: 27 contratos. 20 son `available` para construir schemas básicos y 7 permanecen `modeled`.
- `available`: text, textarea, rich-text, number, currency, email, phone, url, date, time, datetime, color, select, radio, checkbox, switch, image, gallery, file, map.
- `modeled`: relation, user, taxonomy, repeater, group, calculated, conditional.
- `modeled` significa contrato portable registrado, no runtime completo. Relations pertenecen MF-043; repeater/group/calculated/conditional y otros advanced behaviors pertenecen MF-042.
- El test `plugin/rating` demuestra que un tipo externo se registra, valida, crea defaults y migra config sin modificar el core registry.
- Evidencia funcional MF-039: GitHub Actions run #786 PASS; cierre documental #800 PASS.

## Evidencia F04
- MF-034 definitiva: run #568 PASS.
- MF-035 definitiva, incluyendo duplicate/edit/version: run #662 PASS.
- MF-036 definitiva, incluyendo selective import/demo option/non-destructive merge: run #688 PASS.
- Cierre completo F04: run #712 PASS; PR #5 fusionada por squash a `main` en `57798d9e00f4a3bb87867a847c3bccfccc82f764`.

## Estado actual
- F04 está cerrada y fusionada.
- F05 — Contenido dinámico está activa en `agent/f05-dynamic-content` / draft PR #6.
- MF-037 CPT model + editor: DONE, run #730 PASS; docs #740 PASS.
- MF-038 Taxonomy model + editor: DONE, run #766 PASS; docs #776 PASS.
- MF-039 Field type registry: DONE, run #786 PASS; docs #800 PASS.
- MF-040 Custom field groups: siguiente microfase; no iniciada todavía.
