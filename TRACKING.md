# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F04 — Widgets, inspector, responsive y themes
- Fase actual: **F05 — Dynamic Content**
- Microfase actual: **MF-040 — Custom Field Groups — NEXT**
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- UI activa: Studio Pro único; no reintroducir UI/CSS legacy de F05.
- Estrategia F05: portar cada microfase validada desde `agent/f05-dynamic-content` a una rama fresca desde `main`, ejecutar gate completo y fusionar secuencialmente.
- Preview deployment: MANUAL ONLY. `vercel.json` usa `git.deploymentEnabled: false`; no desplegar por push/PR.

## Evidencia reciente F05
- MF-037 Content Types: PR #34 → merge `748c6e61af114640a176665903b5f3bc0336ca07`; Quality Gate #1515 PASS.
- MF-038 Taxonomies: PR #41 → merge `7cf28bb23d2825fd6174f90720fd80cbe0314666`; Quality Gate #1517 PASS.
- MF-039 Field Type Registry: PR #42 → merge `0db52d1c8db88b70a6ce5c6275f14803397c9691`; Quality Gate #1519 PASS.

## F00
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-000 | DONE | Inventario del proyecto completado |
| MF-001 | DONE | Gap analysis completado |
| MF-002 | DONE | Arquitectura React/TypeScript definida |
| MF-003 | DONE | Modelo canónico y versionado definido |
| MF-004 | DONE | Contratos de registries/renderers/exporters definidos |
| MF-005 | DONE | CI base con lint, types, tests, coverage, build y E2E |

## F01
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-006 | DONE | React/TypeScript strict, `package-lock.json`, CI reproducible con `npm ci` |
| MF-007 | DONE | Core domain independiente de React/DOM: JSON, errores, Result e IDs tipados |
| MF-008 | DONE | `CanonicalProject` schema v1, factory, seis breakpoints y validación de integridad del árbol |
| MF-009 | DONE | `ProjectRepository` + adapter in-memory con clones defensivos y conflicto en create duplicado |
| MF-010 | DONE | CRUD IndexedDB transaccional + recovery store + Playwright reload E2E |
| MF-011 | DONE | Migration registry ordenado, v0→v1, rechazo de schemas futuros e integración desde IndexedDB |
| MF-012 | DONE | Autosave debounced/serializado, revisión incremental y recovery snapshots limitados |

## F02
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-013 | DONE | History API router para Editor/Preview/Backend/Export y `ProjectSessionProvider`; E2E conserva zoom/estado |
| MF-014 | DONE | Header conectado a project/save/document/breakpoint/zoom y routing Preview/Export |
| MF-015 | DONE | Navegación izquierda/derecha, collapse, resize, reorder, icon/text modes y density |
| MF-016 | DONE | Estrategias desktop/tablet/mobile, drawer accesible y Playwright sin overflow raíz |
| MF-017 | DONE | Workspace preferences schema v1 separado de `CanonicalProject`; reload E2E |
| MF-018 | DONE | Editor light/dark/auto persistente e independiente de frontend/backend themes |

## F03
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-019 | DONE | Motor inmutable de árbol, indexes/traversals/invariants; run #195 PASS |
| MF-020 | DONE | Renderer recursivo del modelo canónico y overlay separado; run #211 PASS |
| MF-021 | DONE | Inserción, reorder/nesting y DnD semántico; run #256 PASS |
| MF-022 | DONE | Selección simple/múltiple transitoria y convivencia con DnD; run #276 PASS |
| MF-023 | DONE | `DocumentCommand` reversible, Undo/Redo y atajos; run #296 PASS |
| MF-024 | DONE | Copy/Cut/Paste, Group/Ungroup, Lock/Hide reversibles; run #320 PASS |
| MF-025 | DONE | Geometría responsive, snapping, guías y Undo; run #348 PASS |
| MF-026 | DONE | Autosave/hydration/recovery IndexedDB integrado; run #368 PASS y cierre final #396 PASS |

