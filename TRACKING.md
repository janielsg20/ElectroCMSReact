# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase completada: F03 — Canvas, nodos, DnD e historial
- Fase actual: F04 — Widgets, inspector, responsive y themes
- Microfase actual: MF-029 — Basic/content widgets
- Último quality gate completo: GitHub Actions run #434 PASS
- Último build válido: GitHub Actions run #434 PASS
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de fase: #5 `agent/f04-widgets-inspector-themes -> main`
- Preview automático: Vercel sobre cada push/PR de la rama activa.

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
| MF-029 | IN_PROGRESS | Basic/content widgets |
| MF-030 | TODO | Dynamic/commerce/form/filter widget contracts |
| MF-031 | TODO | Inspector schema engine |
| MF-032 | TODO | Style engine |
| MF-033 | TODO | Breakpoint engine |
| MF-034 | TODO | Editor theme presets |
| MF-035 | TODO | Frontend/backend theme system |
| MF-036 | TODO | Theme packages import/export |

## Invariantes consolidadas
- El DOM nunca es fuente de verdad; el canvas es una proyección de `CanonicalDocument`.
- Los widgets se resuelven por `type@version` mediante registries explícitos.
- El editor core no contiene branching por cada tipo de widget.
- Factories producen `DocumentNode` canónicos y las props se validan antes de aceptar el nodo.
- Inserción de widgets estructurales usa el registry; Container y Group ya no dependen de factories locales paralelas.
- Selección, clipboard UI, guides y estado de interacción son transitorios y no entran al proyecto.
- Undo/Redo usa comandos canónicos reversibles por documento.
- Geometría usa `ResponsiveStyleSet` por breakpoint.
- Autosave reutiliza repositorios F01 y no reemplaza contenido nuevo con callbacks stale.

## Regla de salida
F04 solo puede marcarse DONE cuando MF-027…MF-036 estén implementadas y el gate completo final esté verde. No avanzar a F05 con ningún gate rojo.
