# TRACKING.md — Estado de ejecución

## Estado global
- Estado: IN_PROGRESS
- Fase actual: F03 — Canvas, nodos, DnD e historial
- Microfase completada: MF-019 — Document node tree engine
- Siguiente microfase: MF-020 — Canvas renderer base
- Último quality gate completo: GitHub Actions run #195 PASS
- Último build válido: GitHub Actions run #195 PASS
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de fase: #4 `agent/f03-canvas-history -> main`

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
| MF-013 | DONE | History API router para Editor/Preview/Backend/Export y `ProjectSessionProvider` por encima de las rutas; E2E conserva zoom/estado |
| MF-014 | DONE | Header conectado a project/save/document/breakpoint/zoom; Preview/Export navegan; Undo/Redo permanecen honestamente deshabilitados hasta F03 |
| MF-015 | DONE | Navegación izquierda/derecha, collapse, resize puntero/teclado, reorder, icon/text modes y density |
| MF-016 | DONE | Estrategias desktop/tablet/mobile, drawer accesible y Playwright sin overflow raíz en 820px y 390px |
| MF-017 | DONE | Workspace preferences schema v1 en storage separado de `CanonicalProject`; reload E2E |
| MF-018 | DONE | Editor light/dark/auto persistente e independiente de frontend/backend theme IDs |

## F03
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-019 | DONE | Motor inmutable de árbol, parent/depth indexes, traversals, CRUD de nodo/subárbol, invariants y property-style test de 240 operaciones; run #195 PASS |
| MF-020 | IN_PROGRESS | Canvas renderer base pendiente de implementación/validación |
| MF-021 | TODO | Insert/reorder/nesting y DnD |
| MF-022 | TODO | Selection y multi-selection |
| MF-023 | TODO | Commands + undo/redo |
| MF-024 | TODO | Clipboard/group/lock/hide |
| MF-025 | TODO | Resize/position/guides/snapping |
| MF-026 | TODO | Autosave integration del editor |

## Quality gates MF-019
- `npm run verify:repo` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS, incluyendo random CRUD/property-style sequence
- `npm run test:coverage` — PASS
- `npm run build` — PASS
- `npm run test:e2e` — PASS (regresión F02)

## Invariantes nuevas F03
- Parent/depth son índices derivados; no se añade `parentId` al schema persistido.
- Un nodo no puede tener múltiples padres.
- Root no puede ser child.
- Missing child, duplicate child, cycles y orphans son inválidos.
- CRUD estructural es inmutable y revalida invariantes después de cada operación.
- `updateDocumentNode` no puede cambiar `id` ni `children`; estructura se cambia mediante operaciones dedicadas.

## Evidencia actual
GitHub Actions `ElectroCMS Quality Gates`, run #195, commit `ec9f5e6c6d9fe98c4d9dbe6f7d8e15c4466e127e`: `success`.

## Regla de salida
MF-019 está cerrada. F03 continúa en MF-020; la fase completa no puede integrarse hasta MF-026 y el gate final verde.
