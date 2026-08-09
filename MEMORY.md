# MEMORY.md — Memoria técnica durable

## Proyecto y quality contract
ElectroCMS es un CMS visual local-first en React 19 + TypeScript strict + Vite. Vitest cubre unit/integration y Playwright E2E. GitHub Actions es la autoridad: no cerrar ni mergear con verify/lint/types/tests/coverage/E2E/build en rojo.

## Arquitectura durable
- Domain → Application → Infrastructure → Presentation.
- `CanonicalProject.schemaVersion = 1`; modelo canónico independiente de React/DOM.
- IndexedDB es el adapter web principal local-first.
- Widgets, themes y Field Types se resuelven mediante registries explícitos/versionados.
- Document edits usan comandos reversibles; recursos F05 usan APIs públicas de core a través de `ProjectSession`.
- Colecciones canónicas del proyecto nunca tienen stores paralelos.

## Studio Pro
- Único sistema visual del editor: `studio-pro`.
- `light`/`dark`/`auto` son modos del mismo Studio Pro; frontend/backend project themes son independientes.
- No importar Bento ni UI/CSS histórica F05.

## F05 — Dynamic Content
`agent/f05-dynamic-content` es fuente histórica de contratos/tests, nunca base de merge.

- MF-037 Content Types — DONE: PR #34; Gate #1515; merge `748c6e61af114640a176665903b5f3bc0336ca07`.
- MF-038 Taxonomies — DONE: PR #41; Gate #1517; merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`.
- MF-039 Field Type Registry — DONE: PR #42; Gate #1519; merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`.
- MF-040 Custom Field Groups — DONE: PR #44; Gate #1524; merge `dcef1c3302c2520a1911884624fb059eef09f4c0`.
- MF-041 Records CRUD — DONE: PR #46; Gate #1528; merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`.
- MF-042 Advanced Fields — DONE: PR #48; Gate #1533; merge `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`.

### MF-042 Advanced Fields — durable
- Public content registry preserves historical v1 modeled contracts and promotes Group, Repeater, Calculated and Conditional to v2 `available`.
- Advanced runtime is React-free and version-aware.
- Reusable Field Group references must exist, cannot cycle and cannot exceed depth 8.
- Repeater maximum is 100 rows.
- Calculated expressions use a dedicated safe arithmetic tokenizer/parser; no `eval`, `Function` or code generation.
- Calculated fields may depend only on sibling Number/Currency fields.
- Conditional source must be another non-advanced sibling; numeric operators require Number/Currency.
- Group/Repeater values normalize recursively; Calculated is recomputed; inactive Conditional persists `null`.
- Field Group delete/update integrity includes advanced references, ancestor graph validation and direct/nested Record revalidation.

### MF-043 Relations — DONE / PR #51 / Gate #1569 PASS
- `RelationDefinition` es un contrato canónico React-free almacenado en `CanonicalProject.relations`.
- Cardinalidades soportadas en MF-043: `one` y `many` para source y target; `bidirectional` es metadata canónica.
- El registry conserva `core/relation`, `core/user` y `core/taxonomy` v1 como `modeled` y añade v2 `available`.
- `core/relation@2` almacena ids de Records y configura `relationId` + `side`; valida endpoint propietario, Content Type objetivo y cardinalidad.
- `core/user@2` referencia un id existente en `CanonicalProject.users` o `null`.
- `core/taxonomy@2` almacena ids de términos y configura `taxonomyId`; valida que la Taxonomy exista y esté asignada al Content Type propietario. MF-043 no inventa todavía un term catalog nuevo.
- El default config vacío de Relation/Taxonomy es sintácticamente válido en el Registry para permitir authoring; la existencia real de Relation/Taxonomy se exige al validar el Field Group/proyecto.
- La validación de referencias recorre también valores anidados dentro de Group, Repeater y Conditional, preservando MF-042.
- Se bloquea borrar un Record referenciado por Relation fields.
- Se bloquea cambiar destructivamente una Relation si deja Field Groups/Records inválidos.
- Se bloquea borrar una Relation mientras un Field Group la referencia.
- Se bloquea borrar un Content Type usado como endpoint de Relation.
- Se bloquea borrar una Taxonomy usada por `core/taxonomy@2`.
- La eliminación de Field Groups usa el registry MF-043; no debe degradar un Field Group válido con reference fields a “invalid definition”.
- `ProjectSession` expone create/update/remove Relation y conserva autosave local-first.
- Studio Pro tiene CRUD real de Relations, configuración Relation/Taxonomy en Field Groups y edición de referencias en Records, también dentro de estructuras MF-042 anidadas.
- Playwright prueba creación Product→Brand, persistencia real en IndexedDB, recarga y rechazo de borrado/update destructivo.
- Quality Gate #1569: verify repo, lint, strict TypeScript, 181 unit/integration tests, coverage, production build y Playwright E2E — PASS.

## Invariantes F05
- Core content React-free; `CanonicalProject` es la única fuente persistente.
- UI no muta maps directamente; mutación + validación + autosave pasan por `ProjectSession`.
- Runtime resuelve por `type@version`; `modeled` no significa funcional.
- Content Type deletion se bloquea mientras Records/Taxonomies/Relations lo usen.
- Field Group deletion/update respeta Taxonomies, Records, advanced references y reference fields.
- No romper MF-042 al extender reference runtime.
- MF-044 Dynamic Bindings no forma parte de MF-043.
- No avanzar con un gate rojo.

## Accesibilidad durable
WCAG AA baseline, focus-visible, nombres accesibles, no hover/gesture-only, touch targets compactos >=48px, reduced motion/contrast/forced colors, browser zoom habilitado y sin root horizontal overflow.

## Trabajo actual
- Fase: **F05 — Dynamic Content**.
- Implementado y verde: MF-037 a MF-043.
- PR de MF-043: **#51**, Gate **#1569 PASS**.
- Si PR #51 sigue abierta, integrarla antes de comenzar trabajo nuevo.
- Próxima microfase después de integración: **MF-044 — Dynamic Bindings**.
- MF-044 debe comenzar desde `main` actualizado, nunca dentro de la rama MF-043.
- Deployments de preview son manual-only.
