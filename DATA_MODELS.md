# DATA_MODELS.md — Canonical Project v1

## Principios
- El modelo persistido es independiente de React y del DOM.
- `schemaVersion` versiona el formato ElectroCMS; `project.version` pertenece al proyecto.
- IDs son estables y no codifican posición.
- Children se ordenan mediante arrays de IDs.
- Todo payload persistido es JSON-serializable salvo binarios multimedia, que se referencian por ID/hash.
- Los mapas de capacidades de fases futuras se modelan como JSON portable hasta que su módulo especializado los tipa y valida con más detalle.

## Versiones
```ts
CURRENT_PROJECT_SCHEMA_VERSION = 1
CURRENT_NODE_SCHEMA_VERSION = 1
```

## CanonicalProject
El schema v1 contiene identidad, metadata, settings local-first, tres theme IDs independientes, documentos, orden de documentos, mapas portables para contenido dinámico/queries/forms/filters/roles/backend, media, tokens, breakpoints, export metadata e history metadata.

## Document y node
`CanonicalDocument` contiene `rootNodeId` + `nodes: Record<string, DocumentNode>`.

Cada `DocumentNode` contiene:
- `id`, `type`, `version`;
- `props` JSON;
- `styles` responsive;
- bindings/conditions opcionales;
- `children` por ID;
- flags opcionales `locked` y `hidden`.

El validador F01 comprueba además integridad de árbol: root existente, children existentes, ausencia de ciclos, ausencia de nodos huérfanos y coherencia key/id.

## Responsive
La herencia se representa explícitamente:
- `explicit` con valor;
- `inherited` con breakpoint origen;
- `unset`.

Breakpoints iniciales editables: Desktop, Laptop, Tablet horizontal, Tablet vertical, Móvil grande y Móvil pequeño.

## Media
`MediaAssetRef` almacena metadata portable (`id`, `hash`, nombre, media type, byte size, dimensiones opcionales, alt text y tags). El binario se incorporará a `AssetRepository` en la fase de media.

## Migraciones
1. Leer `schemaVersion`.
2. Rechazar versiones futuras sin modificar datos.
3. Clonar input antes de migrar.
4. Ejecutar pasos puros `N -> N+1` en orden.
5. Validar el target de cada paso cuando exista validator.
6. Validar contra schema actual al finalizar.
7. El adapter de persistencia hidrata mediante el registry antes de entregar un proyecto editable.

## Legacy v0
El único formato pre-v1 soportado por F01 es el header de proyecto del scaffold temprano: `schemaVersion`, `id`, `name`, `version?`, `createdAt?`, `updatedAt?`. La migración crea la estructura canónica completa v1 preservando identidad, versión y timestamps conocidos.
