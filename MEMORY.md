# MEMORY.md — Memoria técnica durable

## Proyecto
ElectroCMS es un CMS visual local-first construido en React + TypeScript. El proyecto se desarrolla por fases y ninguna fase se considera cerrada con quality gates rojos.

## Toolchain confirmado
- React 19 + TypeScript strict + Vite.
- Vitest para unit/integration.
- Playwright para E2E en navegador real.
- GitHub Actions como entorno oficial de instalación/test/build porque el sandbox de ChatGPT no alcanza el registry npm público.
- `package-lock.json` versionado; CI usa `npm ci` y permisos `contents: read`.

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
- Capacidades de fases futuras existen solo como mapas JSON portables hasta que sus módulos especializados sean implementados; no deben presentarse como funciones terminadas.

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
- Estado transitorio del editor nunca se serializa en el proyecto.

## Editor shell F02
- Routing interno usa History API + `useSyncExternalStore`, sin dependencia de router externa.
- Rutas estables: `/editor`, `/preview`, `/backend`, `/export`.
- `ProjectSessionProvider` vive por encima del outlet lógico; cambiar workspace no remonta proyecto, documento activo, breakpoint ni zoom.
- Undo/Redo están visibles pero deshabilitados hasta que F03 implemente command history real.
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
- Playwright valida 820×1180 y 390×844 sin overflow raíz.

## Editor theme base
- Modos `light`, `dark`, `auto` resuelven solo la apariencia de ElectroCMS.
- Se mantienen independientes de `frontendThemeId` y `backendThemeId`.
- La UI base usa tokens CSS y respeta `prefers-reduced-motion`.

## Última fase cerrada funcionalmente
F02 — Editor shell y workspace responsive. Evidencia funcional: GitHub Actions run #150 PASS. El commit documental de cierre debe volver a pasar CI antes del merge.

## Siguiente trabajo
F03 — Canvas, nodos, DnD e historial, comenzando en MF-019 — Document node tree engine. No introducir scope de F04 (widgets/inspector/themes avanzados) durante F03.
