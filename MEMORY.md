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
- Registries explícitos resuelven widgets/themes; el core del editor no debe crecer mediante `switch` por cada tipo.

## Estado del modelo
- `CanonicalProject.schemaVersion = 1`.
- `DocumentNode.version = 1`.
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

## Migraciones
- Registry puro y secuencial N→N+1.
- Rechaza schemas futuros.
- Clona input antes de migrar.
- F01 soporta legacy v0 del scaffold inicial y lo transforma a canonical v1.
- Errores de migración/validación se conservan; persistencia no los oculta.

## Autosave y recovery
- Autosave debounced y serializado.
- Incrementa `historyMetadata.revision` y `lastSavedAt`.
- Guarda recovery snapshot antes del proyecto principal.
- Recovery snapshots son limitados por configuración.
- F03 integra autosave al `ProjectSession`: commands/undo/redo encolan cambios y el header muestra `dirty/saving/saved/error` real.
- F04 usa el mismo autosave para `frontendThemeId` y `backendThemeId`.
- `EditorProjectPersistence` elige al hidratar el candidato más fresco entre project store y recovery por revision + `updatedAt`.
- Revisiones permanecen monotónicas incluso si un payload pendiente trae metadata stale.
- Un callback de save fusiona metadata; nunca reemplaza contenido editor más nuevo.

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
- Widgets de datos/forms/filters permanecen explícitamente `modeled`; comportamiento real corresponde a F05/F06.

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

## Editor design system F04
- Fuentes de verdad: `design-system/electrocms-editor/MASTER.md` y `pages/editor.md`.
- Referencias seleccionadas de `nextlevelbuilder/ui-ux-pro-max-skill`: `ui-ux-pro-max`, `design-system`, `ui-styling`.
- Arquetipo del editor: Productivity Tool + Design System tooling + Data-Dense SaaS.
- Lenguaje base: Minimal/Swiss + Flat + Data-Dense + Accessible, con micro-interacciones funcionales.
- Editor = entorno de autoría no-code, no un dashboard genérico de cards.
- Anatomía objetivo: header global, navegación/insert/layers lateral, canvas dominante y inspector contextual derecho.
- Ritmo: micro-grid 4px, base 8px; desktop denso, touch crítico >=44px.
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
- `ProjectSession.setProjectTheme()` valida scope, actualiza solo el ID correspondiente y encola autosave.

### Theme package library
- Formato: `kind=electrocms-theme-package`, `schemaVersion=1`.
- Tamaño máximo: 256 KB.
- Parse valida envelope + theme definition.
- Imports se guardan localmente en `electrocms:project-theme-packages:v1`, fuera de `CanonicalProject`.
- El proyecto guarda solo el ID activo; el catálogo local resuelve la definición.
- IDs importados no pueden colisionar con built-ins o paquetes ya instalados.
- Export genera `*.electrocms-theme.json` versionado.
- E2E cubre import → selección → autosave → reload → export y rechazo de colisión.

## Última fase cerrada funcionalmente
F04 — Widgets, inspector, responsive y themes. Evidencia funcional: GitHub Actions run #622 PASS. Falta el cierre documental/higiene final y un gate completo sobre ese estado antes del merge.

## Siguiente trabajo
Después de integrar PR #5 a `main`, recuperar el contrato exacto de F05 desde `phases/` y comenzar en una rama nueva. No iniciar F05 desde la rama F04 antes del merge.
