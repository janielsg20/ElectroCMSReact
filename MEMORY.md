# MEMORY.md — Memoria técnica durable

## Proyecto
ElectroCMS es un CMS visual local-first construido en React + TypeScript. El proyecto se desarrolla por fases y ninguna fase se considera cerrada con quality gates rojos.

## Toolchain confirmado
- React 19 + TypeScript strict + Vite.
- Vitest para unit/integration.
- Playwright para E2E en navegador real.
- GitHub Actions como entorno oficial de instalación/test/build porque el sandbox de ChatGPT no alcanza el registry npm público.
- `package-lock.json` versionado; CI usa `npm ci` y permisos `contents: read`.
- Vercel conectado a GitHub para previews automáticos de ramas/PR y producción desde `main`.

## Arquitectura durable
- Dependencias: Domain → Application → Infrastructure → Presentation.
- El modelo canónico no depende de React ni del DOM.
- UI/editor, renderer y exporters permanecen desacoplados.
- Persistencia se consume mediante contratos; componentes no acceden directamente a IndexedDB.

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
- Incluyen posición, ancho, collapse, icon/text mode, orden, density, last workspace y editor theme mode.
- La separación es no negociable: apariencia/layout del editor no altera el frontend o backend generado.

## Responsive shell
- El threshold compacto del shell es `960px`; es una decisión de layout del editor y NO un breakpoint canónico del proyecto generado.
- Desktop usa navegación lateral simultánea.
- Tablet/móvil usan drawer accesible; funciones principales permanecen disponibles.
- En móvil, la segunda fila del header conserva controles mediante scroll horizontal local.
- `contain: inline-size paint` impide que ese scroll interno cree overflow del documento raíz.

## Editor theme base
- Modos `light`, `dark`, `auto` resuelven solo la apariencia de ElectroCMS.
- Se mantienen independientes de `frontendThemeId` y `backendThemeId`.
- La UI base usa tokens CSS y respeta `prefers-reduced-motion`.

## Canvas y árbol F03
- `CanonicalDocument.nodes + children` es la única fuente estructural persistente.
- `parentId`, depth y traversals se derivan runtime; no se persisten.
- Validator y tree engine rechazan missing/duplicate children, multiple parents, root-parent, cycles y orphans.
- `CanvasRenderer` es una proyección recursiva; overlays y drop targets no son datos del proyecto.
- DnD usa `{nodeId,parentId,index}` y operaciones puras; nunca reordena DOM como fuente de verdad.

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

## Última fase cerrada funcionalmente
F03 — Canvas, nodos, DnD e historial. Evidencia funcional: GitHub Actions run #368 PASS. El commit documental de cierre debe volver a pasar CI antes del merge.

## Siguiente trabajo
F04 — Widgets, inspector, responsive y themes, comenzando en MF-027 después de integrar PR #4 a `main`. No iniciar F04 desde una rama F03 sin merge.
