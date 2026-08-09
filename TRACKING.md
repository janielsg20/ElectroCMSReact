# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F04 — Widgets, inspector, responsive y themes
- Fase actual: **F05 — Dynamic Content**
- Microfase actual: **MF-042 — Advanced Fields — NEXT**
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- UI activa: Studio Pro único; no reintroducir UI/CSS legacy de F05.
- Estrategia F05: portar cada microfase validada desde `agent/f05-dynamic-content` a una rama fresca desde `main`, ejecutar gate completo y fusionar secuencialmente.
- Último merge funcional F05: MF-041 → `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`.
- Último quality gate funcional completo: GitHub Actions #1528 PASS.
- Preview deployment: MANUAL ONLY.

## Evidencia reciente F05
- MF-037 Content Types: PR #34 → merge `748c6e61af114640a176665903b5f3bc0336ca07`; Quality Gate #1515 PASS.
- MF-038 Taxonomies: PR #41 → merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`; Quality Gate #1517 PASS.
- MF-039 Field Type Registry: PR #42 → merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`; Quality Gate #1519 PASS.
- MF-040 Custom Field Groups: PR #44 → merge `dcef1c3302c2520a1911884624fb059eef09f4c0`; Quality Gate #1524 PASS.
- MF-041 Records CRUD: PR #46 → merge `2aa05132b7c8303071ec33936fff9ca1d1c14fa1`; Quality Gate #1528 PASS.

## F00–F04
F00–F04 permanecen DONE con la evidencia histórica ya registrada. No reabrir esas fases salvo regresión demostrada.

## F05
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-037 | DONE | Content Types canónicos + Studio Pro CRUD + autosave/persistencia E2E; PR #34; Gate #1515; merge `748c6e61…` |
| MF-038 | DONE | Taxonomías canónicas + referencias validadas + Studio Pro CRUD; PR #41; Gate #1517; merge `7cf28bb2…` |
| MF-039 | DONE | Registry React-free `type@version`, 27 built-ins, plugins/migraciones; PR #42; Gate #1519; merge `0db52d1c…` |
| MF-040 | DONE | Field Groups, 20 tipos disponibles, orden/config/defaults e integridad de Taxonomy; PR #44; Gate #1524; merge `dcef1c33…` |
| MF-041 | DONE | Records v1, draft/published/archived, defaults/required, slug por CPT, integridad Field Group, Studio Pro CRUD + IndexedDB E2E; PR #46; Gate #1528; merge `2aa05132…` |
| MF-042 | NEXT | Advanced Fields. Portar contratos/runtime históricos sin adelantar Relations MF-043; habilitar solo los tipos avanzados que pertenecen a MF-042 y revalidar Field Groups/Records/UI |
| MF-043 | BLOCKED | Relations/reference fields; depende de MF-042 verde e integrado |
| MF-044 | BLOCKED | Dynamic bindings; depende de MF-042 y MF-043 |

## Invariantes F05
- Core content React-free; `CanonicalProject` es la única fuente persistente.
- UI nunca muta maps canónicos directamente; usa `ProjectSession`.
- Field Types se resuelven por `type@version`; `modeled` no significa funcional.
- Records validan Content Type, Field Groups y valores mediante el registry.
- Record IDs y `createdAt` son inmutables; slug es único dentro de su Content Type.
- Field Group deletion se bloquea si lo referencia una Taxonomy o un Record.
- No importar UI/CSS de `agent/f05-dynamic-content`.
- No avanzar de microfase con gates rojos.

## Quality gate obligatorio
Cada microfase moderna debe aprobar en GitHub Actions: `verify:repo`, lint zero-warning, TypeScript strict, unit/integration, coverage, production build y Playwright E2E.

## Regla de salida
**Próximo trabajo: MF-042 Advanced Fields.** No iniciar MF-043 Relations hasta que MF-042 esté validada y fusionada en `main`.
