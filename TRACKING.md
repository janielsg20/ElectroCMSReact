# TRACKING.md — Estado de ejecución

## Estado global
- Estado: READY
- Fase completada: F03 — Canvas, nodos, DnD e historial
- Siguiente fase: F04 — Widgets, inspector, responsive y themes
- Siguiente microfase: MF-027
- Último quality gate funcional completo: GitHub Actions run #368 PASS
- Último build válido: GitHub Actions run #368 PASS
- Repositorio oficial: `janielsg20/ElectroCMSReact`
- PR de fase: #4 `agent/f03-canvas-history -> main`
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
| MF-013 | DONE | History API router para Editor/Preview/Backend/Export y `ProjectSessionProvider` por encima de las rutas; E2E conserva zoom/estado |
| MF-014 | DONE | Header conectado a project/save/document/breakpoint/zoom y routing Preview/Export |
| MF-015 | DONE | Navegación izquierda/derecha, collapse, resize puntero/teclado, reorder, icon/text modes y density |
| MF-016 | DONE | Estrategias desktop/tablet/mobile, drawer accesible y Playwright sin overflow raíz en 820px y 390px |
| MF-017 | DONE | Workspace preferences schema v1 en storage separado de `CanonicalProject`; reload E2E |
| MF-018 | DONE | Editor light/dark/auto persistente e independiente de frontend/backend theme IDs |

## F03
| Microfase | Estado | Evidencia |
|---|---|---|
| MF-019 | DONE | Motor inmutable de árbol, parent/depth indexes, traversals, invariants y property-style test de 240 operaciones; run #195 PASS |
| MF-020 | DONE | Renderer recursivo del modelo canónico, overlay separado, empty-root e invalid-tree fallback; run #211 PASS |
| MF-021 | DONE | Inserción, reorder/nesting y DnD semántico `{nodeId,parentId,index}` con targets estables; run #256 PASS |
| MF-022 | DONE | Selección simple/múltiple transitoria, teclado, Escape y convivencia con DnD; run #276 PASS |
| MF-023 | DONE | `DocumentCommand` reversible por documento, Undo/Redo real y atajos; run #296 PASS |
| MF-024 | DONE | Copy/Cut/Paste con fresh IDs, Group/Ungroup, Lock/Hide, todo reversible; run #320 PASS |
| MF-025 | DONE | Geometría responsive X/Y/W/H, nudge, snapping semántico+grid, guías y Undo; run #348 PASS |
| MF-026 | DONE | Autosave editor integrado con F01, dirty/saving/saved/error, hydration/recovery e IndexedDB reload E2E; run #368 PASS |

## Quality gates F03
- `npm run verify:repo` — PASS
- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS
- `npm run test:coverage` — PASS
- `npm run test:e2e` — PASS
- `npm run build` — PASS

## Invariantes consolidadas en F03
- El DOM nunca es fuente de verdad; el canvas es una proyección de `CanonicalDocument`.
- Parent/depth/traversals son derivados; `parentId` no se persiste.
- DnD opera por IDs/targets semánticos y toda mutación estructural valida invariantes.
- Selección, clipboard UI, guides y estado de interacción son transitorios y no entran al proyecto.
- Undo/Redo usa comandos canónicos reversibles por documento; nunca snapshots del DOM.
- Paste remapea todos los IDs del subárbol copiado antes de insertarlo.
- Lock/Hide/Group/Ungroup son cambios canónicos y reversibles.
- Geometría usa `ResponsiveStyleSet` existente (`layout.x/y/width/height`) por breakpoint; no existe un segundo modelo geométrico.
- Viewport center/edges tienen prioridad sobre grid snapping cuando ambos están dentro del threshold.
- Autosave reutiliza repositorios F01; recovery snapshot se escribe antes del proyecto principal.
- Revisiones de autosave son monotónicas incluso si llega un payload pendiente con metadata stale.
- Un callback de guardado nunca reemplaza contenido editor más nuevo: solo fusiona metadata de persistencia.

## Evidencia funcional de cierre
GitHub Actions `ElectroCMS Quality Gates`, run #368, commit `21fa21d177f5481b50113fe75da9e1e9ec5dad91`: `success`.

## Regla de salida
F03 queda completada funcionalmente. Los cambios documentales de cierre deben volver a pasar el gate completo antes de integrar PR #4. F04/MF-027 solo puede comenzar desde `main` después de ese merge.
