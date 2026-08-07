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

## Última fase cerrada
F01 — Foundation, estado y persistencia. Evidencia funcional: GitHub Actions run #72 PASS. El commit documental de cierre debe volver a pasar CI antes del merge.

## Siguiente trabajo
F02 — Editor shell y workspace responsive, comenzando en MF-013 — App shell y routing interno.
