# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F04 — Widgets, inspector, responsive y themes
- Fase actual: **F05 — Dynamic Content**
- Microfase actual: **MF-043 — Relations — NEXT**
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- UI activa: Studio Pro único; no reintroducir UI/CSS legacy de F05.
- Estrategia F05: portar contratos históricos secuencialmente desde `agent/f05-dynamic-content` sobre ramas frescas de `main`, con gate completo por microfase.
- Último merge funcional F05: MF-042 → `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`.
- Último quality gate funcional completo: GitHub Actions #1533 PASS.
- Preview deployment: MANUAL ONLY.

## Evidencia F05 moderna
- MF-037 Content Types: PR #34 → merge `748c6e61af114640a176665903b5f3bc0336ca07`; Gate #1515 PASS.
- MF-038 Taxonomies: PR #41 → merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`; Gate #1517 PASS.
- MF-039 Field Type Registry: PR #42 → merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`; Gate #1519 PASS.
- MF-040 Custom Field Groups: PR #44 → merge `dcef1c3302c2520a1911884624fb059eef09f4c0`; Gate #1524 PASS.
- MF-041 Records CRUD: PR #46 → merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`; Gate #1528 PASS.
- MF-042 Advanced Fields: PR #48 → merge `899a4fdc2d3ad65ced9f3086c43e7fc8d4b859ad`; Gate #1533 PASS.

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
| MF-043 | NEXT | Relations/reference runtime. Recuperar contrato histórico exacto; habilitar Relation/User/Taxonomy solo según alcance MF-043, integrar Records/Field Groups/Studio Pro y revalidar integridad |
| MF-044 | BLOCKED | Dynamic bindings; depende de MF-043 verde e integrado |

## Invariantes F05
- Core content React-free; `CanonicalProject` es la única fuente persistente.
- UI muta únicamente mediante APIs públicas de core expuestas por `ProjectSession`.
- Field Types se resuelven por `type@version`; las versiones históricas modeled siguen preservadas.
- MF-042 activa v2 de Group/Repeater/Calculated/Conditional; Relation/User/Taxonomy siguen modeled hasta MF-043.
- Calculated usa parser aritmético propio; prohibido `eval`, `Function` o ejecución dinámica.
- Profundidad avanzada máxima: 8. Repeater máximo: 100 filas.
- Field Group deletion/update se bloquea si rompe Taxonomies, Records o referencias avanzadas.
- No importar UI/CSS de `agent/f05-dynamic-content`.
- No avanzar de microfase con gates rojos.

## Quality gate obligatorio
Cada microfase moderna debe aprobar `verify:repo`, lint zero-warning, TypeScript strict, unit/integration, coverage, production build y Playwright E2E en GitHub Actions.

## Regla de salida
**Próximo trabajo: MF-043 Relations.** No iniciar MF-044 Dynamic Bindings hasta que MF-043 esté integrada y verde en `main`.
