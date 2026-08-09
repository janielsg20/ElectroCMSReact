# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F04 — Widgets, inspector, responsive y themes
- Fase actual: **F05 — Dynamic Content**
- Microfase completada en rama: **MF-043 — Relations**
- Siguiente microfase: **MF-044 — Dynamic Bindings**, únicamente desde `main` después de integrar PR #51.
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- UI activa: Studio Pro único; no reintroducir UI/CSS legacy de F05.
- Estrategia F05: portar contratos históricos secuencialmente desde `agent/f05-dynamic-content` sobre ramas frescas de `main`, con gate completo por microfase.
- Último merge funcional F05 en `main` al abrir esta microfase: MF-042 → `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`.
- MF-043: PR #51; GitHub Actions #1569 PASS.
- Preview deployment: MANUAL ONLY.

## Evidencia F05 moderna
- MF-037 Content Types: PR #34 → merge `748c6e61af114640a176665903b5f3bc0336ca07`; Gate #1515 PASS.
- MF-038 Taxonomies: PR #41 → merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`; Gate #1517 PASS.
- MF-039 Field Type Registry: PR #42 → merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`; Gate #1519 PASS.
- MF-040 Custom Field Groups: PR #44 → merge `dcef1c3302c2520a1911884624fb059eef09f4c0`; Gate #1524 PASS.
- MF-041 Records CRUD: PR #46 → merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`; Gate #1528 PASS.
- MF-042 Advanced Fields: PR #48 → merge `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`; Gate #1533 PASS.
- MF-043 Relations: PR #51; Gate #1569 PASS. RelationDefinition canónico + Relation/User/Taxonomy v2 + integridad de referencias + Studio Pro CRUD + persistencia IndexedDB E2E.

## F00–F04
F00–F04 permanecen DONE con la evidencia histórica ya registrada. No reabrir salvo regresión demostrada.

## F05
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-037 | DONE | Content Types canónicos + Studio Pro CRUD + autosave/persistencia E2E; PR #34; Gate #1515 |
| MF-038 | DONE | Taxonomías canónicas + asociaciones/referencias validadas + Studio Pro CRUD; PR #41; Gate #1517 |
| MF-039 | DONE | Registry React-free `type@version`, 27 built-ins, plugins/migraciones; PR #42; Gate #1519 |
| MF-040 | DONE | Field Groups + 20 tipos disponibles + config/defaults + integridad Taxonomy; PR #44; Gate #1524 |
| MF-041 | DONE | Records v1 + defaults/required + slug por CPT + integridad + IndexedDB E2E; PR #46; Gate #1528 |
| MF-042 | DONE | Group/Repeater/Calculated/Conditional v2; parser seguro; depth 8; repeater 100; ciclos/schema integrity; Studio Pro recursivo + IndexedDB E2E; PR #48; Gate #1533; merge `899a4fdc…` |
| MF-043 | DONE | `RelationDefinition` canónico; cardinalidad one/many; `core/relation`, `core/user`, `core/taxonomy` v2 available manteniendo v1 modeled; integridad Content Types/Taxonomies/Records/Field Groups; Studio Pro Relations CRUD; edición de referencias top-level y anidadas; IndexedDB E2E; PR #51; Gate #1569 PASS |
| MF-044 | NEXT | Dynamic Bindings. No comenzar dentro de la rama MF-043; iniciar desde `main` una vez PR #51 esté integrada |

## Invariantes F05
- Core content React-free; `CanonicalProject` es la única fuente persistente.
- UI muta únicamente mediante APIs públicas de core expuestas por `ProjectSession`.
- Field Types se resuelven por `type@version`; las versiones históricas modeled siguen preservadas.
- MF-042 activa v2 de Group/Repeater/Calculated/Conditional.
- MF-043 activa v2 de Relation/User/Taxonomy y mantiene sus contratos v1 como `modeled` para compatibilidad.
- Relation fields validan endpoint propietario, Content Type de Records referenciados y cardinalidad; User valida ids existentes; Taxonomy valida existencia y aplicabilidad al Content Type.
- No se puede borrar un Record referenciado, una Relation usada por Field Groups, un Content Type que sea endpoint de Relation ni una Taxonomy referenciada por un campo v2.
- Calculated usa parser aritmético propio; prohibido `eval`, `Function` o ejecución dinámica.
- Profundidad avanzada máxima: 8. Repeater máximo: 100 filas.
- Field Group deletion/update se bloquea si rompe Taxonomies, Records o referencias avanzadas/reference.
- No importar UI/CSS de `agent/f05-dynamic-content`.
- No avanzar de microfase con gates rojos.

## Quality gate MF-043
GitHub Actions #1569 PASS:
- `verify:repo`: PASS
- lint zero-warning: PASS
- TypeScript strict: PASS
- unit/integration: PASS — 181 tests
- coverage: PASS
- production build: PASS
- Playwright E2E: PASS, incluyendo persistencia IndexedDB y rechazo de mutaciones destructivas de Relations/Records.

## Regla de salida
**MF-043 está implementada y verde en PR #51.** Si PR #51 todavía está abierta, integrarla. Después iniciar MF-044 Dynamic Bindings desde el `main` actualizado; no añadir MF-044 a la rama de Relations.
