# TRACKING.md — Estado de ejecución

## Estado global
- Estado: READY
- Fase completada: F02 — Editor shell y workspace responsive
- Siguiente fase: F03 — Canvas, nodos, DnD e historial
- Siguiente microfase: MF-019 — Document node tree engine
- Último quality gate completo: GitHub Actions run #150 PASS
- Último build válido: GitHub Actions run #150 PASS
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de fase: #3 `agent/f02-editor-shell -> main`

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

## Quality gates F02
- `npm run verify:repo` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS (22 unit/integration tests)
- `npm run test:coverage` — PASS
- `npm run test:e2e` — PASS (6 Playwright tests)
- `npm run build` — PASS

## Incidencias resueltas en F02
- Separados providers de hooks/context para cumplir Fast Refresh sin desactivar lint.
- `useMediaQuery` usa `useSyncExternalStore`, evitando sincronización manual de estado en effects.
- `exactOptionalPropertyTypes` se conserva; providers omiten props opcionales cuando no existen.
- El harness global hace `cleanup()` entre component tests para impedir contaminación de DOM.
- El header compacto usa scroll horizontal local y `contain: inline-size paint`; el contenido interno ya no crea overflow del `documentElement` en 390px.
- El layout tablet conserva documento, breakpoint, zoom, exportación y navegación mediante drawer.

## Evidencia funcional de cierre
GitHub Actions `ElectroCMS Quality Gates`, run #150, commit `411cf937771171e3d1d0f8bed25fb90a0b23ef4c`: `success`.

## Regla de salida
F02 queda completada funcionalmente. Los cambios documentales de cierre deben volver a pasar el gate completo antes de integrar PR #3. Después puede comenzar F03/MF-019.