## F04
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-027 | DONE | Registry framework-neutral + binding React, factories, validation, child policies, capabilities, migrations y plugin preview sin branching del editor; run #424 PASS |
| MF-028 | DONE | Container/Group/Section/Grid/Flex/Stack/Divider/Spacer/Tabs/Accordion registrados, inserción genérica y factories registry-driven; run #434 PASS |
| MF-029 | DONE | 16 widgets básicos/contenido con defaults, validación, previews e inserción registry-driven; run #446 PASS |
| MF-030 | DONE | 19 contratos dynamic/commerce/form/filter con capacidad `modeled`, previews honestos y validación; run #456 PASS |
| MF-031 | DONE | Inspector schema engine, controles generados, validación, edición canónica y Undo/Redo; run #479 PASS |
| MF-032 | DONE | Style engine responsive, resolución explicit/inherited/unset, renderer seguro, inspector y Undo; run #505 PASS |
| MF-033 | DONE | Breakpoint engine, cadena wider/narrower, herencia desde breakpoint superior y E2E; run #529 PASS |
| MF-034 | DONE | 10 presets de editor separados de proyecto + DnD con hit areas estables/no rerender durante gesto; run #568 PASS |
| MF-035 | DONE | Themes frontend/backend separados, 15 built-ins, duplicación editable local, versionado automático y autosave/reload; run #662 PASS |
| MF-036 | DONE | Paquetes versionados, export/import selectivo, demo data opt-in, merge no destructivo, biblioteca local y round-trip; run #688 PASS; F04 posteriormente cerrada y fusionada |

## F05
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-037 | DONE | Content Types canónicos + Studio Pro CRUD + autosave/persistencia E2E; PR #34; Quality Gate #1515 PASS; merge `748c6e61…` |
| MF-038 | DONE | Taxonomías canónicas, asociaciones/referencias validadas + Studio Pro CRUD + reload E2E; PR #41; Quality Gate #1517 PASS; merge `7cf28bb2…` |
| MF-039 | DONE | Registry React-free `type@version`, 27 contratos builtin, plugins externos, migraciones explícitas; PR #42; Quality Gate #1519 PASS; merge `0db52d1c…` |
| MF-040 | NEXT | Custom Field Groups. Portar contrato histórico validado sobre `main` moderno y habilitar edición Studio Pro solo después del core/session |
| MF-041 | BLOCKED | Records CRUD; depende de MF-040 |
| MF-042 | BLOCKED | Advanced fields; la rama histórica tiene implementación, pero debe portarse y revalidarse sobre current `main` |
| MF-043 | BLOCKED | Relations; la rama histórica tiene implementación/hardening, pero debe portarse y revalidarse después de MF-042 |
| MF-044 | BLOCKED | Dynamic bindings; no iniciar hasta cerrar MF-042 y MF-043 en la línea moderna |

## Design system del editor
- Fuente de verdad: `design-system/electrocms-editor/MASTER.md`.
- Override del workspace principal: `design-system/electrocms-editor/pages/editor.md`.
- Arquetipo: productivity tool + design-system tooling + data-dense SaaS.
- Sistema visual activo: **Studio Pro** único, responsive y accesible.
- Frontend/backend project themes permanecen independientes de la apariencia del editor.
- No traer superficies, CSS o layouts de la rama histórica F05; solo recuperar contratos de dominio/tests y adaptarlos a Studio Pro.

## Invariantes consolidadas
- El DOM nunca es fuente de verdad; el canvas es proyección del modelo canónico.
- `CanonicalProject` y sus colecciones son la única fuente persistente de verdad; no crear stores paralelos para F05.
- Widgets se resuelven por `type@version` mediante registries explícitos.
- Field Types F05 también se resuelven por `type@version`; no promover tipos `modeled` antes de su microfase.
- Mutaciones de Content Types/Taxonomies y futuras entidades F05 deben entrar por APIs públicas de core expuestas por `ProjectSession`, conservando validación, autosave y persistencia atómica.
- Undo/Redo de documentos usa comandos canónicos reversibles; UI transitoria no entra al proyecto.
- Autosave reutiliza los repositorios F01 y no reemplaza contenido nuevo con callbacks stale.
- Deployments de preview son manuales y solo bajo petición explícita del usuario.

## Quality gate obligatorio
Cada microfase portada a la línea moderna debe ejecutar y aprobar, contra el merge ref actual de `main`:
1. `verify:repo`;
2. lint con cero warnings;
3. TypeScript strict;
4. unit/integration tests;
5. coverage;
6. production build;
7. Playwright E2E.

No marcar una microfase como DONE por evidencia histórica únicamente. La evidencia histórica sirve para recuperar el contrato; el estado DONE exige un gate nuevo en la UI/arquitectura actual.

## Regla de salida
Continuar F05 secuencialmente. **Próximo trabajo: MF-040 Custom Field Groups**. No saltar a Records/Advanced Fields/Relations hasta que MF-040 esté integrado y verde en `main`.
